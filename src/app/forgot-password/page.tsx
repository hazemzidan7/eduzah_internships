"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "@/components/logo";
import { Loader2, ArrowLeft } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (resetError) {
      setError(resetError.message);
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4">
      <div className="brand-gradient pointer-events-none absolute -left-32 -top-32 h-80 w-80 rounded-full opacity-20 blur-3xl" />
      <div className="brand-gradient pointer-events-none absolute -bottom-32 -right-32 h-80 w-80 rounded-full opacity-20 blur-3xl" />

      <div className="relative w-full max-w-md animate-fade-in-up">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <Logo height={48} />
          <div>
            <h1 className="text-2xl font-bold text-foreground">Reset your password</h1>
            <p className="text-sm text-foreground/60">
              Enter your email and we&apos;ll send you a reset link.
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-6 shadow-xl shadow-primary/5 sm:p-8">
          {sent ? (
            <p className="rounded-lg bg-success/10 px-3 py-2 text-sm text-success">
              Check your inbox for a password reset link.
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="email" className="text-sm font-medium text-foreground">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@eduzah.com"
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
                Send reset link
              </button>
            </form>
          )}
        </div>

        <Link
          href="/login"
          className="mt-6 flex items-center justify-center gap-1.5 text-center text-sm font-medium text-primary hover:underline"
        >
          <ArrowLeft size={14} /> Back to sign in
        </Link>
      </div>
    </div>
  );
}
