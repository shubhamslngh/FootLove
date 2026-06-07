import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarDays, Clock3, MapPin, Swords, Users } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { PlayerRosterItem } from "@/components/player-roster-item";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/server/auth";
import { readDb, withVenue, publicUser } from "@/lib/server/db";
import { formatDisplayDate } from "@/lib/utils";
import { canManagePlatform } from "@/lib/server/roles";

export default async function MatchDetailPage({ params }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const db = await readDb();
  const match = db.matches.find((match) => match.id === id);
  if (!match) redirect("/matches");

  const matchWithVenue = withVenue(match, db.venues);
  const host = db.users.find((candidate) => candidate.id === match.hostUserId);
  const bookings = db.bookings
    .filter((booking) => booking.matchId === match.id)
    .map((booking) => ({
      ...booking,
      player: publicUser(
        db.users.find((candidate) => candidate.id === booking.userId),
      ),
    }))
    .sort((a, b) => {
      const order = { confirmed: 0, pending: 1, rejected: 2 };
      return (order[a.status] ?? 3) - (order[b.status] ?? 3);
    });

  const pendingCount = bookings.filter(
    (booking) => booking.status === "pending",
  ).length;
  const remaining = Math.max(0, match.capacity - match.booked - pendingCount);
  const canScore =
    match.hostUserId === user.id || canManagePlatform(user.role);

  return (
    <AppShell user={user}>
      <div className="space-y-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-primary">Match</p>
            <h1 className="text-3xl font-bold tracking-normal">
              {match.title}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {match.level} · {match.format}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {canScore && (
              <Button asChild size="sm">
                <Link href={`/matches/${match.id}/score`}>
                  <Swords />
                  {match.status === "live"
                    ? "Open scoring"
                    : match.status === "completed"
                      ? "View score"
                      : "Set teams & kick off"}
                </Link>
              </Button>
            )}
            <Link
              href="/matches"
              className="text-sm font-semibold text-primary hover:text-primary/80">
              ← Back to matches
            </Link>
            <Badge>{match.status}</Badge>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
          <Card className="overflow-hidden bg-card/95 shadow-[0_24px_120px_rgba(59,130,246,0.12)] ring-1 ring-border">
            <CardHeader>
              <CardTitle className="text-lg">Match details</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm text-muted-foreground">
              <div className="space-y-1">
                <p className="font-semibold text-foreground">When</p>
                <p>
                  {formatDisplayDate(match.date)} · {match.time}
                </p>
              </div>
              <div className="space-y-1">
                <p className="font-semibold text-foreground">Where</p>
                <p>
                  {matchWithVenue.venue?.name || "Venue"}
                  {matchWithVenue.venue?.area
                    ? `, ${matchWithVenue.venue.area}`
                    : ""}
                </p>
              </div>
              <div className="space-y-1">
                <p className="font-semibold text-foreground">Capacity</p>
                <p>
                  {match.booked}/{match.capacity} players
                </p>
              </div>
              <div className="space-y-1">
                <p className="font-semibold text-foreground">Slots remaining</p>
                <p>{remaining}</p>
              </div>
              <div className="space-y-1">
                <p className="font-semibold text-foreground">Hosted by</p>
                <p>{host?.name ?? "Unknown host"}</p>
              </div>
              <div className="space-y-1">
                <p className="font-semibold text-foreground">Slot roles</p>
                <p>
                  {Array.isArray(match.slotRoles)
                    ? match.slotRoles.join(", ")
                    : String(match.slotRoles || "Any role")}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden bg-card/95 ring-1 ring-border">
            <CardHeader>
              <CardTitle className="text-lg">Player roster</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-center justify-between gap-3 rounded-2xl bg-secondary/80 p-4">
                <div>
                  <p className="text-sm font-semibold">Confirmed players</p>
                  <p className="text-xs text-muted-foreground">
                    {
                      bookings.filter(
                        (booking) => booking.status === "confirmed",
                      ).length
                    }{" "}
                    confirmed
                  </p>
                </div>
                <Badge variant={remaining <= 3 ? "default" : "secondary"}>
                  {remaining} left
                </Badge>
              </div>
              <div className="grid gap-3">
                {bookings.length > 0 ? (
                  bookings.map((booking) => (
                    <PlayerRosterItem
                      key={booking.id}
                      booking={booking}
                      confirmedByName={
                        booking.confirmedByUserId
                          ? db.users.find(
                              (candidate) =>
                                candidate.id === booking.confirmedByUserId,
                            )?.name || booking.confirmedByUserId
                          : null
                      }
                    />
                  ))
                ) : (
                  <p className="rounded-3xl bg-card p-5 text-sm font-semibold text-muted-foreground shadow-[0_14px_34px_rgba(17,24,39,0.08)] ring-1 ring-border">
                    No players have joined this match yet.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
