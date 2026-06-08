"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  ChevronDown,
  Clock3,
  IndianRupee,
  MapPin,
  Share2,
  Users,
} from "lucide-react";

import { BookingActions } from "@/components/booking-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatDisplayDate } from "@/lib/utils";

const TEAM_NAMES = [
  "Thunder",
  "Strikers",
  "Raptors",
  "Vipers",
  "Falcons",
  "Knights",
  "Tigers",
  "Rangers",
  "Warriors",
  "Panthers",
  "Comets",
  "Blaze",
  "Storm",
  "Titans",
  "Raiders",
  "Legends",
];

function hashString(value) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function getMatchTeams(id) {
  const seed = hashString(id);
  const home = TEAM_NAMES[seed % TEAM_NAMES.length];
  let away = TEAM_NAMES[(seed + 7) % TEAM_NAMES.length];
  if (away === home) {
    away = TEAM_NAMES[(seed + 11) % TEAM_NAMES.length];
  }
  return [home, away];
}

function getTeamInitials(name) {
  return name
    .split(/\s+/)
    .map((word) => word[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function MatchCard({
  match,
  canBook = false,
  existingBooking = null,
  pendingCount = 0,
  showPending = false,
  href,
  preview = false,
  showDetails = false,
  hideViewDetails = false,
}) {
  const [shareStatus, setShareStatus] = useState("");
  const [expanded, setExpanded] = useState(false);
  const remaining = Math.max(0, match.capacity - match.booked - pendingCount);
  const venueName = match.venue?.name ?? match.venue ?? "Venue";
  const venueArea = match.venue?.area ?? match.area ?? "";
  const detailHref = href ?? `/matches/${match.id}`;
  const fallbackTeams = getMatchTeams(match.id);
  const homeTeam = match.homeTeam || fallbackTeams[0];
  const awayTeam = match.awayTeam || fallbackTeams[1];
  const homeInitials = getTeamInitials(homeTeam);
  const awayInitials = getTeamInitials(awayTeam);
  const matchStatus = match.status
    ? match.status.replace(/_/g, " ").toUpperCase()
    : "UPCOMING";
  const dateLabel = formatDisplayDate(match.date);
  const hasScore = match.homeScore != null && match.awayScore != null;
  const isPlayerCard = canBook;

  async function shareMatch() {
    setShareStatus("");
    const url = `${window.location.origin}${detailHref}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: `${homeTeam} vs ${awayTeam}`,
          text: `Join the match at ${venueName}`,
          url,
        });
        setShareStatus("Shared successfully");
        return;
      }

      await navigator.clipboard.writeText(url);
      setShareStatus("Link copied to clipboard");
    } catch (error) {
      setShareStatus("Could not share match link");
    }
  }

  return (
    <Card className="overflow-hidden rounded-2xl bg-card/95 shadow-[0_12px_30px_rgba(17,24,39,0.08)] ring-border">
      <CardContent className="grid gap-3 p-3">
        <button
          type="button"
          className={`grid gap-3 text-left ${
            isPlayerCard ? "cursor-pointer" : "cursor-default"
          }`}
          onClick={() => isPlayerCard && setExpanded((current) => !current)}
          aria-expanded={isPlayerCard ? expanded : undefined}>
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-bold">{match.title}</p>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <CalendarDays className="size-3.5" />
                {dateLabel}
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock3 className="size-3.5" />
                {match.time}
              </span>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className="rounded-full bg-secondary px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-normal text-secondary-foreground">
              {preview ? "PREVIEW" : matchStatus}
            </span>
            {isPlayerCard && (
              <ChevronDown
                className={`size-4 text-muted-foreground transition-transform duration-300 ${
                  expanded ? "rotate-180" : ""
                }`}
              />
            )}
          </div>
        </div>

        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-center">
          <div className="flex min-w-0 items-center gap-2">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary text-sm font-bold text-white shadow-sm">
              {homeInitials}
            </div>
            <div className="min-w-0 text-left">
              <p className="text-[0.65rem] font-bold uppercase text-muted-foreground">
                Home
              </p>
              <p className="truncate text-sm font-semibold">{homeTeam}</p>
            </div>
          </div>

          <div className="flex items-center justify-center">
            {hasScore ? (
              <div className="flex items-center gap-1.5">
                <div className="rounded-xl bg-foreground px-2.5 py-1.5 text-sm font-bold text-background shadow-sm">
                  {match.homeScore}
                </div>
                <span className="text-sm font-bold text-foreground">:</span>
                <div className="rounded-xl bg-foreground px-2.5 py-1.5 text-sm font-bold text-background shadow-sm">
                  {match.awayScore}
                </div>
              </div>
            ) : (
              <div className="rounded-xl bg-foreground px-3 py-1.5 text-xs font-bold text-background shadow-sm">
                VS
              </div>
            )}
          </div>

          <div className="flex min-w-0 items-center justify-end gap-2">
            <div className="min-w-0 text-right">
              <p className="text-[0.65rem] font-bold uppercase text-muted-foreground">
                Away
              </p>
              <p className="truncate text-sm font-semibold">{awayTeam}</p>
            </div>
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-foreground text-sm font-bold text-background shadow-sm">
              {awayInitials}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3 text-xs text-muted-foreground">
          <div className="flex min-w-0 items-center gap-1.5">
            <MapPin className="size-3.5 shrink-0" />
            <p className="truncate font-semibold text-foreground">
              {venueName}
              {venueArea ? `, ${venueArea}` : ""}
            </p>
          </div>
          <p className="shrink-0 font-semibold text-foreground">
            {remaining} of {match.capacity} slots left
            {showPending && pendingCount ? ` · ${pendingCount} pending` : ""}
          </p>
        </div>
        </button>

        {!preview && <div
          className={`grid overflow-hidden transition-[grid-template-rows,opacity] duration-300 ease-out motion-reduce:transition-none ${
            !isPlayerCard || expanded
              ? "grid-rows-[1fr] opacity-100"
              : "grid-rows-[0fr] opacity-0"
          }`}>
          <div className="min-h-0">
            <div className="grid gap-3 border-t border-border pt-3">
              {(isPlayerCard || showDetails) && (
                <div className="overflow-hidden rounded-xl bg-secondary">
                  <div className="border-b border-border p-3">
                    <p className="text-xs font-bold uppercase text-muted-foreground">
                      Match details
                    </p>
                    <p className="mt-1 text-sm font-bold">
                      {homeTeam} vs {awayTeam}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-px bg-border">
                    <div className="bg-secondary p-3">
                      <CalendarDays className="size-4 text-primary" />
                      <p className="mt-2 text-[0.65rem] text-muted-foreground">
                        Schedule
                      </p>
                      <p className="text-xs font-bold">
                        {dateLabel}, {match.time}
                      </p>
                    </div>
                    <div className="bg-secondary p-3">
                      <MapPin className="size-4 text-primary" />
                      <p className="mt-2 text-[0.65rem] text-muted-foreground">
                        Venue
                      </p>
                      <p className="truncate text-xs font-bold">{venueName}</p>
                    </div>
                    <div className="bg-secondary p-3">
                      <Users className="size-4 text-primary" />
                      <p className="mt-2 text-[0.65rem] text-muted-foreground">
                        Format and level
                      </p>
                      <p className="text-xs font-bold">
                        {match.format} · {match.level || "Open"}
                      </p>
                    </div>
                    <div className="bg-secondary p-3">
                      <IndianRupee className="size-4 text-primary" />
                      <p className="mt-2 text-[0.65rem] text-muted-foreground">
                        Entry and availability
                      </p>
                      <p className="text-xs font-bold">
                        ₹{match.price} · {remaining} slots
                      </p>
                    </div>
                  </div>
                </div>
              )}
        <div className="grid gap-2">
          <div className="grid grid-cols-[1fr_auto] gap-2">
            {!hideViewDetails && (
              <Button asChild size="sm">
                <Link href={detailHref} className="w-full justify-center">
                  View details
                </Link>
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={shareMatch}
              className={hideViewDetails ? "w-full" : "w-9 shrink-0 px-0"}
              aria-label="Share match">
              <Share2 />
              {hideViewDetails && "Share match"}
            </Button>
          </div>
          {shareStatus && (
            <p className="text-xs font-medium text-muted-foreground">
              {shareStatus}
            </p>
          )}
        </div>

            </div>
          </div>
        </div>}
        {canBook && (
          <BookingActions
            match={{ ...match, pendingCount }}
            existingBooking={existingBooking}
          />
        )}
      </CardContent>
    </Card>
  );
}
