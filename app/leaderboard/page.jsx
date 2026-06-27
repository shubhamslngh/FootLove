import { redirect } from "next/navigation";
import { Medal, ShieldCheck, Sparkles, Target, Trophy } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getCurrentUser } from "@/lib/server/auth";
import { readDb } from "@/lib/server/db";
import { buildLeaderboard, sortByCategory } from "@/lib/server/stats";

const categories = [
  { id: "overall", label: "Overall", icon: Trophy },
  { id: "goals", label: "Goals", icon: Target },
  { id: "assists", label: "Assists", icon: Sparkles },
  { id: "wins", label: "Wins", icon: Medal },
  { id: "fair_play", label: "Fair play", icon: ShieldCheck },
];

export default async function LeaderboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const db = await readDb();
  const leaderboard = buildLeaderboard({
    matches: db.matches,
    bookings: db.bookings,
    users: db.users,
  });
  const completedMatches = db.matches.filter(
    (match) => match.status === "completed",
  ).length;
  const registeredCount = leaderboard.filter((row) => !row.isOffline).length;
  const offlineCount = leaderboard.filter((row) => row.isOffline).length;

  return (
    <AppShell user={user}>
      <div className="space-y-5">
        <section className="rounded-[28px] bg-foreground p-5 text-background shadow-[0_18px_40px_rgba(17,24,39,0.18)]">
          <Badge variant="secondary">App-wide rankings</Badge>
          <h1 className="mt-4 text-3xl font-bold tracking-normal">
            Player leaderboard
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-background/75">
            Rankings are calculated from completed matches. Goals and assists
            carry the most weight, with wins, appearances, and discipline also
            counted.
          </p>
          <div className="mt-5 grid grid-cols-3 gap-2 text-foreground">
            <HeroStat label="Players" value={leaderboard.length} />
            <HeroStat label="Matches" value={completedMatches} />
            <HeroStat label="Offline" value={offlineCount} />
          </div>
        </section>

        <Tabs defaultValue="overall">
          <TabsList className="w-full text-black justify-start overflow-x-auto">
            {categories.map(({ id, label, icon: Icon }) => (
              <TabsTrigger key={id} value={id} className="gap-2 text-sm">
                <Icon className="size-4 text-fuchsia-800" />
                {label}
              </TabsTrigger>
            ))}
          </TabsList>

          {categories.map((category) => (
            <TabsContent key={category.id} value={category.id}>
              <LeaderboardTable
                rows={sortByCategory(leaderboard, category.id)}
                category={category.id}
              />
            </TabsContent>
          ))}
        </Tabs>

        {!leaderboard.length && (
          <Card>
            <CardContent className="p-6 text-sm font-semibold text-muted-foreground">
              Complete matches with recorded events to start the leaderboard.
            </CardContent>
          </Card>
        )}

        {leaderboard.length > 0 && (
          <p className="text-xs font-semibold text-muted-foreground">
            Showing {registeredCount} registered and {offlineCount} offline
            players.
          </p>
        )}
      </div>
    </AppShell>
  );
}

function HeroStat({ label, value }) {
  return (
    <div className="rounded-2xl bg-background p-3">
      <p className="text-2xl font-black">{value}</p>
      <p className="text-xs font-bold uppercase text-muted-foreground">
        {label}
      </p>
    </div>
  );
}

function LeaderboardTable({ rows, category }) {
  const topRows = rows.slice(0, 50);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{getCategoryTitle(category)}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-xs uppercase text-muted-foreground">
                <th className="p-3 text-left">#</th>
                <th className="p-3 text-left">Player</th>
                <th className="p-3 text-right">
                  {category === "overall" ? "Pts" : "Points"}
                </th>
                <th className="p-3 text-right">Goals</th>
                <th className="p-3 text-right">Assists</th>
                <th className="p-3 text-right">Wins</th>
                <th className="p-3 text-right hidden sm:table-cell">Played</th>
                <th className="p-3 text-right hidden sm:table-cell">Fouls</th>
                <th className="p-3 text-right hidden sm:table-cell">YC</th>
                <th className="p-3 text-right hidden sm:table-cell">RC</th>
              </tr>
            </thead>
            <tbody>
              {topRows.map((row) => (
                <LeaderboardRow key={row.key} row={row} category={category} />
              ))}
              {!topRows.length && (
                <tr>
                  <td
                    colSpan={10}
                    className="p-3 text-sm font-semibold text-muted-foreground">
                    No leaderboard data yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function LeaderboardRow({ row, category }) {
  return (
    <tr className="border-t border-border">
      <td className="p-3 align-middle">
        <div className="grid size-9 place-items-center rounded-full bg-card text-sm font-black">
          #{row.rank}
        </div>
      </td>
      <td className="p-3 align-middle">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate font-bold">@{row.username || row.name}</p>
            {row.isOffline && <Badge variant="outline">offline</Badge>}
          </div>
          <p className="text-xs font-semibold text-muted-foreground">
            {row.name}
          </p>
        </div>
      </td>
      <td className="p-3 text-right align-middle">
        {formatPoints(row.points)}
      </td>
      <td className="p-3 text-right align-middle">{row.goals}</td>
      <td className="p-3 text-right align-middle">{row.assists}</td>
      <td className="p-3 text-right align-middle">{row.wins}</td>
      <td className="p-3 text-right align-middle hidden sm:table-cell">
        {row.played}
      </td>
      <td className="p-3 text-right align-middle hidden sm:table-cell">
        {row.fouls}
      </td>
      <td className="p-3 text-right align-middle hidden sm:table-cell">
        {row.yellowCards}
      </td>
      <td className="p-3 text-right align-middle hidden sm:table-cell">
        {row.redCards}
      </td>
    </tr>
  );
}

function MiniStat({ label, value, muted }) {
  return (
    <div className={muted ? "text-muted-foreground" : ""}>
      <p className="font-black">{value}</p>
      <p className="text-[0.65rem] font-bold uppercase">{label}</p>
    </div>
  );
}

function formatPoints(points) {
  return Number.isInteger(points) ? points : points.toFixed(2);
}

function getCategoryTitle(category) {
  if (category === "goals") return "Top scorers";
  if (category === "assists") return "Top creators";
  if (category === "wins") return "Most wins";
  if (category === "fair_play") return "Fair play";
  return "Overall leaderboard";
}
