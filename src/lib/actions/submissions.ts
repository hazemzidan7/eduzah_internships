"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function submitAssignment(
  courseId: string,
  sessionId: string,
  data: { file_url?: string | null; file_name?: string | null; link_url?: string | null }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: session } = await supabase.from("sessions").select("deadline").eq("id", sessionId).single();
  const isLate = session?.deadline ? new Date() > new Date(session.deadline) : false;
  const status = isLate ? "late" : "submitted";

  const { data: existing } = await supabase
    .from("submissions")
    .select("id")
    .eq("session_id", sessionId)
    .eq("student_id", user.id)
    .maybeSingle();

  const payload = {
    session_id: sessionId,
    student_id: user.id,
    file_url: data.file_url ?? null,
    file_name: data.file_name ?? null,
    link_url: data.link_url ?? null,
    submitted_at: new Date().toISOString(),
    status,
    is_late: isLate,
    grade: null,
    feedback: null,
    reviewed_at: null,
  };

  if (existing) {
    const { error } = await supabase.from("submissions").update(payload).eq("id", existing.id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from("submissions").insert(payload);
    if (error) throw new Error(error.message);
  }

  const { data: instructorLinks } = await supabase.from("course_instructors").select("instructor_id").eq("course_id", courseId);
  if (instructorLinks && instructorLinks.length) {
    await supabase.from("notifications").insert(
      instructorLinks.map((l) => ({
        user_id: l.instructor_id,
        type: "submission",
        title: "New assignment submission",
        body: "A student submitted an assignment for review.",
        link: `/courses/${courseId}/sessions/${sessionId}`,
      }))
    );
  }

  revalidatePath(`/courses/${courseId}/sessions/${sessionId}`);
}

export async function gradeSubmission(courseId: string, sessionId: string, submissionId: string, formData: FormData) {
  const supabase = await createClient();

  const gradeRaw = formData.get("grade") as string;
  const grade = gradeRaw ? Number(gradeRaw) : null;
  const feedback = (formData.get("feedback") as string) || null;
  const action = formData.get("action") as string;
  const status = action === "approve" ? "approved" : "reviewed";

  const { data: sub } = await supabase.from("submissions").select("student_id").eq("id", submissionId).single();

  const { error } = await supabase
    .from("submissions")
    .update({ grade, feedback, status, reviewed_at: new Date().toISOString() })
    .eq("id", submissionId);

  if (error) throw new Error(error.message);

  if (sub) {
    await supabase.from("notifications").insert({
      user_id: sub.student_id,
      type: "grade",
      title: "Assignment graded",
      body: status === "approved" ? "Your submission was approved." : "Your submission was reviewed.",
      link: `/courses/${courseId}/sessions/${sessionId}`,
    });
  }

  revalidatePath(`/courses/${courseId}/sessions/${sessionId}`);
}
