"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Login failed");
      router.push("/menu");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-[calc(100vh-160px)] grid-cols-1 lg:grid-cols-2">
      <div className="flex items-center justify-center px-4 sm:px-8 py-16">
        <div className="w-full max-w-sm">
          <span className="text-[13px] font-semibold tracking-[0.08em] text-canteen uppercase">
            Campus canteen, online
          </span>
          <h1 className="font-display mt-3 mb-8 text-5xl tracking-tight text-ink">Welcome back</h1>
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-ink">Email</label>
              <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-ink">Password</label>
              <Input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Logging in..." : "Log in"}
            </Button>
          </form>
          <p className="mt-6 text-sm text-muted">
            No account?{" "}
            <Link href="/register" className="font-semibold text-canteen hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
      <div className="relative hidden bg-canteen-light lg:block">
        <Image
          src="https://loremflickr.com/900/1200/curry"
          alt="A warm, steaming meal"
          fill
          className="object-cover"
          priority
        />
      </div>
    </div>
  );
}
