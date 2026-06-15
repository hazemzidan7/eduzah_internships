import type { LucideIcon } from "lucide-react";

export function HeroBanner({
  title,
  subtitle,
  icon: Icon,
}: {
  title: string;
  subtitle: string;
  icon: LucideIcon;
}) {
  return (
    <div className="brand-gradient relative overflow-hidden rounded-2xl p-6 text-white shadow-lg shadow-accent/10 sm:p-8">
      <div className="pointer-events-none absolute inset-0 bg-black/10" />
      <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-12 right-24 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
      <div className="relative flex items-center gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15">
          <Icon size={24} />
        </div>
        <div>
          <h1 className="text-xl font-bold sm:text-2xl">{title}</h1>
          <p className="mt-0.5 text-sm text-white/80">{subtitle}</p>
        </div>
      </div>
    </div>
  );
}
