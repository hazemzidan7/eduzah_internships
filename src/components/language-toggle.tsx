"use client";

import { useLanguage } from "@/lib/language-context";

export function LanguageToggle() {
  const { language, setLanguage } = useLanguage();

  return (
    <button
      onClick={() => setLanguage(language === "en" ? "ar" : "en")}
      className="flex h-9 w-auto min-w-[36px] items-center justify-center rounded-lg border border-border bg-surface px-2 text-sm font-semibold text-foreground/70 transition hover:text-foreground"
      aria-label="Toggle language"
    >
      {language === "en" ? "ع" : "EN"}
    </button>
  );
}
