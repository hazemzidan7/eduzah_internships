"use client";

import { createContext, useContext } from "react";
import type { Notification, Profile } from "./types";

interface DashboardContextValue {
  profile: Profile;
  notifications: Notification[];
}

const DashboardContext = createContext<DashboardContextValue | null>(null);

export function DashboardProvider({
  profile,
  notifications,
  children,
}: DashboardContextValue & { children: React.ReactNode }) {
  return <DashboardContext.Provider value={{ profile, notifications }}>{children}</DashboardContext.Provider>;
}

export function useDashboard() {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error("useDashboard must be used within a DashboardProvider");
  return ctx;
}
