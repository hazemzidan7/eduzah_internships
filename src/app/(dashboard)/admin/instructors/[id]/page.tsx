import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Topbar } from "@/components/topbar";
import { Card, Avatar, StatCard, EmptyState } from "@/components/ui";
import { CourseCard } from "@/components/courses/course-card";
import { ChevronLeft, BookOpen, Users, ClipboardCheck } from "lucide-react";
import type { Course, Submission, Profile } from "@/lib/types";

export default async function InstructorProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: instructor } = await supabase.from("profiles").select("*").eq("id", id).eq("role", "instructor").single();
  if (!instructor) notFound();

  const { data: assignments } = await supabase.from("course_instructors").select("course_id").eq("instructor_id", id);
  const courseIds = (assignments ?? []).map((a) => a.course_id);

  const { data: courses } = courseIds.length
    ? await supabase.from("courses").select("*").in("id", courseIds)
    : { data: [] as Course[] };
  const courseList = (courses ?? []) as Course[];

  const { data: enrollments } = courseIds.length
    ? await supabase.from("enrollments").select("student_id").in("course_id", courseIds)
    : { data: [] };
  const totalStudents = new Set((enrollments ?? []).map((e) => e.student_id)).size;

  const { data: sessions } = courseIds.length
    ? await supabase.from("sessions").select("id").in("course_id", courseIds)
    : { data: [] };
  const sessionIds = (sessions ?? []).map((s) => s.id);

  const { data: submissions } = sessionIds.length
    ? await supabase.from("submissions").select("*").in("session_id", sessionIds)
    : { data: [] as Submission[] };
  const reviewedCount = ((submissions ?? []) as Submission[]).filter((s) => s.status === "reviewed" || s.status === "approved").length;

  return (
    <div>
      <Topbar title={(instructor as Profile).name} subtitle="Instructor profile" />
      <div className="space-y-6 p-4 sm:p-6 lg:p-8">
        <Link href="/admin/instructors" className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground/60 hover:text-foreground">
          <ChevronLeft size={16} /> Back to instructors
        </Link>

        <Card className="flex items-center gap-4">
          <Avatar name={(instructor as Profile).name} src={(instructor as Profile).avatar_url} size={56} />
          <div>
            <h1 className="text-lg font-bold text-foreground">{(instructor as Profile).name}</h1>
            <p className="text-sm text-foreground/50">{(instructor as Profile).email}</p>
            {(instructor as Profile).phone && <p className="text-sm text-foreground/50">{(instructor as Profile).phone}</p>}
          </div>
        </Card>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard label="Assigned Courses" value={courseList.length} icon={<BookOpen size={22} />} />
          <StatCard label="Total Students" value={totalStudents} icon={<Users size={22} />} accent="bg-primary-soft text-primary" />
          <StatCard label="Submissions Reviewed" value={reviewedCount} icon={<ClipboardCheck size={22} />} accent="bg-success/10 text-success" />
        </div>

        <div>
          <h2 className="mb-3 font-semibold text-foreground">Assigned Courses</h2>
          {courseList.length === 0 ? (
            <EmptyState icon={<BookOpen size={24} />} title="No courses assigned" description="This instructor has not been assigned to any courses yet." />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {courseList.map((c) => (
                <CourseCard key={c.id} course={c} showStatus />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
