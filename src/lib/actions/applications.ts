"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";

export interface ApplicationData {
  nationality: string;
  nationalId: string;
  hadEduzahService: string;
  eduzahServiceName: string;
  fullName: string;
  mobile: string;
  whatsapp: string;
  email: string;
  dateOfBirth: string;
  gender: string;
  governorate: string;
  city: string;
  currentAddress: string;
  facebookLink: string;
  linkedinLink: string;
  university: string;
  faculty: string;
  department: string;
  academicStatus: string;
  graduationYear: string;
  gpa: string;
  academicAchievements: string;
  position: string;
  positionType: string;
  skills: Record<string, string>;
  hasExperience: boolean;
  experiences: {
    id: string;
    organizationName: string;
    position: string;
    startDate: string;
    endDate: string;
    responsibilities: string;
  }[];
  cvUrl: string;
  cvFilename: string;
  portfolioLink: string;
  githubLink: string;
  behanceLink: string;
  personalWebsite: string;
  hoursPerWeek: string;
  preferredDays: string[];
  canAttendOffline: boolean | null;
  canAttendOnline: boolean | null;
  whyJoin: string;
  skillsToGain: string;
  valueAdded: string;
  oneYearVision: string;
}

export async function uploadCv(
  formData: FormData
): Promise<{ url: string; filename: string } | { error: string }> {
  try {
    const file = formData.get("cv") as File | null;
    if (!file) return { error: "No file provided" };
    if (file.type !== "application/pdf") return { error: "Only PDF files are allowed" };
    if (file.size > 5 * 1024 * 1024) return { error: "File size must be under 5 MB" };

    const admin = createAdminClient();
    const ext = file.name.split(".").pop() ?? "pdf";
    const storageName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { error } = await admin.storage
      .from("application-cvs")
      .upload(storageName, file, { contentType: "application/pdf", upsert: false });

    if (error) return { error: `Upload failed: ${error.message}` };

    const { data: { publicUrl } } = admin.storage
      .from("application-cvs")
      .getPublicUrl(storageName);

    return { url: publicUrl, filename: file.name };
  } catch (err) {
    return { error: `Unexpected error: ${err instanceof Error ? err.message : String(err)}` };
  }
}

export async function submitApplication(
  application: ApplicationData
): Promise<{ id: string } | { error: string }> {
  const admin = createAdminClient();

  // Rate limiting — max 3 submissions per email per 24h
  const since = new Date(Date.now() - 86400000).toISOString();
  const { count } = await admin
    .from("internship_applications")
    .select("id", { count: "exact", head: true })
    .eq("email", application.email.toLowerCase().trim())
    .gte("created_at", since);
  if ((count ?? 0) >= 3) {
    return { error: "You have already submitted 3 applications in the last 24 hours. Please try again tomorrow." };
  }

  const { data, error } = await admin
    .from("internship_applications")
    .insert({
      nationality: application.nationality || null,
      national_id: application.nationalId || null,
      full_name: application.fullName,
      mobile: application.mobile,
      whatsapp: application.whatsapp,
      email: application.email,
      date_of_birth: application.dateOfBirth,
      gender: application.gender || null,
      governorate: application.governorate,
      city: application.city,
      current_address: application.currentAddress || null,
      facebook_link: application.facebookLink || null,
      linkedin_link: application.linkedinLink || null,
      university: application.university,
      faculty: application.faculty,
      department: application.department,
      academic_status: application.academicStatus,
      graduation_year: application.graduationYear === "Other" ? 0 : parseInt(application.graduationYear),
      gpa: application.gpa || null,
      academic_achievements: application.academicAchievements || null,
      position: application.position,
      position_type: application.positionType,
      skills: {
        ...application.skills,
        ...(application.hadEduzahService ? { _eduzah_prev_client: application.hadEduzahService } : {}),
        ...(application.eduzahServiceName ? { _eduzah_service: application.eduzahServiceName } : {}),
      },
      has_experience: application.hasExperience,
      experiences: application.experiences,
      cv_url: application.cvUrl,
      cv_filename: application.cvFilename || null,
      portfolio_link: application.portfolioLink || null,
      github_link: application.githubLink || null,
      behance_link: application.behanceLink || null,
      personal_website: application.personalWebsite || null,
      hours_per_week: application.hoursPerWeek,
      preferred_days: application.preferredDays,
      can_attend_offline: application.canAttendOffline,
      can_attend_online: application.canAttendOnline,
      why_join: application.whyJoin,
      skills_to_gain: application.skillsToGain,
      value_added: application.valueAdded,
      one_year_vision: application.oneYearVision,
      status: "pending",
    })
    .select("id")
    .single();

  if (error) return { error: error.message };
  return { id: data.id };
}

export type ApplicationStatus = "pending" | "reviewed" | "shortlisted" | "rejected";

export async function updateApplicationStatus(
  id: string,
  status: ApplicationStatus,
  notes?: string
): Promise<void> {
  const admin = createAdminClient();
  await admin
    .from("internship_applications")
    .update({ status, admin_notes: notes ?? null })
    .eq("id", id);
  revalidatePath("/admin-portal/applications");
}

export async function deleteApplication(id: string): Promise<void> {
  const admin = createAdminClient();
  await admin.from("internship_applications").delete().eq("id", id);
  revalidatePath("/admin-portal/applications");
  revalidatePath("/admin-portal/applications");
}

export interface ApplicationFilters {
  position?: string;
  positionType?: string;
  status?: string;
  graduationYear?: string;
  academicStatus?: string;
  governorate?: string;
}

export async function getApplications(filters: ApplicationFilters = {}) {
  const admin = createAdminClient();

  let query = admin
    .from("internship_applications")
    .select(
      "id, full_name, email, mobile, position, position_type, academic_status, graduation_year, governorate, city, cv_url, cv_filename, status, created_at, skills, portfolio_link, github_link, behance_link, why_join, skills_to_gain, value_added, one_year_vision, university, faculty, department, has_experience, experiences, hours_per_week, preferred_days, admin_notes, gender, date_of_birth, whatsapp, current_address, facebook_link, linkedin_link, can_attend_offline, can_attend_online, gpa, academic_achievements, personal_website"
    )
    .order("created_at", { ascending: false })
    .limit(10000); // Override Supabase default 1000 row limit

  if (filters.position) query = query.eq("position", filters.position);
  if (filters.positionType) query = query.eq("position_type", filters.positionType);
  if (filters.status) query = query.eq("status", filters.status);
  if (filters.graduationYear) query = query.eq("graduation_year", parseInt(filters.graduationYear));
  if (filters.academicStatus) query = query.eq("academic_status", filters.academicStatus);
  if (filters.governorate) query = query.eq("governorate", filters.governorate);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getApplicationStats() {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("internship_applications")
    .select("position, position_type, graduation_year, academic_status, governorate, status")
    .limit(100000);

  if (error) throw new Error(error.message);
  const rows = data ?? [];

  const total = rows.length;
  const totalInternships = rows.filter((r) => r.position_type !== "paid").length;
  const totalPaid = rows.filter((r) => r.position_type === "paid").length;
  const pending = rows.filter((r) => r.status === "pending").length;
  const shortlisted = rows.filter((r) => r.status === "shortlisted").length;

  const byPosition = rows.reduce<Record<string, number>>((acc, r) => {
    acc[r.position] = (acc[r.position] ?? 0) + 1;
    return acc;
  }, {});

  const byYear = rows.reduce<Record<string, number>>((acc, r) => {
    const y = String(r.graduation_year);
    acc[y] = (acc[y] ?? 0) + 1;
    return acc;
  }, {});

  const byGovernorateCounts = rows.reduce<Record<string, number>>((acc, r) => {
    acc[r.governorate] = (acc[r.governorate] ?? 0) + 1;
    return acc;
  }, {});

  const byAcademicStatus = rows.reduce<Record<string, number>>((acc, r) => {
    acc[r.academic_status] = (acc[r.academic_status] ?? 0) + 1;
    return acc;
  }, {});

  return {
    total,
    totalInternships,
    totalPaid,
    pending,
    shortlisted,
    byPosition,
    byYear,
    byGovernorateCounts,
    byAcademicStatus,
  };
}
