"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/logo";
import type { UserRole } from "@/lib/types";
import {
  LayoutDashboard,
  BookOpen,
  Users,
  GraduationCap,
  BarChart3,
  Bell,
  LogOut,
  Menu,
  X,
} from "lucide-react";

interface SidebarProps {
  role: UserRole;
}

const baseLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/courses", label: "Courses", icon: BookOpen },
];

const adminLinks = [
  { href: "/admin/instructors", label: "Instructors", icon: GraduationCap },
  { href: "/admin/students", label: "Students", icon: Users },
  { href: "/admin/reports", label: "Reports", icon: BarChart3 },
];

const tailLinks = [{ href: "/notifications", label: "Notifications", icon: Bell }];

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const links = [...baseLinks, ...(role === "admin" ? adminLinks : []), ...tailLinks];

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const content = (
    <div className="flex h-full flex-col">
      <div className="flex flex-col gap-2 px-5 py-5">
        <Logo height={32} />
        <p className="text-xs font-medium capitalize tracking-wide text-foreground/50">{role} portal</p>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {links.map((link) => {
          const Icon = link.icon;
          const active = pathname === link.href || pathname.startsWith(link.href + "/");
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                active
                  ? "brand-gradient text-primary-foreground shadow-md shadow-accent/20"
                  : "text-foreground/70 hover:translate-x-0.5 hover:bg-surface-muted hover:text-foreground"
              )}
            >
              <Icon size={18} />
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border p-3">
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-foreground/70 transition hover:bg-surface-muted hover:text-danger"
        >
          <LogOut size={18} />
          Sign out
        </button>
      </div>
    </div>
  );

  return (
    <>
      <div className="flex items-center justify-between border-b border-border bg-surface px-4 py-3 lg:hidden">
        <Logo height={26} />
        <button
          onClick={() => setOpen(true)}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-foreground/70"
          aria-label="Open menu"
        >
          <Menu size={18} />
        </button>
      </div>

      <aside className="hidden w-64 shrink-0 border-r border-border bg-surface lg:block">{content}</aside>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-64 bg-surface shadow-xl">
            <button
              onClick={() => setOpen(false)}
              className="absolute right-3 top-4 flex h-8 w-8 items-center justify-center rounded-lg text-foreground/60"
              aria-label="Close menu"
            >
              <X size={18} />
            </button>
            {content}
          </aside>
        </div>
      )}
    </>
  );
}
