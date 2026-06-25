import { redirect } from "next/navigation";
import {
  CalendarCheck,
  Goal,
  ShieldCheck,
  Star,
  Trophy,
} from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { LogoutButton } from "@/components/logout-button";
import { PlayerCardDialog } from "@/components/player-card-dialog";
import { ProfileForm } from "@/components/profile-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  canHavePlayerCard,
  formatPoints,
  getEmptyPlayerStats,
} from "@/lib/player-card";
import { getCurrentUser } from "@/lib/server/auth";
import { readDb } from "@/lib/server/db";
import { ROLES } from "@/lib/server/roles";
import { buildLeaderboard } from "@/lib/server/stats";

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const db = await readDb();
  const leaderboard = buildLeaderboard({
    matches: db.matches,
    bookings: db.bookings,
    users: db.users,
  });
  const playerStats =
    leaderboard.find((row) => row.userId === user.id) ||
    getEmptyPlayerStats(user);
  const userBookings = db.bookings.filter(
    (booking) => booking.userId === user.id,
  );
  const hostedMatches = db.matches.filter(
    (match) => match.hostUserId === user.id,
  );
  const hasPlayerCard = canHavePlayerCard(user);
  const stats =
    user.role === ROLES.PLAYER
      ? [
          { label: "Bookings", value: userBookings.length, icon: CalendarCheck },
          { label: "Played", value: playerStats.played, icon: Trophy },
          { label: "Goals", value: playerStats.goals, icon: Goal },
        ]
      : [
          { label: "Hosted", value: hostedMatches.length, icon: CalendarCheck },
          {
            label: "Completed",
            value: hostedMatches.filter((match) => match.status === "completed")
              .length,
            icon: Trophy,
          },
          {
            label: "Players confirmed",
            value: db.bookings.filter(
              (booking) =>
                booking.status === "confirmed" &&
                hostedMatches.some((match) => match.id === booking.matchId),
            ).length,
            icon: ShieldCheck,
          },
        ];

  return (
    <AppShell user={user}>
      <div className="mx-auto grid max-w-4xl gap-5">
        <div>
          <p className="text-sm font-semibold text-primary">Profile</p>
          <div className="mt-1 flex items-center justify-between gap-3">
            <div>
              <h1 className="text-3xl font-bold">{user.name}</h1>
              <p className="text-sm text-muted-foreground">
                @{user.username || "user"}
              </p>
            </div>
            <Badge variant="secondary">{user.role}</Badge>
          </div>
        </div>

        <section className="grid grid-cols-3 gap-3">
          {stats.map(({ label, value, icon: Icon }) => (
            <Card key={label}>
              <CardContent className="p-4">
                <Icon className="size-5 text-primary" />
                <p className="mt-3 text-2xl font-bold">{value}</p>
                <p className="text-xs font-semibold text-muted-foreground">
                  {label}
                </p>
              </CardContent>
            </Card>
          ))}
        </section>

        {hasPlayerCard && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2">
                  <Star className="size-5 text-primary" />
                  Your player stats
                </span>
                <PlayerCardDialog user={user} stats={playerStats} />
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <ProfileStat
                  label="Rank"
                  value={playerStats.rank ? `#${playerStats.rank}` : "-"}
                />
                <ProfileStat
                  label="Points"
                  value={formatPoints(playerStats.points)}
                />
                <ProfileStat label="Played" value={playerStats.played} />
                <ProfileStat label="Wins" value={playerStats.wins} />
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <ProfileStat label="Goals" value={playerStats.goals} />
                <ProfileStat label="Assists" value={playerStats.assists} />
                <ProfileStat label="Fouls" value={playerStats.fouls} muted />
                <ProfileStat
                  label="Cards"
                  value={playerStats.yellowCards + playerStats.redCards}
                  muted
                />
              </div>
              <p className="text-sm font-semibold text-muted-foreground">
                Card upgrades automatically as completed matches add goals,
                assists, wins, points, and rank changes.
              </p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Manage profile</CardTitle>
          </CardHeader>
          <CardContent>
            <ProfileForm user={user} />
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <LogoutButton />
        </div>
      </div>
    </AppShell>
  );
}

function ProfileStat({ label, value, muted = false }) {
  return (
    <div className="rounded-2xl bg-secondary p-3">
      <p className={`text-2xl font-black ${muted ? "text-muted-foreground" : ""}`}>
        {value}
      </p>
      <p className="text-xs font-bold uppercase text-muted-foreground">
        {label}
      </p>
    </div>
  );
}
