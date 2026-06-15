import { type NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUserId } from "@/lib/auth";
import dbConnect from "@/lib/dbConnect";
import Availability from "@/models/availability";
import Performance from "@/models/performance";
import RoleType from "@/models/roleType";
import User from "@/models/user";
import UserCalendar from "@/models/userCalendar";

// populate の ref を確実に登録する (未参照だと MissingSchemaError になるため)
void Performance;
void RoleType;

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

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error: "認証が必要です。" }, { status: 401 });
  }

  const { id: eventId } = await context.params;

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
      .populate("performances.performanceId")
      .populate("performances.roleTypeIds")
      .lean<PopulatedCalendar[]>(),
  ]);

  const userMap = new Map(users.map((u) => [u._id.toString(), u]));
  const calendarMap = new Map(calendars.map((c) => [c.userId.toString(), c]));

  // 3. member 構築 (卒業者は除外)
  const members: Member[] = availabilities.flatMap((a) => {
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

  const facets = buildFacets(members);

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
