"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Search, BookOpen, User } from "lucide-react";
import type { UserRole } from "@/lib/types";

interface ResultItem {
  id: string;
  label: string;
  sublabel: string;
  href: string;
  icon: "course" | "user";
}

export function GlobalSearch({ role }: { role: UserRole }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ResultItem[]>([]);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  useEffect(() => {
    if (query.trim().length < 2) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setResults([]);
      return;
    }
    const supabase = createClient();
    const timeout = setTimeout(async () => {
      const items: ResultItem[] = [];

      const { data: courses } = await supabase
        .from("courses")
        .select("id, title, category")
        .ilike("title", `%${query}%`)
        .limit(5);

      (courses ?? []).forEach((c) =>
        items.push({ id: c.id, label: c.title, sublabel: c.category, href: `/courses/${c.id}`, icon: "course" })
      );

      if (role === "admin") {
        const { data: people } = await supabase
          .from("profiles")
          .select("id, name, email, role")
          .ilike("name", `%${query}%`)
          .limit(5);

        (people ?? []).forEach((p) =>
          items.push({
            id: p.id,
            label: p.name,
            sublabel: p.email,
            href: p.role === "instructor" ? "/admin/instructors" : p.role === "student" ? "/admin/students" : "/dashboard",
            icon: "user",
          })
        );
      }

      setResults(items);
      setOpen(true);
    }, 250);

    return () => clearTimeout(timeout);
  }, [query, role]);

  return (
    <div ref={containerRef} className="relative w-full max-w-sm">
      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" />
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => results.length > 0 && setOpen(true)}
        placeholder="Search courses, people..."
        className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm text-foreground outline-none ring-primary/30 transition focus:ring-2"
      />
      {open && results.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-80 overflow-y-auto rounded-xl border border-border bg-surface p-1.5 shadow-lg">
          {results.map((r) => (
            <button
              key={`${r.icon}-${r.id}`}
              onClick={() => {
                router.push(r.href);
                setOpen(false);
                setQuery("");
              }}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition hover:bg-surface-muted"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                {r.icon === "course" ? <BookOpen size={15} /> : <User size={15} />}
              </div>
              <div className="min-w-0">
                <p className="truncate font-medium text-foreground">{r.label}</p>
                <p className="truncate text-xs text-foreground/50">{r.sublabel}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
