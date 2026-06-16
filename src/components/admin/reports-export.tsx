"use client";

import { Button } from "@/components/ui";
import { downloadCsv } from "@/lib/csv";
import { Download } from "lucide-react";
import { useLanguage } from "@/lib/language-context";
import { translations } from "@/lib/translations";

export function ReportsExport({
  students,
  attendance,
  grades,
}: {
  students: Record<string, string | number | null>[];
  attendance: Record<string, string | number | null>[];
  grades: Record<string, string | number | null>[];
}) {
  const { language } = useLanguage();
  const tr = translations[language].reports;

  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="secondary" onClick={() => downloadCsv("students.csv", students)}>
        <Download size={15} /> {tr.exportStudents}
      </Button>
      <Button variant="secondary" onClick={() => downloadCsv("attendance.csv", attendance)}>
        <Download size={15} /> {tr.exportAttendance}
      </Button>
      <Button variant="secondary" onClick={() => downloadCsv("grades.csv", grades)}>
        <Download size={15} /> {tr.exportGrades}
      </Button>
    </div>
  );
}
