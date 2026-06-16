import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Topbar } from "@/components/topbar";
import { Button } from "@/components/ui";
import { CourseCatalog } from "@/components/courses/course-catalog";
import { Plus } from "lucide-react";
import type { Course, Session, Submission, Profile } from "@/lib/types";

export const revalidate = 30;

export default async function CoursesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  const role = (profile as Pick<Profile, "role">).role;

  let courses: Course[] = [];
  const metaMap: Record<string, string> = {};
  const progressMap: Record<string, number> = {};

  if (role === "admin") {
    const [coursesRes, enrollmentsRes] = await Promise.all([
      supabase.from("courses").select("*").order("created_at", { ascending: false }),
      supabase.from("enrollments").select("course_id"),
    ]);
    courses = (coursesRes.data ?? []) as Course[];
    const counts = new Map<string, number>();
    (enrollmentsRes.data ?? []).forEach((e) => counts.set(e.course_id, (counts.get(e.course_id) ?? 0) + 1));
    courses.forEach((c) => { metaMap[c.id] = String(counts.get(c.id) ?? 0); });

  } else if (role === "instructor") {
    const { data: assignments } = await supabase.from("course_instructors").select("course_id").eq("instructor_id", user.id);
    const courseIds = (assignments ?? []).map((a) => a.course_id);
    if (courseIds.length) {
      const [coursesRes, enrollmentsRes] = await Promise.all([
        supabase.from("courses").select("*").in("id", courseIds).order("created_at", { ascending: false }),
        supabase.from("enrollments").select("course_id").in("course_id", courseIds),
      ]);
      courses = (coursesRes.data ?? []) as Course[];
      const counts = new Map<string, number>();
      (enrollmentsRes.data ?? []).forEach((e) => counts.set(e.course_id, (counts.get(e.course_id) ?? 0) + 1));
      courses.forEach((c) => { metaMap[c.id] = String(counts.get(c.id) ?? 0); });
    }

  } else {
    const { data: enrollments } = await supabase.from("enrollments").select("course_id").eq("student_id", user.id);
    const courseIds = (enrollments ?? []).map((e) => e.course_id);
    if (courseIds.length) {
      const [coursesRes, sessionsRes, submissionsRes] = await Promise.all([
        supabase.from("courses").select("*").in("id", courseIds).order("created_at", { ascending: false }),
        supabase.from("sessions").select("id, course_id").in("course_id", courseIds),
        supabase.from("submissions").select("session_id, status").eq("student_id", user.id),
      ]);
      courses = (coursesRes.data ?? []) as Course[];
      const sessionList = (sessionsRes.data ?? []) as Pick<Session, "id" | "course_id">[];
      const subList = (submissionsRes.data ?? []) as Pick<Submission, "session_id" | "status">[];
      const subMap = new Map(subList.map((s) => [s.session_id, s]));
      courses.forEach((c) => {
        const cs = sessionList.filter((s) => s.course_id === c.id);
        const reviewed = cs.filter((s) => { const sub = subMap.get(s.id); return sub?.status === "reviewed" || sub?.status === "approved"; }).length;
        progressMap[c.id] = cs.length > 0 ? Math.round((reviewed / cs.length) * 100) : 0;
      });
    }
  }

  return (
    <div>
      <Topbar
        title={role === "admin" ? "Courses" : "My Courses"}
        subtitle={role === "admin" ? "Manage all courses on the platform" : "Browse your courses and materials"}
        titleAr={role === "admin" ? "الكورسات" : "كورساتي"}
        subtitleAr={role === "admin" ? "إدارة جميع الكورسات على المنصة" : "تصفح كورساتك ومواد التعلم"}
      />
      <div className="space-y-4 p-4 sm:p-6 lg:p-8">
        {role === "admin" && (
          <div className="flex justify-end">
            <Link href="/admin/courses/new">
              <Button><Plus size={16} /> New Course</Button>
            </Link>
          </div>
        )}
        <CourseCatalog
          courses={courses}
          showStatus={role === "admin"}
          progressMap={role === "student" ? progressMap : undefined}
          metaMap={role !== "student" ? metaMap : undefined}
        />
      </div>
    </div>
  );
}
