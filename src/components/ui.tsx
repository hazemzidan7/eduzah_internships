"use client";

import { cn } from "@/lib/utils";
import { getInitials } from "@/lib/utils";
import type { SubmissionStatus, CourseStatus, AttendanceStatus } from "@/lib/types";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import * as DropdownPrimitive from "@radix-ui/react-dropdown-menu";
import * as AvatarPrimitive from "@radix-ui/react-avatar";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { X } from "lucide-react";

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("rounded-2xl border border-border bg-surface p-5 shadow-sm", className)}>
      {children}
    </div>
  );
}

export function StatCard({
  label,
  value,
  icon,
  accent,
  trend,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  accent?: string;
  trend?: string;
}) {
  return (
    <Card className="card-hover flex items-center gap-4">
      <div
        className={cn(
          "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition-transform group-hover:scale-105",
          accent ?? "bg-primary/10 text-primary"
        )}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-bold text-foreground">{value}</p>
        <p className="text-sm text-foreground/60">{label}</p>
        {trend && <p className="mt-0.5 text-xs font-medium text-success">{trend}</p>}
      </div>
    </Card>
  );
}

export function ProgressBar({ value, className }: { value: number; className?: string }) {
  const pct = Math.min(100, Math.max(0, value));
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-surface-muted", className)}>
      <div className="brand-gradient h-full rounded-full transition-all" style={{ width: `${pct}%` }} />
    </div>
  );
}

const statusStyles: Record<SubmissionStatus, string> = {
  not_submitted: "bg-zinc-500/10 text-zinc-500",
  submitted: "bg-amber-500/10 text-amber-500",
  late: "bg-orange-500/10 text-orange-500",
  reviewed: "bg-blue-500/10 text-blue-500",
  approved: "bg-emerald-500/10 text-emerald-500",
};

const statusLabels: Record<SubmissionStatus, string> = {
  not_submitted: "Not Submitted",
  submitted: "Submitted",
  late: "Late Submission",
  reviewed: "Reviewed",
  approved: "Approved",
};

export function StatusBadge({ status }: { status: SubmissionStatus }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold", statusStyles[status])}>
      {statusLabels[status]}
    </span>
  );
}

const courseStatusStyles: Record<CourseStatus, string> = {
  draft: "bg-zinc-500/10 text-zinc-500",
  active: "bg-success/10 text-success",
  archived: "bg-amber-500/10 text-amber-500",
};

export function CourseStatusBadge({ status }: { status: CourseStatus }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold capitalize", courseStatusStyles[status])}>
      {status}
    </span>
  );
}

const attendanceStyles: Record<AttendanceStatus, string> = {
  present: "bg-success/10 text-success",
  absent: "bg-danger/10 text-danger",
  late: "bg-warning/10 text-warning",
};

export function AttendanceBadge({ status }: { status: AttendanceStatus }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold capitalize", attendanceStyles[status])}>
      {status}
    </span>
  );
}

export function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full bg-surface-muted px-2.5 py-1 text-xs font-medium text-foreground/70", className)}>
      {children}
    </span>
  );
}

export function EmptyState({ icon, title, description, action }: { icon: React.ReactNode; title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-muted text-foreground/40">
        {icon}
      </div>
      <div>
        <p className="font-semibold text-foreground">{title}</p>
        {description && <p className="mx-auto mt-1 max-w-sm text-sm text-foreground/50">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        "w-full rounded-lg border border-border bg-background px-3.5 py-2 text-sm text-foreground outline-none ring-primary/30 transition focus:ring-2",
        props.className
      )}
    />
  );
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cn(
        "w-full rounded-lg border border-border bg-background px-3.5 py-2 text-sm text-foreground outline-none ring-primary/30 transition focus:ring-2",
        props.className
      )}
    />
  );
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={cn(
        "w-full rounded-lg border border-border bg-background px-3.5 py-2 text-sm text-foreground outline-none ring-primary/30 transition focus:ring-2",
        props.className
      )}
    />
  );
}

export function Button({
  variant = "primary",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "danger" | "ghost" }) {
  const variants = {
    primary: "brand-gradient text-primary-foreground shadow-sm shadow-accent/20 hover:opacity-90 hover:shadow-md hover:shadow-accent/30",
    secondary: "bg-surface-muted text-foreground hover:bg-border",
    danger: "bg-danger/10 text-danger hover:bg-danger/20",
    ghost: "text-foreground/70 hover:bg-surface-muted",
  };
  return (
    <button
      {...props}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-60",
        variants[variant],
        className
      )}
    />
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-skeleton rounded-lg bg-surface-muted", className)} />;
}

export function Avatar({ name, src, size = 36 }: { name: string; src?: string | null; size?: number }) {
  return (
    <AvatarPrimitive.Root
      className="inline-flex shrink-0 select-none items-center justify-center overflow-hidden rounded-full bg-primary/10 font-semibold text-primary"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {src && <AvatarPrimitive.Image src={src} alt={name} className="h-full w-full object-cover" />}
      <AvatarPrimitive.Fallback>{getInitials(name)}</AvatarPrimitive.Fallback>
    </AvatarPrimitive.Root>
  );
}

export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/40" />
        <DialogPrimitive.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-surface p-6 shadow-xl focus:outline-none">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <DialogPrimitive.Title className="text-lg font-bold text-foreground">{title}</DialogPrimitive.Title>
              {description && <DialogPrimitive.Description className="mt-1 text-sm text-foreground/50">{description}</DialogPrimitive.Description>}
            </div>
            <DialogPrimitive.Close className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-foreground/40 hover:bg-surface-muted hover:text-foreground">
              <X size={18} />
            </DialogPrimitive.Close>
          </div>
          {children}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

export const DropdownMenu = DropdownPrimitive.Root;
export const DropdownMenuTrigger = DropdownPrimitive.Trigger;

export function DropdownMenuContent({ className, ...props }: React.ComponentProps<typeof DropdownPrimitive.Content>) {
  return (
    <DropdownPrimitive.Portal>
      <DropdownPrimitive.Content
        sideOffset={8}
        className={cn(
          "z-50 min-w-[200px] rounded-xl border border-border bg-surface p-1.5 shadow-lg",
          className
        )}
        {...props}
      />
    </DropdownPrimitive.Portal>
  );
}

export function DropdownMenuItem({ className, ...props }: React.ComponentProps<typeof DropdownPrimitive.Item>) {
  return (
    <DropdownPrimitive.Item
      className={cn(
        "flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground/80 outline-none transition data-[highlighted]:bg-surface-muted data-[highlighted]:text-foreground",
        className
      )}
      {...props}
    />
  );
}

export function Tabs({ value, onValueChange, children }: { value: string; onValueChange: (v: string) => void; children: React.ReactNode }) {
  return (
    <TabsPrimitive.Root value={value} onValueChange={onValueChange}>
      {children}
    </TabsPrimitive.Root>
  );
}

export function TabsList({ children }: { children: React.ReactNode }) {
  return (
    <TabsPrimitive.List className="inline-flex items-center gap-1 rounded-xl border border-border bg-surface p-1">
      {children}
    </TabsPrimitive.List>
  );
}

export function TabsTrigger({ value, children }: { value: string; children: React.ReactNode }) {
  return (
    <TabsPrimitive.Trigger
      value={value}
      className="rounded-lg px-3.5 py-1.5 text-sm font-medium text-foreground/60 transition data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
    >
      {children}
    </TabsPrimitive.Trigger>
  );
}

export function TabsContent({ value, children }: { value: string; children: React.ReactNode }) {
  return <TabsPrimitive.Content value={value}>{children}</TabsPrimitive.Content>;
}
