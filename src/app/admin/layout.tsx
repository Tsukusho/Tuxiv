import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";

// /admin 配下はサーバー側で管理者ゲート。非ログインは middleware が /login へ、
// ログイン済み非管理者はここで /(トップ) へ弾く。
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const gate = await requireAdmin();
  if (!gate.ok) redirect("/");
  return <>{children}</>;
}
