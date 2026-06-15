"use client";

import { useState, useTransition } from "react";
import { Card, Avatar, EmptyState } from "@/components/ui";
import { markAttendance } from "@/lib/actions/attendance";
import { cn } from "@/lib/utils";
import { Users } from "lucide-react";
import type { Attendance, AttendanceStatus, Profile } from "@/lib/types";

const OPTIONS: { value: AttendanceStatus; label: string; active: string }[] = [
  { value: "present", label: "Present", active: "bg-success text-white" },
  { value: "late", label: "Late", active: "bg-warning text-white" },
  { value: "absent", label: "Absent", active: "bg-danger text-white" },
];

export function AttendancePanel({
  courseId,
  sessionId,
  students,
  attendance,
}: {
  courseId: string;
  sessionId: string;
  students: Profile[];
  attendance: Attendance[];
}) {
  const [records, setRecords] = useState(new Map(attendance.map((a) => [a.student_id, a.status])));
  const [, startTransition] = useTransition();

  if (students.length === 0) {
    return <EmptyState icon={<Users size={24} />} title="No students enrolled" description="Enroll students to take attendance." />;
  }

  function setStatus(studentId: string, status: AttendanceStatus) {
    setRecords((prev) => new Map(prev).set(studentId, status));
    startTransition(() => {
      markAttendance(courseId, sessionId, studentId, status);
    });
  }

  return (
    <Card className="space-y-3">
      <h2 className="font-semibold text-foreground">Attendance</h2>
      <div className="space-y-2">
        {students.map((st) => {
          const current = records.get(st.id);
          return (
            <div key={st.id} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface p-3">
              <div className="flex items-center gap-2">
                <Avatar name={st.name} src={st.avatar_url} size={28} />
                <span className="text-sm font-medium text-foreground">{st.name}</span>
              </div>
              <div className="flex gap-1.5">
                {OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setStatus(st.id, opt.value)}
                    className={cn(
                      "rounded-lg px-2.5 py-1 text-xs font-semibold transition",
                      current === opt.value ? opt.active : "bg-surface-muted text-foreground/60 hover:text-foreground"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
