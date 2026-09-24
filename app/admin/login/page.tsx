"use client";

import { useState, type FormEvent } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Loader2, Lock } from "lucide-react";
import { createClient } from "@/lib/supabase-client";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) {
        setError("Incorrect email or password.");
        setLoading(false);
        return;
      }
      router.replace("/admin");
      router.refresh();
    } catch (err) {
      console.error("[admin login]", err);
      setError("Couldn't reach the server. Check your connection and try again.");
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-950 via-brand-900 to-brand-700 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <span className="rounded-2xl bg-white px-5 py-3 shadow-lg">
            <Image src="/images/logo.png" alt="Friends Pharmacy" width={172} height={70} priority />
          </span>
          <h1 className="mt-4 text-lg font-semibold text-white">Admin Portal</h1>
        </div>

        <div className="rounded-2xl bg-white p-7 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            )}

            <div>
              <label htmlFor="email" className="label">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
              />
            </div>

            <div>
              <label htmlFor="password" className="label">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
              />
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Lock className="h-4 w-4" aria-hidden="true" />
              )}
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>

        <p className="mt-5 text-center text-xs text-brand-200">
          Admin accounts are managed in Supabase (Authentication → Users).
        </p>
      </div>
    </div>
  );
}
