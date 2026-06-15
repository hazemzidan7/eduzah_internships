"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Avatar, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui";
import { LogOut, User as UserIcon } from "lucide-react";
import type { Profile } from "@/lib/types";

export function UserMenu({ profile }: { profile: Profile }) {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 rounded-lg p-1 transition hover:bg-surface-muted">
          <Avatar name={profile.name} src={profile.avatar_url} size={32} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="px-3 py-2">
          <p className="truncate text-sm font-semibold text-foreground">{profile.name}</p>
          <p className="truncate text-xs text-foreground/50">{profile.email}</p>
        </div>
        <div className="my-1 h-px bg-border" />
        <DropdownMenuItem>
          <UserIcon size={15} /> {profile.role.charAt(0).toUpperCase() + profile.role.slice(1)} account
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={handleSignOut} className="text-danger">
          <LogOut size={15} /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
