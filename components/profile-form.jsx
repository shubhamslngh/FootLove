"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AtSign, LockKeyhole, Phone, Save, UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ProfileForm({ user }) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: user.name || "",
    username: user.username || "",
    phone: user.phone || "",
    pin: "",
    confirmPin: "",
  });
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    setMessage("");
    if (form.pin && form.pin !== form.confirmPin) {
      setMessage("PINs do not match");
      return;
    }

    setSaving(true);
    const response = await fetch("/api/auth/me", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        username: form.username,
        phone: form.phone,
        pin: form.pin,
      }),
    });
    const result = await response.json();
    setSaving(false);

    if (!response.ok) {
      setMessage(result?.error?.message || "Could not update profile");
      return;
    }

    setForm((current) => ({ ...current, pin: "", confirmPin: "" }));
    setMessage("Profile updated");
    router.refresh();
  }

  return (
    <form className="grid gap-4" onSubmit={submit}>
      <ProfileInput icon={UserRound} label="Full name">
        <Input
          value={form.name}
          onChange={(event) => update("name", event.target.value)}
          required
        />
      </ProfileInput>
      <ProfileInput icon={AtSign} label="Username">
        <Input
          value={form.username}
          onChange={(event) =>
            update(
              "username",
              event.target.value
                .toLowerCase()
                .replace(/[^a-z0-9_]/g, "")
                .slice(0, 20),
            )
          }
          required
        />
      </ProfileInput>
      <ProfileInput icon={Phone} label="Mobile number">
        <Input
          value={form.phone}
          onChange={(event) =>
            update(
              "phone",
              event.target.value.replace(/\D/g, "").slice(0, 10),
            )
          }
          type="tel"
          inputMode="numeric"
          required
        />
      </ProfileInput>

      <div className="grid gap-3 border-t border-border pt-4">
        <div>
          <p className="text-sm font-bold">Change login PIN</p>
          <p className="text-xs text-muted-foreground">
            Leave blank to keep your current PIN.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <ProfileInput icon={LockKeyhole} label="New 6-digit PIN">
            <PinInput
              value={form.pin}
              onChange={(value) => update("pin", value)}
            />
          </ProfileInput>
          <ProfileInput icon={LockKeyhole} label="Confirm new PIN">
            <PinInput
              value={form.confirmPin}
              onChange={(value) => update("confirmPin", value)}
            />
          </ProfileInput>
        </div>
      </div>

      {message && (
        <p className="rounded-2xl bg-secondary p-3 text-sm font-semibold">
          {message}
        </p>
      )}
      <Button disabled={saving}>
        <Save />
        {saving ? "Saving..." : "Save profile"}
      </Button>
    </form>
  );
}

function ProfileInput({ icon: Icon, label, children }) {
  return (
    <label className="grid gap-2 text-sm font-semibold">
      {label}
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <div className="[&_input]:pl-10">{children}</div>
      </div>
    </label>
  );
}

function PinInput({ value, onChange }) {
  return (
    <Input
      value={value}
      onChange={(event) =>
        onChange(event.target.value.replace(/\D/g, "").slice(0, 6))
      }
      type="password"
      inputMode="numeric"
      maxLength={6}
      placeholder="••••••"
      className="text-center tracking-[0.3em]"
      autoComplete="new-password"
    />
  );
}
