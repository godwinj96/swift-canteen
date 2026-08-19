"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
    } finally {
      setLoading(false);
      setSubmitted(true);
    }
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-160px)] max-w-sm flex-col justify-center px-4 py-16 sm:px-8">
      <span className="text-[13px] font-semibold tracking-[0.08em] text-canteen uppercase">
        Campus canteen, online
      </span>
      <h1 className="font-display mt-3 mb-8 text-4xl tracking-tight text-ink">Reset your password</h1>

      {submitted ? (
        <p className="text-sm text-muted">
          If an account exists for that email, we&apos;ve sent a link to reset your password. Check your inbox.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-ink">Email</label>
            <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Sending..." : "Send reset link"}
          </Button>
        </form>
      )}

      <p className="mt-6 text-sm text-muted">
        <Link href="/login" className="font-semibold text-canteen hover:underline">
          Back to log in
        </Link>
      </p>
    </div>
  );
}
