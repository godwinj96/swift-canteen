"use client";

import { FormEvent, Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not reset password");
      setSuccess(true);
      setTimeout(() => router.push("/login"), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not reset password");
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="mx-auto flex min-h-[calc(100vh-160px)] max-w-sm flex-col justify-center px-4 py-16 text-center sm:px-8">
        <p className="text-sm text-muted">
          This reset link is missing its token. Request a new one from the{" "}
          <Link href="/forgot-password" className="font-semibold text-canteen hover:underline">
            forgot password
          </Link>{" "}
          page.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-160px)] max-w-sm flex-col justify-center px-4 py-16 sm:px-8">
      <span className="text-[13px] font-semibold tracking-[0.08em] text-canteen uppercase">
        Campus canteen, online
      </span>
      <h1 className="font-display mt-3 mb-8 text-4xl tracking-tight text-ink">Set a new password</h1>

      {success ? (
        <p className="text-sm text-muted">Password updated. Redirecting you to log in...</p>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-ink">New password</label>
            <Input
              type="password"
              required
              minLength={8}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Updating..." : "Update password"}
          </Button>
        </form>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}
