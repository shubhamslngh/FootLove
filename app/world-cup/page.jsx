import Image from "next/image";
import { redirect } from "next/navigation";
import { CalendarDays, MapPin, Trophy, UsersRound } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/server/auth";
import { getWorldCupOverview } from "@/lib/server/world-cup";

function getEventDate(event) {
  return event.dateEvent || event.strTimestamp?.slice(0, 10) || "";
}

function getEventTime(event) {
  return event.strTime?.slice(0, 5) || event.strTimestamp?.slice(11, 16) || "TBA";
}

function formatDate(value) {
  if (!value) return "Date TBA";
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}

export default async function WorldCupPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  let overview = null;
  let errorMessage = "";

  try {
    overview = await getWorldCupOverview();
  } catch (error) {
    errorMessage =
      error.message === "THESPORTSDB_API_KEY is not configured"
        ? "Add THESPORTSDB_API_KEY to your environment and restart the app."
        : "Tournament data is temporarily unavailable.";
  }

  const events = overview?.events || [];
  const teams = overview?.teams || [];
  const upcomingEvents = events
    .filter((event) => {
      const date = getEventDate(event);
      return date && new Date(`${date}T23:59:59`) >= new Date();
    })
    .sort((a, b) => getEventDate(a).localeCompare(getEventDate(b)))
    .slice(0, 12);

  return (
    <AppShell user={user}>
      <div className="space-y-6">
        <section className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-emerald-950 via-emerald-800 to-teal-600 p-6 text-white shadow-[0_20px_50px_rgba(6,78,59,0.3)] sm:p-8">
          <div className="absolute -right-12 -top-12 size-56 rounded-full bg-white/10" />
          <div className="relative max-w-xl">
            <Badge className="bg-white/15 text-white ring-1 ring-white/20">
              Canada · Mexico · United States
            </Badge>
            <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">
              FIFA World Cup 2026
            </h1>
            <p className="mt-3 text-sm font-medium text-white/80 sm:text-base">
              Follow fixtures, participating nations, and match updates.
            </p>
            <div className="mt-5 flex flex-wrap gap-3 text-sm font-bold">
              <span className="rounded-full bg-black/20 px-4 py-2">48 teams</span>
              <span className="rounded-full bg-black/20 px-4 py-2">104 matches</span>
              <span className="rounded-full bg-black/20 px-4 py-2">16 host cities</span>
            </div>
          </div>
          <Trophy className="absolute bottom-5 right-6 size-24 text-white/15 sm:size-32" />
        </section>

        {errorMessage ? (
          <Card>
            <CardHeader>
              <CardTitle>World Cup data needs configuration</CardTitle>
            </CardHeader>
            <CardContent className="text-sm font-medium text-muted-foreground">
              {errorMessage}
            </CardContent>
          </Card>
        ) : (
          <>
            <section className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-primary">Schedule</p>
                  <h2 className="text-xl font-bold">Upcoming fixtures</h2>
                </div>
                <Badge variant="secondary">{events.length} matches</Badge>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {upcomingEvents.map((event) => (
                  <Card key={event.idEvent || `${event.strEvent}-${getEventDate(event)}`}>
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between gap-3 text-xs font-bold text-muted-foreground">
                        <span className="inline-flex items-center gap-1.5">
                          <CalendarDays className="size-4 text-primary" />
                          {formatDate(getEventDate(event))} · {getEventTime(event)}
                        </span>
                        {event.strGroup && <Badge variant="secondary">{event.strGroup}</Badge>}
                      </div>
                      <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                        <p className="text-right text-sm font-bold">{event.strHomeTeam || "TBA"}</p>
                        <span className="rounded-full bg-foreground px-3 py-1.5 text-xs font-black text-background">
                          VS
                        </span>
                        <p className="text-sm font-bold">{event.strAwayTeam || "TBA"}</p>
                      </div>
                      {(event.strVenue || event.strCity) && (
                        <p className="mt-5 flex items-center justify-center gap-1.5 border-t border-border pt-4 text-xs font-medium text-muted-foreground">
                          <MapPin className="size-3.5" />
                          {event.strVenue || event.strCity}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
                {!upcomingEvents.length && (
                  <div className="rounded-2xl bg-card p-5 text-sm font-semibold text-muted-foreground shadow-[0_14px_34px_rgba(17,24,39,0.08)] ring-1 ring-border md:col-span-2">
                    The fixture list is not available yet.
                  </div>
                )}
              </div>
            </section>

            <section className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-primary">Nations</p>
                  <h2 className="text-xl font-bold">Participating teams</h2>
                </div>
                <Badge variant="secondary">
                  <UsersRound className="mr-1 size-3.5" />
                  {teams.length}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {teams.map((team) => (
                  <Card key={team.idTeam}>
                    <CardContent className="flex items-center gap-3 p-4">
                      {team.strBadge ? (
                        <Image
                          src={team.strBadge}
                          alt=""
                          width={40}
                          height={40}
                          className="size-10 object-contain"
                        />
                      ) : (
                        <div className="grid size-10 place-items-center rounded-full bg-secondary text-xs font-black">
                          {(team.strTeam || "?").slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <p className="min-w-0 truncate text-sm font-bold">{team.strTeam}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </AppShell>
  );
}
