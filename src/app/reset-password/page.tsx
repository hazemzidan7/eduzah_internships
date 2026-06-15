"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "@/components/logo";
import { Loader2, Eye, EyeOff } from "lucide-react";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4">
      <div className="brand-gradient pointer-events-none absolute -left-32 -top-32 h-80 w-80 rounded-full opacity-20 blur-3xl" />
      <div className="brand-gradient pointer-events-none absolute -bottom-32 -right-32 h-80 w-80 rounded-full opacity-20 blur-3xl" />

      <div className="relative w-full max-w-md animate-fade-in-up">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <Logo height={48} />
          <div>
            <h1 className="text-2xl font-bold text-foreground">Set a new password</h1>
            <p className="text-sm text-foreground/60">Choose a strong password for your account.</p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-2xl border border-border bg-surface p-6 shadow-xl shadow-primary/5 sm:p-8"
        >
          <div className="space-y-1.5">
            <label htmlFor="password" className="text-sm font-medium text-foreground">
              New password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 pr-10 text-sm text-foreground outline-none ring-primary/30 transition focus:ring-2"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-foreground/40 hover:text-foreground/70"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="confirm" className="text-sm font-medium text-foreground">
              Confirm password
            </label>
            <input
              id="confirm"
              type={showPassword ? "text" : "password"}
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm text-foreground outline-none ring-primary/30 transition focus:ring-2"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="brand-gradient flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-md shadow-accent/20 transition hover:opacity-90 hover:shadow-lg hover:shadow-accent/30 disabled:opacity-60"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            Update password
          </button>
        </form>
      </div>
    </div>
  );
}
