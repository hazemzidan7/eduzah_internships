"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Card,
  Badge,
  CourseStatusBadge,
  Button,
  Avatar,
  StatusBadge,
  EmptyState,
  Dialog,
  Input,
  Textarea,
  Select,
} from "@/components/ui";
import { MaterialIcon } from "@/components/material-icon";
import { formatDate, isOverdue } from "@/lib/utils";
import { createSession } from "@/lib/actions/sessions";
import { updateCourse, assignInstructor, removeInstructor, enrollStudent, unenrollStudent } from "@/lib/actions/courses";
import { Plus, Calendar, ClipboardList, Users, X, Pencil, FolderOpen } from "lucide-react";
import type { Course, Session, Material, Attendance, Submission, Profile, UserRole, CourseStatus } from "@/lib/types";

const CATEGORIES = [
  "Flutter Development",
  "Front-End",
  "Full Stack",
  "Cyber Security",
  "Networking",
  "English",
  "Graphic Design",
  "AI/ML",
];

export function CourseDetailTabs({
  course,
  role,
  sessions,
  materials,
  instructors,
  students,
  attendance,
  submissions,
  allInstructors,
  allStudents,
}: {
  course: Course;
  role: UserRole;
  userId: string;
  sessions: Session[];
  materials: Material[];
  instructors: Profile[];
  students: Profile[];
  attendance: Attendance[];
  submissions: Submission[];
  allInstructors: Profile[];
  allStudents: Profile[];
}) {
  const [tab, setTab] = useState("sessions");
  const [addSessionOpen, setAddSessionOpen] = useState(false);
  const [editCourseOpen, setEditCourseOpen] = useState(false);
  const [enrollOpen, setEnrollOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);

  const canManage = role === "admin" || role === "instructor";
  const submissionMap = new Map(submissions.map((s) => [s.session_id, s]));

  const unenrolledStudents = allStudents.filter((s) => !students.some((e) => e.id === s.id));
  const unassignedInstructors = allInstructors.filter((i) => !instructors.some((a) => a.id === i.id));

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge>{course.category}</Badge>
              {role === "admin" && <CourseStatusBadge status={course.status} />}
            </div>
            <p className="text-sm text-foreground/70">{course.description}</p>
            {course.duration_text && <p className="text-xs text-foreground/50">Duration: {course.duration_text}</p>}
            {instructors.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-xs text-foreground/50">Instructors:</span>
                {instructors.map((i) => (
                  <span key={i.id} className="flex items-center gap-1.5 rounded-full bg-surface-muted px-2 py-1 text-xs text-foreground/70">
                    <Avatar name={i.name} src={i.avatar_url} size={18} />
                    {i.name}
                    {role === "admin" && (
                      <button onClick={() => removeInstructor(course.id, i.id)} className="text-foreground/40 hover:text-danger">
                        <X size={12} />
                      </button>
                    )}
                  </span>
                ))}
              </div>
            )}
          </div>
          {role === "admin" && (
            <div className="flex shrink-0 gap-2">
              <Button variant="secondary" onClick={() => setAssignOpen(true)}><Users size={15} /> Assign Instructor</Button>
              <Button variant="secondary" onClick={() => setEditCourseOpen(true)}><Pencil size={15} /> Edit</Button>
            </div>
          )}
        </div>
      </Card>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
          <TabsTrigger value="materials">Materials</TabsTrigger>
          {canManage && <TabsTrigger value="roster">Roster</TabsTrigger>}
          {canManage && <TabsTrigger value="attendance">Attendance</TabsTrigger>}
        </TabsList>

        <TabsContent value="sessions">
          <div className="space-y-3 pt-4">
            {canManage && (
              <div className="flex justify-end">
                <Button onClick={() => setAddSessionOpen(true)}><Plus size={16} /> Add Session</Button>
              </div>
            )}
            {sessions.length === 0 ? (
              <EmptyState icon={<Calendar size={24} />} title="No sessions yet" description="Sessions will appear here once added." />
            ) : (
              <div className="space-y-2">
                {sessions.map((s, idx) => {
                  const sub = submissionMap.get(s.id);
                  return (
                    <Link
                      key={s.id}
                      href={`/courses/${course.id}/sessions/${s.id}`}
                      className="flex flex-col gap-2 rounded-xl border border-border bg-surface p-4 transition hover:border-primary/40 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-sm font-semibold text-primary">
                          {idx + 1}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{s.title}</p>
                          <p className="text-sm text-foreground/50">
                            {s.session_date ? formatDate(s.session_date) : "No date set"}
                            {s.assignment_title && <> · {s.assignment_title}</>}
                            {s.deadline && (
                              <>
                                {" "}· Due {formatDate(s.deadline)}
                                {isOverdue(s.deadline) && <span className="ml-1 font-semibold text-danger">Overdue</span>}
                              </>
                            )}
                          </p>
                        </div>
                      </div>
                      {role === "student" && s.assignment_title && <StatusBadge status={sub?.status ?? "not_submitted"} />}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="materials">
          <div className="space-y-4 pt-4">
            {sessions.length === 0 || materials.length === 0 ? (
              <EmptyState icon={<FolderOpen size={24} />} title="No materials yet" description="Course materials will appear here once uploaded." />
            ) : (
              sessions.map((s) => {
                const sessionMaterials = materials.filter((m) => m.session_id === s.id);
                if (sessionMaterials.length === 0) return null;
                return (
                  <div key={s.id}>
                    <p className="mb-2 text-sm font-semibold text-foreground">{s.title}</p>
                    <div className="space-y-2">
                      {sessionMaterials.map((m) => (
                        <a
                          key={m.id}
                          href={m.url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-3 rounded-xl border border-border bg-surface p-3 transition hover:border-primary/40"
                        >
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-soft text-primary">
                            <MaterialIcon type={m.type} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-foreground">{m.title}</p>
                            <p className="text-xs uppercase text-foreground/50">{m.type}</p>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </TabsContent>

        {canManage && (
          <TabsContent value="roster">
            <div className="space-y-3 pt-4">
              {role === "admin" && (
                <div className="flex justify-end">
                  <Button onClick={() => setEnrollOpen(true)}><Plus size={16} /> Enroll Student</Button>
                </div>
              )}
              {students.length === 0 ? (
                <EmptyState icon={<Users size={24} />} title="No students enrolled" description="Enrolled students will appear here." />
              ) : (
                <div className="overflow-hidden rounded-xl border border-border bg-surface">
                  <table className="w-full text-sm">
                    <thead className="bg-surface-muted text-left text-xs uppercase text-foreground/50">
                      <tr>
                        <th className="px-4 py-3 font-medium">Student</th>
                        <th className="px-4 py-3 font-medium">Attendance</th>
                        <th className="px-4 py-3 font-medium">Avg Grade</th>
                        {role === "admin" && <th className="px-4 py-3 font-medium"></th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {students.map((st) => {
                        const studentAttendance = attendance.filter((a) => a.student_id === st.id);
                        const present = studentAttendance.filter((a) => a.status === "present").length;
                        const attendancePct = studentAttendance.length > 0 ? Math.round((present / studentAttendance.length) * 100) : null;

                        const grades = submissions.filter((s) => s.student_id === st.id && s.grade !== null).map((s) => s.grade as number);
                        const avgGrade = grades.length > 0 ? Math.round(grades.reduce((a, b) => a + b, 0) / grades.length) : null;

                        return (
                          <tr key={st.id}>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <Avatar name={st.name} src={st.avatar_url} size={28} />
                                <div>
                                  <p className="font-medium text-foreground">{st.name}</p>
                                  <p className="text-xs text-foreground/50">{st.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-foreground/70">{attendancePct !== null ? `${attendancePct}%` : "—"}</td>
                            <td className="px-4 py-3 text-foreground/70">{avgGrade !== null ? `${avgGrade}%` : "—"}</td>
                            {role === "admin" && (
                              <td className="px-4 py-3 text-right">
                                <button onClick={() => unenrollStudent(course.id, st.id)} className="text-xs font-medium text-danger hover:underline">
                                  Remove
                                </button>
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </TabsContent>
        )}

        {canManage && (
          <TabsContent value="attendance">
            <div className="space-y-3 pt-4">
              {sessions.length === 0 ? (
                <EmptyState icon={<ClipboardList size={24} />} title="No sessions yet" description="Attendance can be tracked once sessions exist." />
              ) : (
                <div className="overflow-hidden rounded-xl border border-border bg-surface">
                  <table className="w-full text-sm">
                    <thead className="bg-surface-muted text-left text-xs uppercase text-foreground/50">
                      <tr>
                        <th className="px-4 py-3 font-medium">Session</th>
                        <th className="px-4 py-3 font-medium">Present</th>
                        <th className="px-4 py-3 font-medium">Absent</th>
                        <th className="px-4 py-3 font-medium">Late</th>
                        <th className="px-4 py-3 font-medium"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {sessions.map((s) => {
                        const records = attendance.filter((a) => a.session_id === s.id);
                        const present = records.filter((a) => a.status === "present").length;
                        const absent = records.filter((a) => a.status === "absent").length;
                        const late = records.filter((a) => a.status === "late").length;
                        return (
                          <tr key={s.id}>
                            <td className="px-4 py-3 font-medium text-foreground">{s.title}</td>
                            <td className="px-4 py-3 text-success">{present}</td>
                            <td className="px-4 py-3 text-danger">{absent}</td>
                            <td className="px-4 py-3 text-warning">{late}</td>
                            <td className="px-4 py-3 text-right">
                              <Link href={`/courses/${course.id}/sessions/${s.id}`} className="text-xs font-medium text-primary hover:underline">
                                Mark attendance
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </TabsContent>
        )}
      </Tabs>

      {/* Add Session Dialog */}
      <Dialog open={addSessionOpen} onOpenChange={setAddSessionOpen} title="Add Session" description="Create a new session for this course.">
        <form
          action={async (formData) => {
            await createSession(course.id, formData);
            setAddSessionOpen(false);
          }}
          className="space-y-3"
        >
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Title</label>
            <Input name="title" required placeholder="Session title" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Description</label>
            <Textarea name="description" rows={3} placeholder="What's covered in this session?" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Session date</label>
              <Input type="date" name="session_date" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Deadline</label>
              <Input type="date" name="deadline" />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Recording URL</label>
            <Input name="recording_url" placeholder="https://..." />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Assignment title</label>
            <Input name="assignment_title" placeholder="Optional" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Assignment description</label>
            <Textarea name="assignment_description" rows={2} placeholder="Optional" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="submit">Create Session</Button>
          </div>
        </form>
      </Dialog>

      {/* Edit Course Dialog */}
      {role === "admin" && (
        <Dialog open={editCourseOpen} onOpenChange={setEditCourseOpen} title="Edit Course">
          <form
            action={async (formData) => {
              await updateCourse(course.id, formData);
              setEditCourseOpen(false);
            }}
            className="space-y-3"
          >
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Title</label>
              <Input name="title" required defaultValue={course.title} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Description</label>
              <Textarea name="description" required rows={3} defaultValue={course.description} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Category</label>
                <Select name="category" required defaultValue={course.category}>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Status</label>
                <Select name="status" defaultValue={course.status as CourseStatus}>
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="archived">Archived</option>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Duration</label>
                <Input name="duration_text" defaultValue={course.duration_text ?? ""} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Banner URL</label>
                <Input name="banner_url" defaultValue={course.banner_url ?? ""} />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="submit">Save Changes</Button>
            </div>
          </form>
        </Dialog>
      )}

      {/* Enroll Student Dialog */}
      {role === "admin" && (
        <Dialog open={enrollOpen} onOpenChange={setEnrollOpen} title="Enroll Student">
          {unenrolledStudents.length === 0 ? (
            <p className="text-sm text-foreground/50">All students are already enrolled.</p>
          ) : (
            <form
              action={async (formData) => {
                await enrollStudent(course.id, formData.get("student_id") as string);
                setEnrollOpen(false);
              }}
              className="space-y-3"
            >
              <Select name="student_id" required defaultValue="">
                <option value="" disabled>Select a student</option>
                {unenrolledStudents.map((s) => (
                  <option key={s.id} value={s.id}>{s.name} ({s.email})</option>
                ))}
              </Select>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="submit">Enroll</Button>
              </div>
            </form>
          )}
        </Dialog>
      )}

      {/* Assign Instructor Dialog */}
      {role === "admin" && (
        <Dialog open={assignOpen} onOpenChange={setAssignOpen} title="Assign Instructor">
          {unassignedInstructors.length === 0 ? (
            <p className="text-sm text-foreground/50">All instructors are already assigned.</p>
          ) : (
            <form
              action={async (formData) => {
                await assignInstructor(course.id, formData.get("instructor_id") as string);
                setAssignOpen(false);
              }}
              className="space-y-3"
            >
              <Select name="instructor_id" required defaultValue="">
                <option value="" disabled>Select an instructor</option>
                {unassignedInstructors.map((i) => (
                  <option key={i.id} value={i.id}>{i.name} ({i.email})</option>
                ))}
              </Select>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="submit">Assign</Button>
              </div>
            </form>
          )}
        </Dialog>
      )}
    </div>
  );
}
