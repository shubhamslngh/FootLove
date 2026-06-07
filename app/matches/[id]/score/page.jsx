import Link from "next/link";
import { redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell";
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
  if (match.hostUserId !== user.id && !canManagePlatform(user.role)) {
    redirect(`/matches/${id}`);
  }

  const players = db.bookings
    .filter(
      (booking) =>
        booking.matchId === id && booking.status === "confirmed",
    )
    .map((booking) => {
      const player = publicUser(
        db.users.find((candidate) => candidate.id === booking.userId),
      );
      return {
        bookingId: booking.id,
        team: booking.team,
        name: player?.name || "Unknown player",
        username: player?.username,
      };
    });

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
        <MatchScoringConsole match={match} players={players} />
        <Link
          href={`/matches/${id}`}
          className="inline-block text-sm font-semibold text-primary">
          Back to match
        </Link>
      </div>
    </AppShell>
  );
}
