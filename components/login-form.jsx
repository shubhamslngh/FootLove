"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LockKeyhole, Phone } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phone: formData.get("phone"),
        password: formData.get("password"),
      }),
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
    <form className="space-y-4" onSubmit={onSubmit}>
      <label className="grid gap-2 text-sm font-semibold">
        Phone number
        <div className="relative">
          <Phone className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input name="phone" className="pl-10" type="tel" inputMode="numeric" pattern="[6-9][0-9]{9}" maxLength={10} placeholder="9876543210" required />
        </div>
      </label>
      <label className="grid gap-2 text-sm font-semibold">
        Password
        <div className="relative">
          <LockKeyhole className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input name="password" className="pl-10" type="password" placeholder="Password" required />
        </div>
      </label>
      {error && <p className="rounded-2xl bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}
      <Button className="w-full" disabled={loading}>
        {loading ? "Signing in..." : "Continue"}
      </Button>
    </form>
  );
}
