import { createClient } from "@/lib/supabase/server";
import { Topbar } from "@/components/topbar";
import { NotificationList } from "@/components/notifications/notification-list";
import type { Notification } from "@/lib/types";

export default async function NotificationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: notifications } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div>
      <Topbar title="Notifications" subtitle="Stay up to date with your courses" />
      <div className="p-4 sm:p-6 lg:p-8">
        <NotificationList notifications={(notifications ?? []) as Notification[]} />
      </div>
    </div>
  );
}
