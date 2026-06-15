import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/sidebar";
import { DashboardProvider } from "@/lib/dashboard-context";
import type { Profile } from "@/lib/types";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (!profile) redirect("/login");

  const { data: notifications } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <DashboardProvider profile={profile as Profile} notifications={notifications ?? []}>
      <div className="flex min-h-screen flex-col lg:flex-row">
        <Sidebar role={(profile as Profile).role} />
        <main className="flex-1 overflow-x-hidden">{children}</main>
      </div>
    </DashboardProvider>
  );
}
