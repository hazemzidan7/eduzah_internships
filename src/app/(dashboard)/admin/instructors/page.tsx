import { createClient } from "@/lib/supabase/server";
import { Topbar } from "@/components/topbar";
import { UserList } from "@/components/admin/user-list";
import type { Profile } from "@/lib/types";

export default async function InstructorsPage() {
  const supabase = await createClient();

  const { data: instructors } = await supabase.from("profiles").select("*").eq("role", "instructor").order("name");
  const { data: assignments } = await supabase.from("course_instructors").select("instructor_id");

  const counts = new Map<string, number>();
  (assignments ?? []).forEach((a) => counts.set(a.instructor_id, (counts.get(a.instructor_id) ?? 0) + 1));

  const metaMap: Record<string, string> = {};
  ((instructors ?? []) as Profile[]).forEach((i) => { metaMap[i.id] = String(counts.get(i.id) ?? 0); });

  return (
    <div>
      <Topbar title="Instructors" subtitle="Manage instructor accounts and course assignments" titleAr="المدرسين" subtitleAr="إدارة حسابات المدرسين وتعيينات الكورسات" />
      <div className="p-4 sm:p-6 lg:p-8">
        <UserList users={(instructors ?? []) as Profile[]} role="instructor" label="Instructor" profilePathBase="/admin/instructors" metaMap={metaMap} />
      </div>
    </div>
  );
}
