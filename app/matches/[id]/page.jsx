import Link from "next/link";
import { notFound } from "next/navigation";
import { Swords } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { MatchCard } from "@/components/match-card";
import { MatchHostTabs } from "@/components/match-host-tabs";
import { PlayerRosterItem } from "@/components/player-roster-item";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/server/auth";
import { readDb, withVenue, publicUser } from "@/lib/server/db";
import { canBookMatch, canManagePlatform } from "@/lib/server/roles";
import { formatDisplayDate } from "@/lib/utils";

export async function generateMetadata({ params }) {
  const { id } = await params;
  const db = await readDb();
  const match = db.matches.find((candidate) => candidate.id === id);

  if (!match) {
    return {
      title: "Match not found | SoccerSesh",
    };
  }

  const venue = db.venues.find((candidate) => candidate.id === match.venueId);
  const pendingCount = db.bookings.filter(
    (booking) =>
      booking.matchId === match.id && booking.status === "pending",
  ).length;
  const remaining = Math.max(
    0,
    match.capacity - match.booked - pendingCount,
  );
  const teams = `${match.homeTeam} vs ${match.awayTeam}`;
  const description = `${formatDisplayDate(match.date)} at ${match.time} · ${venue?.name || "Venue"} · ₹${match.price} · ${remaining} slots left`;
  const imageUrl = `/matches/${match.id}/opengraph-image`;

  return {
    title: `${teams} | SoccerSesh`,
    description,
    alternates: {
      canonical: `/matches/${match.id}`,
    },
    openGraph: {
      title: teams,
      description,
      type: "website",
      url: `/matches/${match.id}`,
      siteName: "SoccerSesh",
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: `${teams} match card`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: teams,
      description,
      images: [imageUrl],
    },
  };
}

export default async function MatchDetailPage({ params }) {
  const user = await getCurrentUser();

  const { id } = await params;
  const db = await readDb();
  const match = db.matches.find((match) => match.id === id);
  if (!match) notFound();

  const matchWithVenue = withVenue(match, db.venues);
  const host = db.users.find((candidate) => candidate.id === match.hostUserId);
  const allBookings = db.bookings
    .filter((booking) => booking.matchId === match.id)
    .map((booking) => ({
      ...booking,
      player: booking.userId
        ? publicUser(
            db.users.find((candidate) => candidate.id === booking.userId),
          )
        : {
            name: booking.guestName,
            username: booking.guestUsername,
            phone: booking.guestPhone,
            role: booking.guestUsername ? "offline" : "guest",
          },
    }))
    .sort((a, b) => {
      const order = { confirmed: 0, pending: 1, rejected: 2 };
      return (order[a.status] ?? 3) - (order[b.status] ?? 3);
    });
  const bookings = user
    ? allBookings
    : allBookings.filter((booking) => booking.status === "confirmed");

  const pendingCount = allBookings.filter(
    (booking) => booking.status === "pending",
  ).length;
  const remaining = Math.max(0, match.capacity - match.booked - pendingCount);
  const canScore =
    Boolean(user) &&
    (match.hostUserId === user.id || canManagePlatform(user.role));
  const canManage =
    Boolean(user) &&
    (match.hostUserId === user.id || canManagePlatform(user.role));
  const canViewScore = match.status === "completed";
  const canBook = !user || canBookMatch(user.role);
  const existingBooking = user
    ? allBookings.find((booking) => booking.userId === user.id) || null
    : null;
  const hostBookings = allBookings.map((booking) => ({
    ...booking,
    confirmedByName: booking.confirmedByUserId
      ? db.users.find(
          (candidate) => candidate.id === booking.confirmedByUserId,
        )?.name || booking.confirmedByUserId
      : null,
  }));

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
            {(canScore || canViewScore) && (
              <Button asChild size="sm">
                <Link href={`/matches/${match.id}/score`}>
                  <Swords />
                  {canViewScore
                    ? "View score"
                    : match.status === "live"
                    ? "Open scoring"
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

        <div
          className={`grid gap-4 ${
            canManage ? "" : "lg:grid-cols-[1.5fr_1fr]"
          }`}>
          <div className="grid content-start gap-3">
            <MatchCard
              match={matchWithVenue}
              canBook={canBook}
              existingBooking={existingBooking}
              isAuthenticated={Boolean(user)}
              pendingCount={pendingCount}
              showPending={canManage}
              showDetails
              hideViewDetails
            />
            <Card>
              <CardContent className="grid gap-2 p-4 text-sm">
                <p>
                  <span className="font-semibold">Hosted by:</span>{" "}
                  {host?.name ?? "Unknown host"}
                </p>
                <p>
                  <span className="font-semibold">Available roles:</span>{" "}
                  {Array.isArray(match.slotRoles)
                    ? match.slotRoles.join(", ")
                    : String(match.slotRoles || "Any role")}
                </p>
                {match.notes && (
                  <p>
                    <span className="font-semibold">Notes:</span> {match.notes}
                  </p>
                )}
              </CardContent>
            </Card>
            {canManage && (
              <MatchHostTabs
                match={match}
                bookings={hostBookings}
                remaining={remaining}
                hostBooking={existingBooking}
              />
            )}
          </div>

          {!canManage && (
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
          )}
        </div>
      </div>
    </AppShell>
  );
}
