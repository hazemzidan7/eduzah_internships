"use client";

import Link from "next/link";
import { CourseStatusBadge, ProgressBar, Badge } from "@/components/ui";
import { BookOpen, Clock, Users } from "lucide-react";
import { useLanguage } from "@/lib/language-context";
import { translations } from "@/lib/translations";
import type { Course } from "@/lib/types";

export function CourseCard({
  course,
  showStatus,
  progress,
  meta,
}: {
  course: Course;
  showStatus?: boolean;
  progress?: number;
  meta?: string;
}) {
  const { language } = useLanguage();
  const tr = translations[language].courses;

  return (
    <Link
      href={`/courses/${course.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-sm transition hover:border-primary/40 hover:shadow-md"
    >
      <div className="brand-gradient flex h-32 items-center justify-center text-primary-foreground">
        {course.banner_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={course.banner_url} alt={course.title} className="h-full w-full object-cover" />
        ) : (
          <BookOpen size={36} />
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-center justify-between gap-2">
          <Badge>{course.category}</Badge>
          {showStatus && <CourseStatusBadge status={course.status} />}
        </div>
        <h3 dir="auto" className="font-semibold text-foreground group-hover:text-primary">{course.title}</h3>
        <p dir="auto" className="line-clamp-2 text-sm text-foreground/50">{course.description}</p>
        <div className="mt-auto flex items-center gap-3 pt-2 text-xs text-foreground/50">
          {course.duration_text && (
            <span dir="auto" className="flex items-center gap-1">
              <Clock size={13} /> {course.duration_text}
            </span>
          )}
          {meta && (
            <span className="flex items-center gap-1">
              <Users size={13} /> {meta} {tr.students}
            </span>
          )}
        </div>
        {progress !== undefined && (
          <div className="pt-1">
            <ProgressBar value={progress} />
            <p className="mt-1 text-xs text-foreground/50">{progress}% {tr.complete}</p>
          </div>
        )}
      </div>
    </Link>
  );
}
