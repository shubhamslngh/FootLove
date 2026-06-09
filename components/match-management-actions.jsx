"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, UserPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function MatchManagementActions({ match, hostBooking = null }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [joining, setJoining] = useState(false);
  const [slotRole, setSlotRole] = useState(
    match.slotRoles?.[0] || "Any role",
  );
  const [message, setMessage] = useState("");

  async function joinMatch() {
    setMessage("");
    setJoining(true);
    const response = await fetch(`/api/matches/${match.id}/join-host`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slotRole }),
    });
    const result = await response.json();
    setJoining(false);

    if (!response.ok) {
      setMessage(result?.error?.message || "Could not join match");
      return;
    }

    router.refresh();
  }

  async function deleteMatch() {
    if (
      !window.confirm(
        `Delete "${match.title}"? This will also remove its bookings.`,
      )
    ) {
      return;
    }

    setMessage("");
    setDeleting(true);
    const response = await fetch(`/api/matches/${match.id}`, {
      method: "DELETE",
    });
    const result = await response.json();

    if (!response.ok) {
      setDeleting(false);
      setMessage(result?.error?.message || "Could not delete match");
      return;
    }

    router.push("/matches");
    router.refresh();
  }

  return (
    <div className="grid gap-2 rounded-2xl bg-card p-3 shadow-[0_12px_30px_rgba(17,24,39,0.08)] ring-1 ring-border">
      <p className="text-xs font-bold uppercase text-muted-foreground">
        Manage match
      </p>
      {hostBooking ? (
        <p className="rounded-xl bg-secondary p-3 text-sm font-semibold">
          You are playing as {hostBooking.slotRole}.
        </p>
      ) : (
        <div className="grid grid-cols-[1fr_auto] gap-2">
          <Select value={slotRole} onValueChange={setSlotRole}>
            <SelectTrigger>
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent>
              {(match.slotRoles?.length
                ? match.slotRoles
                : ["Any role"]
              ).map((role) => (
                <SelectItem key={role} value={role}>
                  {role}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            type="button"
            size="sm"
            disabled={joining || match.status !== "open"}
            onClick={joinMatch}>
            <UserPlus />
            {joining ? "Joining..." : "Join game"}
          </Button>
        </div>
      )}
      <div className="grid grid-cols-2 gap-2">
        <Button asChild variant="outline" size="sm">
          <Link href={`/host?edit=${match.id}`}>
            <Pencil />
            Edit match
          </Link>
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950/30"
          disabled={deleting}
          onClick={deleteMatch}>
          <Trash2 />
          {deleting ? "Deleting..." : "Delete match"}
        </Button>
      </div>
      {message && (
        <p className="text-xs font-medium text-red-600 dark:text-red-400">
          {message}
        </p>
      )}
    </div>
  );
}
