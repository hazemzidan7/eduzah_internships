"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/types";

function generatePassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  let pw = "";
  for (let i = 0; i < 10; i++) pw += chars[Math.floor(Math.random() * chars.length)];
  return `${pw}!1`;
}

export async function createUserAccount(formData: FormData): Promise<{ success: boolean; error?: string; email?: string; password?: string }> {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const phone = (formData.get("phone") as string) || null;
  const role = formData.get("role") as UserRole;

  const password = generatePassword();
  const admin = createAdminClient();

  const { error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name, phone, role },
  });

  if (error) return { success: false, error: error.message };

  revalidatePath(role === "instructor" ? "/admin/instructors" : "/admin/students");
  return { success: true, email, password };
}

export async function updateUserProfile(userId: string, formData: FormData) {
  const supabase = await createClient();
  const name = formData.get("name") as string;
  const phone = (formData.get("phone") as string) || null;

  const { error } = await supabase.from("profiles").update({ name, phone }).eq("id", userId);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/instructors");
  revalidatePath("/admin/students");
  revalidatePath(`/admin/instructors/${userId}`);
  revalidatePath(`/admin/students/${userId}`);
}

export async function deleteUserAccount(userId: string, role: UserRole) {
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) throw new Error(error.message);

  revalidatePath(role === "instructor" ? "/admin/instructors" : "/admin/students");
}
