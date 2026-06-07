"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X } from "lucide-react";

import { Button } from "@/components/ui/button";

export function VenueApprovalActions({
  venueId,
  approved = false,
  inactive = false,
}) {
  const router = useRouter();
  const [loadingAction, setLoadingAction] = useState("");
  const [message, setMessage] = useState("");

  async function updateStatus(action) {
    setMessage("");
    setLoadingAction(action);

    const response = await fetch(`/api/venues/${venueId}/${action}`, { method: "POST" });
    const result = await response.json();
    setLoadingAction("");

    if (!response.ok) {
      setMessage(result?.error?.message || "Could not update venue");
      return;
    }

    router.refresh();
  }

  return (
    <div className="grid gap-2">
      <div className="flex gap-2">
        {(!approved || inactive) && (
          <Button size="sm" disabled={Boolean(loadingAction)} onClick={() => updateStatus("approve")}>
            <Check />{" "}
            {loadingAction === "approve"
              ? inactive
                ? "Activating..."
                : "Approving..."
              : inactive
                ? "Activate venue"
                : "Approve"}
          </Button>
        )}
        {!inactive && (
          <Button size="sm" variant="outline" disabled={Boolean(loadingAction)} onClick={() => updateStatus("reject")}>
            <X /> {loadingAction === "reject" ? (approved ? "Disabling..." : "Rejecting...") : (approved ? "Disable venue" : "Reject")}
          </Button>
        )}
      </div>
      {message && <p className="text-sm font-semibold text-muted-foreground">{message}</p>}
    </div>
  );
}
