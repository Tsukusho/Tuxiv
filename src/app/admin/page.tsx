"use client";

import GraduationEditor from "./_components/GraduationEditor";
import MasterTypeEditor from "./_components/MasterTypeEditor";

export default function AdminPage() {
  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">管理画面</h1>
      <div className="space-y-8">
        <MasterTypeEditor
          title="公演種類"
          endpoint="/api/admin/performance-types"
          queryKey="admin-performance-types"
        />
        <MasterTypeEditor title="役職" endpoint="/api/admin/role-types" queryKey="admin-role-types" />
        <GraduationEditor />
      </div>
    </div>
  );
}
