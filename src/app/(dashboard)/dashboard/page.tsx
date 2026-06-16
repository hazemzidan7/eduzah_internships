import { createClient } from "@/lib/supabase/server";
import { StudentDashboard } from "@/components/dashboard/student-dashboard";
import { InstructorDashboard } from "@/components/dashboard/instructor-dashboard";
import { AdminDashboard } from "@/components/dashboard/admin-dashboard";
import { isOverdue } from "@/lib/utils";
import type { Course, Session, Submission, Profile, Notification } from "@/lib/types";

export const revalidate = 30;

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  const role = (profile as Profile).role;
  const firstName = (profile as Profile).name.split(" ")[0];

  if (role === "student") {
    const { data: enrollments } = await supabase.from("enrollments").select("course_id").eq("student_id", user.id);
    const courseIds = (enrollments ?? []).map((e) => e.course_id);

    const [coursesRes, sessionsRes, submissionsRes] = await Promise.all([
      courseIds.length ? supabase.from("courses").select("*").in("id", courseIds) : Promise.resolve({ data: [] as Course[] }),
      courseIds.length ? supabase.from("sessions").select("*").in("course_id", courseIds).order("order_index") : Promise.resolve({ data: [] as Session[] }),
      supabase.from("submissions").select("*").eq("student_id", user.id),
    ]);

    const sessionList = (sessionsRes.data ?? []) as Session[];
    const subList = (submissionsRes.data ?? []) as Submission[];
    const subMap = new Map(subList.map((s) => [s.session_id, s]));
    const courseMap = new Map(((coursesRes.data ?? []) as Course[]).map((c) => [c.id, c.title]));

    const total = sessionList.length;
    const reviewed = subList.filter((s) => s.status === "reviewed" || s.status === "approved").length;
    const submitted = subList.filter((s) => s.status === "submitted" || s.status === "late").length;
    const progress = total > 0 ? Math.round((reviewed / total) * 100) : 0;
    const grades = subList.filter((s) => s.grade !== null).map((s) => s.grade as number);
    const avgGrade = grades.length > 0 ? Math.round(grades.reduce((a, b) => a + b, 0) / grades.length) : null;

    const upcoming = sessionList
      .filter((s) => {
        const sub = subMap.get(s.id);
        return s.deadline && sub?.status !== "reviewed" && sub?.status !== "approved" && sub?.status !== "submitted";
      })
      .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime())
      .slice(0, 5);

    return (
      <StudentDashboard
        firstName={firstName}
        courses={(coursesRes.data ?? []) as Course[]}
        sessionList={sessionList}
        subList={subList}
        subMap={subMap}
        courseMap={courseMap}
        total={total}
        reviewed={reviewed}
        submitted={submitted}
        progress={progress}
        avgGrade={avgGrade}
        upcoming={upcoming}
      />
    );
  }

  if (role === "instructor") {
    const { data: assignments } = await supabase.from("course_instructors").select("course_id").eq("instructor_id", user.id);
    const courseIds = (assignments ?? []).map((a) => a.course_id);

    const [coursesRes, sessionsRes, enrollmentsRes] = await Promise.all([
      courseIds.length ? supabase.from("courses").select("*").in("id", courseIds) : Promise.resolve({ data: [] as Course[] }),
      courseIds.length ? supabase.from("sessions").select("*").in("course_id", courseIds) : Promise.resolve({ data: [] as Session[] }),
      courseIds.length ? supabase.from("enrollments").select("student_id").in("course_id", courseIds) : Promise.resolve({ data: [] }),
    ]);

    const sessionList = (sessionsRes.data ?? []) as Session[];
    const sessionIds = sessionList.map((s) => s.id);
    const sessionMap = new Map(sessionList.map((s) => [s.id, s]));
    const courseMap = new Map(((coursesRes.data ?? []) as Course[]).map((c) => [c.id, c.title]));
    const totalStudents = new Set((enrollmentsRes.data ?? []).map((e) => e.student_id)).size;

    const { data: submissions } = sessionIds.length
      ? await supabase.from("submissions").select("*").in("session_id", sessionIds)
      : { data: [] as Submission[] };
    const subList = (submissions ?? []) as Submission[];
    const pendingReview = subList.filter((s) => s.status === "submitted" || s.status === "late").length;

    const recentSubmissions = subList
      .filter((s) => s.submitted_at)
      .sort((a, b) => new Date(b.submitted_at!).getTime() - new Date(a.submitted_at!).getTime())
      .slice(0, 6);

    const studentIds = [...new Set(recentSubmissions.map((s) => s.student_id))];
    const { data: studentProfiles } = studentIds.length
      ? await supabase.from("profiles").select("id, name").in("id", studentIds)
      : { data: [] };
    const studentMap = new Map((studentProfiles ?? []).map((p) => [p.id, p.name]));

    return (
      <InstructorDashboard
        firstName={firstName}
        courses={(coursesRes.data ?? []) as Course[]}
        sessionList={sessionList}
        totalStudents={totalStudents}
        pendingReview={pendingReview}
        recentSubmissions={recentSubmissions}
        sessionMap={sessionMap}
        courseMap={courseMap}
        studentMap={studentMap}
      />
    );
  }

  // Admin — all queries in parallel
  const [
    coursesRes,
    studentCountRes,
    instructorCountRes,
    enrollmentsRes,
    attendanceRes,
    submissionsRes,
    notificationsRes,
  ] = await Promise.all([
    supabase.from("courses").select("*"),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "student"),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "instructor"),
    supabase.from("enrollments").select("course_id"),
    supabase.from("attendance").select("status"),
    supabase.from("submissions").select("status, grade"),
    supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(6),
  ]);

  const courseList = (coursesRes.data ?? []) as Course[];
  const courseMap = new Map(courseList.map((c) => [c.id, c]));

  const categoryCounts = new Map<string, number>();
  (enrollmentsRes.data ?? []).forEach((e) => {
    const course = courseMap.get(e.course_id);
    if (!course) return;
    categoryCounts.set(course.category, (categoryCounts.get(course.category) ?? 0) + 1);
  });
  const enrollmentsByCategory = [...categoryCounts.entries()].map(([name, value]) => ({ name, value }));

  const statusCounts = { draft: 0, active: 0, archived: 0 };
  courseList.forEach((c) => { statusCounts[c.status]++; });
  const courseStatusData = [
    { name: "Active", value: statusCounts.active },
    { name: "Draft", value: statusCounts.draft },
    { name: "Archived", value: statusCounts.archived },
  ].filter((d) => d.value > 0);

  const attCounts = { present: 0, absent: 0, late: 0 };
  (attendanceRes.data ?? []).forEach((a) => { attCounts[a.status as keyof typeof attCounts]++; });
  const attendanceData = [
    { name: "Present", value: attCounts.present },
    { name: "Absent", value: attCounts.absent },
    { name: "Late", value: attCounts.late },
  ].filter((d) => d.value > 0);

  const subList = (submissionsRes.data ?? []) as { status: string; grade: number | null }[];
  const submittedCount = subList.filter((s) => ["submitted", "late", "reviewed", "approved"].includes(s.status)).length;
  const pendingReview = subList.filter((s) => s.status === "submitted" || s.status === "late").length;
  const reviewedCount = subList.filter((s) => s.status === "reviewed" || s.status === "approved").length;
  const completionRate = submittedCount > 0 ? Math.round((reviewedCount / submittedCount) * 100) : 0;

  return (
    <AdminDashboard
      firstName={firstName}
      courseCount={courseList.length}
      studentCount={studentCountRes.count ?? 0}
      instructorCount={instructorCountRes.count ?? 0}
      pendingReview={pendingReview}
      submittedCount={submittedCount}
      reviewedCount={reviewedCount}
      completionRate={completionRate}
      courseStatusData={courseStatusData}
      enrollmentsByCategory={enrollmentsByCategory}
      attendanceData={attendanceData}
      recentNotifications={(notificationsRes.data ?? []) as Notification[]}
    />
  );
}
