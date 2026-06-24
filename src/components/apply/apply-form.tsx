"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/logo";
import { uploadCv, submitApplication } from "@/lib/actions/applications";
import type { ApplicationData } from "@/lib/actions/applications";

// ─── Constants ────────────────────────────────────────────────────────────────

const TOTAL_STEPS = 9;
const STORAGE_KEY = "eduzah-application-draft-v2";

const EGYPT_GOVERNORATES = [
  "Cairo", "Giza", "Alexandria", "Dakahlia", "Red Sea", "Beheira",
  "Faiyum", "Gharbia", "Ismailia", "Menofia", "Minya", "Qalyubia",
  "New Valley", "North Sinai", "Port Said", "Sharqia", "South Sinai",
  "Suez", "Luxor", "Aswan", "Asyut", "Beni Suef", "Matruh", "Qena",
  "Kafr El Sheikh", "Damietta", "Sohag",
];

const STEP_NAMES = [
  "Personal Info", "Education", "Position", "Skills",
  "Experience", "Portfolio & CV", "Availability", "Questions", "Agreement",
];

type PositionType = "technical_internship" | "non_technical_internship" | "paid";

interface PositionDef {
  name: string;
  type: PositionType;
}

const POSITIONS: PositionDef[] = [
  { name: "AI Internship", type: "technical_internship" },
  { name: "Data Analysis Internship", type: "technical_internship" },
  { name: "Front-End Development Internship", type: "technical_internship" },
  { name: "Flutter Development Internship", type: "technical_internship" },
  { name: "UI/UX Design Internship", type: "technical_internship" },
  { name: "Project Management Internship", type: "non_technical_internship" },
  { name: "Graphic Design Internship", type: "non_technical_internship" },
  { name: "Photography Internship", type: "non_technical_internship" },
  { name: "HR Internship", type: "non_technical_internship" },
  { name: "Marketing Specialist", type: "paid" },
  { name: "Reels Maker", type: "paid" },
  { name: "Sales Specialist", type: "paid" },
];

type SkillFieldType = "rating" | "text" | "url" | "textarea";

interface SkillField {
  key: string;
  label: string;
  type: SkillFieldType;
}

const SKILLS_CONFIG: Record<string, SkillField[]> = {
  "AI Internship": [
    { key: "ai_tools", label: "AI Tools Experience", type: "rating" },
    { key: "chatgpt", label: "ChatGPT Experience", type: "rating" },
    { key: "prompt_eng", label: "Prompt Engineering", type: "rating" },
    { key: "machine_learning", label: "Machine Learning", type: "rating" },
    { key: "python", label: "Python", type: "rating" },
    { key: "ai_projects", label: "AI Projects (describe briefly)", type: "textarea" },
    { key: "github", label: "GitHub Profile Link", type: "url" },
  ],
  "Data Analysis Internship": [
    { key: "excel", label: "Excel", type: "rating" },
    { key: "power_bi", label: "Power BI", type: "rating" },
    { key: "sql", label: "SQL", type: "rating" },
    { key: "python", label: "Python", type: "rating" },
    { key: "dashboards", label: "Dashboard Projects (describe briefly)", type: "textarea" },
    { key: "github", label: "GitHub Profile Link", type: "url" },
  ],
  "Front-End Development Internship": [
    { key: "html", label: "HTML", type: "rating" },
    { key: "css", label: "CSS", type: "rating" },
    { key: "javascript", label: "JavaScript", type: "rating" },
    { key: "bootstrap", label: "Bootstrap", type: "rating" },
    { key: "react", label: "React", type: "rating" },
    { key: "angular", label: "Angular", type: "rating" },
    { key: "portfolio", label: "Portfolio Link", type: "url" },
    { key: "github", label: "GitHub Profile Link", type: "url" },
  ],
  "Flutter Development Internship": [
    { key: "dart", label: "Dart", type: "rating" },
    { key: "flutter", label: "Flutter", type: "rating" },
    { key: "firebase", label: "Firebase", type: "rating" },
    { key: "published_apps", label: "Published Applications (links)", type: "textarea" },
    { key: "github", label: "GitHub Profile Link", type: "url" },
  ],
  "UI/UX Design Internship": [
    { key: "figma", label: "Figma", type: "rating" },
    { key: "adobe_xd", label: "Adobe XD", type: "rating" },
    { key: "user_research", label: "User Research", type: "rating" },
    { key: "wireframing", label: "Wireframing", type: "rating" },
    { key: "portfolio", label: "Portfolio Link", type: "url" },
  ],
  "Project Management Internship": [
    { key: "pm_experience", label: "Project Management Experience", type: "rating" },
    { key: "leadership", label: "Leadership Experience", type: "rating" },
    { key: "agile", label: "Agile Knowledge", type: "rating" },
    { key: "scrum", label: "Scrum Knowledge", type: "rating" },
    { key: "team_coordination", label: "Team Coordination Experience", type: "rating" },
  ],
  "Graphic Design Internship": [
    { key: "photoshop", label: "Photoshop", type: "rating" },
    { key: "illustrator", label: "Illustrator", type: "rating" },
    { key: "canva", label: "Canva", type: "rating" },
    { key: "behance", label: "Behance Profile Link", type: "url" },
    { key: "portfolio", label: "Portfolio Link", type: "url" },
  ],
  "Photography Internship": [
    { key: "photography_exp", label: "Photography Experience", type: "rating" },
    { key: "camera_type", label: "Camera / Equipment Used", type: "text" },
    { key: "editing_software", label: "Editing Software", type: "text" },
    { key: "portfolio", label: "Portfolio / Instagram Link", type: "url" },
  ],
  "HR Internship": [
    { key: "recruitment", label: "Recruitment Experience", type: "rating" },
    { key: "communication", label: "Communication Skills", type: "rating" },
    { key: "hr_knowledge", label: "HR Knowledge", type: "rating" },
    { key: "interview_exp", label: "Interview Experience", type: "rating" },
  ],
  "Marketing Specialist": [
    { key: "social_media", label: "Social Media Marketing", type: "rating" },
    { key: "content_creation", label: "Content Creation", type: "rating" },
    { key: "paid_ads", label: "Paid Ads Experience", type: "rating" },
    { key: "marketing_campaigns", label: "Marketing Campaigns (describe briefly)", type: "textarea" },
    { key: "portfolio", label: "Portfolio / Work Samples Link", type: "url" },
  ],
  "Reels Maker": [
    { key: "video_exp", label: "Short-Form Video Experience", type: "rating" },
    { key: "camera_equipment", label: "Camera / Equipment Used", type: "text" },
    { key: "editing_tools", label: "Editing Tools (CapCut, Premiere, etc.)", type: "text" },
    { key: "platforms", label: "Platforms (Instagram, TikTok, etc.)", type: "text" },
    { key: "portfolio", label: "Portfolio / Reel Link", type: "url" },
  ],
  "Sales Specialist": [
    { key: "sales_exp", label: "Sales Experience", type: "rating" },
    { key: "communication", label: "Communication Skills", type: "rating" },
    { key: "negotiation", label: "Negotiation Skills", type: "rating" },
    { key: "crm", label: "CRM Experience", type: "rating" },
  ],
};

const RATING_OPTIONS = ["None", "Beginner", "Intermediate", "Advanced"];

// ─── Form State ───────────────────────────────────────────────────────────────

interface Experience {
  id: string;
  organizationName: string;
  position: string;
  startDate: string;
  endDate: string;
  responsibilities: string;
}

interface FormState {
  fullName: string; mobile: string; whatsapp: string; email: string;
  dateOfBirth: string; gender: string; governorate: string; city: string;
  currentAddress: string; facebookLink: string; linkedinLink: string;
  university: string; faculty: string; department: string; academicStatus: string;
  graduationYear: string; gpa: string; academicAchievements: string;
  position: string; positionType: string;
  skills: Record<string, string>;
  hasExperience: string; experiences: Experience[];
  cvUrl: string; cvFilename: string; portfolioLink: string;
  githubLink: string; behanceLink: string; personalWebsite: string;
  hoursPerWeek: string; preferredDays: string[];
  canAttendOffline: string; canAttendOnline: string;
  whyJoin: string; skillsToGain: string; valueAdded: string; oneYearVision: string;
  confirmAccurate: boolean; confirmUnpaid: boolean; agreePolicy: boolean; agreeContact: boolean;
}

const INITIAL: FormState = {
  fullName: "", mobile: "", whatsapp: "", email: "", dateOfBirth: "", gender: "",
  governorate: "", city: "", currentAddress: "", facebookLink: "", linkedinLink: "",
  university: "", faculty: "", department: "", academicStatus: "", graduationYear: "",
  gpa: "", academicAchievements: "", position: "", positionType: "", skills: {},
  hasExperience: "", experiences: [], cvUrl: "", cvFilename: "", portfolioLink: "",
  githubLink: "", behanceLink: "", personalWebsite: "", hoursPerWeek: "",
  preferredDays: [], canAttendOffline: "", canAttendOnline: "",
  whyJoin: "", skillsToGain: "", valueAdded: "", oneYearVision: "",
  confirmAccurate: false, confirmUnpaid: false, agreePolicy: false, agreeContact: false,
};

// ─── UI Primitives ────────────────────────────────────────────────────────────

function Field({ label, required, error, children }: {
  label: string; required?: boolean; error?: string; children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-500">⚠ {error}</p>}
    </div>
  );
}

function Input({ value, onChange, placeholder, type = "text" }: {
  value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#d91b5b]/40 focus:border-[#d91b5b] transition text-sm"
    />
  );
}

function Select({ value, onChange, options, placeholder }: {
  value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[]; placeholder?: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#d91b5b]/40 focus:border-[#d91b5b] transition text-sm"
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

function Textarea({ value, onChange, placeholder, rows = 4 }: {
  value: string; onChange: (v: string) => void; placeholder?: string; rows?: number;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#d91b5b]/40 focus:border-[#d91b5b] transition text-sm resize-none"
    />
  );
}

function RatingSelector({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {RATING_OPTIONS.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
            value === opt
              ? "text-white border-transparent"
              : "border-gray-200 text-gray-600 hover:border-[#d91b5b]/40"
          }`}
          style={value === opt ? { background: "linear-gradient(135deg,#d91b5b,#faa633)" } : {}}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ApplyForm() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [data, setData] = useState<FormState>(INITIAL);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cvUploading, setCvUploading] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [hasDraft, setHasDraft] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const topRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setData((prev) => ({ ...prev, ...parsed }));
        setHasDraft(true);
      }
    } catch {}
  }, []);

  useEffect(() => {
    try {
      const { confirmAccurate, confirmUnpaid, agreePolicy, agreeContact, ...saveData } = data;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saveData));
    } catch {}
  }, [data]);

  const update = useCallback((field: keyof FormState, value: unknown) => {
    setData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  }, []);

  const scrollTop = () => topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  const next = () => { setStep((s) => Math.min(s + 1, TOTAL_STEPS)); scrollTop(); };
  const prev = () => { setStep((s) => Math.max(s - 1, 1)); scrollTop(); };

  // ─── CV Upload ──────────────────────────────────────────────────────────────

  const handleCvChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      setErrors((prev) => ({ ...prev, cvUrl: "Only PDF files allowed" }));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, cvUrl: "File must be under 5 MB" }));
      return;
    }
    setCvUploading(true);
    setErrors((prev) => ({ ...prev, cvUrl: "" }));
    const fd = new FormData();
    fd.append("cv", file);
    const result = await uploadCv(fd);
    setCvUploading(false);
    if ("error" in result) {
      setErrors((prev) => ({ ...prev, cvUrl: result.error }));
    } else {
      update("cvUrl", result.url);
      update("cvFilename", result.filename);
    }
  };

  // ─── Submit ──────────────────────────────────────────────────────────────────

  const submit = async () => {
    const e: Record<string, string> = {};
    if (!data.cvUrl) e.cvUrl = "CV upload is required";
    if (!data.whyJoin.trim()) e.whyJoin = "Required";
    if (!data.skillsToGain.trim()) e.skillsToGain = "Required";
    if (!data.valueAdded.trim()) e.valueAdded = "Required";
    if (!data.oneYearVision.trim()) e.oneYearVision = "Required";
    if (!data.confirmAccurate) e.confirmAccurate = "Required";
    if (!data.confirmUnpaid) e.confirmUnpaid = "Required";
    if (!data.agreePolicy) e.agreePolicy = "Required";
    if (!data.agreeContact) e.agreeContact = "Required";
    if (Object.keys(e).length) { setErrors(e); return; }

    setIsSubmitting(true);
    setSubmitError("");

    const payload: ApplicationData = {
      fullName: data.fullName, mobile: data.mobile, whatsapp: data.whatsapp,
      email: data.email, dateOfBirth: data.dateOfBirth, gender: data.gender,
      governorate: data.governorate, city: data.city, currentAddress: data.currentAddress,
      facebookLink: data.facebookLink, linkedinLink: data.linkedinLink,
      university: data.university, faculty: data.faculty, department: data.department,
      academicStatus: data.academicStatus, graduationYear: data.graduationYear,
      gpa: data.gpa, academicAchievements: data.academicAchievements,
      position: data.position, positionType: data.positionType, skills: data.skills,
      hasExperience: data.hasExperience === "yes",
      experiences: data.experiences,
      cvUrl: data.cvUrl, cvFilename: data.cvFilename,
      portfolioLink: data.portfolioLink, githubLink: data.githubLink,
      behanceLink: data.behanceLink, personalWebsite: data.personalWebsite,
      hoursPerWeek: data.hoursPerWeek, preferredDays: data.preferredDays,
      canAttendOffline: data.canAttendOffline === "yes" ? true : data.canAttendOffline === "no" ? false : null,
      canAttendOnline: data.canAttendOnline === "yes" ? true : data.canAttendOnline === "no" ? false : null,
      whyJoin: data.whyJoin, skillsToGain: data.skillsToGain,
      valueAdded: data.valueAdded, oneYearVision: data.oneYearVision,
    };

    const result = await submitApplication(payload);
    setIsSubmitting(false);
    if ("error" in result) {
      setSubmitError(result.error);
    } else {
      localStorage.removeItem(STORAGE_KEY);
      router.push("/apply/success");
    }
  };

  // ─── Experience Helpers ───────────────────────────────────────────────────────

  const addExperience = () => {
    update("experiences", [
      ...data.experiences,
      { id: crypto.randomUUID(), organizationName: "", position: "", startDate: "", endDate: "", responsibilities: "" },
    ]);
  };

  const updateExperience = (id: string, field: keyof Experience, value: string) => {
    update("experiences", data.experiences.map((exp) => exp.id === id ? { ...exp, [field]: value } : exp));
  };

  const removeExperience = (id: string) => {
    update("experiences", data.experiences.filter((exp) => exp.id !== id));
  };

  const skillsForPosition = data.position ? (SKILLS_CONFIG[data.position] ?? []) : [];

  // ─── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen" style={{ background: "#F8F7FF" }} ref={topRef}>

      {/* Header */}
      <header className="py-8 px-4" style={{ background: "linear-gradient(135deg, #321d3d 0%, #672d86 100%)" }}>
        <div className="max-w-3xl mx-auto">
          <div className="mb-4">
            <Logo height={36} />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">
            Internship & Team Application
          </h1>
          <p className="text-white/80 text-sm max-w-xl">
            Thank you for your interest in joining EDUZAH. Please complete all required information accurately.
          </p>
        </div>
      </header>

      {/* Draft Banner */}
      {hasDraft && step === 1 && (
        <div className="bg-[#d91b5b]/10 border-b border-[#d91b5b]/20">
          <div className="max-w-3xl mx-auto px-4 py-2 flex items-center gap-2 text-sm text-[#d91b5b]">
            <span>Draft restored — your previous progress has been loaded.</span>
            <button
              onClick={() => { setData(INITIAL); localStorage.removeItem(STORAGE_KEY); setHasDraft(false); }}
              className="ml-auto text-xs underline opacity-70 hover:opacity-100"
            >
              Clear draft
            </button>
          </div>
        </div>
      )}

      {/* Progress */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-3">
          {/* Mobile */}
          <div className="sm:hidden space-y-1.5">
            <div className="flex justify-between text-xs text-gray-500">
              <span className="font-semibold text-[#d91b5b]">Step {step} of {TOTAL_STEPS}</span>
              <span>{STEP_NAMES[step - 1]}</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${(step / TOTAL_STEPS) * 100}%`, background: "linear-gradient(90deg,#d91b5b,#672d86)" }}
              />
            </div>
          </div>
          {/* Desktop */}
          <div className="hidden sm:flex items-center gap-1 overflow-x-auto pb-1">
            {STEP_NAMES.map((name, i) => {
              const n = i + 1;
              const done = n < step;
              const active = n === step;
              return (
                <div key={n} className="flex items-center gap-1 flex-shrink-0">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                        done || active ? "text-white" : "bg-gray-100 text-gray-400"
                      } ${active ? "ring-2 ring-[#d91b5b]/30" : ""}`}
                      style={done || active ? { background: "linear-gradient(135deg,#d91b5b,#faa633)" } : {}}
                    >
                      {done ? "✓" : n}
                    </div>
                    <span className={`text-[10px] mt-0.5 font-medium ${active ? "text-[#d91b5b]" : "text-gray-400"}`}>
                      {name}
                    </span>
                  </div>
                  {n < TOTAL_STEPS && (
                    <div className={`w-6 h-0.5 mb-3 rounded-full flex-shrink-0 ${done ? "bg-[#d91b5b]" : "bg-gray-200"}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Form */}
      <main className="max-w-3xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.2 }}
          >
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8 space-y-6">
              <div className="border-b border-gray-100 pb-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-[#d91b5b] mb-1">
                  Step {step} of {TOTAL_STEPS}
                </p>
                <h2 className="text-xl font-bold text-gray-900">{STEP_NAMES[step - 1]}</h2>
              </div>

              {/* Step 1 */}
              {step === 1 && (
                <div className="space-y-5">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Field label="Full Name" required error={errors.fullName}>
                      <Input value={data.fullName} onChange={(v) => update("fullName", v)} placeholder="Your full name" />
                    </Field>
                    <Field label="Mobile Number" required error={errors.mobile}>
                      <Input value={data.mobile} onChange={(v) => update("mobile", v)} placeholder="01XXXXXXXXX" type="tel" />
                    </Field>
                    <Field label="WhatsApp Number" required error={errors.whatsapp}>
                      <Input value={data.whatsapp} onChange={(v) => update("whatsapp", v)} placeholder="01XXXXXXXXX" type="tel" />
                    </Field>
                    <Field label="Email Address" required error={errors.email}>
                      <Input value={data.email} onChange={(v) => update("email", v)} placeholder="you@example.com" type="email" />
                    </Field>
                    <Field label="Date of Birth" required error={errors.dateOfBirth}>
                      <Input value={data.dateOfBirth} onChange={(v) => update("dateOfBirth", v)} type="date" />
                    </Field>
                    <Field label="Gender" error={errors.gender}>
                      <Select value={data.gender} onChange={(v) => update("gender", v)} placeholder="Select gender"
                        options={[{ value: "Male", label: "Male" }, { value: "Female", label: "Female" }]} />
                    </Field>
                    <Field label="Governorate" required error={errors.governorate}>
                      <Select value={data.governorate} onChange={(v) => update("governorate", v)} placeholder="Select governorate"
                        options={EGYPT_GOVERNORATES.map((g) => ({ value: g, label: g }))} />
                    </Field>
                    <Field label="City" required error={errors.city}>
                      <Input value={data.city} onChange={(v) => update("city", v)} placeholder="Your city" />
                    </Field>
                  </div>
                  <Field label="Current Address" error={errors.currentAddress}>
                    <Input value={data.currentAddress} onChange={(v) => update("currentAddress", v)} placeholder="Street, area..." />
                  </Field>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Field label="Facebook Profile Link" error={errors.facebookLink}>
                      <Input value={data.facebookLink} onChange={(v) => update("facebookLink", v)} placeholder="https://facebook.com/..." type="url" />
                    </Field>
                    <Field label="LinkedIn Profile Link" error={errors.linkedinLink}>
                      <Input value={data.linkedinLink} onChange={(v) => update("linkedinLink", v)} placeholder="https://linkedin.com/in/..." type="url" />
                    </Field>
                  </div>
                </div>
              )}

              {/* Step 2 */}
              {step === 2 && (
                <div className="space-y-5">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Field label="University / Institute" required error={errors.university}>
                      <Input value={data.university} onChange={(v) => update("university", v)} placeholder="e.g. Sohag University" />
                    </Field>
                    <Field label="Faculty" required error={errors.faculty}>
                      <Input value={data.faculty} onChange={(v) => update("faculty", v)} placeholder="e.g. Faculty of Computers" />
                    </Field>
                    <Field label="Department / Major" required error={errors.department}>
                      <Input value={data.department} onChange={(v) => update("department", v)} placeholder="e.g. Computer Science" />
                    </Field>
                    <Field label="Current Academic Status" required error={errors.academicStatus}>
                      <Select value={data.academicStatus} onChange={(v) => update("academicStatus", v)} placeholder="Select status"
                        options={[
                          { value: "Student", label: "Student" },
                          { value: "Fresh Graduate", label: "Fresh Graduate" },
                          { value: "Working & Studying", label: "Working & Studying" },
                        ]} />
                    </Field>
                    <Field label="Expected Graduation Year" required error={errors.graduationYear}>
                      <Select value={data.graduationYear} onChange={(v) => update("graduationYear", v)} placeholder="Select year"
                        options={["2023","2024","2025","2026","2027"].map((y) => ({ value: y, label: y }))} />
                    </Field>
                    <Field label="GPA (Optional)" error={errors.gpa}>
                      <Input value={data.gpa} onChange={(v) => update("gpa", v)} placeholder="e.g. 3.5 / 4.0" />
                    </Field>
                  </div>
                  <Field label="Academic Achievements (Optional)" error={errors.academicAchievements}>
                    <Textarea value={data.academicAchievements} onChange={(v) => update("academicAchievements", v)}
                      placeholder="Awards, honour lists, competitions..." rows={3} />
                  </Field>
                </div>
              )}

              {/* Step 3 */}
              {step === 3 && (
                <div className="space-y-6">
                  {errors.position && <p className="text-sm text-red-500">Please select a position</p>}

                  <PositionGroup
                    title="Technical Internships"
                    badge="Internship — Unpaid"
                    badgeColor="#d91b5b"
                    positions={POSITIONS.filter((p) => p.type === "technical_internship")}
                    selected={data.position}
                    onSelect={(pos) => { update("position", pos.name); update("positionType", pos.type); update("skills", {}); }}
                  />
                  <PositionGroup
                    title="Non-Technical Internships"
                    badge="Internship — Unpaid"
                    badgeColor="#d91b5b"
                    positions={POSITIONS.filter((p) => p.type === "non_technical_internship")}
                    selected={data.position}
                    onSelect={(pos) => { update("position", pos.name); update("positionType", pos.type); update("skills", {}); }}
                  />
                  <PositionGroup
                    title="Paid Positions"
                    badge="Paid Position"
                    badgeColor="#10B981"
                    positions={POSITIONS.filter((p) => p.type === "paid")}
                    selected={data.position}
                    onSelect={(pos) => { update("position", pos.name); update("positionType", pos.type); update("skills", {}); }}
                  />
                </div>
              )}

              {/* Step 4 */}
              {step === 4 && (
                <div className="space-y-5">
                  {data.position && (
                    <div className="p-3 rounded-xl border border-[#d91b5b]/20" style={{ background: "#F8F7FF" }}>
                      <p className="font-semibold text-gray-900">{data.position}</p>
                      <p className="text-xs text-gray-500 mt-0.5">Fill in your skill level for each area</p>
                    </div>
                  )}
                  {skillsForPosition.length === 0 && (
                    <p className="text-gray-400 text-sm">No specific skill fields for this position. Continue to the next step.</p>
                  )}
                  {skillsForPosition.map((field) => (
                    <Field key={field.key} label={field.label}>
                      {field.type === "rating" && (
                        <RatingSelector value={data.skills[field.key] ?? ""} onChange={(v) => update("skills", { ...data.skills, [field.key]: v })} />
                      )}
                      {field.type === "text" && (
                        <Input value={data.skills[field.key] ?? ""} onChange={(v) => update("skills", { ...data.skills, [field.key]: v })} />
                      )}
                      {field.type === "url" && (
                        <Input value={data.skills[field.key] ?? ""} onChange={(v) => update("skills", { ...data.skills, [field.key]: v })} type="url" placeholder="https://..." />
                      )}
                      {field.type === "textarea" && (
                        <Textarea value={data.skills[field.key] ?? ""} onChange={(v) => update("skills", { ...data.skills, [field.key]: v })} rows={3} />
                      )}
                    </Field>
                  ))}
                </div>
              )}

              {/* Step 5 */}
              {step === 5 && (
                <div className="space-y-6">
                  <Field label="Do you have previous work experience?" required error={errors.hasExperience}>
                    <div className="flex gap-3 mt-1">
                      {["yes", "no"].map((opt) => (
                        <button key={opt} type="button" onClick={() => update("hasExperience", opt)}
                          className={`px-6 py-2.5 rounded-xl border font-medium text-sm transition ${
                            data.hasExperience === opt ? "text-white border-transparent" : "border-gray-200 text-gray-600"
                          }`}
                          style={data.hasExperience === opt ? { background: "linear-gradient(135deg,#d91b5b,#faa633)" } : {}}>
                          {opt === "yes" ? "Yes" : "No"}
                        </button>
                      ))}
                    </div>
                  </Field>

                  {data.hasExperience === "yes" && (
                    <div className="space-y-4">
                      {data.experiences.map((exp, idx) => (
                        <div key={exp.id} className="border border-gray-200 rounded-xl p-4 space-y-4">
                          <div className="flex justify-between items-center">
                            <p className="font-medium text-gray-700 text-sm">Experience #{idx + 1}</p>
                            <button onClick={() => removeExperience(exp.id)} className="text-red-400 hover:text-red-600 text-xs">Remove</button>
                          </div>
                          <div className="grid sm:grid-cols-2 gap-3">
                            <Field label="Organization Name">
                              <Input value={exp.organizationName} onChange={(v) => updateExperience(exp.id, "organizationName", v)} placeholder="Company / Organization" />
                            </Field>
                            <Field label="Position">
                              <Input value={exp.position} onChange={(v) => updateExperience(exp.id, "position", v)} placeholder="Your role" />
                            </Field>
                            <Field label="Start Date">
                              <Input value={exp.startDate} onChange={(v) => updateExperience(exp.id, "startDate", v)} type="month" />
                            </Field>
                            <Field label="End Date">
                              <Input value={exp.endDate} onChange={(v) => updateExperience(exp.id, "endDate", v)} type="month" />
                            </Field>
                          </div>
                          <Field label="Responsibilities">
                            <Textarea value={exp.responsibilities} onChange={(v) => updateExperience(exp.id, "responsibilities", v)} placeholder="Describe your key responsibilities..." rows={3} />
                          </Field>
                        </div>
                      ))}
                      <button type="button" onClick={addExperience}
                        className="w-full py-2.5 rounded-xl border-2 border-dashed border-[#d91b5b]/30 text-[#d91b5b] text-sm font-medium hover:border-[#d91b5b]/60 transition">
                        + Add Experience
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Step 6 */}
              {step === 6 && (
                <div className="space-y-5">
                  <Field label="Upload Your CV" required error={errors.cvUrl}>
                    <div
                      onClick={() => fileRef.current?.click()}
                      className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition ${
                        data.cvUrl ? "border-[#d91b5b]/40 bg-[#d91b5b]/5" : "border-gray-200 hover:border-[#d91b5b]/40"
                      }`}
                    >
                      <input ref={fileRef} type="file" accept=".pdf" className="hidden" onChange={handleCvChange} />
                      {cvUploading ? (
                        <div className="space-y-2">
                          <div className="w-8 h-8 border-2 border-[#d91b5b] border-t-transparent rounded-full animate-spin mx-auto" />
                          <p className="text-sm text-gray-500">Uploading...</p>
                        </div>
                      ) : data.cvUrl ? (
                        <div className="space-y-1">
                          <p className="font-medium text-[#d91b5b] text-sm">{data.cvFilename || "CV uploaded"}</p>
                          <p className="text-xs text-gray-400">Click to replace</p>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-gray-700">Click to upload your CV</p>
                          <p className="text-xs text-gray-400">PDF only · Max 5 MB</p>
                        </div>
                      )}
                    </div>
                  </Field>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Field label="Portfolio Link" error={errors.portfolioLink}>
                      <Input value={data.portfolioLink} onChange={(v) => update("portfolioLink", v)} type="url" placeholder="https://..." />
                    </Field>
                    <Field label="GitHub Link" error={errors.githubLink}>
                      <Input value={data.githubLink} onChange={(v) => update("githubLink", v)} type="url" placeholder="https://github.com/..." />
                    </Field>
                    <Field label="Behance Link" error={errors.behanceLink}>
                      <Input value={data.behanceLink} onChange={(v) => update("behanceLink", v)} type="url" placeholder="https://behance.net/..." />
                    </Field>
                    <Field label="Personal Website" error={errors.personalWebsite}>
                      <Input value={data.personalWebsite} onChange={(v) => update("personalWebsite", v)} type="url" placeholder="https://yoursite.com" />
                    </Field>
                  </div>
                </div>
              )}

              {/* Step 7 */}
              {step === 7 && (
                <div className="space-y-6">
                  <Field label="Available Hours Per Week" required error={errors.hoursPerWeek}>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {["Less than 5 Hours","5–10 Hours","10–15 Hours","15–20 Hours","More than 20 Hours"].map((h) => (
                        <button key={h} type="button" onClick={() => update("hoursPerWeek", h)}
                          className={`px-4 py-2 rounded-xl border text-sm font-medium transition ${
                            data.hoursPerWeek === h ? "text-white border-transparent" : "border-gray-200 text-gray-600"
                          }`}
                          style={data.hoursPerWeek === h ? { background: "linear-gradient(135deg,#d91b5b,#faa633)" } : {}}>
                          {h}
                        </button>
                      ))}
                    </div>
                  </Field>
                  <Field label="Preferred Working Days" required error={errors.preferredDays}>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {["Saturday","Sunday","Monday","Tuesday","Wednesday","Thursday","Friday"].map((day) => (
                        <button key={day} type="button"
                          onClick={() => {
                            const days = data.preferredDays.includes(day)
                              ? data.preferredDays.filter((d) => d !== day)
                              : [...data.preferredDays, day];
                            update("preferredDays", days);
                          }}
                          className={`px-4 py-2 rounded-xl border text-sm font-medium transition ${
                            data.preferredDays.includes(day) ? "text-white border-transparent" : "border-gray-200 text-gray-600"
                          }`}
                          style={data.preferredDays.includes(day) ? { background: "linear-gradient(135deg,#d91b5b,#faa633)" } : {}}>
                          {day}
                        </button>
                      ))}
                    </div>
                  </Field>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {[
                      { field: "canAttendOffline", label: "Can you attend offline activities?" },
                      { field: "canAttendOnline", label: "Can you attend online meetings?" },
                    ].map(({ field, label }) => (
                      <Field key={field} label={label}>
                        <div className="flex gap-2 mt-1">
                          {["yes","no"].map((opt) => (
                            <button key={opt} type="button"
                              onClick={() => update(field as keyof FormState, opt)}
                              className={`px-5 py-2 rounded-xl border text-sm font-medium transition ${
                                (data as unknown as Record<string, string>)[field] === opt ? "text-white border-transparent" : "border-gray-200 text-gray-600"
                              }`}
                              style={(data as unknown as Record<string, string>)[field] === opt ? { background: "linear-gradient(135deg,#d91b5b,#faa633)" } : {}}>
                              {opt === "yes" ? "Yes" : "No"}
                            </button>
                          ))}
                        </div>
                      </Field>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 8 */}
              {step === 8 && (
                <div className="space-y-5">
                  {[
                    { key: "whyJoin", label: "Why do you want to join EDUZAH?", placeholder: "Share your motivation..." },
                    { key: "skillsToGain", label: "What skills do you hope to gain?", placeholder: "Describe the skills you aim to develop..." },
                    { key: "valueAdded", label: "How can you add value to EDUZAH?", placeholder: "Explain your unique contribution..." },
                    { key: "oneYearVision", label: "Where do you see yourself after one year?", placeholder: "Describe your professional goals..." },
                  ].map(({ key, label, placeholder }) => (
                    <Field key={key} label={label} required error={errors[key]}>
                      <Textarea
                        value={(data as unknown as Record<string, string>)[key]}
                        onChange={(v) => update(key as keyof FormState, v)}
                        placeholder={placeholder}
                        rows={4}
                      />
                    </Field>
                  ))}
                </div>
              )}

              {/* Step 9 */}
              {step === 9 && (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">Please review and accept all terms before submitting.</p>
                  {[
                    { key: "confirmAccurate", label: "I confirm that all information provided is accurate and complete." },
                    { key: "confirmUnpaid", label: "I understand that Internship positions are unpaid training opportunities." },
                    { key: "agreePolicy", label: "I agree to comply with EDUZAH's policies and instructions throughout the program." },
                    { key: "agreeContact", label: "I agree that EDUZAH may contact me via phone, WhatsApp, or email regarding this application." },
                  ].map(({ key, label }) => (
                    <label key={key}
                      className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition ${
                        (data as unknown as Record<string, boolean>)[key]
                          ? "border-[#d91b5b]/40 bg-[#d91b5b]/5"
                          : "border-gray-200"
                      } ${errors[key] ? "border-red-300 bg-red-50/50" : ""}`}>
                      <input type="checkbox"
                        checked={(data as unknown as Record<string, boolean>)[key]}
                        onChange={(e) => update(key as keyof FormState, e.target.checked)}
                        className="mt-0.5 w-4 h-4 accent-[#d91b5b] flex-shrink-0"
                      />
                      <span className="text-sm text-gray-700">{label}</span>
                    </label>
                  ))}

                  {submitError && (
                    <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600">
                      {submitError}
                    </div>
                  )}

                  <div className="mt-4 p-4 rounded-xl border border-gray-100 space-y-2" style={{ background: "#F8F7FF" }}>
                    <p className="font-semibold text-gray-700 text-sm">Application Summary</p>
                    <div className="text-sm space-y-1 text-gray-600">
                      <p><span className="font-medium">Name:</span> {data.fullName || "—"}</p>
                      <p><span className="font-medium">Position:</span> {data.position || "—"}</p>
                      <p><span className="font-medium">University:</span> {data.university || "—"}</p>
                      <p><span className="font-medium">Governorate:</span> {data.governorate || "—"}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6 gap-4">
          <button type="button" onClick={prev} disabled={step === 1}
            className="px-6 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-medium text-sm disabled:opacity-30 hover:bg-gray-50 transition">
            Previous
          </button>
          <span className="text-xs text-gray-400 hidden sm:block">{step} / {TOTAL_STEPS}</span>
          {step < TOTAL_STEPS ? (
            <button type="button" onClick={next}
              className="px-8 py-2.5 rounded-xl text-white font-semibold text-sm transition hover:opacity-90"
              style={{ background: "linear-gradient(135deg,#d91b5b,#faa633)" }}>
              Next
            </button>
          ) : (
            <button type="button" onClick={submit} disabled={isSubmitting}
              className="px-8 py-2.5 rounded-xl text-white font-semibold text-sm transition hover:opacity-90 disabled:opacity-60 flex items-center gap-2"
              style={{ background: "linear-gradient(135deg,#d91b5b,#faa633)" }}>
              {isSubmitting
                ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Submitting...</>
                : "Submit Application"}
            </button>
          )}
        </div>
      </main>

      <footer className="text-center py-8 text-xs text-gray-400 space-y-1">
        <p>© {new Date().getFullYear()} EDUZAH — All rights reserved</p>
        <p>
          Questions?{" "}
          <a href="tel:01044222881" className="text-[#d91b5b]">01044222881</a>
          {" "}/{" "}
          <a href="tel:01146966811" className="text-[#d91b5b]">01146966811</a>
        </p>
      </footer>
    </div>
  );
}

// ─── Position Components ──────────────────────────────────────────────────────

function PositionGroup({ title, badge, badgeColor, positions, selected, onSelect }: {
  title: string;
  badge: string;
  badgeColor: string;
  positions: PositionDef[];
  selected: string;
  onSelect: (pos: PositionDef) => void;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <h3 className="font-semibold text-gray-800">{title}</h3>
        <span
          className="text-xs px-2 py-0.5 rounded-full border font-medium"
          style={{ color: badgeColor, borderColor: `${badgeColor}40`, background: `${badgeColor}10` }}
        >
          {badge}
        </span>
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        {positions.map((pos) => (
          <PositionCard key={pos.name} pos={pos} selected={selected === pos.name} onClick={() => onSelect(pos)} />
        ))}
      </div>
    </div>
  );
}

function PositionCard({ pos, selected, onClick }: { pos: PositionDef; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left p-4 rounded-xl border-2 transition ${
        selected
          ? "border-[#d91b5b] bg-[#d91b5b]/5"
          : "border-gray-200 hover:border-[#d91b5b]/40 bg-white"
      }`}
    >
      <div className="flex items-center justify-between">
        <p className={`font-semibold text-sm ${selected ? "text-[#d91b5b]" : "text-gray-900"}`}>
          {pos.name}
        </p>
        {selected && <span className="text-[#d91b5b] font-bold text-lg">✓</span>}
      </div>
      <p className={`text-xs mt-0.5 ${pos.type === "paid" ? "text-green-600" : "text-[#672d86]"}`}>
        {pos.type === "paid" ? "Paid Position" : "Internship (Unpaid)"}
      </p>
    </button>
  );
}
