"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, Button, EmptyState } from "@/components/ui";
import { formatDateTime } from "@/lib/utils";
import { Bell, CheckCheck } from "lucide-react";
import type { Notification } from "@/lib/types";

export function NotificationList({ notifications }: { notifications: Notification[] }) {
  const router = useRouter();
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const filtered = filter === "unread" ? notifications.filter((n) => !n.read) : notifications;
  const unreadCount = notifications.filter((n) => !n.read).length;

  async function markRead(id: string) {
    const supabase = createClient();
    await supabase.from("notifications").update({ read: true }).eq("id", id);
    router.refresh();
  }

  async function markAllRead() {
    const supabase = createClient();
    const ids = notifications.filter((n) => !n.read).map((n) => n.id);
    if (ids.length === 0) return;
    await supabase.from("notifications").update({ read: true }).in("id", ids);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="inline-flex items-center gap-1 rounded-xl border border-border bg-surface p-1">
          <button
            onClick={() => setFilter("all")}
            className={`rounded-lg px-3.5 py-1.5 text-sm font-medium transition ${filter === "all" ? "bg-primary text-primary-foreground" : "text-foreground/60"}`}
          >
            All
          </button>
          <button
            onClick={() => setFilter("unread")}
            className={`rounded-lg px-3.5 py-1.5 text-sm font-medium transition ${filter === "unread" ? "bg-primary text-primary-foreground" : "text-foreground/60"}`}
          >
            Unread {unreadCount > 0 && `(${unreadCount})`}
          </button>
        </div>
        {unreadCount > 0 && (
          <Button variant="secondary" onClick={markAllRead}>
            <CheckCheck size={15} /> Mark all read
          </Button>
        )}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={<Bell size={24} />} title="No notifications" description="You're all caught up!" />
      ) : (
        <div className="space-y-2">
          {filtered.map((n) => (
            <Card key={n.id} className={n.read ? "" : "border-primary/30 bg-primary-soft/30"}>
              <Link href={n.link ?? "/notifications"} onClick={() => !n.read && markRead(n.id)} className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-foreground">{n.title}</p>
                    {!n.read && <span className="h-2 w-2 rounded-full bg-primary" />}
                  </div>
                  {n.body && <p className="mt-1 text-sm text-foreground/60">{n.body}</p>}
                </div>
                <span className="shrink-0 text-xs text-foreground/40">{formatDateTime(n.created_at)}</span>
              </Link>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
