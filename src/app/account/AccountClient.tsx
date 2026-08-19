"use client";

import { FormEvent, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";

export function AccountClient({
  initialFullName,
  email,
  initialPhone,
}: {
  initialFullName: string;
  email: string;
  initialPhone: string;
}) {
  const [fullName, setFullName] = useState(initialFullName);
  const [phone, setPhone] = useState(initialPhone);
  const [savingProfile, setSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  async function handleSaveProfile(e: FormEvent) {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await fetch("/api/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, phone: phone || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not update profile");
      toast.success("Profile updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update profile");
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleChangePassword(e: FormEvent) {
    e.preventDefault();
    setChangingPassword(true);
    try {
      const res = await fetch("/api/account/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not change password");
      toast.success("Password changed");
      setCurrentPassword("");
      setNewPassword("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not change password");
    } finally {
      setChangingPassword(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-8">
      <span className="text-[13px] font-semibold tracking-[0.08em] text-canteen uppercase">
        Your account
      </span>
      <h1 className="font-display mt-2 mb-8 text-4xl tracking-tight text-ink">Account settings</h1>

      <div className="flex flex-col gap-6">
        <Card>
          <h2 className="mb-4 font-semibold text-ink">Profile</h2>
          <form onSubmit={handleSaveProfile} className="flex flex-col gap-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-ink">Full name</label>
              <Input required value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-ink">Email</label>
              <Input value={email} disabled className="opacity-60" />
              <p className="mt-1 text-xs text-muted">Email changes aren&apos;t supported yet.</p>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-ink">Phone</label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <Button type="submit" disabled={savingProfile} className="self-start">
              {savingProfile ? "Saving..." : "Save changes"}
            </Button>
          </form>
        </Card>

        <Card>
          <h2 className="mb-4 font-semibold text-ink">Change password</h2>
          <form onSubmit={handleChangePassword} className="flex flex-col gap-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-ink">Current password</label>
              <Input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>
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
            <Button type="submit" disabled={changingPassword} className="self-start">
              {changingPassword ? "Updating..." : "Change password"}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
