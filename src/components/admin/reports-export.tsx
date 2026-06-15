"use client";

import { Button } from "@/components/ui";
import { downloadCsv } from "@/lib/csv";
import { Download } from "lucide-react";

export function ReportsExport({
  students,
  attendance,
  grades,
}: {
  students: Record<string, string | number | null>[];
  attendance: Record<string, string | number | null>[];
  grades: Record<string, string | number | null>[];
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="secondary" onClick={() => downloadCsv("students.csv", students)}>
        <Download size={15} /> Export Students
      </Button>
      <Button variant="secondary" onClick={() => downloadCsv("attendance.csv", attendance)}>
        <Download size={15} /> Export Attendance
      </Button>
      <Button variant="secondary" onClick={() => downloadCsv("grades.csv", grades)}>
        <Download size={15} /> Export Grades
      </Button>
    </div>
  );
}
