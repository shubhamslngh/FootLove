"use client";

import { useState } from "react";
import { ChevronDown, Phone, UserRound } from "lucide-react";

import { Badge } from "@/components/ui/badge";

export function PlayerRosterItem({ booking, confirmedByName }) {
  const [expanded, setExpanded] = useState(false);
  const player = booking.player;

  return (
    <div className="rounded-2xl bg-background ring-1 ring-border">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-3 p-3 text-left"
        onClick={() => setExpanded((current) => !current)}
        aria-expanded={expanded}>
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid size-9 shrink-0 place-items-center rounded-full bg-secondary">
            <UserRound className="size-4 text-primary" />
          </div>
          <p className="truncate text-sm font-bold">
            @{player?.username || player?.name || "unknown"}
          </p>
        </div>
        <ChevronDown
          className={`size-4 shrink-0 text-muted-foreground transition-transform ${
            expanded ? "rotate-180" : ""
          }`}
        />
      </button>

      <div
        className={`grid overflow-hidden transition-[grid-template-rows,opacity] duration-200 ${
          expanded
            ? "grid-rows-[1fr] opacity-100"
            : "grid-rows-[0fr] opacity-0"
        }`}>
        <div className="min-h-0">
          <div className="grid gap-3 border-t border-border p-3 text-sm">
            <ProfileRow label="Status">
              <Badge variant="secondary">{booking.status}</Badge>
            </ProfileRow>
            <ProfileRow label="Account">
              <span className="font-semibold">{player?.role || "player"}</span>
            </ProfileRow>
            <ProfileRow label="Full name">
              <span className="font-semibold">
                {player?.name || "Not available"}
              </span>
            </ProfileRow>
            <ProfileRow label="Slot">
              <span className="font-semibold">{booking.slotRole}</span>
            </ProfileRow>
            <ProfileRow label="Phone">
              <a
                href={player?.phone ? `tel:${player.phone}` : undefined}
                className="inline-flex items-center gap-1.5 font-semibold text-primary">
                <Phone className="size-3.5" />
                {player?.phone || "Not available"}
              </a>
            </ProfileRow>
            {confirmedByName && (
              <ProfileRow label="Confirmed by">
                <span className="font-semibold">{confirmedByName}</span>
              </ProfileRow>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ProfileRow({ label, children }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      {children}
    </div>
  );
}
