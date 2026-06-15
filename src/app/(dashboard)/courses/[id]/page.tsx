import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Topbar } from "@/components/topbar";
import { CourseDetailTabs } from "@/components/courses/course-detail-tabs";
import type { Course, Session, Material, Submission, Attendance, Profile } from "@/lib/types";

export default async function CourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: courseId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  const role = (profile as Profile).role;

  const { data: course } = await supabase.from("courses").select("*").eq("id", courseId).single();
  if (!course) notFound();

  const { data: sessions } = await supabase.from("sessions").select("*").eq("course_id", courseId).order("order_index");
  const sessionList = (sessions ?? []) as Session[];
  const sessionIds = sessionList.map((s) => s.id);

  const { data: materials } = sessionIds.length
    ? await supabase.from("materials").select("*").in("session_id", sessionIds)
    : { data: [] as Material[] };

  const { data: instructorLinks } = await supabase.from("course_instructors").select("instructor_id").eq("course_id", courseId);
  const instructorIds = (instructorLinks ?? []).map((l) => l.instructor_id);
  const { data: instructors } = instructorIds.length
    ? await supabase.from("profiles").select("*").in("id", instructorIds)
    : { data: [] as Profile[] };

  const { data: enrollments } = await supabase.from("enrollments").select("student_id, enrolled_at").eq("course_id", courseId);
  const studentIds = (enrollments ?? []).map((e) => e.student_id);
  const { data: students } = studentIds.length
    ? await supabase.from("profiles").select("*").in("id", studentIds)
    : { data: [] as Profile[] };

  const { data: attendance } = sessionIds.length
    ? await supabase.from("attendance").select("*").in("session_id", sessionIds)
    : { data: [] as Attendance[] };

  let submissions: Submission[] = [];
  if (sessionIds.length) {
    if (role === "student") {
      const { data } = await supabase.from("submissions").select("*").eq("student_id", user.id).in("session_id", sessionIds);
      submissions = (data ?? []) as Submission[];
    } else {
      const { data } = await supabase.from("submissions").select("*").in("session_id", sessionIds);
      submissions = (data ?? []) as Submission[];
    }
  }

  let allInstructors: Profile[] = [];
  let allStudents: Profile[] = [];
  if (role === "admin") {
    const { data: inst } = await supabase.from("profiles").select("*").eq("role", "instructor");
    allInstructors = (inst ?? []) as Profile[];
    const { data: stud } = await supabase.from("profiles").select("*").eq("role", "student");
    allStudents = (stud ?? []) as Profile[];
  }

  return (
    <div>
      <Topbar title={(course as Course).title} subtitle={(course as Course).category} />
      <div className="space-y-6 p-4 sm:p-6 lg:p-8">
        <CourseDetailTabs
          course={course as Course}
          role={role}
          userId={user.id}
          sessions={sessionList}
          materials={(materials ?? []) as Material[]}
          instructors={(instructors ?? []) as Profile[]}
          students={(students ?? []) as Profile[]}
          attendance={(attendance ?? []) as Attendance[]}
          submissions={submissions}
          allInstructors={allInstructors}
          allStudents={allStudents}
        />
      </div>
    </div>
  );
}
