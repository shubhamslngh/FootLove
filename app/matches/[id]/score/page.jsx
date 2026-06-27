import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { MatchHostTabs } from "@/components/match-host-tabs";
import { MatchScoringConsole } from "@/components/match-scoring-console";
import { Badge } from "@/components/ui/badge";
import { getCurrentUser } from "@/lib/server/auth";
import { publicUser, readDb } from "@/lib/server/db";
import { canManagePlatform } from "@/lib/server/roles";
import { getTeamLogoUrl } from "@/lib/team-logos";

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
  const homeLogo = getTeamLogoUrl(match.homeTeam);
  const awayLogo = getTeamLogoUrl(match.awayTeam);

  return (
    <AppShell user={user}>
      <div className="space-y-5">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-primary">Scoring</p>
            <h1 className="text-3xl font-bold">{match.title}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm font-bold">
              <div className="flex items-center gap-2">
                {homeLogo ? (
                  <div className="grid size-12 place-items-center overflow-hidden rounded-full bg-card p-1 ring-1 ring-border">
                    <Image
                      src={homeLogo}
                      alt={`${match.homeTeam} logo`}
                      width={48}
                      height={48}
                      className="size-full object-contain"
                    />
                  </div>
                ) : null}
                <span>{match.homeTeam}</span>
              </div>
              <span className="rounded-full bg-foreground px-2.5 py-1 text-[0.65rem] font-black text-background">
                VS
              </span>
              <div className="flex items-center gap-2">
                {awayLogo ? (
                  <div className="grid size-12 place-items-center overflow-hidden rounded-full bg-card p-1 ring-1 ring-border">
                    <Image
                      src={awayLogo}
                      alt={`${match.awayTeam} logo`}
                      width={48}
                      height={48}
                      className="size-full object-contain"
                    />
                  </div>
                ) : null}
                <span>{match.awayTeam}</span>
              </div>
            </div>
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
