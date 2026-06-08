"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LockKeyhole, Phone } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function LoginForm() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function login(event) {
    event.preventDefault();
    setError("");
    if (!/^[6-9]\d{9}$/.test(phone)) {
      setError("Enter a valid 10-digit Indian mobile number");
      return;
    }
    if (!/^\d{6}$/.test(pin)) {
      setError("Enter your 6-digit PIN");
      return;
    }
    setLoading(true);

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, pin }),
    });
    const result = await response.json();
    setLoading(false);

    if (!response.ok) {
      setError(result?.error?.message || "Login failed");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form className="space-y-4" onSubmit={login}>
      <label className="grid gap-2 text-sm font-semibold">
        Mobile number
        <div className="relative">
          <Phone className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={phone}
            onChange={(event) =>
              setPhone(event.target.value.replace(/\D/g, "").slice(0, 10))
            }
            className="pl-10"
            type="tel"
            inputMode="numeric"
            placeholder="9876543210"
            autoComplete="tel"
            autoFocus
            required
          />
        </div>
      </label>
      <label className="grid gap-2 text-sm font-semibold">
        6-digit PIN
        <div className="relative">
          <LockKeyhole className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={pin}
            onChange={(event) =>
              setPin(event.target.value.replace(/\D/g, "").slice(0, 6))
            }
            className="pl-10 text-center text-lg tracking-[0.35em]"
            type="password"
            inputMode="numeric"
            maxLength={6}
            placeholder="••••••"
            autoComplete="current-password"
            required
          />
        </div>
      </label>
      {error && (
        <p className="rounded-2xl bg-red-50 p-3 text-sm font-semibold text-red-700">
          {error}
        </p>
      )}
      <Button
        className="w-full"
        disabled={loading || phone.length !== 10 || pin.length !== 6}>
        {loading ? "Signing in..." : "Login"}
      </Button>
    </form>
  );
}
