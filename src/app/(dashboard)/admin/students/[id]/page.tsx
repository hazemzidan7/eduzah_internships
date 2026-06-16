import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Topbar } from "@/components/topbar";
import { Card, Avatar, StatCard, ProgressBar, EmptyState } from "@/components/ui";
import { ChevronLeft, GraduationCap, TrendingUp, CheckCircle2 } from "lucide-react";
import type { Course, Session, Submission, Attendance, Profile } from "@/lib/types";

export default async function StudentProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: student } = await supabase.from("profiles").select("*").eq("id", id).eq("role", "student").single();
  if (!student) notFound();

  const { data: enrollments } = await supabase.from("enrollments").select("course_id").eq("student_id", id);
  const courseIds = (enrollments ?? []).map((e) => e.course_id);

  const { data: courses } = courseIds.length
    ? await supabase.from("courses").select("*").in("id", courseIds)
    : { data: [] as Course[] };
  const courseList = (courses ?? []) as Course[];

  const { data: sessions } = courseIds.length
    ? await supabase.from("sessions").select("*").in("course_id", courseIds).order("order_index")
    : { data: [] as Session[] };
  const sessionList = (sessions ?? []) as Session[];

  const { data: submissions } = await supabase.from("submissions").select("*").eq("student_id", id);
  const subList = (submissions ?? []) as Submission[];
  const subMap = new Map(subList.map((s) => [s.session_id, s]));

  const { data: attendance } = await supabase.from("attendance").select("*").eq("student_id", id);
  const attList = (attendance ?? []) as Attendance[];
  const present = attList.filter((a) => a.status === "present").length;
  const attendancePct = attList.length > 0 ? Math.round((present / attList.length) * 100) : null;

  const grades = subList.filter((s) => s.grade !== null).map((s) => s.grade as number);
  const avgGrade = grades.length > 0 ? Math.round(grades.reduce((a, b) => a + b, 0) / grades.length) : null;

  const reviewed = subList.filter((s) => s.status === "reviewed" || s.status === "approved").length;
  const overallProgress = sessionList.length > 0 ? Math.round((reviewed / sessionList.length) * 100) : 0;

  return (
    <div>
      <Topbar title={(student as Profile).name} subtitle="Student profile" subtitleAr="ملف الطالب" />
      <div className="space-y-6 p-4 sm:p-6 lg:p-8">
        <Link href="/admin/students" className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground/60 hover:text-foreground">
          <ChevronLeft size={16} /> Back to students
        </Link>

        <Card className="flex items-center gap-4">
          <Avatar name={(student as Profile).name} src={(student as Profile).avatar_url} size={56} />
          <div>
            <h1 className="text-lg font-bold text-foreground">{(student as Profile).name}</h1>
            <p className="text-sm text-foreground/50">{(student as Profile).email}</p>
            {(student as Profile).phone && <p className="text-sm text-foreground/50">{(student as Profile).phone}</p>}
          </div>
        </Card>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard label="Enrolled Courses" value={courseList.length} icon={<GraduationCap size={22} />} />
          <StatCard label="Average Grade" value={avgGrade !== null ? `${avgGrade}%` : "—"} icon={<TrendingUp size={22} />} accent="bg-primary-soft text-primary" />
          <StatCard label="Attendance Rate" value={attendancePct !== null ? `${attendancePct}%` : "—"} icon={<CheckCircle2 size={22} />} accent="bg-success/10 text-success" />
        </div>

        <Card>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-semibold text-foreground">Overall Progress</h2>
            <span className="text-sm font-medium text-foreground/60">{overallProgress}%</span>
          </div>
          <ProgressBar value={overallProgress} />
        </Card>

        <div>
          <h2 className="mb-3 font-semibold text-foreground">Enrolled Courses</h2>
          {courseList.length === 0 ? (
            <EmptyState icon={<GraduationCap size={24} />} title="Not enrolled in any courses" description="This student has not been enrolled in any courses yet." />
          ) : (
            <div className="space-y-3">
              {courseList.map((c) => {
                const courseSessions = sessionList.filter((s) => s.course_id === c.id);
                const courseReviewed = courseSessions.filter((s) => {
                  const sub = subMap.get(s.id);
                  return sub?.status === "reviewed" || sub?.status === "approved";
                }).length;
                const pct = courseSessions.length > 0 ? Math.round((courseReviewed / courseSessions.length) * 100) : 0;
                return (
                  <Card key={c.id}>
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-medium text-foreground">{c.title}</p>
                        <p className="text-sm text-foreground/50">{c.category}</p>
                      </div>
                      <span className="text-sm font-semibold text-foreground/70">{pct}%</span>
                    </div>
                    <div className="mt-2">
                      <ProgressBar value={pct} />
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
