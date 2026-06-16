"use client";

import { Card, StatCard, ProgressBar } from "@/components/ui";
import { CompletionByCourseChart, AttendanceOverviewChart } from "@/components/dashboard/admin-charts";
import { ReportsExport } from "@/components/admin/reports-export";
import { useLanguage } from "@/lib/language-context";
import { translations } from "@/lib/translations";
import { TrendingUp, CheckCircle2, Users, Layers } from "lucide-react";

type StudentRow = { student: string; email: string; course: string; enrolled_at: string | null };
type AttendanceRow = { student: string; session: string; course: string; status: string; recorded_at: string | null };
type GradeRow = { student: string; session: string; course: string; grade: number | null; status: string };

export function ReportsContent({
  overallCompletion,
  avgGrade,
  overallAttendanceRate,
  totalCourses,
  completionByCourse,
  attendanceData,
  studentRows,
  attendanceRows,
  gradeRows,
}: {
  overallCompletion: number;
  avgGrade: number;
  overallAttendanceRate: number;
  totalCourses: number;
  completionByCourse: { name: string; value: number }[];
  attendanceData: { name: string; value: number }[];
  studentRows: StudentRow[];
  attendanceRows: AttendanceRow[];
  gradeRows: GradeRow[];
}) {
  const { language } = useLanguage();
  const tr = translations[language].reports;

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label={tr.avgCompletion} value={`${overallCompletion}%`} icon={<CheckCircle2 size={22} />} accent="bg-success/10 text-success" />
        <StatCard label={tr.avgGrade} value={`${avgGrade}%`} icon={<TrendingUp size={22} />} accent="bg-primary-soft text-primary" />
        <StatCard label={tr.attendanceRate} value={`${overallAttendanceRate}%`} icon={<Users size={22} />} />
        <StatCard label={tr.totalCourses} value={totalCourses} icon={<Layers size={22} />} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <CompletionByCourseChart data={completionByCourse.length ? completionByCourse : [{ name: "No data", value: 0 }]} />
        <AttendanceOverviewChart data={attendanceData.length ? attendanceData : [{ name: "No records", value: 1 }]} />
      </div>

      <Card>
        <h2 className="mb-2 font-semibold text-foreground">{tr.overallCompletion}</h2>
        <ProgressBar value={overallCompletion} />
      </Card>

      <div>
        <h2 className="mb-3 font-semibold text-foreground">{tr.exportData}</h2>
        <ReportsExport students={studentRows} attendance={attendanceRows} grades={gradeRows} />
      </div>
    </div>
  );
}
