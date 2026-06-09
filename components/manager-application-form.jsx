"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, CreditCard, QrCode, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createPaymentQr } from "@/lib/payment";

export function ManagerApplicationForm({ status }) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(status === "rejected");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function submitApplication(event) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const formData = new FormData(event.currentTarget);
    const upiId = String(formData.get("upiId") || "");
    const payeeName = String(formData.get("payeeName") || "");
    const paymentQrDataUrl = await createPaymentQr({ upiId, payeeName });
    const response = await fetch("/api/manager-applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        upiId,
        payeeName,
        paymentQrDataUrl,
      }),
    });
    const result = await response.json();
    setLoading(false);

    if (!response.ok) {
      setMessage(result?.error?.message || "Could not submit application");
      return;
    }

    setMessage("Application submitted for admin approval.");
    router.refresh();
  }

  if (status === "pending") {
    return (
      <div className="text-xs text-muted-foreground">
        Manager application pending admin review.
      </div>
    );
  }

  if (!expanded) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground transition hover:text-foreground">
        Interested in hosting matches?
        <ChevronDown className="size-3.5" />
      </button>
    );
  }

  return (
    <form
      className="grid gap-3 rounded-2xl bg-secondary p-4"
      onSubmit={submitApplication}>
      <div>
        <p className="font-bold">
          {status === "rejected" ? "Resubmit application" : "Become a manager"}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Submit your payment method for admin verification.
        </p>
      </div>
      <label className="grid gap-2 text-sm font-semibold">
        UPI ID
        <div className="relative">
          <CreditCard className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input name="upiId" className="pl-10" placeholder="player@upi" required />
        </div>
      </label>
      <label className="grid gap-2 text-sm font-semibold">
        Payee name
        <Input name="payeeName" placeholder="Name shown during payment" required />
      </label>
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <QrCode className="size-4" /> Your payment QR will be generated automatically.
      </p>
      <Button disabled={loading}>
        <Send /> {loading ? "Submitting..." : "Submit for approval"}
      </Button>
      {message && (
        <p className="text-sm font-semibold text-muted-foreground">{message}</p>
      )}
    </form>
  );
}
