import { createClient } from "@/lib/supabase/server";
import { Topbar } from "@/components/topbar";
import { UserList } from "@/components/admin/user-list";
import type { Profile } from "@/lib/types";

export default async function StudentsPage() {
  const supabase = await createClient();

  const { data: students } = await supabase.from("profiles").select("*").eq("role", "student").order("name");
  const { data: enrollments } = await supabase.from("enrollments").select("student_id");

  const counts = new Map<string, number>();
  (enrollments ?? []).forEach((e) => counts.set(e.student_id, (counts.get(e.student_id) ?? 0) + 1));

  const metaMap: Record<string, string> = {};
  ((students ?? []) as Profile[]).forEach((s) => { metaMap[s.id] = String(counts.get(s.id) ?? 0); });

  return (
    <div>
      <Topbar title="Students" subtitle="Manage student accounts and enrollments" />
      <div className="p-4 sm:p-6 lg:p-8">
        <UserList users={(students ?? []) as Profile[]} role="student" label="Student" profilePathBase="/admin/students" metaMap={metaMap} />
      </div>
    </div>
  );
}
