import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Topbar } from "@/components/topbar";
import { Card, ProgressBar, StatCard, StatusBadge, EmptyState } from "@/components/ui";
import { HeroBanner } from "@/components/dashboard/hero-banner";
import { CourseStatusChart, EnrollmentsByCategoryChart, AttendanceOverviewChart } from "@/components/dashboard/admin-charts";
import { formatDate, isOverdue } from "@/lib/utils";
import {
  BookOpen,
  CheckCircle2,
  Clock,
  TrendingUp,
  Users,
  ClipboardCheck,
  AlarmClock,
  GraduationCap,
  Layers,
  Sparkles,
  LayoutDashboard,
} from "lucide-react";
import type { Course, Session, Submission, Profile } from "@/lib/types";

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

    const { data: courses } = courseIds.length
      ? await supabase.from("courses").select("*").in("id", courseIds)
      : { data: [] as Course[] };

    const { data: sessions } = courseIds.length
      ? await supabase.from("sessions").select("*").in("course_id", courseIds).order("order_index")
      : { data: [] as Session[] };

    const { data: submissions } = await supabase.from("submissions").select("*").eq("student_id", user.id);

    const sessionList = (sessions ?? []) as Session[];
    const subList = (submissions ?? []) as Submission[];
    const subMap = new Map(subList.map((s) => [s.session_id, s]));

    const total = sessionList.length;
    const reviewed = subList.filter((s) => s.status === "reviewed" || s.status === "approved").length;
    const submitted = subList.filter((s) => s.status === "submitted" || s.status === "late").length;
    const progress = total > 0 ? Math.round((reviewed / total) * 100) : 0;

    const grades = subList.filter((s) => s.grade !== null).map((s) => s.grade as number);
    const avgGrade = grades.length > 0 ? Math.round(grades.reduce((a, b) => a + b, 0) / grades.length) : null;

    const courseMap = new Map(((courses ?? []) as Course[]).map((c) => [c.id, c.title]));

    const upcoming = sessionList
      .filter((s) => {
        const sub = subMap.get(s.id);
        return s.deadline && sub?.status !== "reviewed" && sub?.status !== "approved" && sub?.status !== "submitted";
      })
      .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime())
      .slice(0, 5);

    return (
      <div>
        <Topbar title="Dashboard" subtitle="Here's your learning progress" />
        <div className="space-y-6 p-4 sm:p-6 lg:p-8">
          <HeroBanner
            title={`Welcome back, ${firstName} 👋`}
            subtitle={`${reviewed} of ${total} sessions reviewed · ${progress}% overall progress`}
            icon={Sparkles}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Enrolled Courses" value={(courses ?? []).length} icon={<GraduationCap size={22} />} />
            <StatCard label="Total Sessions" value={total} icon={<BookOpen size={22} />} />
            <StatCard label="Reviewed" value={reviewed} icon={<CheckCircle2 size={22} />} accent="bg-success/10 text-success" />
            <StatCard label="Average Grade" value={avgGrade !== null ? `${avgGrade}%` : "—"} icon={<TrendingUp size={22} />} accent="bg-highlight-soft text-highlight" />
          </div>

          <Card className="card-hover">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="font-semibold text-foreground">Overall Progress</h2>
              <span className="text-sm font-medium text-foreground/60">{progress}%</span>
            </div>
            <ProgressBar value={progress} />
            <p className="mt-2 text-sm text-foreground/50">
              {reviewed} of {total} sessions completed and reviewed · {submitted} pending review.
            </p>
          </Card>

          <div>
            <h2 className="mb-3 font-semibold text-foreground">Upcoming Deadlines</h2>
            {upcoming.length === 0 ? (
              <EmptyState icon={<AlarmClock size={24} />} title="You're all caught up!" description="No pending deadlines right now." />
            ) : (
              <div className="space-y-2">
                {upcoming.map((s) => {
                  const sub = subMap.get(s.id);
                  return (
                    <Link
                      key={s.id}
                      href={`/courses/${s.course_id}/sessions/${s.id}`}
                      className="flex flex-col gap-2 rounded-xl border border-border bg-surface p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-md sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="font-medium text-foreground">{s.title}</p>
                        <p className="text-sm text-foreground/50">
                          {courseMap.get(s.course_id)} · {s.assignment_title ?? "No assignment"} · Due {formatDate(s.deadline)}
                          {isOverdue(s.deadline) && <span className="ml-2 font-semibold text-danger">Overdue</span>}
                        </p>
                      </div>
                      <StatusBadge status={sub?.status ?? "not_submitted"} />
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (role === "instructor") {
    const { data: assignments } = await supabase.from("course_instructors").select("course_id").eq("instructor_id", user.id);
    const courseIds = (assignments ?? []).map((a) => a.course_id);

    const { data: courses } = courseIds.length
      ? await supabase.from("courses").select("*").in("id", courseIds)
      : { data: [] as Course[] };

    const { data: sessions } = courseIds.length
      ? await supabase.from("sessions").select("*").in("course_id", courseIds)
      : { data: [] as Session[] };

    const sessionList = (sessions ?? []) as Session[];
    const sessionIds = sessionList.map((s) => s.id);
    const sessionMap = new Map(sessionList.map((s) => [s.id, s]));
    const courseMap = new Map(((courses ?? []) as Course[]).map((c) => [c.id, c.title]));

    const { data: enrollments } = courseIds.length
      ? await supabase.from("enrollments").select("student_id").in("course_id", courseIds)
      : { data: [] };
    const totalStudents = new Set((enrollments ?? []).map((e) => e.student_id)).size;

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
      <div>
        <Topbar title="Dashboard" subtitle="Overview of your assigned courses" />
        <div className="space-y-6 p-4 sm:p-6 lg:p-8">
          <HeroBanner
            title={`Welcome back, ${firstName} 👋`}
            subtitle={`${(courses ?? []).length} assigned courses · ${pendingReview} submissions awaiting review`}
            icon={LayoutDashboard}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Assigned Courses" value={(courses ?? []).length} icon={<Layers size={22} />} />
            <StatCard label="Total Students" value={totalStudents} icon={<Users size={22} />} />
            <StatCard label="Pending Review" value={pendingReview} icon={<Clock size={22} />} accent="bg-highlight-soft text-highlight" />
            <StatCard label="Total Sessions" value={sessionList.length} icon={<BookOpen size={22} />} />
          </div>

          <div>
            <h2 className="mb-3 font-semibold text-foreground">Recent Submissions</h2>
            {recentSubmissions.length === 0 ? (
              <EmptyState icon={<ClipboardCheck size={24} />} title="No submissions yet" description="Student submissions will appear here." />
            ) : (
              <div className="card-hover overflow-hidden rounded-xl border border-border bg-surface">
                <table className="w-full text-sm">
                  <thead className="bg-surface-muted text-left text-xs uppercase text-foreground/50">
                    <tr>
                      <th className="px-4 py-3 font-medium">Student</th>
                      <th className="px-4 py-3 font-medium">Course</th>
                      <th className="px-4 py-3 font-medium">Session</th>
                      <th className="px-4 py-3 font-medium">Submitted</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {recentSubmissions.map((s) => {
                      const session = sessionMap.get(s.session_id);
                      return (
                        <tr key={s.id} className="transition-colors hover:bg-surface-muted/60">
                          <td className="px-4 py-3 font-medium text-foreground">{studentMap.get(s.student_id) ?? "Unknown"}</td>
                          <td className="px-4 py-3 text-foreground/70">{session ? courseMap.get(session.course_id) : "—"}</td>
                          <td className="px-4 py-3 text-foreground/70">{session?.title ?? "—"}</td>
                          <td className="px-4 py-3 text-foreground/50">{formatDate(s.submitted_at)}</td>
                          <td className="px-4 py-3"><StatusBadge status={s.status} /></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Admin dashboard
  const { data: courses } = await supabase.from("courses").select("*");
  const courseList = (courses ?? []) as Course[];

  const { count: studentCount } = await supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "student");
  const { count: instructorCount } = await supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "instructor");

  const { data: enrollments } = await supabase.from("enrollments").select("course_id");
  const courseMap = new Map(courseList.map((c) => [c.id, c]));

  const categoryCounts = new Map<string, number>();
  (enrollments ?? []).forEach((e) => {
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

  const { data: attendanceRows } = await supabase.from("attendance").select("status");
  const attCounts = { present: 0, absent: 0, late: 0 };
  (attendanceRows ?? []).forEach((a) => { attCounts[a.status as keyof typeof attCounts]++; });
  const attendanceData = [
    { name: "Present", value: attCounts.present },
    { name: "Absent", value: attCounts.absent },
    { name: "Late", value: attCounts.late },
  ].filter((d) => d.value > 0);

  const { data: submissions } = await supabase.from("submissions").select("*");
  const subList = (submissions ?? []) as Submission[];
  const submittedCount = subList.filter((s) => s.status === "submitted" || s.status === "late" || s.status === "reviewed" || s.status === "approved").length;
  const pendingReview = subList.filter((s) => s.status === "submitted" || s.status === "late").length;
  const reviewedCount = subList.filter((s) => s.status === "reviewed" || s.status === "approved").length;
  const totalPossible = (studentCount ?? 0) * courseList.length;
  const completionRate = totalPossible > 0 ? Math.round((reviewedCount / Math.max(subList.length, 1)) * 100) : 0;

  const { data: recentNotifications } = await supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(6);

  return (
    <div>
      <Topbar title="Dashboard" subtitle="Platform-wide overview" />
      <div className="space-y-6 p-4 sm:p-6 lg:p-8">
        <HeroBanner
          title={`Welcome back, ${firstName} 👋`}
          subtitle={`${courseList.length} courses · ${studentCount ?? 0} students · ${instructorCount ?? 0} instructors`}
          icon={Sparkles}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total Courses" value={courseList.length} icon={<Layers size={22} />} />
          <StatCard label="Total Students" value={studentCount ?? 0} icon={<Users size={22} />} />
          <StatCard label="Total Instructors" value={instructorCount ?? 0} icon={<GraduationCap size={22} />} accent="bg-accent-soft text-accent" />
          <StatCard label="Pending Reviews" value={pendingReview} icon={<Clock size={22} />} accent="bg-highlight-soft text-highlight" />
        </div>

        <div>
          <h2 className="mb-3 font-semibold text-foreground">Analytics</h2>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <CourseStatusChart data={courseStatusData.length ? courseStatusData : [{ name: "No courses", value: 1 }]} />
            <EnrollmentsByCategoryChart data={enrollmentsByCategory.length ? enrollmentsByCategory : [{ name: "No data", value: 0 }]} />
            <AttendanceOverviewChart data={attendanceData.length ? attendanceData : [{ name: "No records", value: 1 }]} />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Card className="card-hover">
            <h2 className="mb-2 font-semibold text-foreground">Assignment Completion</h2>
            <ProgressBar value={completionRate} />
            <p className="mt-2 text-sm text-foreground/50">
              {reviewedCount} of {submittedCount || subList.length} submissions reviewed ({completionRate}%)
            </p>
          </Card>

          <Card className="card-hover">
            <h2 className="mb-2 font-semibold text-foreground">Recent Activity</h2>
            {(recentNotifications ?? []).length === 0 ? (
              <p className="py-4 text-sm text-foreground/50">No recent activity.</p>
            ) : (
              <ul className="space-y-2">
                {(recentNotifications ?? []).map((n) => (
                  <li key={n.id} className="flex items-start justify-between gap-2 text-sm">
                    <span className="text-foreground/80">{n.title}</span>
                    <span className="shrink-0 text-xs text-foreground/40">{formatDate(n.created_at)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
