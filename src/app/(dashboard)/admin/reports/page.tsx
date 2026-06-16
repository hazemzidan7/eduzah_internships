import { createClient } from "@/lib/supabase/server";
import { Topbar } from "@/components/topbar";
import { Card, StatCard, ProgressBar } from "@/components/ui";
import { CompletionByCourseChart, AttendanceOverviewChart } from "@/components/dashboard/admin-charts";
import { ReportsExport } from "@/components/admin/reports-export";
import { TrendingUp, CheckCircle2, Users, Layers } from "lucide-react";
import type { Course, Session, Submission, Attendance, Profile, Enrollment } from "@/lib/types";

export default async function ReportsPage() {
  const supabase = await createClient();

  const { data: courses } = await supabase.from("courses").select("*");
  const courseList = (courses ?? []) as Course[];

  const { data: sessions } = await supabase.from("sessions").select("*");
  const sessionList = (sessions ?? []) as Session[];

  const { data: submissions } = await supabase.from("submissions").select("*");
  const subList = (submissions ?? []) as Submission[];

  const { data: attendance } = await supabase.from("attendance").select("*");
  const attList = (attendance ?? []) as Attendance[];

  const { data: enrollments } = await supabase.from("enrollments").select("*");
  const enrollmentList = (enrollments ?? []) as Enrollment[];

  const { data: students } = await supabase.from("profiles").select("*").eq("role", "student");
  const studentList = (students ?? []) as Profile[];

  const studentMap = new Map(studentList.map((s) => [s.id, s]));
  const courseMap = new Map(courseList.map((c) => [c.id, c]));
  const sessionMap = new Map(sessionList.map((s) => [s.id, s]));

  // Completion rate per course
  const completionByCourse = courseList.map((c) => {
    const assignmentSessions = sessionList.filter((s) => s.course_id === c.id && s.assignment_title);
    const enrolledStudents = enrollmentList.filter((e) => e.course_id === c.id);
    const possible = assignmentSessions.length * enrolledStudents.length;
    const sessionIds = new Set(assignmentSessions.map((s) => s.id));
    const reviewed = subList.filter((s) => sessionIds.has(s.session_id) && (s.status === "reviewed" || s.status === "approved")).length;
    const rate = possible > 0 ? Math.round((reviewed / possible) * 100) : 0;
    return { name: c.title, value: rate };
  });

  const overallCompletion = completionByCourse.length > 0
    ? Math.round(completionByCourse.reduce((acc, c) => acc + c.value, 0) / completionByCourse.length)
    : 0;

  // Attendance overview
  const attCounts = { present: 0, absent: 0, late: 0 };
  attList.forEach((a) => { attCounts[a.status]++; });
  const attendanceData = [
    { name: "Present", value: attCounts.present },
    { name: "Absent", value: attCounts.absent },
    { name: "Late", value: attCounts.late },
  ].filter((d) => d.value > 0);
  const overallAttendanceRate = attList.length > 0 ? Math.round((attCounts.present / attList.length) * 100) : 0;

  const grades = subList.filter((s) => s.grade !== null).map((s) => s.grade as number);
  const avgGrade = grades.length > 0 ? Math.round(grades.reduce((a, b) => a + b, 0) / grades.length) : 0;

  // CSV export rows
  const studentRows = enrollmentList.map((e) => ({
    student: studentMap.get(e.student_id)?.name ?? "Unknown",
    email: studentMap.get(e.student_id)?.email ?? "",
    course: courseMap.get(e.course_id)?.title ?? "Unknown",
    enrolled_at: e.enrolled_at,
  }));

  const attendanceRows = attList.map((a) => ({
    student: studentMap.get(a.student_id)?.name ?? "Unknown",
    session: sessionMap.get(a.session_id)?.title ?? "Unknown",
    course: courseMap.get(sessionMap.get(a.session_id)?.course_id ?? "")?.title ?? "Unknown",
    status: a.status,
    recorded_at: a.recorded_at,
  }));

  const gradeRows = subList.filter((s) => s.grade !== null).map((s) => ({
    student: studentMap.get(s.student_id)?.name ?? "Unknown",
    session: sessionMap.get(s.session_id)?.title ?? "Unknown",
    course: courseMap.get(sessionMap.get(s.session_id)?.course_id ?? "")?.title ?? "Unknown",
    grade: s.grade,
    status: s.status,
  }));

  return (
    <div>
      <Topbar title="Reports & Analytics" subtitle="Platform-wide performance and completion metrics" titleAr="التقارير والتحليلات" subtitleAr="مقاييس الأداء والإتمام على مستوى المنصة" />
      <div className="space-y-6 p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Avg Completion Rate" value={`${overallCompletion}%`} icon={<CheckCircle2 size={22} />} accent="bg-success/10 text-success" />
          <StatCard label="Avg Grade" value={`${avgGrade}%`} icon={<TrendingUp size={22} />} accent="bg-primary-soft text-primary" />
          <StatCard label="Attendance Rate" value={`${overallAttendanceRate}%`} icon={<Users size={22} />} />
          <StatCard label="Total Courses" value={courseList.length} icon={<Layers size={22} />} />
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <CompletionByCourseChart data={completionByCourse.length ? completionByCourse : [{ name: "No data", value: 0 }]} />
          <AttendanceOverviewChart data={attendanceData.length ? attendanceData : [{ name: "No records", value: 1 }]} />
        </div>

        <Card>
          <h2 className="mb-2 font-semibold text-foreground">Overall Completion</h2>
          <ProgressBar value={overallCompletion} />
        </Card>

        <div>
          <h2 className="mb-3 font-semibold text-foreground">Export Data</h2>
          <ReportsExport students={studentRows} attendance={attendanceRows} grades={gradeRows} />
        </div>
      </div>
    </div>
  );
}
