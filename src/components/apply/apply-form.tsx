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
  mode?: string;
}

const POSITIONS: PositionDef[] = [
  { name: "AI Internship",                   type: "technical_internship",     mode: "Remote"          },
  { name: "Data Analysis Internship",        type: "technical_internship",     mode: "Hybrid"          },
  { name: "Front-End Development Internship",type: "technical_internship",     mode: "Hybrid"          },
  { name: "Flutter Development Internship",  type: "technical_internship",     mode: "Hybrid"          },
  { name: "UI/UX Design Internship",         type: "technical_internship",     mode: "Hybrid"          },
  { name: "Graphic Design Internship",       type: "non_technical_internship", mode: "Hybrid"          },
  { name: "Photography Internship",          type: "non_technical_internship", mode: "Hybrid"          },
  { name: "HR Internship",                   type: "non_technical_internship", mode: "Hybrid"          },
  { name: "Marketing Specialist",            type: "paid",                     mode: "Hybrid"          },
  { name: "Reels Maker",                     type: "paid",                     mode: "Hybrid"          },
  { name: "Sales Specialist",                type: "paid",                     mode: "Hybrid / Remote" },
];

type SkillFieldType = "rating" | "text" | "url" | "textarea";

interface SkillField {
  key: string;
  label: string;
  type: SkillFieldType;
}

const SKILLS_CONFIG: Record<string, SkillField[]> = {

  // ── Technical Internships ─────────────────────────────────────────────────

  "AI Internship": [
    { key: "python",          label: "Python",                                              type: "rating" },
    { key: "machine_learning",label: "Machine Learning",                                   type: "rating" },
    { key: "deep_learning",   label: "Deep Learning",                                      type: "rating" },
    { key: "nlp",             label: "NLP (Natural Language Processing)",                  type: "rating" },
    { key: "data_analysis",   label: "Data Analysis & Visualization",                      type: "rating" },
    { key: "frameworks",      label: "Frameworks (TensorFlow, PyTorch, Scikit-learn)",     type: "rating" },
    { key: "sql_databases",   label: "SQL / Databases",                                    type: "rating" },
    { key: "math_stats",      label: "Mathematics & Statistics",                           type: "rating" },
    { key: "git_github",      label: "Git & GitHub",                                       type: "rating" },
    { key: "other_langs",     label: "Other Programming Languages (C++, Java, R, etc.)",   type: "text"   },
    { key: "kaggle",          label: "Kaggle Profile / Competitions Link (Optional)",       type: "url"    },
  ],

  "Data Analysis Internship": [
    { key: "excel",       label: "Excel (including Pivot Tables, VLOOKUP)",  type: "rating"   },
    { key: "power_bi",    label: "Power BI",                                 type: "rating"   },
    { key: "tableau",     label: "Tableau",                                  type: "rating"   },
    { key: "sql",         label: "SQL",                                      type: "rating"   },
    { key: "python",      label: "Python (Pandas, NumPy, Matplotlib)",       type: "rating"   },
    { key: "r_lang",      label: "R Language",                               type: "rating"   },
    { key: "statistics",  label: "Statistics & Data Interpretation",         type: "rating"   },
    { key: "git_github",  label: "Git & GitHub",                             type: "rating"   },
    { key: "dashboards",  label: "Describe a data project you worked on",    type: "textarea" },
  ],

  "Front-End Development Internship": [
    { key: "html",        label: "HTML5",                          type: "rating"   },
    { key: "css",         label: "CSS3 / Responsive Design",       type: "rating"   },
    { key: "javascript",  label: "JavaScript (ES6+)",              type: "rating"   },
    { key: "typescript",  label: "TypeScript",                     type: "rating"   },
    { key: "react",       label: "React.js",                       type: "rating"   },
    { key: "bootstrap",   label: "Bootstrap / Tailwind CSS",       type: "rating"   },
    { key: "rest_api",    label: "REST API Integration",           type: "rating"   },
    { key: "git_github",  label: "Git & GitHub",                   type: "rating"   },
    { key: "other_tools", label: "Other frameworks (Vue, Angular, Next.js, etc.)", type: "text" },
  ],

  "Flutter Development Internship": [
    { key: "dart",            label: "Dart Language",                                      type: "rating"   },
    { key: "flutter",         label: "Flutter Framework",                                  type: "rating"   },
    { key: "state_management",label: "State Management (Provider, Bloc, GetX, Riverpod)", type: "rating"   },
    { key: "firebase",        label: "Firebase (Auth, Firestore, Storage)",               type: "rating"   },
    { key: "rest_api",        label: "REST API Integration",                               type: "rating"   },
    { key: "ui_design",       label: "UI Design & Custom Widgets",                        type: "rating"   },
    { key: "git_github",      label: "Git & GitHub",                                      type: "rating"   },
    { key: "published_apps",  label: "Published / Personal Apps (store links or APKs)",   type: "textarea" },
  ],

  "UI/UX Design Internship": [
    { key: "figma",           label: "Figma",                            type: "rating" },
    { key: "adobe_xd",        label: "Adobe XD",                         type: "rating" },
    { key: "wireframing",     label: "Wireframing & Prototyping",        type: "rating" },
    { key: "user_research",   label: "User Research & Persona Creation", type: "rating" },
    { key: "usability",       label: "Usability Testing",                type: "rating" },
    { key: "design_systems",  label: "Design Systems & Style Guides",    type: "rating" },
    { key: "mobile_first",    label: "Mobile-First Design Thinking",     type: "rating" },
    { key: "interaction",     label: "Interaction / Motion Design",      type: "rating" },
  ],

  // ── Non-Technical Internships ─────────────────────────────────────────────

  "Graphic Design Internship": [
    { key: "photoshop",    label: "Adobe Photoshop",                        type: "rating"   },
    { key: "illustrator",  label: "Adobe Illustrator",                      type: "rating"   },
    { key: "indesign",     label: "Adobe InDesign",                         type: "rating"   },
    { key: "canva",        label: "Canva",                                   type: "rating"   },
    { key: "branding",     label: "Branding & Visual Identity",             type: "rating"   },
    { key: "typography",   label: "Typography & Color Theory",              type: "rating"   },
    { key: "motion",       label: "Motion Graphics / After Effects",        type: "rating"   },
    { key: "specialization",label: "Design Specialization (Social Media, Print, Branding, etc.)", type: "text" },
  ],

  "Photography Internship": [
    { key: "photography_exp", label: "Photography Experience",                          type: "rating"   },
    { key: "lighting",        label: "Lighting Techniques",                             type: "rating"   },
    { key: "photo_editing",   label: "Photo Editing Proficiency",                       type: "rating"   },
    { key: "videography",     label: "Videography Experience",                          type: "rating"   },
    { key: "camera_type",     label: "Camera & Equipment Used",                         type: "text"     },
    { key: "editing_software",label: "Editing Software (Lightroom, Photoshop, etc.)",  type: "text"     },
    { key: "specialization",  label: "Photography Specialization (Events, Product, Portrait, etc.)", type: "text" },
  ],

  "HR Internship": [
    { key: "recruitment",     label: "Recruitment & Sourcing",           type: "rating"   },
    { key: "communication",   label: "Communication & Interpersonal Skills", type: "rating" },
    { key: "hr_knowledge",    label: "HR Fundamentals & Labor Law Basics",type: "rating"   },
    { key: "interview_exp",   label: "Interviewing Techniques",          type: "rating"   },
    { key: "onboarding",      label: "Employee Onboarding Knowledge",    type: "rating"   },
    { key: "conflict",        label: "Conflict Resolution",              type: "rating"   },
    { key: "ms_office",       label: "MS Office / Google Workspace",     type: "rating"   },
    { key: "hr_desc",         label: "Describe your HR experience briefly", type: "textarea" },
  ],

  // ── Paid Positions ────────────────────────────────────────────────────────

  "Marketing Specialist": [
    { key: "social_media",    label: "Social Media Marketing",                    type: "rating"   },
    { key: "content_creation",label: "Content Creation & Copywriting",            type: "rating"   },
    { key: "paid_ads",        label: "Paid Ads (Facebook, Instagram, Google Ads)", type: "rating"  },
    { key: "email_marketing", label: "Email Marketing",                            type: "rating"   },
    { key: "seo_sem",         label: "SEO / SEM",                                 type: "rating"   },
    { key: "analytics",       label: "Analytics Tools (Google Analytics, Meta Insights)", type: "rating" },
    { key: "community",       label: "Community Management",                       type: "rating"   },
    { key: "campaigns",       label: "Describe your most successful marketing campaign", type: "textarea" },
  ],

  "Reels Maker": [
    { key: "video_exp",       label: "Short-Form Video Production",               type: "rating"   },
    { key: "storytelling",    label: "Storytelling & Scriptwriting",              type: "rating"   },
    { key: "audio",           label: "Audio Selection & Sound Design",            type: "rating"   },
    { key: "trending",        label: "Trending Content Awareness",                type: "rating"   },
    { key: "camera_equipment",label: "Camera & Equipment Used",                   type: "text"     },
    { key: "editing_tools",   label: "Editing Tools (CapCut, Premiere, DaVinci)", type: "text"    },
    { key: "platforms",       label: "Active Platforms (Instagram, TikTok, YouTube Shorts)", type: "text" },
  ],

  "Sales Specialist": [
    { key: "sales_exp",      label: "Sales Experience",                           type: "rating"   },
    { key: "communication",  label: "Communication & Persuasion Skills",         type: "rating"   },
    { key: "negotiation",    label: "Negotiation Skills",                         type: "rating"   },
    { key: "target",         label: "Target Achievement Experience",              type: "rating"   },
    { key: "cold_outreach",  label: "Cold Calling / Cold Outreach",              type: "rating"   },
    { key: "crm",            label: "CRM Tools Experience",                       type: "rating"   },
    { key: "sales_type",     label: "Sales Type Experience (B2C, B2B, Online, Offline)", type: "text" },
    { key: "best_achievement",label: "Describe your best sales achievement",       type: "textarea" },
  ],
};

const RATING_OPTIONS = ["None", "Beginner", "Intermediate", "Advanced"];

type LinkVis = "required" | "optional" | "hidden";
interface PortfolioConfig { portfolio: LinkVis; github: LinkVis; behance: LinkVis; website: LinkVis; }

const PORTFOLIO_CONFIG: Record<string, PortfolioConfig> = {
  "AI Internship":                     { github: "required",  portfolio: "optional", website: "optional", behance: "hidden"   },
  "Data Analysis Internship":          { github: "required",  portfolio: "optional", website: "optional", behance: "hidden"   },
  "Front-End Development Internship":  { github: "required",  portfolio: "required", website: "optional", behance: "optional" },
  "Flutter Development Internship":    { github: "required",  portfolio: "required", website: "optional", behance: "hidden"   },
  "UI/UX Design Internship":           { behance: "required", portfolio: "optional", website: "optional", github: "hidden"    },
  "Graphic Design Internship":         { behance: "required", portfolio: "optional", website: "optional", github: "hidden"    },
  "Photography Internship":            { portfolio: "required",behance: "optional",  website: "optional", github: "hidden"    },
  "HR Internship":                     { portfolio: "optional",behance: "hidden",    website: "optional", github: "hidden"    },
  "Marketing Specialist":              { portfolio: "required",behance: "optional",  website: "optional", github: "hidden"    },
  "Reels Maker":                       { portfolio: "required",behance: "hidden",    website: "optional", github: "hidden"    },
  "Sales Specialist":                  { portfolio: "optional",behance: "hidden",    website: "optional", github: "hidden"    },
};

const DEFAULT_PORTFOLIO: PortfolioConfig = { portfolio: "optional", github: "optional", behance: "optional", website: "optional" };

// ─── URL Validators ───────────────────────────────────────────────────────────

function isValidUrl(url: string): boolean {
  if (!url.trim()) return true;
  try { new URL(url.startsWith("http") ? url : `https://${url}`); return true; }
  catch { return false; }
}

function urlMatchesDomain(url: string, domain: string): boolean {
  if (!url.trim()) return true;
  try {
    const u = new URL(url.startsWith("http") ? url : `https://${url}`);
    return u.hostname.includes(domain);
  } catch { return false; }
}

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
  nationality: string;
  nationalId: string;
  fullName: string; whatsapp: string; email: string;
  dateOfBirth: string; gender: string; governorate: string; city: string;
  currentAddress: string; linkedinLink: string;
  hadEduzahService: string;
  eduzahServiceName: string;
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

// Egyptian National ID parser
const GOVERNORATE_CODES: Record<string, string> = {
  "01": "Cairo", "02": "Alexandria", "03": "Port Said", "04": "Suez",
  "11": "Damietta", "12": "Dakahlia", "13": "Sharqia", "14": "Qalyubia",
  "15": "Kafr El Sheikh", "16": "Gharbia", "17": "Menofia", "18": "Beheira",
  "19": "Ismailia", "21": "Giza", "22": "Beni Suef", "23": "Faiyum",
  "24": "Minya", "25": "Asyut", "26": "Sohag", "27": "Qena",
  "28": "Aswan", "29": "Luxor", "31": "Red Sea", "32": "New Valley",
  "33": "Matruh", "34": "North Sinai", "35": "South Sinai",
};

function parseNationalId(id: string): { dateOfBirth: string; gender: string; governorate: string } | null {
  if (!/^\d{14}$/.test(id)) return null;
  const century = id[0] === "2" ? "19" : id[0] === "3" ? "20" : null;
  if (!century) return null;
  const year  = century + id.substring(1, 3);
  const month = id.substring(3, 5);
  const day   = id.substring(5, 7);
  const govCode = id.substring(7, 9);
  const genderDigit = parseInt(id[12]);
  const m = parseInt(month), d = parseInt(day);
  if (m < 1 || m > 12 || d < 1 || d > 31) return null;
  return {
    dateOfBirth: `${year}-${month}-${day}`,
    gender: genderDigit % 2 === 1 ? "Male" : "Female",
    governorate: GOVERNORATE_CODES[govCode] ?? "",
  };
}

const INITIAL: FormState = {
  nationality: "",
  nationalId: "",
  fullName: "", whatsapp: "", email: "", dateOfBirth: "", gender: "",
  governorate: "", city: "", currentAddress: "", linkedinLink: "",
  hadEduzahService: "", eduzahServiceName: "",
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

  const validateStep = (s: number): Record<string, string> => {
    const e: Record<string, string> = {};
    if (s === 1) {
      if (!data.nationality)                                        e.nationality   = "Please select your nationality";
      if (data.nationality === "Egyptian" && !data.nationalId.trim()) e.nationalId  = "National ID is required";
      if (!data.fullName.trim())                                    e.fullName      = "Full name is required";
      if (!data.whatsapp.trim())                                    e.whatsapp      = "WhatsApp number is required";
      if (!data.email.trim())                                       e.email         = "Email is required";
      else if (!/\S+@\S+\.\S+/.test(data.email))                   e.email         = "Invalid email address";
      if (!data.dateOfBirth)                                        e.dateOfBirth   = "Date of birth is required";
      if (!data.governorate)                                        e.governorate   = "Governorate is required";
      if (!data.city.trim())                                        e.city          = "City is required";
      if (!data.linkedinLink.trim())                                e.linkedinLink      = "LinkedIn profile link is required";
      else if (!urlMatchesDomain(data.linkedinLink, "linkedin.com")) e.linkedinLink    = "Must be a valid linkedin.com link";
      if (!data.hadEduzahService)                                   e.hadEduzahService  = "Please answer this question";
      if (data.hadEduzahService === "Yes" && !data.eduzahServiceName.trim()) e.eduzahServiceName = "Please specify the course or service";
    }
    if (s === 2) {
      if (!data.university.trim())  e.university    = "University is required";
      if (!data.faculty.trim())     e.faculty       = "Faculty is required";
      if (!data.department.trim())  e.department    = "Department is required";
      if (!data.academicStatus)     e.academicStatus = "Academic status is required";
      if (!data.graduationYear)     e.graduationYear = "Graduation year is required";
    }
    if (s === 3) {
      if (!data.position) e.position = "Please select a position";
    }
    if (s === 4) {
      const ratingFields = (SKILLS_CONFIG[data.position] ?? []).filter(f => f.type === "rating");
      const empty = ratingFields.filter(f => !data.skills[f.key]);
      if (empty.length > 0) e.skills = `Please rate all skills (missing: ${empty.map(f => f.label).join(", ")})`;
    }
    if (s === 5) {
      if (!data.hasExperience) e.hasExperience = "Please answer this question";
    }
    if (s === 6) {
      if (!data.cvUrl) e.cvUrl = "CV upload is required";
      const pc = data.position ? (PORTFOLIO_CONFIG[data.position] ?? DEFAULT_PORTFOLIO) : DEFAULT_PORTFOLIO;
      if (pc.github    === "required" && !data.githubLink.trim())    e.githubLink    = "GitHub link is required";
      else if (data.githubLink.trim()    && !urlMatchesDomain(data.githubLink,    "github.com"))   e.githubLink    = "Must be a github.com link";
      if (pc.portfolio === "required" && !data.portfolioLink.trim()) e.portfolioLink = "Portfolio link is required";
      if (pc.behance   === "required" && !data.behanceLink.trim())   e.behanceLink   = "Behance link is required";
      else if (data.behanceLink.trim()   && !urlMatchesDomain(data.behanceLink,   "behance.net"))  e.behanceLink   = "Must be a behance.net link";
    }
    if (s === 7) {
      if (!data.hoursPerWeek)                e.hoursPerWeek   = "Please select available hours";
      if (data.preferredDays.length === 0)   e.preferredDays  = "Please select at least one day";
    }
    if (s === 8) {
      if (!data.whyJoin.trim())        e.whyJoin       = "This field is required";
      if (!data.skillsToGain.trim())   e.skillsToGain  = "This field is required";
      if (!data.valueAdded.trim())     e.valueAdded    = "This field is required";
      if (!data.oneYearVision.trim())  e.oneYearVision = "This field is required";
    }
    return e;
  };

  const next = () => {
    const e = validateStep(step);
    if (Object.keys(e).length > 0) { setErrors(e); return; }
    setErrors({});
    setStep((s) => Math.min(s + 1, TOTAL_STEPS));
    scrollTop();
  };
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
    // Comprehensive validation across all steps
    const missing: string[] = [];

    // Step 1
    if (!data.nationality) missing.push("Nationality (Step 1)");
    if (data.nationality === "Egyptian" && !data.nationalId.trim()) missing.push("National ID (Step 1)");
    if (!data.fullName.trim()) missing.push("Full Name (Step 1)");
    if (!data.whatsapp.trim()) missing.push("WhatsApp Number (Step 1)");
    if (!data.email.trim()) missing.push("Email Address (Step 1)");
    if (!data.dateOfBirth) missing.push("Date of Birth (Step 1)");
    if (!data.governorate) missing.push("Governorate (Step 1)");
    if (!data.city.trim()) missing.push("City (Step 1)");
    // LinkedIn required
    if (!data.linkedinLink.trim()) missing.push("LinkedIn Profile Link (Step 1)");
    else if (!urlMatchesDomain(data.linkedinLink, "linkedin.com")) missing.push("LinkedIn link must be a valid linkedin.com URL (Step 1)");
    if (!data.hadEduzahService) missing.push("EDUZAH previous service question (Step 1)");
    if (data.hadEduzahService === "Yes" && !data.eduzahServiceName.trim()) missing.push("Please specify the EDUZAH course/service (Step 1)");

    // Step 2
    if (!data.university.trim()) missing.push("University (Step 2)");
    if (!data.faculty.trim()) missing.push("Faculty (Step 2)");
    if (!data.department.trim()) missing.push("Department (Step 2)");
    if (!data.academicStatus) missing.push("Academic Status (Step 2)");
    if (!data.graduationYear) missing.push("Graduation Year (Step 2)");

    // Step 3
    if (!data.position) missing.push("Position (Step 3)");

    // Step 4 — Skills required (rating fields must be filled)
    if (data.position) {
      const skillFields = SKILLS_CONFIG[data.position] ?? [];
      const ratingFields = skillFields.filter(f => f.type === "rating");
      const emptyRatings = ratingFields.filter(f => !data.skills[f.key]);
      if (emptyRatings.length > 0) {
        missing.push(`Please rate all skills in Step 4 (missing: ${emptyRatings.map(f => f.label).join(", ")})`);
      }
      // Validate skill URLs (kaggle must be kaggle.com)
      if (data.skills["kaggle"] && !urlMatchesDomain(data.skills["kaggle"], "kaggle.com"))
        missing.push("Kaggle link must be a valid kaggle.com URL (Step 4)");
    }

    // Step 6 — CV + required portfolio links with domain validation
    if (!data.cvUrl) missing.push("CV Upload (Step 6)");
    const pc = data.position ? (PORTFOLIO_CONFIG[data.position] ?? DEFAULT_PORTFOLIO) : DEFAULT_PORTFOLIO;
    if (pc.github === "required") {
      if (!data.githubLink.trim()) missing.push("GitHub Link is required (Step 6)");
      else if (!urlMatchesDomain(data.githubLink, "github.com")) missing.push("GitHub link must be a valid github.com URL (Step 6)");
    } else if (data.githubLink.trim() && !urlMatchesDomain(data.githubLink, "github.com")) {
      missing.push("GitHub link must be a valid github.com URL (Step 6)");
    }
    if (pc.portfolio === "required") {
      if (!data.portfolioLink.trim()) missing.push("Portfolio Link is required (Step 6)");
      else if (!isValidUrl(data.portfolioLink)) missing.push("Portfolio link must be a valid URL (Step 6)");
    } else if (data.portfolioLink.trim() && !isValidUrl(data.portfolioLink)) {
      missing.push("Portfolio link must be a valid URL (Step 6)");
    }
    if (pc.behance === "required") {
      if (!data.behanceLink.trim()) missing.push("Behance Link is required (Step 6)");
      else if (!urlMatchesDomain(data.behanceLink, "behance.net")) missing.push("Behance link must be a valid behance.net URL (Step 6)");
    } else if (data.behanceLink.trim() && !urlMatchesDomain(data.behanceLink, "behance.net")) {
      missing.push("Behance link must be a valid behance.net URL (Step 6)");
    }
    if (data.personalWebsite.trim() && !isValidUrl(data.personalWebsite))
      missing.push("Personal website must be a valid URL (Step 6)");

    // Step 7
    if (!data.hoursPerWeek) missing.push("Available Hours (Step 7)");

    // Step 8
    if (!data.whyJoin.trim()) missing.push("Why join EDUZAH? (Step 8)");
    if (!data.skillsToGain.trim()) missing.push("Skills to gain (Step 8)");
    if (!data.valueAdded.trim()) missing.push("Value added (Step 8)");
    if (!data.oneYearVision.trim()) missing.push("One-year vision (Step 8)");

    // Step 9
    const e: Record<string, string> = {};
    if (!data.confirmAccurate) e.confirmAccurate = "Required";
    if (!data.confirmUnpaid)   e.confirmUnpaid   = "Required";
    if (!data.agreePolicy)     e.agreePolicy     = "Required";
    if (!data.agreeContact)    e.agreeContact    = "Required";

    if (missing.length > 0) {
      setSubmitError("Please complete the following fields before submitting:\n• " + missing.join("\n• "));
      setErrors(e);
      return;
    }
    if (Object.keys(e).length) { setErrors(e); return; }

    setIsSubmitting(true);
    setSubmitError("");

    const payload: ApplicationData = {
      nationality: data.nationality,
      nationalId: data.nationalId,
      fullName: data.fullName, mobile: data.whatsapp, whatsapp: data.whatsapp,
      email: data.email, dateOfBirth: data.dateOfBirth, gender: data.gender,
      governorate: data.governorate, city: data.city, currentAddress: data.currentAddress,
      facebookLink: "", linkedinLink: data.linkedinLink,
      hadEduzahService: data.hadEduzahService,
      eduzahServiceName: data.eduzahServiceName,
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
      <header className="relative overflow-hidden" style={{ minHeight: 340 }}>

        {/* Background photo */}
        <img
          src="/team-photo.jpg"
          alt="EDUZAH Team"
          style={{
            position: "absolute", inset: 0,
            width: "100%", height: "100%",
            objectFit: "cover", objectPosition: "center 25%",
          }}
        />

        {/* Overlay: brand colors gradient — red/purple on left, transparent right */}
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to right, rgba(50,29,61,0.97) 0%, rgba(103,45,134,0.85) 32%, rgba(217,27,91,0.40) 58%, rgba(217,27,91,0.05) 100%)",
        }} />

        {/* Text */}
        <div className="relative z-10" style={{ padding: "40px 40px", maxWidth: 560, marginLeft: "8%" }}>
          <div style={{ marginBottom: 20 }}><Logo height={34} /></div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white" style={{ marginBottom: 10 }}>
            Internship & Team Application
          </h1>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.78)", lineHeight: 1.6, marginBottom: 16 }}>
            Thank you for your interest in joining EDUZAH Internship. Please complete all required information accurately.
          </p>
          <p className="text-xs uppercase" style={{ color: "rgba(255,255,255,0.45)", letterSpacing: "0.1em" }}>
            Our team — last season
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
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10 shadow-sm" style={{ borderTop: "3px solid #d91b5b" }}>
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
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8 space-y-6" style={{ borderTop: "3px solid #d91b5b" }}>
              <div className="border-b border-gray-100 pb-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-[#d91b5b] mb-1">
                  Step {step} of {TOTAL_STEPS}
                </p>
                <h2 className="text-xl font-bold text-gray-900">{STEP_NAMES[step - 1]}</h2>
              </div>

              {/* Step 1 */}
              {step === 1 && (
                <div className="space-y-5">
                  {/* Nationality toggle */}
                  <Field label="Nationality" required error={errors.nationality}>
                    <div className="flex gap-3">
                      {[
                        { value: "Egyptian",     label: "Egyptian 🇪🇬" },
                        { value: "Non-Egyptian", label: "Non-Egyptian" },
                      ].map((opt) => (
                        <button key={opt.value} type="button"
                          onClick={() => { update("nationality", opt.value); if (opt.value === "Non-Egyptian") update("nationalId", ""); }}
                          className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition ${
                            data.nationality === opt.value ? "text-white border-transparent" : "border-gray-200 text-gray-600"
                          }`}
                          style={data.nationality === opt.value ? { background: "linear-gradient(135deg,#d91b5b,#faa633)" } : {}}>
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </Field>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <Field label="Full Name" required error={errors.fullName}>
                      <Input value={data.fullName} onChange={(v) => update("fullName", v)} placeholder="Your full name" />
                    </Field>
                    <Field label="WhatsApp Number" required error={errors.whatsapp}>
                      <Input value={data.whatsapp} onChange={(v) => update("whatsapp", v)} placeholder="01XXXXXXXXX" type="tel" />
                    </Field>
                    <Field label="Email Address" required error={errors.email}>
                      <Input value={data.email} onChange={(v) => update("email", v)} placeholder="you@example.com" type="email" />
                    </Field>

                    {/* National ID — required for Egyptians only */}
                    {data.nationality === "Egyptian" && (
                      <Field label="National ID" required error={errors.nationalId}>
                        <div className="relative">
                          <Input
                            value={data.nationalId}
                            onChange={(v) => {
                              update("nationalId", v);
                              if (v.length === 14) {
                                const parsed = parseNationalId(v);
                                if (parsed) {
                                  update("dateOfBirth", parsed.dateOfBirth);
                                  update("gender", parsed.gender);
                                  if (parsed.governorate) update("governorate", parsed.governorate);
                                }
                              }
                            }}
                            placeholder="14-digit national ID"
                          />
                          {data.nationalId.length === 14 && parseNationalId(data.nationalId) && (
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500 text-xs font-bold">✓ Auto-filled</span>
                          )}
                        </div>
                        {data.nationalId.length === 14 && !parseNationalId(data.nationalId) && (
                          <p className="text-xs text-red-400 mt-1">Invalid national ID number</p>
                        )}
                        {data.nationalId.length === 14 && parseNationalId(data.nationalId) && (
                          <p className="text-xs text-green-600 mt-1">Date of birth, gender & governorate auto-filled</p>
                        )}
                      </Field>
                    )}

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
                    <Field label="LinkedIn Profile Link" required error={errors.linkedinLink}>
                      <Input value={data.linkedinLink} onChange={(v) => update("linkedinLink", v)} placeholder="https://linkedin.com/in/username" type="url" />
                      {data.linkedinLink.trim() && !urlMatchesDomain(data.linkedinLink, "linkedin.com") && (
                        <p className="text-xs text-red-400 mt-1">Must be a linkedin.com link</p>
                      )}
                    </Field>
                  </div>

                  {/* EDUZAH previous service question */}
                  <div className="p-4 rounded-2xl border border-[#d91b5b]/20" style={{ background: "#fff5f7" }}>
                    <Field label="Have you previously taken a course or service at EDUZAH?" required error={errors.hadEduzahService}>
                      <div className="flex gap-3 mt-1">
                        {["Yes", "No"].map((opt) => (
                          <button key={opt} type="button"
                            onClick={() => { update("hadEduzahService", opt); if (opt === "No") update("eduzahServiceName", ""); }}
                            className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition ${
                              data.hadEduzahService === opt ? "text-white border-transparent" : "border-gray-200 text-gray-600 bg-white"
                            }`}
                            style={data.hadEduzahService === opt ? { background: "linear-gradient(135deg,#d91b5b,#faa633)" } : {}}>
                            {opt}
                          </button>
                        ))}
                      </div>
                    </Field>
                    {data.hadEduzahService === "Yes" && (
                      <div className="mt-3">
                        <Field label="Which course or service?" required error={errors.eduzahServiceName}>
                          <Input
                            value={data.eduzahServiceName}
                            onChange={(v) => update("eduzahServiceName", v)}
                            placeholder="e.g. Frontend, Data Analysis, UI/UX..."
                          />
                        </Field>
                      </div>
                    )}
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
                        options={["2023","2024","2025","2026","2027","Other"].map((y) => ({ value: y, label: y === "Other" ? "Other (غير ذلك)" : y }))} />
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

                  {/* Technical — Closed */}
                  <ClosedSection
                    title="Technical Internships"
                    badge="Internship — Unpaid"
                    badgeColor="#672d86"
                    positions={POSITIONS.filter((p) => p.type === "technical_internship")}
                  />

                  {/* Non-Technical — Closed */}
                  <ClosedSection
                    title="Non-Technical Internships"
                    badge="Internship — Unpaid"
                    badgeColor="#672d86"
                    positions={POSITIONS.filter((p) => p.type === "non_technical_internship")}
                  />
                  <PositionGroup
                    title="Paid Positions"
                    badge="Paid Position"
                    badgeColor="#faa633"
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
                  {(() => {
                    const pc = data.position ? (PORTFOLIO_CONFIG[data.position] ?? DEFAULT_PORTFOLIO) : DEFAULT_PORTFOLIO;
                    type LinkField = { key: keyof FormState; label: string; placeholder: string; vis: LinkVis; domain?: string };
                    const fields: LinkField[] = [
                      { key: "githubLink",     label: "GitHub Link",      placeholder: "https://github.com/username",  vis: pc.github,   domain: "github.com"   },
                      { key: "portfolioLink",  label: "Portfolio Link",   placeholder: "https://yourportfolio.com",    vis: pc.portfolio                         },
                      { key: "behanceLink",    label: "Behance Link",     placeholder: "https://behance.net/username", vis: pc.behance,  domain: "behance.net"  },
                      { key: "personalWebsite",label: "Personal Website", placeholder: "https://yoursite.com",         vis: pc.website                           },
                    ];
                    const visible = fields.filter(f => f.vis !== "hidden");
                    return (
                      <div className="grid sm:grid-cols-2 gap-4">
                        {visible.map(f => {
                          const val = (data as unknown as Record<string,string>)[f.key];
                          const wrongDomain = f.domain && val.trim() && !urlMatchesDomain(val, f.domain);
                          return (
                            <Field key={f.key} label={`${f.label}${f.vis === "required" ? "" : " (Optional)"}`} required={f.vis === "required"} error={errors[f.key]}>
                              <Input value={val} onChange={(v) => update(f.key, v)} type="url" placeholder={f.placeholder} />
                              {wrongDomain && (
                                <p className="text-xs text-red-400 mt-1">Must be a {f.domain} link</p>
                              )}
                            </Field>
                          );
                        })}
                      </div>
                    );
                  })()}
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
                    <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600 whitespace-pre-line">
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

function ClosedSection({ title, badge, badgeColor, positions }: {
  title: string; badge: string; badgeColor: string; positions: PositionDef[];
}) {
  return (
    <div className="relative">
      <div className="flex items-center gap-2 mb-3">
        <h3 className="font-semibold text-gray-800">{title}</h3>
        <span className="text-xs px-2 py-0.5 rounded-full border font-medium"
          style={{ color: badgeColor, borderColor: `${badgeColor}40`, background: `${badgeColor}10` }}>
          {badge}
        </span>
        <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-red-100 text-red-600 border border-red-200">
          🔒 Closed
        </span>
      </div>
      <div className="grid sm:grid-cols-2 gap-3 opacity-40 pointer-events-none select-none">
        {positions.map((pos) => (
          <div key={pos.name} className="p-4 rounded-xl border-2 border-gray-200 bg-white">
            <p className="font-semibold text-sm text-gray-500">{pos.name}</p>
            <p className="text-xs mt-0.5 text-gray-400">Applications closed</p>
          </div>
        ))}
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="bg-white/95 border border-red-200 rounded-2xl px-5 py-3 text-center shadow-sm">
          <p className="text-sm font-bold text-red-600">🔒 Applications Closed</p>
          <p className="text-xs text-gray-500 mt-0.5">This track is currently not accepting applications</p>
        </div>
      </div>
    </div>
  );
}

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
      <div className="flex items-center gap-2 mt-1 flex-wrap">
        <p className="text-xs font-medium" style={{ color: pos.type === "paid" ? "#faa633" : "#672d86" }}>
          {pos.type === "paid" ? "Paid Position" : "Internship (Unpaid)"}
        </p>
        {pos.mode && (
          <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{
            background: pos.mode === "Remote" ? "#fef3c7" : pos.mode === "Hybrid / Remote" ? "#ede9fe" : "#e0f2fe",
            color:      pos.mode === "Remote" ? "#92400e" : pos.mode === "Hybrid / Remote" ? "#5b21b6"  : "#0369a1",
          }}>
            {pos.mode}
          </span>
        )}
      </div>
    </button>
  );
}
