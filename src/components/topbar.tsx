"use client";

import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageToggle } from "@/components/language-toggle";
import { GlobalSearch } from "@/components/global-search";
import { NotificationBell } from "@/components/notification-bell";
import { UserMenu } from "@/components/user-menu";
import { Logo } from "@/components/logo";
import { useDashboard } from "@/lib/dashboard-context";
import { useLanguage } from "@/lib/language-context";

interface TopbarProps {
  title: string;
  subtitle?: string;
  titleAr?: string;
  subtitleAr?: string;
}

export function Topbar({ title, subtitle, titleAr, subtitleAr }: TopbarProps) {
  const { profile, notifications } = useDashboard();
  const { language } = useLanguage();

  const displayTitle = language === "ar" && titleAr ? titleAr : title;
  const displaySubtitle = language === "ar" && subtitleAr ? subtitleAr : subtitle;

  return (
    <div className="space-y-4 border-b border-border bg-surface px-4 py-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Logo height={26} className="hidden lg:inline-flex" />
          <div className="hidden h-8 w-px bg-border lg:block" />
          <div>
            <h1 className="text-xl font-bold text-foreground sm:text-2xl">{displayTitle}</h1>
            {displaySubtitle && <p className="mt-0.5 text-sm text-foreground/60">{displaySubtitle}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <LanguageToggle />
          <ThemeToggle />
          <NotificationBell notifications={notifications} />
          <UserMenu profile={profile} />
        </div>
      </div>
      <div className="hidden sm:block">
        <GlobalSearch role={profile.role} />
      </div>
    </div>
  );
}
