"use client";

import { useState } from "react";
import { Dialog, Input, Button } from "@/components/ui";
import { createUserAccount } from "@/lib/actions/users";
import { Loader2, Copy, Check } from "lucide-react";
import type { UserRole } from "@/lib/types";

export function CreateUserDialog({
  open,
  onOpenChange,
  role,
  label,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role: UserRole;
  label: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [credentials, setCredentials] = useState<{ email: string; password: string } | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    formData.set("role", role);

    const result = await createUserAccount(formData);
    setLoading(false);

    if (!result.success) {
      setError(result.error ?? "Something went wrong.");
      return;
    }

    setCredentials({ email: result.email!, password: result.password! });
  }

  function handleClose(open: boolean) {
    if (!open) {
      setCredentials(null);
      setError(null);
      setCopied(false);
    }
    onOpenChange(open);
  }

  function copyCredentials() {
    if (!credentials) return;
    navigator.clipboard.writeText(`Email: ${credentials.email}\nPassword: ${credentials.password}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Dialog open={open} onOpenChange={handleClose} title={`Add ${label}`} description={`Create a new ${label.toLowerCase()} account with auto-generated credentials.`}>
      {credentials ? (
        <div className="space-y-3">
          <p className="text-sm text-foreground/70">Share these credentials securely. They will not be shown again.</p>
          <div className="space-y-2 rounded-xl border border-border bg-surface-muted p-3 text-sm">
            <p><span className="font-medium text-foreground">Email:</span> {credentials.email}</p>
            <p><span className="font-medium text-foreground">Password:</span> {credentials.password}</p>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={copyCredentials}>
              {copied ? <Check size={15} /> : <Copy size={15} />} {copied ? "Copied" : "Copy"}
            </Button>
            <Button onClick={() => handleClose(false)}>Done</Button>
          </div>
        </div>
      ) : (
        <form action={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Full name</label>
            <Input name="name" required placeholder="e.g. Sara Ahmed" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Email</label>
            <Input name="email" type="email" required placeholder="name@eduzah.com" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Phone (optional)</label>
            <Input name="phone" placeholder="+20 1XX XXX XXXX" />
          </div>
          {error && <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 size={16} className="animate-spin" />}
              Create Account
            </Button>
          </div>
        </form>
      )}
    </Dialog>
  );
}
