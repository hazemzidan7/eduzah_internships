import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Topbar } from "@/components/topbar";
import { SessionHeader, MaterialsList } from "@/components/courses/session-header";
import { StudentSubmissionPanel, InstructorSubmissionPanel } from "@/components/courses/submission-panel";
import { AttendancePanel } from "@/components/courses/attendance-panel";
import type { Course, Session, Material, Submission, Attendance, Profile } from "@/lib/types";

export default async function SessionDetailPage({ params }: { params: Promise<{ id: string; sid: string }> }) {
  const { id: courseId, sid: sessionId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  const role = (profile as Profile).role;

  const { data: course } = await supabase.from("courses").select("*").eq("id", courseId).single();
  if (!course) notFound();

  const { data: session } = await supabase.from("sessions").select("*").eq("id", sessionId).eq("course_id", courseId).single();
  if (!session) notFound();

  const { data: materials } = await supabase.from("materials").select("*").eq("session_id", sessionId);

  const canManage = role === "admin" || role === "instructor";

  let studentsForRoster: Profile[] = [];
  let submissionsForSession: Submission[] = [];
  let attendanceForSession: Attendance[] = [];
  let mySubmission: Submission | null = null;

  if (canManage) {
    const { data: enrollments } = await supabase.from("enrollments").select("student_id").eq("course_id", courseId);
    const studentIds = (enrollments ?? []).map((e) => e.student_id);
    if (studentIds.length) {
      const { data: students } = await supabase.from("profiles").select("*").in("id", studentIds);
      studentsForRoster = (students ?? []) as Profile[];

      const { data: subs } = await supabase.from("submissions").select("*").eq("session_id", sessionId).in("student_id", studentIds);
      submissionsForSession = (subs ?? []) as Submission[];

      const { data: att } = await supabase.from("attendance").select("*").eq("session_id", sessionId).in("student_id", studentIds);
      attendanceForSession = (att ?? []) as Attendance[];
    }
  } else {
    const { data: sub } = await supabase.from("submissions").select("*").eq("session_id", sessionId).eq("student_id", user.id).maybeSingle();
    mySubmission = (sub ?? null) as Submission | null;
  }

  return (
    <div>
      <Topbar title={(course as Course).title} subtitle={(session as Session).title} />
      <div className="space-y-6 p-4 sm:p-6 lg:p-8">
        <SessionHeader courseId={courseId} session={session as Session} canManage={canManage} />
        <MaterialsList courseId={courseId} sessionId={sessionId} materials={(materials ?? []) as Material[]} canManage={canManage} />

        {(session as Session).assignment_title && (
          <>
            {role === "student" ? (
              <StudentSubmissionPanel courseId={courseId} sessionId={sessionId} userId={user.id} submission={mySubmission} />
            ) : (
              <InstructorSubmissionPanel courseId={courseId} sessionId={sessionId} students={studentsForRoster} submissions={submissionsForSession} />
            )}
          </>
        )}

        {canManage && (
          <AttendancePanel courseId={courseId} sessionId={sessionId} students={studentsForRoster} attendance={attendanceForSession} />
        )}
      </div>
    </div>
  );
}
