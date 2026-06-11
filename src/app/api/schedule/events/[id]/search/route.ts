import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthenticatedUserId } from "@/lib/auth";
import dbConnect from "@/lib/dbConnect";
import { objectIdSchema } from "@/lib/schemas/db";
import Availability from "@/models/availability";
import Performance from "@/models/performance";
import PerformanceType from "@/models/performanceType";
import RoleType from "@/models/roleType";
import User from "@/models/user";
import UserCalendar from "@/models/userCalendar";

// populate の ref を確実に登録する (未参照だと MissingSchemaError になるため)
void Performance;
void PerformanceType;
void RoleType;

// 公演×役職は「公演1つ + その役職複数」を1セットとし、複数セットは AND で結合する。
const groupSchema = z.object({
  performanceId: objectIdSchema,
  roleTypeIds: z.array(objectIdSchema).optional().default([]),
});
const searchSchema = z.object({
  groups: z.array(groupSchema).optional().default([]),
  grades: z.array(z.number().int()).optional().default([]),
  userIds: z.array(objectIdSchema).optional().default([]),
});

interface PopulatedRole {
  _id: { toString(): string };
  name: string;
}
interface PopulatedPerformance {
  _id: { toString(): string };
  year: number;
  displayName: string;
}
interface CalendarEntry {
  performanceId: PopulatedPerformance | null;
  roleTypeIds: PopulatedRole[];
}
interface PopulatedCalendar {
  userId: { toString(): string };
  performances: CalendarEntry[];
  lastInputDate?: Date | null;
}

interface MemberPerformance {
  id: string;
  label: string;
  roleTypes: { id: string; name: string }[];
}
interface Member {
  userId: string;
  name: string;
  grade: number | null;
  performances: MemberPerformance[];
  availableSlots: { start: Date; end: Date; type: string }[];
  lastInputDate: Date | null;
}

const performanceLabel = (p: PopulatedPerformance) => `${p.year}年度 ${p.displayName}`;

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error: "認証が必要です。" }, { status: 401 });
  }

  const { id: eventId } = await context.params;
  const body = await request.json().catch(() => null);
  const parsed = searchSchema.safeParse(body ?? {});
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }
  const { groups, grades, userIds } = parsed.data;

  await dbConnect();

  // 1. この event の出欠 (新コードは availableSlots と userId だけ使う / 旧 name,grade,roles は読まない)
  const availabilities = await Availability.find({ eventId })
    .select("userId availableSlots")
    .lean<{ userId: { toString(): string }; availableSlots: Member["availableSlots"] }[]>();

  const memberUserIds = availabilities.map((a) => a.userId);

  // 2. 名前/学年 (User) と 公演×役職 (UserCalendar) を join
  const [users, calendars] = await Promise.all([
    User.find({ _id: { $in: memberUserIds } })
      .select("fullName grade isGraduated")
      .lean<{ _id: { toString(): string }; fullName: string; grade?: number; isGraduated?: boolean }[]>(),
    UserCalendar.find({ userId: { $in: memberUserIds } })
      .populate({ path: "performances.performanceId", populate: { path: "typeId" } })
      .populate("performances.roleTypeIds")
      .lean<PopulatedCalendar[]>(),
  ]);

  const userMap = new Map(users.map((u) => [u._id.toString(), u]));
  const calendarMap = new Map(calendars.map((c) => [c.userId.toString(), c]));

  // 3. member 構築 (卒業者は検索から除外)
  const allMembers: Member[] = availabilities.flatMap((a) => {
    const uid = a.userId.toString();
    const user = userMap.get(uid);
    if (user?.isGraduated) return [];
    const cal = calendarMap.get(uid);
    const performances: MemberPerformance[] = (cal?.performances ?? []).flatMap((e) => {
      const perf = e.performanceId;
      if (!perf) return [];
      return [
        {
          id: perf._id.toString(),
          label: performanceLabel(perf),
          roleTypes: e.roleTypeIds.map((r) => ({ id: r._id.toString(), name: r.name })),
        },
      ];
    });
    return [
      {
        userId: uid,
        name: user?.fullName ?? "(不明)",
        grade: user?.grade ?? null,
        performances,
        availableSlots: a.availableSlots,
        lastInputDate: cal?.lastInputDate ?? null,
      },
    ];
  });

  // 4. フィルタ。公演×役職セットは AND (全セット合致)、各セットは同一 entry で判定。
  const gradeSet = new Set(grades);
  const userSet = new Set(userIds);

  const matchesGroup = (m: Member, group: { performanceId: string; roleTypeIds: string[] }) => {
    const roleSet = new Set(group.roleTypeIds);
    return m.performances.some(
      (p) => p.id === group.performanceId && (roleSet.size === 0 || p.roleTypes.some((r) => roleSet.has(r.id))),
    );
  };

  const members = allMembers.filter(
    (m) =>
      groups.every((g) => matchesGroup(m, g)) &&
      (gradeSet.size === 0 || (m.grade !== null && gradeSet.has(m.grade))) &&
      (userSet.size === 0 || userSet.has(m.userId)),
  );

  // 5. facets は未フィルタ集合から (選択肢 + 人数)
  const facets = buildFacets(allMembers);

  return NextResponse.json({ members, facets });
}

// 役職は「公演ごと」にネストする (UI が 公演を選ぶ→その公演の役職を選ぶ という階層のため)。
function buildFacets(allMembers: Member[]) {
  interface RoleAgg {
    id: string;
    name: string;
    members: { userId: string; name: string; grade: number | null }[];
  }
  interface PerfFacet {
    id: string;
    label: string;
    count: number;
    roles: Map<string, RoleAgg>;
  }
  const perf = new Map<string, PerfFacet>();
  const grade = new Map<number, { value: number; count: number }>();

  for (const m of allMembers) {
    const seenPerf = new Set<string>();
    const seenPerfRole = new Set<string>();
    for (const p of m.performances) {
      let pe = perf.get(p.id);
      if (!pe) {
        pe = { id: p.id, label: p.label, count: 0, roles: new Map() };
        perf.set(p.id, pe);
      }
      if (!seenPerf.has(p.id)) {
        seenPerf.add(p.id);
        pe.count += 1;
      }
      for (const r of p.roleTypes) {
        const key = `${p.id}:${r.id}`;
        if (!seenPerfRole.has(key)) {
          seenPerfRole.add(key);
          const re = pe.roles.get(r.id) ?? { id: r.id, name: r.name, members: [] };
          re.members.push({ userId: m.userId, name: m.name, grade: m.grade });
          pe.roles.set(r.id, re);
        }
      }
    }
    if (m.grade !== null) {
      const e = grade.get(m.grade) ?? { value: m.grade, count: 0 };
      e.count += 1;
      grade.set(m.grade, e);
    }
  }

  // 学年の高い順 (未設定は末尾)、同学年は名前順
  const byGradeThenName = <T extends { grade: number | null; name: string }>(a: T, b: T) =>
    (b.grade ?? Number.NEGATIVE_INFINITY) - (a.grade ?? Number.NEGATIVE_INFINITY) || a.name.localeCompare(b.name, "ja");

  return {
    performances: [...perf.values()]
      .sort((a, b) => a.label.localeCompare(b.label, "ja"))
      .map((p) => ({
        id: p.id,
        label: p.label,
        count: p.count,
        roleTypes: [...p.roles.values()]
          .sort((a, b) => a.name.localeCompare(b.name, "ja"))
          .map((r) => ({
            id: r.id,
            name: r.name,
            count: r.members.length,
            members: [...r.members].sort(byGradeThenName).map((mm) => ({ userId: mm.userId, name: mm.name })),
          })),
      })),
    grades: [...grade.values()].sort((a, b) => a.value - b.value),
    names: allMembers.map((m) => ({ userId: m.userId, name: m.name, grade: m.grade })).sort(byGradeThenName),
  };
}
