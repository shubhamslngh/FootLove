"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X } from "lucide-react";

import { Button } from "@/components/ui/button";

export function BookingApprovalActions({ bookingId }) {
  const router = useRouter();
  const [loadingAction, setLoadingAction] = useState("");
  const [message, setMessage] = useState("");

  async function updateStatus(action) {
    setMessage("");
    setLoadingAction(action);

    const response = await fetch(`/api/bookings/${bookingId}/${action}`, { method: "POST" });
    const result = await response.json();
    setLoadingAction("");

    if (!response.ok) {
      setMessage(result?.error?.message || "Could not update booking");
      return;
    }

    router.refresh();
  }

  return (
    <div className="grid gap-2">
      <div className="flex gap-2">
        <Button size="sm" disabled={Boolean(loadingAction)} onClick={() => updateStatus("confirm")}>
          <Check /> {loadingAction === "confirm" ? "Confirming..." : "Confirm"}
        </Button>
        <Button size="sm" variant="outline" disabled={Boolean(loadingAction)} onClick={() => updateStatus("reject")}>
          <X /> {loadingAction === "reject" ? "Rejecting..." : "Reject"}
        </Button>
      </div>
      {message && <p className="text-sm font-semibold text-muted-foreground">{message}</p>}
    </div>
  );
}
