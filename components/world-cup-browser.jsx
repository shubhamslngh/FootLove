"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { CalendarDays, MapPin, UsersRound } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

function getEventDate(event) {
  const value = String(event.local_date || "");
  const [datePart] = value.split(" ");
  if (!datePart) return "";
  const [month, day, year] = datePart.split("/");
  if (!month || !day || !year) return "";
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

function getEventTime(event) {
  return String(event.local_date || "").split(" ")[1] || "TBA";
}

function formatDate(value) {
  if (!value) return "Date TBA";
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}

function getMatchKey(event) {
  return event.id || `${event.home_team_name_en}-${event.away_team_name_en}-${getEventDate(event)}`;
}

function isPastEvent(event) {
  const date = getEventDate(event);
  return Boolean(date) && new Date(`${date}T23:59:59`) < new Date();
}

function groupEventsByDate(events) {
  const grouped = new Map();

  events.forEach((event) => {
    const date = getEventDate(event) || "unknown";
    if (!grouped.has(date)) grouped.set(date, []);
    grouped.get(date).push(event);
  });

  return Array.from(grouped.entries()).map(([date, items]) => ({
    date,
    label: formatDate(date === "unknown" ? "" : date),
    items,
  }));
}

function MatchCard({ event, homeTeam, awayTeam }) {
  return (
    <Card className="border-border/70 bg-card text-card-foreground shadow-[0_14px_34px_rgba(17,24,39,0.08)]">
      <CardContent className="relative overflow-hidden p-5">
        <div className="absolute inset-0 z-0 bg-gradient-to-r from-emerald-500/10 via-background to-sky-500/10 dark:from-emerald-400/12 dark:via-card dark:to-sky-400/12" />
        {homeTeam?.flag ? (
          <div className="pointer-events-none absolute -left-4 top-1/2 z-0 -translate-y-1/2 opacity-[0.1] dark:opacity-[0.06]">
            <Image src={homeTeam.flag} alt="" width={120} height={80} className="h-20 w-auto object-contain" />
          </div>
        ) : null}
        {awayTeam?.flag ? (
          <div className="pointer-events-none absolute -right-4 top-1/2 z-0 -translate-y-1/2 opacity-[0.1] dark:opacity-[0.06]">
            <Image src={awayTeam.flag} alt="" width={120} height={80} className="h-20 w-auto object-contain" />
          </div>
        ) : null}
        <div className="relative z-10">
          <div className="flex items-center justify-between gap-3 text-xs font-bold text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="size-4 text-primary" />
              {formatDate(getEventDate(event))} · {getEventTime(event)}
            </span>
            {event.group && <Badge variant="secondary">{event.group}</Badge>}
          </div>
          <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
            <div className="flex min-w-0 flex-col items-end gap-2 text-right">
              {homeTeam?.flag ? (
                <Image
                  src={homeTeam.flag}
                  alt={`${homeTeam.name_en || event.home_team_name_en} flag`}
                  width={48}
                  height={32}
                  className="h-8 w-auto object-contain"
                />
              ) : null}
              <p className="max-w-full text-sm font-bold leading-tight break-words text-foreground">
                {event.home_team_name_en || event.home_team_label || "TBA"}
              </p>
            </div>
            <span className="rounded-full bg-foreground px-3 py-1.5 text-xs font-black text-background">
              VS
            </span>
            <div className="flex min-w-0 flex-col items-start gap-2">
              {awayTeam?.flag ? (
                <Image
                  src={awayTeam.flag}
                  alt={`${awayTeam.name_en || event.away_team_name_en} flag`}
                  width={48}
                  height={32}
                  className="h-8 w-auto object-contain"
                />
              ) : null}
              <p className="max-w-full text-sm font-bold leading-tight break-words text-foreground">
                {event.away_team_name_en || event.away_team_label || "TBA"}
              </p>
            </div>
          </div>
          {(event.type || event.matchday) && (
            <p className="mt-5 flex items-center justify-center gap-1.5 border-t border-border/70 pt-4 text-xs font-medium text-muted-foreground">
              <MapPin className="size-3.5" />
              {String(event.type || "").toUpperCase()} · Matchday {event.matchday}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function MatchSections({ title, emptyLabel, sections, teamById }) {
  if (!sections.length) {
    return (
      <div className="rounded-2xl bg-card p-5 text-sm font-semibold text-muted-foreground shadow-[0_14px_34px_rgba(17,24,39,0.08)] ring-1 ring-border">
        {emptyLabel}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-foreground">{title}</h3>
      </div>
      {sections.map((section) => (
        <div key={section.date} className="space-y-3">
          <div className="flex items-center gap-3">
            <Badge className="bg-foreground text-background">{section.label}</Badge>
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              {section.items.length} matches
            </span>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {section.items.map((event) => (
              <MatchCard
                key={getMatchKey(event)}
                event={event}
                homeTeam={teamById.get(String(event.home_team_id))}
                awayTeam={teamById.get(String(event.away_team_id))}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function WorldCupBrowser({ overview }) {
  const [selectedTeamId, setSelectedTeamId] = useState("all");

  const events = overview?.games || [];
  const teams = overview?.teams || [];
  const groups = overview?.groups || [];

  const teamById = useMemo(
    () => new Map(teams.map((team) => [String(team.id), team])),
    [teams],
  );

  const sortedEvents = useMemo(
    () =>
      [...events].sort((a, b) => {
        const aDate = getEventDate(a);
        const bDate = getEventDate(b);
        if (aDate !== bDate) return aDate.localeCompare(bDate);
        return getEventTime(a).localeCompare(getEventTime(b));
      }),
    [events],
  );

  const filteredEvents = useMemo(() => {
    if (selectedTeamId === "all") return sortedEvents;
    return sortedEvents.filter(
      (event) =>
        String(event.home_team_id) === selectedTeamId ||
        String(event.away_team_id) === selectedTeamId,
    );
  }, [selectedTeamId, sortedEvents]);

  const upcomingSections = useMemo(
    () => groupEventsByDate(filteredEvents.filter((event) => !isPastEvent(event))),
    [filteredEvents],
  );
  const pastSections = useMemo(
    () => groupEventsByDate(filteredEvents.filter((event) => isPastEvent(event)).reverse()),
    [filteredEvents],
  );

  return (
    <Tabs defaultValue="matches" className="space-y-4">
      <TabsList className="w-full justify-start overflow-x-auto">
        <TabsTrigger value="matches">Matches</TabsTrigger>
        <TabsTrigger value="teams">Teams</TabsTrigger>
        <TabsTrigger value="groups">Groups</TabsTrigger>
      </TabsList>

      <TabsContent value="matches" className="space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-primary">Schedule</p>
            <h2 className="text-xl font-bold text-foreground">All fixtures</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Browse upcoming and past matches by date, or filter by team.
            </p>
          </div>
          <div className="w-full max-w-sm">
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
              Filter by team
            </p>
            <Select value={selectedTeamId} onValueChange={setSelectedTeamId}>
              <SelectTrigger>
                <SelectValue placeholder="All teams" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All teams</SelectItem>
                {teams.map((team) => (
                  <SelectItem key={team.id} value={String(team.id)}>
                    {team.name_en}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <Card className="bg-card text-card-foreground">
            <CardContent className="p-4">
              <p className="text-2xl font-black">{filteredEvents.length}</p>
              <p className="text-xs font-bold uppercase text-muted-foreground">Matches shown</p>
            </CardContent>
          </Card>
          <Card className="bg-card text-card-foreground">
            <CardContent className="p-4">
              <p className="text-2xl font-black">{upcomingSections.reduce((sum, section) => sum + section.items.length, 0)}</p>
              <p className="text-xs font-bold uppercase text-muted-foreground">Upcoming</p>
            </CardContent>
          </Card>
          <Card className="bg-card text-card-foreground">
            <CardContent className="p-4">
              <p className="text-2xl font-black">{pastSections.reduce((sum, section) => sum + section.items.length, 0)}</p>
              <p className="text-xs font-bold uppercase text-muted-foreground">Past</p>
            </CardContent>
          </Card>
        </div>

        <MatchSections
          title="Upcoming matches"
          emptyLabel="No upcoming fixtures found for this selection."
          sections={upcomingSections}
          teamById={teamById}
        />

        <MatchSections
          title="Past matches"
          emptyLabel="No past fixtures found for this selection."
          sections={pastSections}
          teamById={teamById}
        />
      </TabsContent>

      <TabsContent value="teams" className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-primary">Nations</p>
            <h2 className="text-xl font-bold text-foreground">Participating teams</h2>
          </div>
          <Badge variant="secondary">
            <UsersRound className="mr-1 size-3.5" />
            {teams.length}
          </Badge>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {teams.map((team) => (
            <Card key={team.id} className="border-border/70 bg-card text-card-foreground">
              <CardContent className="relative flex items-center gap-3 overflow-hidden p-4">
                <div className="absolute inset-0 z-0 bg-gradient-to-br from-foreground/[0.03] via-transparent to-emerald-500/[0.08] dark:from-white/[0.02] dark:to-emerald-400/[0.08]" />
                {team.flag ? (
                  <div className="pointer-events-none absolute -right-3 -top-3 z-0 opacity-[0.08] dark:opacity-[0.05]">
                    <Image src={team.flag} alt="" width={88} height={88} className="size-20 object-contain" />
                  </div>
                ) : null}
                <div className="relative z-10 flex items-center gap-3">
                  {team.flag ? (
                    <Image src={team.flag} alt="" width={40} height={40} className="size-10 object-contain" />
                  ) : (
                    <div className="grid size-10 place-items-center rounded-full bg-secondary text-xs font-black">
                      {(team.name_en || "?").slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <p className="min-w-0 text-sm font-bold leading-tight break-words text-foreground">
                    {team.name_en}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </TabsContent>

      <TabsContent value="groups" className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-primary">Groups</p>
            <h2 className="text-xl font-bold text-foreground">Standings</h2>
          </div>
          <Badge variant="secondary">{groups.length} groups</Badge>
        </div>
        <div className="grid gap-3 lg:grid-cols-2">
          {groups.map((group) => (
            <Card key={group._id} className="border-border/70 bg-card text-card-foreground">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-foreground">Group {group.name}</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-2">
                {group.teams.map((entry) => {
                  const team = teamById.get(String(entry.team_id));
                  return (
                    <div
                      key={entry._id}
                      className="relative grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 overflow-hidden rounded-2xl border border-border/60 bg-card p-3 text-sm"
                    >
                      <div className="absolute inset-0 z-0 bg-gradient-to-r from-foreground/[0.03] via-transparent to-emerald-500/[0.08] dark:from-white/[0.02] dark:to-emerald-400/[0.08]" />
                      {team?.flag ? (
                        <div className="pointer-events-none absolute -right-3 top-1/2 z-0 -translate-y-1/2 opacity-[0.08] dark:opacity-[0.05]">
                          <Image src={team.flag} alt="" width={88} height={60} className="h-14 w-auto object-contain" />
                        </div>
                      ) : null}
                      <div className="relative z-10 min-w-0">
                        <p className="font-bold leading-tight break-words text-foreground">
                          {team?.name_en || `Team ${entry.team_id}`}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          MP {entry.mp} · GD {entry.gd}
                        </p>
                      </div>
                      <span className="relative z-10 font-semibold text-muted-foreground">
                        {entry.w}-{entry.d}-{entry.l}
                      </span>
                      <div className="relative z-10 flex min-w-[62px] flex-col items-center rounded-2xl bg-emerald-950 px-3 py-2 text-white shadow-[0_10px_24px_rgba(6,78,59,0.24)] dark:bg-emerald-600">
                        <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/70">
                          Pts
                        </span>
                        <span className="text-lg font-black leading-none">{entry.pts}</span>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          ))}
        </div>
      </TabsContent>
    </Tabs>
  );
}

export { getEventDate, getEventTime, formatDate };
