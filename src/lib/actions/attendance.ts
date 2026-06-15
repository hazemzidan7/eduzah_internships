"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { AttendanceStatus } from "@/lib/types";

export async function markAttendance(courseId: string, sessionId: string, studentId: string, status: AttendanceStatus) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: existing } = await supabase
    .from("attendance")
    .select("id")
    .eq("session_id", sessionId)
    .eq("student_id", studentId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("attendance")
      .update({ status, recorded_at: new Date().toISOString(), recorded_by: user?.id ?? null })
      .eq("id", existing.id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase
      .from("attendance")
      .insert({ session_id: sessionId, student_id: studentId, status, recorded_by: user?.id ?? null });
    if (error) throw new Error(error.message);
  }

  revalidatePath(`/courses/${courseId}/sessions/${sessionId}`);
}
