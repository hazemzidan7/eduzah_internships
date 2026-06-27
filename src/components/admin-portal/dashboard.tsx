"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { updateApplicationStatus, deleteApplication } from "@/lib/actions/applications";
import type { ApplicationStatus } from "@/lib/actions/applications";
import type { User } from "@supabase/supabase-js";

// ─── Types ────────────────────────────────────────────────────────────────────

type Application = {
  id: string;
  full_name: string;
  email: string;
  mobile: string;
  position: string;
  position_type: string;
  academic_status: string;
  graduation_year: number;
  governorate: string;
  city: string;
  cv_url: string;
  cv_filename: string | null;
  status: string;
  created_at: string;
  skills: Record<string, string>;
  portfolio_link: string | null;
  github_link: string | null;
  behance_link: string | null;
  why_join: string;
  skills_to_gain: string;
  value_added: string;
  one_year_vision: string;
  university: string;
  faculty: string;
  department: string;
  has_experience: boolean;
  experiences: { organizationName: string; position: string; startDate: string; endDate: string; responsibilities: string }[];
  hours_per_week: string;
  preferred_days: string[];
  admin_notes: string | null;
  gender: string | null;
  date_of_birth: string;
  whatsapp: string;
  current_address: string | null;
  facebook_link: string | null;
  linkedin_link: string | null;
  can_attend_offline: boolean | null;
  can_attend_online: boolean | null;
  gpa: string | null;
  academic_achievements: string | null;
  personal_website: string | null;
};

type Stats = {
  total: number;
  totalInternships: number;
  totalPaid: number;
  pending: number;
  shortlisted: number;
  byPosition: Record<string, number>;
  byYear: Record<string, number>;
  byGovernorateCounts: Record<string, number>;
  byAcademicStatus: Record<string, number>;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
  pending:     "bg-yellow-50 text-yellow-700 border-yellow-200",
  reviewed:    "bg-blue-50 text-blue-700 border-blue-200",
  shortlisted: "bg-green-50 text-green-700 border-green-200",
  rejected:    "bg-red-50 text-red-700 border-red-200",
};

const POSITION_TYPES: Record<string, string> = {
  technical_internship:     "Technical Internship",
  non_technical_internship: "Non-Technical Internship",
  paid:                     "Paid Position",
};

const ALL_POSITIONS = [
  "AI Internship","Data Analysis Internship","Front-End Development Internship",
  "Flutter Development Internship","UI/UX Design Internship",
  "Graphic Design Internship","Photography Internship","HR Internship",
  "Marketing Specialist","Reels Maker","Sales Specialist",
];

const EGYPT_GOVERNORATES = [
  "Cairo","Giza","Alexandria","Dakahlia","Red Sea","Beheira","Faiyum","Gharbia",
  "Ismailia","Menofia","Minya","Qalyubia","New Valley","North Sinai","Port Said",
  "Sharqia","South Sinai","Suez","Luxor","Aswan","Asyut","Beni Suef","Matruh",
  "Qena","Kafr El Sheikh","Damietta","Sohag",
];

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

// Escape CSV cells to prevent injection attacks
function escapeCsv(v: unknown): string {
  const str = String(v ?? "");
  // Prefix formula injection characters
  const safe = /^[=+\-@\t\r]/.test(str) ? `'${str}` : str;
  return `"${safe.replace(/"/g, '""')}"`;
}

function exportToCSV(applications: Application[]) {
  const headers = [
    "ID","Name","Email","WhatsApp","Gender","Date of Birth","Nationality",
    "Position","Type","University","Faculty","Department",
    "Academic Status","Graduation Year","GPA",
    "Governorate","City","Address",
    "LinkedIn","Status","Has Experience","Hours/Week",
    "Can Attend Offline","Can Attend Online",
    "CV URL","Portfolio","GitHub","Behance","Website",
    "Applied At",
  ];
  const rows = applications.map((a) => [
    a.id, a.full_name, a.email, a.whatsapp,
    a.gender ?? "", a.date_of_birth ?? "", "",
    a.position, POSITION_TYPES[a.position_type] ?? a.position_type,
    a.university, a.faculty, a.department,
    a.academic_status, a.graduation_year, a.gpa ?? "",
    a.governorate, a.city, a.current_address ?? "",
    a.linkedin_link ?? "", a.status,
    a.has_experience ? "Yes" : "No", a.hours_per_week,
    a.can_attend_offline === true ? "Yes" : a.can_attend_offline === false ? "No" : "",
    a.can_attend_online  === true ? "Yes" : a.can_attend_online  === false ? "No" : "",
    a.cv_url, a.portfolio_link ?? "", a.github_link ?? "", a.behance_link ?? "", a.personal_website ?? "",
    formatDate(a.created_at),
  ]);
  const csv = [headers, ...rows]
    .map((r) => r.map(escapeCsv).join(","))
    .join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `eduzah-applications-${Date.now()}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function AdminPortalDashboard({
  user,
  applications,
  stats,
  activeFilters,
}: {
  user: User;
  applications: Application[];
  stats: Stats;
  activeFilters: Record<string, string | undefined>;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selected, setSelected] = useState<Application | null>(null);
  const [isPending, startTransition] = useTransition();
  const [statusNote, setStatusNote] = useState("");
  const [view, setView] = useState<"table" | "stats">("table");

  const applyFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`/admin-portal/applications?${params.toString()}`);
  };

  const clearFilters = () => router.push("/admin-portal/applications");

  const handleStatusChange = (id: string, status: ApplicationStatus) => {
    startTransition(async () => {
      await updateApplicationStatus(id, status, statusNote || undefined);
      setSelected((prev) => prev ? { ...prev, status } : null);
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm("Delete this application? This cannot be undone.")) return;
    startTransition(async () => {
      await deleteApplication(id);
      setSelected(null);
    });
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  const hasFilters = Object.values(activeFilters).some(Boolean);

  return (
    <div className="min-h-screen" style={{ background: "#F8F7FF" }}>
      {/* Topbar */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-20 shadow-sm">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="EDUZAH" style={{ height: 28, width: "auto" }} />
            <span className="text-sm font-semibold text-gray-700 hidden sm:block">Admin Portal</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400 hidden sm:block">{user.email}</span>
            <a href="/apply" target="_blank"
              className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition font-medium">
              View Form
            </a>
            <button onClick={handleSignOut}
              className="px-3 py-1.5 text-xs rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition font-medium">
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Applications</h1>
            <p className="text-sm text-gray-500 mt-0.5">{stats.total} total applications received</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => setView(view === "table" ? "stats" : "table")}
              className="px-4 py-2 text-sm rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition font-medium">
              {view === "table" ? "Statistics" : "Table"}
            </button>
            <button onClick={() => exportToCSV(applications)}
              className="px-4 py-2 text-sm rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition font-medium">
              Export CSV
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {[
            { label: "Total",       value: stats.total,            color: "#d91b5b" },
            { label: "Internships", value: stats.totalInternships, color: "#672d86" },
            { label: "Paid",        value: stats.totalPaid,        color: "#10B981" },
            { label: "Pending",     value: stats.pending,          color: "#F59E0B" },
            { label: "Shortlisted", value: stats.shortlisted,      color: "#3B82F6" },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <p className="text-2xl font-bold" style={{ color }}>{value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Stats View */}
        {view === "stats" && (
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { title: "By Position",        data: stats.byPosition },
              { title: "By Graduation Year", data: stats.byYear },
              { title: "By Governorate",     data: stats.byGovernorateCounts },
              { title: "By Academic Status", data: stats.byAcademicStatus },
            ].map(({ title, data }) => (
              <div key={title} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                <p className="font-semibold text-gray-700 text-sm mb-3">{title}</p>
                <div className="space-y-2">
                  {Object.entries(data).sort(([,a],[,b]) => b-a).map(([key, count]) => {
                    const max = Math.max(...Object.values(data));
                    return (
                      <div key={key}>
                        <div className="flex justify-between text-xs mb-0.5">
                          <span className="text-gray-600 truncate">{key}</span>
                          <span className="font-medium text-gray-800 ml-2 flex-shrink-0">{count}</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${(count / max) * 100}%`, background: "linear-gradient(90deg,#d91b5b,#faa633)" }} />
                        </div>
                      </div>
                    );
                  })}
                  {Object.keys(data).length === 0 && <p className="text-xs text-gray-400">No data yet.</p>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Filters */}
        {view === "table" && (
          <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-700">Filters</p>
              {hasFilters && <button onClick={clearFilters} className="text-xs text-red-500 hover:text-red-700">Clear all</button>}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2">
              {[
                { key: "position",       placeholder: "All Positions",    options: ALL_POSITIONS.map(p => ({ value: p, label: p })) },
                { key: "positionType",   placeholder: "All Types",        options: Object.entries(POSITION_TYPES).map(([k,v]) => ({ value: k, label: v })) },
                { key: "status",         placeholder: "All Statuses",     options: ["pending","reviewed","shortlisted","rejected"].map(s => ({ value: s, label: s.charAt(0).toUpperCase()+s.slice(1) })) },
                { key: "graduationYear", placeholder: "All Years",        options: ["2023","2024","2025","2026","2027","Other"].map(y => ({ value: y, label: y })) },
                { key: "academicStatus", placeholder: "All Academic",     options: ["Student","Fresh Graduate","Working & Studying"].map(s => ({ value: s, label: s })) },
                { key: "governorate",    placeholder: "All Governorates", options: EGYPT_GOVERNORATES.map(g => ({ value: g, label: g })) },
                { key: "hasExperience", placeholder: "Experience",        options: [{ value: "true", label: "Has Experience" }, { value: "false", label: "No Experience" }] },
              ].map(({ key, placeholder, options }) => (
                <select key={key} value={activeFilters[key] ?? ""}
                  onChange={(e) => applyFilter(key, e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#d91b5b]/40">
                  <option value="">{placeholder}</option>
                  {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              ))}
            </div>
          </div>
        )}

        {/* Table */}
        {view === "table" && (
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
            {applications.length === 0 ? (
              <div className="py-16 text-center text-gray-400">
                <p className="text-3xl mb-2">📭</p>
                <p className="font-medium">No applications found</p>
                <p className="text-sm mt-1">{hasFilters ? "Try clearing some filters." : "Applications will appear here once submitted."}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-3 text-left">Applicant</th>
                      <th className="px-4 py-3 text-left">Position</th>
                      <th className="px-4 py-3 text-left">Education</th>
                      <th className="px-4 py-3 text-left">Location</th>
                      <th className="px-4 py-3 text-left">Status</th>
                      <th className="px-4 py-3 text-left">Applied</th>
                      <th className="px-4 py-3 text-left">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {applications.map((app) => (
                      <tr key={app.id} className="hover:bg-gray-50 transition">
                        <td className="px-4 py-3">
                          <p className="font-semibold text-gray-900">{app.full_name}</p>
                          <p className="text-xs text-gray-400">{app.email}</p>
                          <p className="text-xs text-gray-400">{app.whatsapp}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-800 text-xs">{app.position}</p>
                          <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${app.position_type === "paid" ? "text-green-600 bg-green-50" : "text-purple-600 bg-purple-50"}`}>
                            {POSITION_TYPES[app.position_type] ?? app.position_type}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-xs text-gray-600">{app.university}</p>
                          <p className="text-xs text-gray-400">{app.academic_status} · {app.graduation_year}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-xs text-gray-600">{app.governorate}</p>
                          <p className="text-xs text-gray-400">{app.city}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-1 rounded-lg border font-medium capitalize ${STATUS_STYLES[app.status] ?? ""}`}>
                            {app.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                          {formatDate(app.created_at)}
                        </td>
                        <td className="px-4 py-3">
                          <button onClick={() => setSelected(app)} className="text-xs text-[#d91b5b] font-medium hover:underline">
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Detail Drawer */}
      {selected && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/40" onClick={() => setSelected(null)} />
          <div className="w-full max-w-2xl bg-white h-full overflow-y-auto shadow-2xl flex flex-col">
            <div className="p-5 border-b border-gray-100 flex items-start justify-between gap-3 sticky top-0 bg-white z-10">
              <div>
                <h2 className="font-bold text-lg text-gray-900">{selected.full_name}</h2>
                <p className="text-sm text-gray-500">{selected.position}</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
            </div>

            <div className="p-5 space-y-6 flex-1">
              {/* Status */}
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Change Status</p>
                <div className="flex flex-wrap gap-2">
                  {(["pending","reviewed","shortlisted","rejected"] as ApplicationStatus[]).map((s) => (
                    <button key={s} disabled={isPending} onClick={() => handleStatusChange(selected.id, s)}
                      className={`px-4 py-1.5 rounded-lg text-xs font-semibold border capitalize transition ${selected.status === s ? STATUS_STYLES[s] : "border-gray-200 text-gray-500"}`}>
                      {s}
                    </button>
                  ))}
                </div>
                <textarea value={statusNote} onChange={(e) => setStatusNote(e.target.value)}
                  placeholder="Admin notes (optional)..." rows={2}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 bg-gray-50 text-gray-700 resize-none focus:outline-none focus:ring-1 focus:ring-[#d91b5b]/40" />
              </div>

              {/* Personal */}
              <Section title="Personal Information">
                <Row label="Email"       value={selected.email} />
                <Row label="WhatsApp"    value={selected.whatsapp} />
                <Row label="Date of Birth" value={selected.date_of_birth} />
                <Row label="Gender"      value={selected.gender ?? "—"} />
                <Row label="Governorate" value={selected.governorate} />
                <Row label="City"        value={selected.city} />
                {selected.current_address && <Row label="Address" value={selected.current_address} />}
                {selected.linkedin_link && <RowLink label="LinkedIn" href={selected.linkedin_link} />}
              </Section>

              {/* Education */}
              <Section title="Education">
                <Row label="University"      value={selected.university} />
                <Row label="Faculty"         value={selected.faculty} />
                <Row label="Department"      value={selected.department} />
                <Row label="Academic Status" value={selected.academic_status} />
                <Row label="Graduation Year" value={String(selected.graduation_year)} />
                {selected.gpa && <Row label="GPA" value={selected.gpa} />}
                {selected.academic_achievements && <Row label="Achievements" value={selected.academic_achievements} />}
              </Section>

              {/* Skills */}
              {Object.keys(selected.skills ?? {}).length > 0 && (
                <Section title="Skills">
                  {Object.entries(selected.skills).map(([k, v]) => (
                    <Row key={k} label={k.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())} value={v} />
                  ))}
                </Section>
              )}

              {/* Experience */}
              <Section title="Experience">
                <Row label="Has Experience" value={selected.has_experience ? "Yes" : "No"} />
                {selected.experiences?.map((exp, i) => (
                  <div key={i} className="mt-2 p-3 rounded-xl bg-gray-50 text-xs space-y-1">
                    <p className="font-semibold text-gray-700">{exp.organizationName} — {exp.position}</p>
                    <p className="text-gray-500">{exp.startDate} → {exp.endDate || "Present"}</p>
                    <p className="text-gray-600">{exp.responsibilities}</p>
                  </div>
                ))}
              </Section>

              {/* Files */}
              <Section title="Files & Portfolio">
                <div className="flex flex-wrap gap-2">
                  <a href={selected.cv_url} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white"
                    style={{ background: "linear-gradient(135deg,#d91b5b,#faa633)" }}>
                    View CV
                  </a>
                  {selected.portfolio_link  && <ExtLink href={selected.portfolio_link}  label="Portfolio" />}
                  {selected.github_link     && <ExtLink href={selected.github_link}     label="GitHub" />}
                  {selected.behance_link    && <ExtLink href={selected.behance_link}    label="Behance" />}
                  {selected.personal_website && <ExtLink href={selected.personal_website} label="Website" />}
                </div>
              </Section>

              {/* Availability */}
              <Section title="Availability">
                <Row label="Hours / Week"       value={selected.hours_per_week} />
                <Row label="Preferred Days"     value={(selected.preferred_days ?? []).join(", ")} />
                <Row label="Attend Offline"     value={selected.can_attend_offline === true ? "Yes" : selected.can_attend_offline === false ? "No" : "—"} />
                <Row label="Attend Online"      value={selected.can_attend_online  === true ? "Yes" : selected.can_attend_online  === false ? "No" : "—"} />
              </Section>

              {/* Questions */}
              <Section title="Personal Questions">
                <QuestionRow label="Why join EDUZAH?"  value={selected.why_join} />
                <QuestionRow label="Skills to gain"    value={selected.skills_to_gain} />
                <QuestionRow label="Value added"       value={selected.value_added} />
                <QuestionRow label="One-year vision"   value={selected.one_year_vision} />
              </Section>

              {selected.admin_notes && (
                <Section title="Admin Notes">
                  <p className="text-xs text-gray-600">{selected.admin_notes}</p>
                </Section>
              )}
            </div>

            <div className="p-5 border-t border-gray-100 flex gap-2">
              <button onClick={() => handleDelete(selected.id)} disabled={isPending}
                className="px-4 py-2 text-xs rounded-xl border border-red-200 text-red-600 hover:bg-red-50 transition font-medium">
                Delete
              </button>
              <button onClick={() => setSelected(null)}
                className="ml-auto px-4 py-2 text-xs rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition font-medium">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">{title}</p>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}
function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-2 text-xs">
      <span className="text-gray-400 min-w-[130px] flex-shrink-0">{label}</span>
      <span className="text-gray-800 font-medium">{value || "—"}</span>
    </div>
  );
}
function RowLink({ label, href }: { label: string; href: string }) {
  return (
    <div className="flex items-start gap-2 text-xs">
      <span className="text-gray-400 min-w-[130px] flex-shrink-0">{label}</span>
      <a href={href} target="_blank" rel="noopener noreferrer" className="text-[#d91b5b] font-medium hover:underline truncate">{href}</a>
    </div>
  );
}
function QuestionRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-0.5">
      <p className="text-xs font-medium text-gray-600">{label}</p>
      <p className="text-xs text-gray-800 leading-relaxed">{value}</p>
    </div>
  );
}
function ExtLink({ href, label }: { href: string; label: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer"
      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 transition">
      {label}
    </a>
  );
}
