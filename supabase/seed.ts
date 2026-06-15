import { config } from "dotenv";
config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";
import type { CourseStatus } from "../src/lib/types";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const PASSWORD = "EduZah2026!";

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function createUser(name: string, email: string, role: "admin" | "instructor" | "student", phone?: string) {
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { name, role, phone: phone ?? null },
  });
  if (error) throw new Error(`Failed to create ${email}: ${error.message}`);
  return data.user!.id;
}

const STUDENT_NAMES = [
  "Ahmed Mohamed", "Sara Ibrahim", "Mohamed Tarek", "Laila Hassan", "Omar Khaled",
  "Nour El-Din", "Yasmin Adel", "Karim Fathy", "Mariam Saeed", "Hassan Aly",
  "Dina Mostafa", "Tarek Salem", "Rania Gamal", "Mostafa Nabil", "Heba Reda",
];

const COURSES: { title: string; category: string; description: string; duration_text: string; status: CourseStatus }[] = [
  { title: "Flutter Development Bootcamp", category: "Flutter Development", description: "Build cross-platform mobile apps with Flutter and Dart, from fundamentals to publishing on the App Store and Play Store.", duration_text: "10 weeks", status: "active" },
  { title: "Modern Front-End Development", category: "Front-End", description: "Master HTML, CSS, JavaScript, and React to build responsive, accessible, and performant web interfaces.", duration_text: "8 weeks", status: "active" },
  { title: "Full Stack Web Development", category: "Full Stack", description: "Learn to build complete web applications using Next.js, Node.js, and PostgreSQL.", duration_text: "12 weeks", status: "active" },
  { title: "Cyber Security Fundamentals", category: "Cyber Security", description: "Understand core security concepts, threat modeling, network defense, and ethical hacking basics.", duration_text: "6 weeks", status: "active" },
  { title: "Networking Essentials", category: "Networking", description: "Learn networking fundamentals including TCP/IP, routing, switching, and network troubleshooting.", duration_text: "6 weeks", status: "active" },
  { title: "Business English Communication", category: "English", description: "Improve professional English speaking, writing, and presentation skills for the workplace.", duration_text: "4 weeks", status: "active" },
  { title: "UI/UX Graphic Design", category: "Graphic Design", description: "Learn design principles, Figma, and prototyping to craft beautiful and usable interfaces.", duration_text: "8 weeks", status: "draft" },
  { title: "AI & Machine Learning Foundations", category: "AI/ML", description: "Get hands-on with Python, data analysis, and core machine learning algorithms.", duration_text: "10 weeks", status: "active" },
];

const SESSION_TEMPLATES = [
  { title: "Orientation & Setup", hasAssignment: false },
  { title: "Core Concepts", hasAssignment: true },
  { title: "Hands-on Practice", hasAssignment: true },
  { title: "Project Work", hasAssignment: true },
  { title: "Final Review & Wrap-up", hasAssignment: true },
];

function daysFromNow(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

async function main() {
  console.log("Seeding EDUZAH demo data...\n");

  console.log("Creating admin...");
  await createUser("Admin User", "admin@eduzah.com", "admin", "+20 100 000 0001");

  console.log("Creating instructors...");
  const instructorIds = await Promise.all([
    createUser("Mona Khalil", "instructor1@eduzah.com", "instructor", "+20 100 000 0011"),
    createUser("Yousef Adel", "instructor2@eduzah.com", "instructor", "+20 100 000 0012"),
    createUser("Salma Farouk", "instructor3@eduzah.com", "instructor", "+20 100 000 0013"),
  ]);

  console.log("Creating students...");
  const studentIds: string[] = [];
  for (let i = 0; i < STUDENT_NAMES.length; i++) {
    const email = `student${i + 1}@eduzah.com`;
    const id = await createUser(STUDENT_NAMES[i], email, "student", `+20 100 000 01${String(i + 20).padStart(2, "0")}`);
    studentIds.push(id);
  }

  console.log("Creating courses...");
  const courseIds: string[] = [];
  for (const course of COURSES) {
    const { data, error } = await supabase.from("courses").insert(course).select("id").single();
    if (error) throw new Error(error.message);
    courseIds.push(data.id);
  }

  console.log("Assigning instructors to courses...");
  const instructorAssignments = [
    [0, instructorIds[0]], [1, instructorIds[1]], [2, instructorIds[1]],
    [3, instructorIds[2]], [4, instructorIds[2]], [5, instructorIds[0]],
    [6, instructorIds[1]], [7, instructorIds[0]],
  ] as const;
  for (const [courseIdx, instructorId] of instructorAssignments) {
    const { error } = await supabase.from("course_instructors").insert({ course_id: courseIds[courseIdx], instructor_id: instructorId });
    if (error) throw new Error(error.message);
  }

  console.log("Enrolling students...");
  const enrollments: { course_id: string; student_id: string }[] = [];
  studentIds.forEach((studentId, i) => {
    const courseCount = 1 + (i % 3);
    for (let c = 0; c < courseCount; c++) {
      const courseIdx = (i + c) % COURSES.length;
      enrollments.push({ course_id: courseIds[courseIdx], student_id: studentId });
    }
  });
  for (const enrollment of enrollments) {
    const { error } = await supabase.from("enrollments").insert(enrollment);
    if (error && !error.message.includes("duplicate")) throw new Error(error.message);
  }

  console.log("Creating sessions, materials, submissions, attendance...");
  for (let courseIdx = 0; courseIdx < courseIds.length; courseIdx++) {
    const courseId = courseIds[courseIdx];
    const courseStudents = enrollments.filter((e) => e.course_id === courseId).map((e) => e.student_id);

    const sessionIds: string[] = [];
    for (let s = 0; s < SESSION_TEMPLATES.length; s++) {
      const template = SESSION_TEMPLATES[s];
      const { data: session, error } = await supabase
        .from("sessions")
        .insert({
          course_id: courseId,
          order_index: s,
          title: `Session ${s + 1}: ${template.title}`,
          description: `In this session, students explore ${template.title.toLowerCase()} for ${COURSES[courseIdx].title}.`,
          session_date: daysFromNow(s * 7 - 21),
          recording_url: s > 0 ? "https://example.com/recordings/sample.mp4" : null,
          assignment_title: template.hasAssignment ? `${template.title} Assignment` : null,
          assignment_description: template.hasAssignment ? `Complete the tasks covered in "${template.title}" and submit your work.` : null,
          deadline: template.hasAssignment ? daysFromNow(s * 7 - 21 + 5) : null,
        })
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      sessionIds.push(session.id);

      await supabase.from("materials").insert([
        { session_id: session.id, title: `${template.title} Slides`, type: "pdf", url: "https://example.com/materials/slides.pdf", size_bytes: 1024000 },
        { session_id: session.id, title: "Reference Link", type: "link", url: "https://developer.mozilla.org" },
      ]);
    }

    // Submissions for assignment sessions
    for (let s = 0; s < sessionIds.length; s++) {
      if (!SESSION_TEMPLATES[s].hasAssignment) continue;
      for (let stIdx = 0; stIdx < courseStudents.length; stIdx++) {
        const studentId = courseStudents[stIdx];
        const variant = (stIdx + s) % 4;
        if (variant === 3) continue; // not submitted

        const statusByVariant = ["approved", "reviewed", "submitted"] as const;
        const status = statusByVariant[variant];
        const grade = status === "approved" ? 90 + (stIdx % 10) : status === "reviewed" ? 70 + (stIdx % 20) : null;

        await supabase.from("submissions").insert({
          session_id: sessionIds[s],
          student_id: studentId,
          link_url: "https://github.com/example/student-submission",
          submitted_at: daysFromNow(s * 7 - 22),
          status,
          grade,
          feedback: status !== "submitted" ? "Good work, keep it up!" : null,
          reviewed_at: status !== "submitted" ? daysFromNow(s * 7 - 20) : null,
          is_late: false,
        });
      }
    }

    // Attendance
    for (let s = 0; s < sessionIds.length; s++) {
      for (let stIdx = 0; stIdx < courseStudents.length; stIdx++) {
        const variant = (stIdx + s) % 5;
        const status = variant === 0 ? "absent" : variant === 1 ? "late" : "present";
        await supabase.from("attendance").insert({
          session_id: sessionIds[s],
          student_id: courseStudents[stIdx],
          status,
          recorded_at: daysFromNow(s * 7 - 21),
        });
      }
    }
  }

  console.log("Creating notifications...");
  for (let i = 0; i < studentIds.length; i++) {
    await supabase.from("notifications").insert([
      { user_id: studentIds[i], type: "enrollment", title: "Welcome to EDUZAH!", body: "You have been enrolled in your courses. Start learning today.", link: "/courses" },
      { user_id: studentIds[i], type: "new_session", title: "New session available", body: "A new session has been added to one of your courses.", link: "/courses" },
    ]);
  }
  for (const instructorId of instructorIds) {
    await supabase.from("notifications").insert({
      user_id: instructorId,
      type: "course_assignment",
      title: "Course assignment",
      body: "You have been assigned to teach a course.",
      link: "/courses",
    });
  }

  console.log("\nSeed complete!");
  console.log("All accounts use password:", PASSWORD);
  console.log("Admin: admin@eduzah.com");
  console.log("Instructors: instructor1@eduzah.com, instructor2@eduzah.com, instructor3@eduzah.com");
  console.log("Students: student1@eduzah.com ... student15@eduzah.com");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
