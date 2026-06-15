"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { MaterialType } from "@/lib/types";

export async function createSession(courseId: string, formData: FormData) {
  const supabase = await createClient();

  const title = formData.get("title") as string;
  const description = (formData.get("description") as string) || "";
  const session_date = (formData.get("session_date") as string) || null;
  const recording_url = (formData.get("recording_url") as string) || null;
  const assignment_title = (formData.get("assignment_title") as string) || null;
  const assignment_description = (formData.get("assignment_description") as string) || null;
  const deadline = (formData.get("deadline") as string) || null;

  const { count } = await supabase.from("sessions").select("*", { count: "exact", head: true }).eq("course_id", courseId);

  const { error } = await supabase.from("sessions").insert({
    course_id: courseId,
    order_index: count ?? 0,
    title,
    description,
    session_date,
    recording_url,
    assignment_title,
    assignment_description,
    deadline,
  });

  if (error) throw new Error(error.message);

  const { data: enrollments } = await supabase.from("enrollments").select("student_id").eq("course_id", courseId);
  if (enrollments && enrollments.length) {
    await supabase.from("notifications").insert(
      enrollments.map((e) => ({
        user_id: e.student_id,
        type: "new_session",
        title: "New session added",
        body: `A new session "${title}" was added to your course.`,
        link: `/courses/${courseId}`,
      }))
    );
  }

  revalidatePath(`/courses/${courseId}`);
}

export async function updateSession(courseId: string, sessionId: string, formData: FormData) {
  const supabase = await createClient();

  const title = formData.get("title") as string;
  const description = (formData.get("description") as string) || "";
  const session_date = (formData.get("session_date") as string) || null;
  const recording_url = (formData.get("recording_url") as string) || null;
  const assignment_title = (formData.get("assignment_title") as string) || null;
  const assignment_description = (formData.get("assignment_description") as string) || null;
  const deadline = (formData.get("deadline") as string) || null;

  const { error } = await supabase
    .from("sessions")
    .update({ title, description, session_date, recording_url, assignment_title, assignment_description, deadline })
    .eq("id", sessionId);

  if (error) throw new Error(error.message);

  revalidatePath(`/courses/${courseId}`);
  revalidatePath(`/courses/${courseId}/sessions/${sessionId}`);
}

export async function deleteSession(courseId: string, sessionId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("sessions").delete().eq("id", sessionId);
  if (error) throw new Error(error.message);
  revalidatePath(`/courses/${courseId}`);
  redirect(`/courses/${courseId}`);
}

export async function addMaterial(courseId: string, sessionId: string, data: { title: string; type: MaterialType; url: string; size_bytes?: number | null }) {
  const supabase = await createClient();
  const { error } = await supabase.from("materials").insert({
    session_id: sessionId,
    title: data.title,
    type: data.type,
    url: data.url,
    size_bytes: data.size_bytes ?? null,
  });
  if (error) throw new Error(error.message);

  const { data: enrollments } = await supabase.from("enrollments").select("student_id").eq("course_id", courseId);
  if (enrollments && enrollments.length) {
    await supabase.from("notifications").insert(
      enrollments.map((e) => ({
        user_id: e.student_id,
        type: "new_material",
        title: "New material uploaded",
        body: `"${data.title}" was added to your course.`,
        link: `/courses/${courseId}/sessions/${sessionId}`,
      }))
    );
  }

  revalidatePath(`/courses/${courseId}/sessions/${sessionId}`);
}

export async function deleteMaterial(courseId: string, sessionId: string, materialId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("materials").delete().eq("id", materialId);
  if (error) throw new Error(error.message);
  revalidatePath(`/courses/${courseId}/sessions/${sessionId}`);
}
