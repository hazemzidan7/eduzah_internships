import type {
  Attendance,
  Course,
  CourseInstructor,
  Enrollment,
  Material,
  Notification,
  Profile,
  Session,
  Submission,
} from "./types";

type TableDef<Row, Insert, Update> = { Row: Row; Insert: Insert; Update: Update };

export interface Database {
  public: {
    Tables: {
      profiles: TableDef<Profile, Partial<Profile> & { id: string }, Partial<Profile>>;
      courses: TableDef<Course, Partial<Course> & { title: string }, Partial<Course>>;
      course_instructors: TableDef<CourseInstructor, CourseInstructor, Partial<CourseInstructor>>;
      enrollments: TableDef<Enrollment, Partial<Enrollment> & { course_id: string; student_id: string }, Partial<Enrollment>>;
      sessions: TableDef<Session, Partial<Session> & { course_id: string; title: string }, Partial<Session>>;
      materials: TableDef<Material, Partial<Material> & { session_id: string; title: string; type: string; url: string }, Partial<Material>>;
      submissions: TableDef<Submission, Partial<Submission> & { session_id: string; student_id: string }, Partial<Submission>>;
      attendance: TableDef<Attendance, Partial<Attendance> & { session_id: string; student_id: string }, Partial<Attendance>>;
      notifications: TableDef<Notification, Partial<Notification> & { user_id: string; type: string; title: string }, Partial<Notification>>;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      user_role: "admin" | "instructor" | "student";
      course_status: "draft" | "active" | "archived";
      submission_status: "not_submitted" | "submitted" | "late" | "reviewed" | "approved";
      attendance_status: "present" | "absent" | "late";
      material_type: "pdf" | "zip" | "ppt" | "doc" | "video" | "link";
    };
  };
}
