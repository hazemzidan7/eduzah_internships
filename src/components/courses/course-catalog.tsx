"use client";

import { useMemo, useState } from "react";
import { CourseCard } from "@/components/courses/course-card";
import { Input, Select, EmptyState } from "@/components/ui";
import { Search, BookOpen } from "lucide-react";
import type { Course } from "@/lib/types";

export function CourseCatalog({
  courses,
  showStatus,
  progressMap,
  metaMap,
}: {
  courses: Course[];
  showStatus?: boolean;
  progressMap?: Record<string, number>;
  metaMap?: Record<string, string>;
}) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");

  const categories = useMemo(() => [...new Set(courses.map((c) => c.category))].sort(), [courses]);

  const filtered = courses.filter((c) => {
    const matchesSearch = c.title.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === "all" || c.category === category;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" />
          <Input placeholder="Search courses..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={category} onChange={(e) => setCategory(e.target.value)} className="sm:w-56">
          <option value="all">All categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={<BookOpen size={24} />} title="No courses found" description="Try adjusting your search or filters." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => (
            <CourseCard
              key={c.id}
              course={c}
              showStatus={showStatus}
              progress={progressMap?.[c.id]}
              meta={metaMap?.[c.id]}
            />
          ))}
        </div>
      )}
    </div>
  );
}
