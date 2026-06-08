"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  AtSign,
  CreditCard,
  LockKeyhole,
  Phone,
  QrCode,
  User,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function SignupForm() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState("player");
  const [paymentQrDataUrl, setPaymentQrDataUrl] = useState("");
  const [availability, setAvailability] = useState({
    username: "idle",
    phone: "idle",
  });
  const [form, setForm] = useState({
    name: "",
    username: "",
    phone: "",
    pin: "",
    confirmPin: "",
    upiId: "",
    upiPayeeName: "",
  });
  const totalSteps = role === "manager" ? 4 : 3;

  useEffect(() => {
    if (!/^[a-z0-9_]{3,20}$/.test(form.username)) {
      setAvailability((current) => ({ ...current, username: "idle" }));
      return;
    }
    setAvailability((current) => ({ ...current, username: "checking" }));
    const timeout = setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/auth/availability?username=${encodeURIComponent(form.username)}`,
        );
        const result = await response.json();
        setAvailability((current) => ({
          ...current,
          username: result?.data?.available ? "available" : "taken",
        }));
      } catch {
        setAvailability((current) => ({ ...current, username: "error" }));
      }
    }, 400);
    return () => clearTimeout(timeout);
  }, [form.username]);

  useEffect(() => {
    if (!/^[6-9]\d{9}$/.test(form.phone)) {
      setAvailability((current) => ({ ...current, phone: "idle" }));
      return;
    }
    setAvailability((current) => ({ ...current, phone: "checking" }));
    const timeout = setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/auth/availability?phone=${encodeURIComponent(form.phone)}`,
        );
        const result = await response.json();
        setAvailability((current) => ({
          ...current,
          phone: result?.data?.available ? "available" : "taken",
        }));
      } catch {
        setAvailability((current) => ({ ...current, phone: "error" }));
      }
    }, 400);
    return () => clearTimeout(timeout);
  }, [form.phone]);

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function nextStep() {
    setError("");
    if (step === 1) {
      if (!form.name.trim()) return setError("Enter your full name");
      if (!/^[a-z0-9_]{3,20}$/.test(form.username)) {
        return setError("Username must use 3-20 lowercase letters, numbers, or underscores");
      }
      if (availability.username !== "available") {
        return setError("Choose an available username");
      }
    }
    if (step === 2) {
      if (!/^[6-9]\d{9}$/.test(form.phone)) {
        return setError("Enter a valid 10-digit Indian mobile number");
      }
      if (availability.phone !== "available") {
        return setError("Use a mobile number that is not already registered");
      }
    }
    if (step === 3) {
      if (!/^\d{6}$/.test(form.pin)) return setError("Create a 6-digit PIN");
      if (form.pin !== form.confirmPin) return setError("PINs do not match");
    }
    setStep((current) => current + 1);
  }

  function uploadPaymentQr(event) {
    const file = event.target.files?.[0];
    if (!file) return setPaymentQrDataUrl("");
    const reader = new FileReader();
    reader.onload = () => setPaymentQrDataUrl(String(reader.result || ""));
    reader.readAsDataURL(file);
  }

  async function submit() {
    setError("");
    if (
      role === "manager" &&
      (!form.upiId || !form.upiPayeeName || !paymentQrDataUrl)
    ) {
      setError("Add your UPI ID, payee name, and payment QR code");
      return;
    }
    setLoading(true);
    const response = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        role,
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
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-xs font-semibold">
        <span className="rounded-full bg-primary px-3 py-1 text-primary-foreground">
          {step} of {totalSteps}
        </span>
        <span className="text-muted-foreground">
          {["Your profile", "Mobile and account", "Create your PIN", "Host payment setup"][step - 1]}
        </span>
      </div>

      {step === 1 && (
        <div className="space-y-4">
          <IconInput icon={User} label="Full name">
            <Input value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="Alex Player" autoFocus />
          </IconInput>
          <IconInput icon={AtSign} label="Choose a username">
            <Input value={form.username} onChange={(e) => update("username", e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 20))} placeholder="alex_player" />
          </IconInput>
          <AvailabilityStatus
            status={availability.username}
            availableText="Username is available"
            takenText="Username is already taken"
          />
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <IconInput icon={Phone} label="Mobile number">
            <Input value={form.phone} onChange={(e) => update("phone", e.target.value.replace(/\D/g, "").slice(0, 10))} type="tel" inputMode="numeric" placeholder="9876543210" autoFocus />
          </IconInput>
          <AvailabilityStatus
            status={availability.phone}
            availableText="Mobile number is available"
            takenText="An account already uses this mobile number"
          />
          <label className="grid gap-2 text-sm font-semibold">
            I want to
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="player">Book and play matches</SelectItem>
                <SelectItem value="manager">Host and manage matches</SelectItem>
              </SelectContent>
            </Select>
          </label>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <p className="rounded-2xl bg-secondary p-3 text-sm text-muted-foreground">
            Choose a PIN you can remember. You will use it with your mobile number to log in.
          </p>
          <PinInput label="Create 6-digit PIN" value={form.pin} onChange={(value) => update("pin", value)} />
          <PinInput label="Confirm PIN" value={form.confirmPin} onChange={(value) => update("confirmPin", value)} />
        </div>
      )}

      {step === 4 && (
        <div className="space-y-4">
          <p className="rounded-2xl bg-secondary p-3 text-sm text-muted-foreground">
            Admin approval is required before you can host matches.
          </p>
          <IconInput icon={CreditCard} label="UPI ID">
            <Input value={form.upiId} onChange={(e) => update("upiId", e.target.value)} placeholder="manager@upi" />
          </IconInput>
          <label className="grid gap-2 text-sm font-semibold">
            Payee name
            <Input value={form.upiPayeeName} onChange={(e) => update("upiPayeeName", e.target.value)} placeholder="Name shown during payment" />
          </label>
          <label className="grid gap-2 text-sm font-semibold">
            Payment QR code
            <Input type="file" accept="image/*" onChange={uploadPaymentQr} />
          </label>
          {paymentQrDataUrl && (
            <div className="flex items-center gap-3 text-sm font-semibold text-muted-foreground">
              <img className="size-16 rounded-2xl bg-white object-contain p-1 ring-1 ring-border" src={paymentQrDataUrl} alt="Payment QR preview" />
              <span className="flex items-center gap-2"><QrCode className="size-4" /> QR ready</span>
            </div>
          )}
        </div>
      )}

      {error && <p className="rounded-2xl bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}
      <div className={`grid gap-2 ${step > 1 ? "grid-cols-[auto_1fr]" : ""}`}>
        {step > 1 && (
          <Button type="button" variant="outline" onClick={() => { setStep((current) => current - 1); setError(""); }}>
            <ArrowLeft />
          </Button>
        )}
        {step < totalSteps ? (
          <Button type="button" onClick={nextStep}>Continue</Button>
        ) : (
          <Button type="button" disabled={loading} onClick={submit}>
            {loading ? "Creating account..." : "Create account"}
          </Button>
        )}
      </div>
    </div>
  );
}

function IconInput({ icon: Icon, label, children }) {
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

function PinInput({ label, value, onChange }) {
  return (
    <IconInput icon={LockKeyhole} label={label}>
      <Input value={value} onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 6))} type="password" inputMode="numeric" maxLength={6} className="text-center text-lg tracking-[0.35em]" placeholder="••••••" autoComplete="new-password" />
    </IconInput>
  );
}

function AvailabilityStatus({ status, availableText, takenText }) {
  if (status === "idle") return null;
  const text =
    status === "checking"
      ? "Checking availability..."
      : status === "available"
        ? availableText
        : status === "taken"
          ? takenText
          : "Could not check availability. Try again.";
  return (
    <p
      className={`-mt-2 text-xs font-semibold ${
        status === "available"
          ? "text-emerald-600 dark:text-emerald-400"
          : status === "taken"
            ? "text-red-600 dark:text-red-400"
            : "text-muted-foreground"
      }`}>
      {text}
    </p>
  );
}
