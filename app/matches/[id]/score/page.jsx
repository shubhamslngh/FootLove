import Link from "next/link";
import { redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { MatchHostTabs } from "@/components/match-host-tabs";
import { MatchScoringConsole } from "@/components/match-scoring-console";
import { Badge } from "@/components/ui/badge";
import { getCurrentUser } from "@/lib/server/auth";
import { publicUser, readDb } from "@/lib/server/db";
import { canManagePlatform } from "@/lib/server/roles";

export default async function MatchScorePage({ params }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const db = await readDb();
  const match = db.matches.find((candidate) => candidate.id === id);
  if (!match) redirect("/matches");
  const canManageMatch =
    match.hostUserId === user.id || canManagePlatform(user.role);
  if (
    match.status !== "completed" &&
    !canManageMatch
  ) {
    redirect(`/matches/${id}`);
  }

  const matchBookings = db.bookings.filter(
    (booking) => booking.matchId === id,
  );
  const players = matchBookings
    .filter(
      (booking) => booking.status === "confirmed",
    )
    .map((booking) => {
      const player = publicUser(
        db.users.find((candidate) => candidate.id === booking.userId),
      );
      return {
        bookingId: booking.id,
        team: booking.team,
        name: player?.name || booking.guestName || "Unknown player",
        username: player?.username || booking.guestUsername,
        phone: player?.phone || booking.guestPhone,
        isOffline: !booking.userId,
      };
    });
  const hostBookings = matchBookings.map((booking) => {
    const player = publicUser(
      db.users.find((candidate) => candidate.id === booking.userId),
    );
    return {
      ...booking,
      player: player || {
        name: booking.guestName,
        username: booking.guestUsername,
        phone: booking.guestPhone,
        role: booking.guestUsername ? "offline" : "guest",
      },
      confirmedByName: booking.confirmedByUserId
        ? db.users.find(
            (candidate) => candidate.id === booking.confirmedByUserId,
          )?.name || booking.confirmedByUserId
        : null,
    };
  });
  const pendingCount = matchBookings.filter(
    (booking) => booking.status === "pending",
  ).length;
  const remaining = Math.max(
    0,
    Number(match.capacity || 0) -
      Number(match.booked || 0) -
      pendingCount,
  );
  const hostBooking =
    matchBookings.find((booking) => booking.userId === user.id) || null;

  return (
    <AppShell user={user}>
      <div className="space-y-5">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-primary">Scoring</p>
            <h1 className="text-3xl font-bold">{match.title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {match.homeTeam} vs {match.awayTeam}
            </p>
          </div>
          <Badge>{match.status}</Badge>
        </div>
        <MatchScoringConsole
          match={match}
          players={players}
          canManageCompleted={canManageMatch}
        />
        {match.status === "completed" && canManageMatch && (
          <MatchHostTabs
            match={match}
            bookings={hostBookings}
            remaining={remaining}
            hostBooking={hostBooking}
            defaultTab="players"
          />
        )}
        <Link
          href={`/matches/${id}`}
          className="inline-block text-sm font-semibold text-primary">
          Back to match
        </Link>
      </div>
    </AppShell>
  );
}
