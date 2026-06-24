"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Maximize2, Send, Ticket, X } from "lucide-react";

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

export function BookingActions({
  match,
  existingBooking,
  isAuthenticated = true,
}) {
  const router = useRouter();
  const [step, setStep] = useState("start");
  const [slotRole, setSlotRole] = useState(match.slotRoles?.[0] || "Any role");
  const [paymentReference, setPaymentReference] = useState("");
  const [guestName, setGuestName] = useState("");
  const [qrExpanded, setQrExpanded] = useState(false);
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

  useEffect(() => {
    if (!qrExpanded) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setQrExpanded(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [qrExpanded]);

  async function bookSlot() {
    setMessage("");
    setLoading(true);

    const response = await fetch(`/api/matches/${match.id}/book`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slotRole, paymentReference, guestName }),
    });

    const result = await response.json();
    setLoading(false);

    if (!response.ok) {
      setMessage(result?.error?.message || "Could not book slot");
      return;
    }

    setMessage("Payment marked. Booking is pending manager confirmation.");
    if (isAuthenticated) {
      router.push("/matches");
    } else {
      setStep("complete");
    }
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

  if (step === "start") {
    if (!isAuthenticated) {
      return (
        <div className="grid gap-2 rounded-2xl bg-secondary p-3">
          <p className="text-sm font-bold">How would you like to book?</p>
          <p className="text-xs text-muted-foreground">
            Continue without an account or log in to track your booking.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep("slot")}>
              Continue as guest
            </Button>
            <Button
              type="button"
              onClick={() =>
                router.push(
                  `/login?next=${encodeURIComponent(`/matches/${match.id}`)}`,
                )
              }>
              Login
            </Button>
          </div>
        </div>
      );
    }

    return (
      <Button
        type="button"
        className="w-full"
        onClick={() => setStep("slot")}>
        <Ticket />
        Book slot
      </Button>
    );
  }

  if (step === "complete") {
    return (
      <div className="rounded-2xl bg-secondary p-3 text-sm font-semibold">
        Booking submitted. The host will verify your payment.
      </div>
    );
  }

  return (
    <div className="grid gap-3 rounded-2xl bg-secondary p-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold">
            {step === "slot" ? "1. Choose your slot" : "2. Complete payment"}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {step === "slot"
              ? "Select the role you want to play."
              : `Pay ₹${match.price} and enter the transaction reference.`}
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => setStep(step === "payment" ? "slot" : "start")}>
          <ArrowLeft />
          Back
        </Button>
      </div>

      {step === "slot" ? (
        <>
          {!isAuthenticated && (
            <Input
              value={guestName}
              onChange={(event) => setGuestName(event.target.value)}
              placeholder="Your name"
              autoComplete="name"
            />
          )}
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
          <Button
            type="button"
            size="sm"
            disabled={!isAuthenticated && guestName.trim().length < 2}
            onClick={() => setStep("payment")}>
            Continue to payment
          </Button>
        </>
      ) : (
        <>
          <div className="grid justify-items-center gap-2 rounded-xl bg-card p-3">
            <div
              className="relative rounded-2xl bg-white p-2 shadow-[0_8px_22px_rgba(17,24,39,0.08)] ring-1 ring-border"
              role="button"
              tabIndex={0}
              onClick={() => setQrExpanded(true)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  setQrExpanded(true);
                }
              }}
              aria-label="Open payment QR full screen">
              <img
                src={qrUrl}
                alt="UPI payment QR code"
                width="220"
                height="220"
                className="cursor-zoom-in"
              />
              <span className="absolute bottom-3 right-3 grid size-9 place-items-center rounded-full bg-black/75 text-white shadow-lg">
                <Maximize2 className="size-4" />
              </span>
            </div>
            <p className="text-sm font-bold">Scan to pay ₹{match.price}</p>
            <p className="max-w-xs text-center text-xs text-muted-foreground">
              On mobile, long-press the QR and choose PhonePe, GPay, or another
              UPI app. Tap once to enlarge.
            </p>
            <p className="text-xs font-semibold text-muted-foreground">
              UPI ID: {upiId}
            </p>
          </div>
          {qrExpanded && (
            <div
              className="fixed inset-0 z-[100] grid bg-black/80 p-4 backdrop-blur-sm"
              role="presentation"
              onMouseDown={(event) => {
                if (event.target === event.currentTarget) setQrExpanded(false);
              }}>
              <div
                role="dialog"
                aria-modal="true"
                aria-label="UPI payment QR"
                className="relative m-auto grid w-full max-w-sm justify-items-center gap-3 rounded-3xl bg-white p-6 text-slate-950 shadow-2xl">
                <button
                  type="button"
                  onClick={() => setQrExpanded(false)}
                  className="absolute right-3 top-3 grid size-10 place-items-center rounded-full bg-slate-100"
                  aria-label="Close payment QR">
                  <X className="size-5" />
                </button>
                <p className="text-lg font-black">Pay ₹{match.price}</p>
              <img
                className="mt-2 size-full max-w-[300px] object-contain"
                src={qrUrl}
                alt="UPI payment QR code"
                width="300"
                height="300"
              />
                <p className="text-sm font-semibold">UPI ID: {upiId}</p>
                <p className="text-center text-xs text-slate-500">
                  Long-press the QR and choose PhonePe, GPay, or another UPI
                  app. After payment, close this view and request confirmation.
                </p>
              </div>
            </div>
          )}
          <Input
            value={paymentReference}
            onChange={(event) => setPaymentReference(event.target.value)}
            placeholder="Transaction reference (optional)"
          />
          <p className="text-xs text-muted-foreground">
            The host will verify your payment before confirming the slot.
          </p>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={loading}
            onClick={bookSlot}>
            <Send />{" "}
            {loading ? "Submitting..." : "I’ve paid — request booking"}
          </Button>
        </>
      )}
      {message && (
        <p className="text-sm font-semibold text-muted-foreground">{message}</p>
      )}
    </div>
  );
}
