import type { Model } from "mongoose";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import dbConnect from "@/lib/dbConnect";
import { isDuplicateKeyError } from "@/lib/dbError";

// PerformanceType と RoleType は同形 (name unique / order / isActive) なので
// CRUD ロジックをここに集約し、両 route から使い回す (重複コードを避ける)。
// 利用元は api/admin 配下だけなのでここに colocate する (_ 始まりで Next のルート化を回避)。
interface MasterType {
  name: string;
  order: number;
  isActive: boolean;
}

const createSchema = z.object({
  name: z.string().trim().min(1, "名前を入力してください。").max(50),
});

const updateSchema = z
  .object({
    name: z.string().trim().min(1, "名前を入力してください。").max(50).optional(),
    order: z.number().int().optional(),
    isActive: z.boolean().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, "更新内容がありません。");

const DUPLICATE_MESSAGE = "この名前は既に存在します。";

function gateError(gate: { status: 401 | 403; error: string }) {
  return NextResponse.json({ error: gate.error }, { status: gate.status });
}

export function masterTypeCollectionRoutes<T extends MasterType>(model: Model<T>) {
  return {
    // 管理画面は論理削除分も含め全件・order 順で返す (公開 GET は isActive:true のみ)
    async GET() {
      const gate = await requireAdmin();
      if (!gate.ok) return gateError(gate);

      await dbConnect();
      const items = await model.find({}).sort({ order: 1 });
      return NextResponse.json(items);
    },

    async POST(request: NextRequest) {
      const gate = await requireAdmin();
      if (!gate.ok) return gateError(gate);

      const body = await request.json().catch(() => null);
      const parsed = createSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
      }

      await dbConnect();
      try {
        const last = await model.findOne().sort({ order: -1 }).lean<{ order: number } | null>();
        const order = (last?.order ?? 0) + 1;
        const created = await model.create({ name: parsed.data.name, order });
        return NextResponse.json(created, { status: 201 });
      } catch (error) {
        if (isDuplicateKeyError(error)) {
          return NextResponse.json({ error: DUPLICATE_MESSAGE }, { status: 409 });
        }
        throw error;
      }
    },
  };
}

export function masterTypeItemRoutes<T extends MasterType>(model: Model<T>) {
  return {
    // 物理削除はしない (UserCalendar が _id 参照するため)。削除は isActive:false で表現。
    async PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
      const gate = await requireAdmin();
      if (!gate.ok) return gateError(gate);

      const { id } = await context.params;
      const body = await request.json().catch(() => null);
      const parsed = updateSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
      }

      await dbConnect();
      try {
        const updated = await model.findByIdAndUpdate(id, parsed.data, {
          new: true,
          runValidators: true,
        });
        if (!updated) return NextResponse.json({ error: "対象が見つかりません。" }, { status: 404 });
        return NextResponse.json(updated);
      } catch (error) {
        if (isDuplicateKeyError(error)) {
          return NextResponse.json({ error: DUPLICATE_MESSAGE }, { status: 409 });
        }
        throw error;
      }
    },
  };
}
