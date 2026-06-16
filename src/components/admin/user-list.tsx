"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Button, Input, Avatar, EmptyState } from "@/components/ui";
import { CreateUserDialog } from "@/components/admin/create-user-dialog";
import { deleteUserAccount } from "@/lib/actions/users";
import { useLanguage } from "@/lib/language-context";
import { translations } from "@/lib/translations";
import { Search, Plus, Users as UsersIcon } from "lucide-react";
import type { Profile, UserRole } from "@/lib/types";

export function UserList({
  users,
  role,
  label,
  profilePathBase,
  metaMap,
}: {
  users: Profile[];
  role: UserRole;
  label: string;
  profilePathBase: string;
  metaMap?: Record<string, string>;
}) {
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const { language } = useLanguage();
  const tr = translations[language].userList;

  const filtered = useMemo(
    () => users.filter((u) => u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())),
    [users, search]
  );

  const labelAr = role === "instructor"
    ? translations[language].nav.instructors
    : role === "student"
    ? translations[language].nav.students
    : label;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 sm:max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" />
          <Input placeholder={`${tr.search} ${labelAr}...`} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Button onClick={() => setCreateOpen(true)}><Plus size={16} /> {tr.add} {labelAr}</Button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={<UsersIcon size={24} />} title={`${tr.noFound} ${labelAr}`} description={tr.trySearch} />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-surface">
          <table className="w-full text-sm">
            <thead className="bg-surface-muted text-left text-xs uppercase text-foreground/50">
              <tr>
                <th className="px-4 py-3 font-medium">{tr.name}</th>
                <th className="px-4 py-3 font-medium">{tr.email}</th>
                <th className="px-4 py-3 font-medium">{tr.phone}</th>
                {metaMap && <th className="px-4 py-3 font-medium">{tr.courses}</th>}
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((u) => (
                <tr key={u.id}>
                  <td className="px-4 py-3">
                    <Link href={`${profilePathBase}/${u.id}`} className="flex items-center gap-2 font-medium text-foreground hover:text-primary">
                      <Avatar name={u.name} src={u.avatar_url} size={28} />
                      {u.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-foreground/70">{u.email}</td>
                  <td className="px-4 py-3 text-foreground/50">{u.phone ?? "—"}</td>
                  {metaMap && <td className="px-4 py-3 text-foreground/70">{metaMap[u.id] ?? "0"}</td>}
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => {
                        if (confirm(`${tr.removeConfirm} ${u.name}${tr.removeConfirmSuffix}`)) deleteUserAccount(u.id, role);
                      }}
                      className="text-xs font-medium text-danger hover:underline"
                    >
                      {tr.remove}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <CreateUserDialog open={createOpen} onOpenChange={setCreateOpen} role={role} label={label} />
    </div>
  );
}
