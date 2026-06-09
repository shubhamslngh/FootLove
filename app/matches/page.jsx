import { redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { PendingBookingCard } from "@/components/pending-booking-card";
import { MatchCard } from "@/components/match-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/server/auth";
import { readDb, withVenue } from "@/lib/server/db";
import { canBookMatch, canHostMatch } from "@/lib/server/roles";
import { formatDisplayDate } from "@/lib/utils";

export default async function MatchesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const db = await readDb();
  const canBook = canBookMatch(user.role);
  const canHost = canHostMatch(user);
  const matches = db.matches.map((match) => {
    const bookingCounts = db.bookings.filter((booking) => booking.matchId === match.id);
    return {
      ...withVenue(match, db.venues),
      pendingCount: bookingCounts.filter((booking) => booking.status === "pending").length,
      userBooking: bookingCounts.find((booking) => booking.userId === user.id) || null,
    };
  });
  const myBookings = db.bookings
    .filter((booking) => booking.userId === user.id)
    .map((booking) => ({ ...booking, match: matches.find((match) => match.id === booking.matchId) }))
    .filter((booking) => booking.match);
  const pendingBookings = db.bookings
    .filter((booking) => booking.status === "pending")
    .map((booking) => ({
      ...booking,
      match: matches.find((match) => match.id === booking.matchId),
      player: booking.userId
        ? db.users.find((candidate) => candidate.id === booking.userId)
        : { name: booking.guestName, role: "guest" },
    }))
    .filter((booking) => booking.match && booking.player);

  return (
    <AppShell user={user}>
      <div className="space-y-5">
        <div>
          <p className="text-sm font-semibold text-primary">Matches</p>
          <h1 className="text-3xl font-bold tracking-normal">Hosted games</h1>
        </div>

        {canHost && pendingBookings.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-primary">
                  Action required
                </p>
                <h2 className="text-lg font-bold">Booking confirmations</h2>
              </div>
              <Badge variant="secondary">{pendingBookings.length}</Badge>
            </div>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {pendingBookings.map((booking) => (
                <PendingBookingCard key={booking.id} booking={booking} />
              ))}
            </div>
          </section>
        )}

        <section className="space-y-3">
          <h2 className="text-lg font-bold">Open matches</h2>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {matches.map((match) => (
              <MatchCard key={match.id} match={match} canBook={canBook} existingBooking={match.userBooking} pendingCount={match.pendingCount} showPending={canHost} />
            ))}
            {!matches.length && (
              <div className="rounded-[24px] bg-card p-5 text-sm font-semibold text-muted-foreground shadow-[0_14px_34px_rgba(17,24,39,0.08)] ring-1 ring-border md:col-span-2 lg:col-span-3">
                No matches have been published yet.
              </div>
            )}
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold">My matches</h2>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {myBookings.map((booking) => (
              <Card key={booking.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <CardTitle className="text-lg">{booking.match.title}</CardTitle>
                    <Badge>{booking.status}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  <p>
                    {formatDisplayDate(booking.match.date)} ·{" "}
                    {booking.match.time}
                  </p>
                  <p>{booking.match.venue?.name}, {booking.match.venue?.area}</p>
                  <p>Slot: {booking.slotRole}</p>
                </CardContent>
              </Card>
            ))}
            {!myBookings.length && (
              <div className="rounded-[24px] bg-card p-5 text-sm font-semibold text-muted-foreground shadow-[0_14px_34px_rgba(17,24,39,0.08)] ring-1 ring-border md:col-span-2 lg:col-span-3">
                Your booked matches will appear here.
              </div>
            )}
          </div>
        </section>

        {!canHost && (
          <section className="space-y-3">
            <h2 className="text-lg font-bold">Past matches</h2>
            <div className="rounded-[24px] bg-card p-5 text-sm font-semibold text-muted-foreground shadow-[0_14px_34px_rgba(17,24,39,0.08)] ring-1 ring-border">
            Completed matches will appear here.
            </div>
          </section>
        )}
      </div>
    </AppShell>
  );
}
