"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase-client";
import PasswordField from "../_components/PasswordField";
import { clearMustChangePassword } from "../team/actions";

export default function ChangePasswordForm({ forced }: { forced: boolean }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formEl = e.currentTarget; // capture before any await (React clears currentTarget)
    const form = new FormData(formEl);
    const password = String(form.get("password") ?? "");
    const confirm = String(form.get("confirm") ?? "");
    setError(null);

    if (password.length < 8) return setError("Password must be at least 8 characters.");
    if (password !== confirm) return setError("The two passwords don't match.");

    setLoading(true);
    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      if (forced) {
        const result = await clearMustChangePassword();
        if (result.error) throw new Error(result.error);
      }
      setDone(true);
      formEl.reset();
      if (forced) {
        router.replace("/admin");
        router.refresh();
      }
    } catch (err) {
      console.error("[change password]", err);
      setError(err instanceof Error ? err.message : "Could not change password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-4 p-5 sm:p-6">
      <h2 className="font-semibold text-gray-900">{forced ? "Choose your password" : "Change password"}</h2>
      {error && (
        <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200">
          {error}
        </p>
      )}
      {done && !forced && (
        <p role="status" className="flex items-center gap-2 rounded-xl bg-brand-50 px-4 py-3 text-sm text-brand-800 ring-1 ring-brand-200">
          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
          Password changed.
        </p>
      )}
      <PasswordField id="new-password" name="password" label="New password" />
      <PasswordField id="confirm-password" name="confirm" label="Confirm new password" />
      <button type="submit" disabled={loading} className="btn-primary">
        {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
        {loading ? "Saving…" : "Save password"}
      </button>
    </form>
  );
}
