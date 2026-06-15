export type UserRole = "admin" | "instructor" | "student";
export type CourseStatus = "draft" | "active" | "archived";
export type SubmissionStatus = "not_submitted" | "submitted" | "late" | "reviewed" | "approved";
export type AttendanceStatus = "present" | "absent" | "late";
export type MaterialType = "pdf" | "zip" | "ppt" | "doc" | "video" | "link";

export interface Profile {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: UserRole;
  avatar_url: string | null;
  created_at: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  banner_url: string | null;
  duration_text: string | null;
  status: CourseStatus;
  created_by: string | null;
  created_at: string;
}

export interface CourseInstructor {
  course_id: string;
  instructor_id: string;
}

export interface Enrollment {
  course_id: string;
  student_id: string;
  enrolled_at: string;
}

export interface Session {
  id: string;
  course_id: string;
  order_index: number;
  title: string;
  description: string;
  session_date: string | null;
  recording_url: string | null;
  assignment_title: string | null;
  assignment_description: string | null;
  deadline: string | null;
  created_at: string;
}

export interface Material {
  id: string;
  session_id: string;
  title: string;
  type: MaterialType;
  url: string;
  size_bytes: number | null;
  created_at: string;
}

export interface Submission {
  id: string;
  session_id: string;
  student_id: string;
  file_url: string | null;
  file_name: string | null;
  link_url: string | null;
  submitted_at: string | null;
  status: SubmissionStatus;
  grade: number | null;
  feedback: string | null;
  reviewed_at: string | null;
  is_late: boolean;
}

export interface Attendance {
  id: string;
  session_id: string;
  student_id: string;
  status: AttendanceStatus;
  recorded_at: string;
  recorded_by: string | null;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  read: boolean;
  created_at: string;
}
