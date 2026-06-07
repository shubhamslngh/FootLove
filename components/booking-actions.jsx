"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, QrCode, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createUpiLink,
  DEFAULT_UPI_ID,
  DEFAULT_UPI_PAYEE,
} from "@/lib/payment";

export function BookingActions({ match, existingBooking }) {
  const router = useRouter();
  const [slotRole, setSlotRole] = useState(match.slotRoles?.[0] || "Any role");
  const [paymentReference, setPaymentReference] = useState("");
  const [showQr, setShowQr] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const isFull = match.booked + (match.pendingCount || 0) >= match.capacity;
  const upiId = match.upiId || DEFAULT_UPI_ID;
  const payeeName = match.upiPayeeName || DEFAULT_UPI_PAYEE;
  const upiLink = createUpiLink({
    amount: match.price,
    note: `${match.title} slot`,
    upiId,
    payeeName,
  });
  const paymentHref = match.paymentLink || upiLink;
  const qrUrl =
    match.qrCodeDataUrl ||
    `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(paymentHref)}`;

  async function bookSlot() {
    setMessage("");
    setLoading(true);

    const response = await fetch(`/api/matches/${match.id}/book`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slotRole, paymentReference }),
    });

    const result = await response.json();
    setLoading(false);

    if (!response.ok) {
      setMessage(result?.error?.message || "Could not book slot");
      return;
    }

    setMessage("Payment marked. Booking is pending manager confirmation.");
    router.push("/matches");
  }

  if (existingBooking) {
    return (
      <div className="rounded-2xl bg-secondary p-3 text-sm">
        <p className="font-bold">Your booking is {existingBooking.status}</p>
        <p className="mt-1 text-muted-foreground">
          Slot: {existingBooking.slotRole}
        </p>
      </div>
    );
  }

  if (isFull) {
    return (
      <div className="rounded-2xl bg-secondary p-3 text-sm font-semibold text-muted-foreground">
        This match is full.
      </div>
    );
  }

  return (
    <div className="grid gap-3 rounded-2xl bg-secondary p-3">
      <div className="grid gap-2">
        <p className="text-sm font-bold">Book slot</p>
        <Select value={slotRole} onValueChange={setSlotRole}>
          <SelectTrigger>
            <SelectValue placeholder="Select slot" />
          </SelectTrigger>
          <SelectContent>
            {(match.slotRoles?.length ? match.slotRoles : ["Any role"]).map(
              (role) => (
                <SelectItem key={role} value={role}>
                  {role}
                </SelectItem>
              ),
            )}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button asChild size="sm">
          <a href={paymentHref}>
            <CreditCard /> Pay UPI
          </a>
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => setShowQr((current) => !current)}>
          <QrCode /> QR
        </Button>
      </div>
      <Input
        value={paymentReference}
        onChange={(event) => setPaymentReference(event.target.value)}
        placeholder="UPI reference ID"
      />
      <Button
        type="button"
        size="sm"
        variant="secondary"
        disabled={loading}
        onClick={bookSlot}>
        <Send /> {loading ? "Submitting..." : "Mark paid"}
      </Button>
      {showQr && (
        <div className="grid justify-items-start gap-2">
          <img
            className="rounded-2xl bg-white p-2 shadow-[0_8px_22px_rgba(17,24,39,0.08)] ring-1 ring-border"
            src={qrUrl}
            alt="UPI payment QR code"
            width="180"
            height="180"
          />
          <p className="text-xs text-muted-foreground">UPI ID: {upiId}</p>
        </div>
      )}
      {message && (
        <p className="text-sm font-semibold text-muted-foreground">{message}</p>
      )}
    </div>
  );
}
