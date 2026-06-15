"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuItem } from "@/components/ui";
import { formatDateTime } from "@/lib/utils";
import { Bell } from "lucide-react";
import type { Notification } from "@/lib/types";

export function NotificationBell({ notifications }: { notifications: Notification[] }) {
  const router = useRouter();
  const unread = notifications.filter((n) => !n.read).length;

  async function handleOpen(n: Notification) {
    if (!n.read) {
      const supabase = createClient();
      await supabase.from("notifications").update({ read: true }).eq("id", n.id);
      router.refresh();
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface text-foreground/70 transition hover:text-foreground" aria-label="Notifications">
          <Bell size={17} />
          {unread > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">
              {unread}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="px-2 py-1.5 text-xs font-semibold uppercase text-foreground/40">Notifications</div>
        {notifications.length === 0 ? (
          <p className="px-3 py-6 text-center text-sm text-foreground/50">You&apos;re all caught up.</p>
        ) : (
          notifications.slice(0, 6).map((n) => (
            <DropdownMenuItem key={n.id} asChild onSelect={() => handleOpen(n)}>
              <Link href={n.link ?? "/notifications"} className="flex flex-col items-start gap-0.5 !py-2.5">
                <div className="flex w-full items-center justify-between gap-2">
                  <p className="text-sm font-medium text-foreground">{n.title}</p>
                  {!n.read && <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />}
                </div>
                {n.body && <p className="line-clamp-2 text-xs text-foreground/50">{n.body}</p>}
                <p className="text-[11px] text-foreground/35">{formatDateTime(n.created_at)}</p>
              </Link>
            </DropdownMenuItem>
          ))
        )}
        <DropdownMenuItem asChild>
          <Link href="/notifications" className="justify-center text-sm font-semibold text-primary">
            View all
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
