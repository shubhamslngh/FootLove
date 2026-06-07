"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AtSign, CreditCard, LockKeyhole, Phone, QrCode, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function SignupForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState("player");
  const [paymentQrDataUrl, setPaymentQrDataUrl] = useState("");

  function uploadPaymentQr(event) {
    const file = event.target.files?.[0];
    if (!file) {
      setPaymentQrDataUrl("");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => setPaymentQrDataUrl(String(reader.result || ""));
    reader.readAsDataURL(file);
  }

  async function onSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const response = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: formData.get("name"),
        username: formData.get("username"),
        phone: formData.get("phone"),
        password: formData.get("password"),
        role,
        upiId: formData.get("upiId"),
        upiPayeeName: formData.get("upiPayeeName"),
        paymentQrDataUrl,
      }),
    });

    const result = await response.json();
    setLoading(false);

    if (!response.ok) {
      setError(result?.error?.message || "Signup failed");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <label className="grid gap-2 text-sm font-semibold">
        Full name
        <div className="relative">
          <User className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input name="name" className="pl-10" placeholder="Alex Player" autoComplete="name" required />
        </div>
      </label>
      <label className="grid gap-2 text-sm font-semibold">
        Username
        <div className="relative">
          <AtSign className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            name="username"
            className="pl-10"
            placeholder="alex_player"
            autoComplete="username"
            minLength={3}
            maxLength={20}
            pattern="[a-z0-9_]{3,20}"
            title="Use 3-20 lowercase letters, numbers, or underscores"
            required
          />
        </div>
        <span className="text-xs font-normal text-muted-foreground">
          Unique, 3-20 characters. Use lowercase letters, numbers, or underscores.
        </span>
      </label>
      <label className="grid gap-2 text-sm font-semibold">
        Phone number
        <div className="relative">
          <Phone className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input name="phone" className="pl-10" type="tel" inputMode="numeric" pattern="[6-9][0-9]{9}" maxLength={10} placeholder="9876543210" autoComplete="tel" required />
        </div>
      </label>
      <label className="grid gap-2 text-sm font-semibold">
        Password
        <div className="relative">
          <LockKeyhole className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input name="password" className="pl-10" type="password" placeholder="At least 8 characters" autoComplete="new-password" minLength={8} required />
        </div>
      </label>
      <label className="grid gap-2 text-sm font-semibold">
        Account type
        <Select value={role} onValueChange={setRole}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="player">Player</SelectItem>
            <SelectItem value="manager">Manager</SelectItem>
          </SelectContent>
        </Select>
      </label>
      {role === "manager" && (
        <div className="grid gap-4 rounded-2xl bg-secondary p-3">
          <div>
            <p className="text-sm font-bold">Host payment verification</p>
            <p className="mt-1 text-xs text-muted-foreground">
              An admin must approve these details before you can host matches.
            </p>
          </div>
          <label className="grid gap-2 text-sm font-semibold">
            UPI ID
            <div className="relative">
              <CreditCard className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                name="upiId"
                className="pl-10"
                placeholder="manager@upi"
                required
              />
            </div>
          </label>
          <label className="grid gap-2 text-sm font-semibold">
            Payee name
            <Input
              name="upiPayeeName"
              placeholder="Name shown during payment"
              required
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold">
            Payment QR code
            <Input
              type="file"
              accept="image/*"
              onChange={uploadPaymentQr}
              required
            />
          </label>
          {paymentQrDataUrl && (
            <div className="flex items-center gap-3 text-sm font-semibold text-muted-foreground">
              <img
                className="size-16 rounded-2xl bg-white object-contain p-1 ring-1 ring-border"
                src={paymentQrDataUrl}
                alt="Payment QR preview"
              />
              <span className="flex items-center gap-2">
                <QrCode className="size-4" /> QR ready for review
              </span>
            </div>
          )}
        </div>
      )}
      {error && <p className="rounded-2xl bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}
      <Button className="w-full" disabled={loading}>
        {loading ? "Creating account..." : `Create ${role} account`}
      </Button>
    </form>
  );
}
