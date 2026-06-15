"use client";

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { Card } from "@/components/ui";

const PIE_COLORS = ["var(--color-chart-1)", "var(--color-chart-2)", "var(--color-chart-3)", "var(--color-chart-4)", "var(--color-chart-5)"];

export function CourseStatusChart({ data }: { data: { name: string; value: number }[] }) {
  return (
    <Card>
      <h2 className="mb-4 font-semibold text-foreground">Courses by Status</h2>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3}>
              {data.map((_, i) => (
                <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 8, fontSize: 12 }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 flex flex-wrap gap-3">
        {data.map((d, i) => (
          <div key={d.name} className="flex items-center gap-1.5 text-xs text-foreground/60">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
            {d.name} ({d.value})
          </div>
        ))}
      </div>
    </Card>
  );
}

export function EnrollmentsByCategoryChart({ data }: { data: { name: string; value: number }[] }) {
  return (
    <Card>
      <h2 className="mb-4 font-semibold text-foreground">Enrollments by Category</h2>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--color-foreground)" }} interval={0} angle={-20} textAnchor="end" height={60} />
            <YAxis tick={{ fontSize: 11, fill: "var(--color-foreground)" }} allowDecimals={false} />
            <Tooltip
              contentStyle={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 8, fontSize: 12 }}
            />
            <Bar dataKey="value" fill="var(--color-chart-1)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

export function CompletionByCourseChart({ data }: { data: { name: string; value: number }[] }) {
  return (
    <Card>
      <h2 className="mb-4 font-semibold text-foreground">Completion Rate by Course (%)</h2>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--color-foreground)" }} interval={0} angle={-20} textAnchor="end" height={70} />
            <YAxis tick={{ fontSize: 11, fill: "var(--color-foreground)" }} domain={[0, 100]} />
            <Tooltip
              contentStyle={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 8, fontSize: 12 }}
            />
            <Bar dataKey="value" fill="var(--color-chart-2)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

export function AttendanceOverviewChart({ data }: { data: { name: string; value: number }[] }) {
  return (
    <Card>
      <h2 className="mb-4 font-semibold text-foreground">Attendance Overview</h2>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3}>
              {data.map((_, i) => (
                <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 8, fontSize: 12 }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 flex flex-wrap gap-3">
        {data.map((d, i) => (
          <div key={d.name} className="flex items-center gap-1.5 text-xs text-foreground/60">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
            {d.name} ({d.value})
          </div>
        ))}
      </div>
    </Card>
  );
}
