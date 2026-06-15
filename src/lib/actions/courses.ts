"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { CourseStatus } from "@/lib/types";

export async function createCourse(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const category = formData.get("category") as string;
  const duration_text = (formData.get("duration_text") as string) || null;
  const banner_url = (formData.get("banner_url") as string) || null;
  const status = (formData.get("status") as CourseStatus) || "draft";

  const { data: course, error } = await supabase
    .from("courses")
    .insert({ title, description, category, duration_text, banner_url, status, created_by: user.id })
    .select()
    .single();

  if (error) throw new Error(error.message);

  revalidatePath("/courses");
  redirect(`/courses/${course.id}`);
}

export async function updateCourse(courseId: string, formData: FormData) {
  const supabase = await createClient();

  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const category = formData.get("category") as string;
  const duration_text = (formData.get("duration_text") as string) || null;
  const banner_url = (formData.get("banner_url") as string) || null;
  const status = formData.get("status") as CourseStatus;

  const { error } = await supabase
    .from("courses")
    .update({ title, description, category, duration_text, banner_url, status })
    .eq("id", courseId);

  if (error) throw new Error(error.message);

  revalidatePath(`/courses/${courseId}`);
  revalidatePath("/courses");
}

export async function assignInstructor(courseId: string, instructorId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("course_instructors").insert({ course_id: courseId, instructor_id: instructorId });
  if (error) throw new Error(error.message);

  await supabase.from("notifications").insert({
    user_id: instructorId,
    type: "course_assignment",
    title: "New course assignment",
    body: "You have been assigned to a new course.",
    link: `/courses/${courseId}`,
  });

  revalidatePath(`/courses/${courseId}`);
}

export async function removeInstructor(courseId: string, instructorId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("course_instructors").delete().eq("course_id", courseId).eq("instructor_id", instructorId);
  if (error) throw new Error(error.message);
  revalidatePath(`/courses/${courseId}`);
}

export async function enrollStudent(courseId: string, studentId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("enrollments").insert({ course_id: courseId, student_id: studentId });
  if (error) throw new Error(error.message);

  const { data: course } = await supabase.from("courses").select("title").eq("id", courseId).single();

  await supabase.from("notifications").insert({
    user_id: studentId,
    type: "enrollment",
    title: "Enrolled in a new course",
    body: course ? `You have been enrolled in ${course.title}.` : "You have been enrolled in a new course.",
    link: `/courses/${courseId}`,
  });

  revalidatePath(`/courses/${courseId}`);
}

export async function unenrollStudent(courseId: string, studentId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("enrollments").delete().eq("course_id", courseId).eq("student_id", studentId);
  if (error) throw new Error(error.message);
  revalidatePath(`/courses/${courseId}`);
}
