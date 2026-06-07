"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  History,
  Minus,
  Palette,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Settings,
  Shirt,
  Swords,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const PHASE_LABELS = {
  first_half: "First Half",
  half_time: "Half Time",
  second_half: "Second Half",
  full_time: "Full Time",
};

const GOAL_TYPES = [
  ["normal", "Normal"],
  ["free_kick", "Free Kick"],
  ["corner", "Corner"],
  ["own_goal", "Own Goal"],
  ["penalty", "Penalty"],
];

export function MatchScoringConsole({ match, players }) {
  const router = useRouter();
  const [assignments, setAssignments] = useState(() =>
    Object.fromEntries(
      players.map((player, index) => [
        player.bookingId,
        player.team || (index % 2 === 0 ? "home" : "away"),
      ]),
    ),
  );
  const [liveMatch, setLiveMatch] = useState(match);
  const [elapsed, setElapsed] = useState(getElapsed(match));
  const [selectedTeam, setSelectedTeam] = useState("home");
  const [pitchTheme, setPitchTheme] = useState(0);
  const [showTimeline, setShowTimeline] = useState(false);
  const [goalDrawer, setGoalDrawer] = useState(null);
  const [loading, setLoading] = useState("");
  const [message, setMessage] = useState("");
  const isLive = liveMatch.status === "live";
  const isCompleted = liveMatch.status === "completed";

  useEffect(() => {
    setElapsed(getElapsed(liveMatch));
    if (!liveMatch.timerRunning) return undefined;
    const interval = window.setInterval(
      () => setElapsed(getElapsed(liveMatch)),
      1000,
    );
    return () => window.clearInterval(interval);
  }, [liveMatch]);

  useEffect(() => {
    if (!isLive) return undefined;
    const interval = window.setInterval(async () => {
      const response = await fetch("/api/matches", { cache: "no-store" });
      if (!response.ok) return;
      const result = await response.json();
      const updated = result.data?.matches?.find(
        (candidate) => candidate.id === match.id,
      );
      if (updated) setLiveMatch(updated);
    }, 3000);
    return () => window.clearInterval(interval);
  }, [isLive, match.id]);

  async function request(path, body, loadingKey) {
    setLoading(loadingKey);
    setMessage("");
    const response = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const result = await response.json();
    setLoading("");
    if (!response.ok) {
      setMessage(result?.error?.message || "Could not update match");
      return null;
    }
    setLiveMatch(result.data.match);
    return result.data.match;
  }

  async function kickoff() {
    const updated = await request(
      `/api/matches/${match.id}/kickoff`,
      {
        assignments: players.map((player) => ({
          bookingId: player.bookingId,
          team: assignments[player.bookingId],
        })),
      },
      "kickoff",
    );
    if (updated) router.refresh();
  }

  const updateScore = (team, change) =>
    request(`/api/matches/${match.id}/score`, { team, change }, "score");

  async function recordGoal(goal) {
    const updated = await request(
      `/api/matches/${match.id}/score`,
      {
        team: goal.team,
        change: 1,
        goalType: goal.goalType,
        scorerBookingId: goal.scorerBookingId,
        assistBookingId: goal.assistBookingId || "",
      },
      "record-goal",
    );
    if (updated) setGoalDrawer(null);
  }

  const control = (action, extra = {}) =>
    request(
      `/api/matches/${match.id}/control`,
      { action, ...extra },
      action,
    );

  async function finishMatch() {
    const updated = await request(
      `/api/matches/${match.id}/score`,
      { finish: true },
      "finish",
    );
    if (updated) router.refresh();
  }

  if (!isLive && !isCompleted) {
    return (
      <div className="grid gap-4">
        <TeamAssignment
          match={liveMatch}
          players={players}
          assignments={assignments}
          setAssignments={setAssignments}
        />
        <Button
          className="w-full"
          disabled={!players.length || Boolean(loading)}
          onClick={kickoff}>
          <Swords /> {loading === "kickoff" ? "Starting..." : "Kick off match"}
        </Button>
        {!players.length && (
          <p className="text-sm font-semibold text-muted-foreground">
            Confirm players before kicking off.
          </p>
        )}
        <StatusMessage message={message} />
      </div>
    );
  }

  const teamPlayers = players.filter(
    (player) => player.team === selectedTeam,
  );

  return (
    <div className="grid gap-4">
      <header className="overflow-hidden rounded-2xl bg-[#101218] text-white shadow-[0_18px_42px_rgba(0,0,0,0.24)]">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 p-4">
          <TeamScore
            side="home"
            name={liveMatch.homeTeam}
            score={liveMatch.homeScore}
            timeouts={liveMatch.homeTimeouts}
            disabled={isCompleted || Boolean(loading)}
            onRemove={() => updateScore("home", -1)}
            onAdd={() => setGoalDrawer(createGoalDraft("home", players))}
            onTimeout={() => control("timeout", { team: "home" })}
          />
          <div className="grid justify-items-center gap-1 text-center">
            <p className="text-[0.65rem] font-bold uppercase text-white/55">
              {PHASE_LABELS[liveMatch.phase] || "Live"}
            </p>
            <p className="text-3xl font-bold">
              {liveMatch.homeScore || 0} : {liveMatch.awayScore || 0}
            </p>
            <button
              type="button"
              disabled={isCompleted}
              onClick={() =>
                control(liveMatch.timerRunning ? "pause" : "resume")
              }
              className="mt-1 inline-flex items-center gap-1.5 text-sm font-bold text-white">
              {liveMatch.timerRunning ? (
                <Pause className="size-4 text-red-500" />
              ) : (
                <Play className="size-4 text-primary" />
              )}
              {formatTimer(elapsed)}
            </button>
          </div>
          <TeamScore
            side="away"
            name={liveMatch.awayTeam}
            score={liveMatch.awayScore}
            timeouts={liveMatch.awayTimeouts}
            disabled={isCompleted || Boolean(loading)}
            onRemove={() => updateScore("away", -1)}
            onAdd={() => setGoalDrawer(createGoalDraft("away", players))}
            onTimeout={() => control("timeout", { team: "away" })}
          />
        </div>
      </header>

      {!isCompleted && (
        <Button
          className="w-full bg-violet-600 text-white hover:bg-violet-500"
          disabled={Boolean(loading)}
          onClick={() =>
            control(
              liveMatch.phase === "half_time" ? "second_half" : "half_time",
            )
          }>
          {liveMatch.phase === "half_time"
            ? "Start Second Half"
            : "Half Time"}
        </Button>
      )}

      <section
        className={`relative min-h-[420px] overflow-hidden rounded-2xl p-4 text-white ring-4 ring-white/70 ring-inset ${
          ["bg-[#168447]", "bg-[#176b87]", "bg-[#743a88]"][pitchTheme]
        }`}>
        <div className="pointer-events-none absolute inset-x-0 top-1/2 border-t-2 border-white/70" />
        <div className="pointer-events-none absolute left-1/2 top-1/2 size-28 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/70" />
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase text-white/70">Lineup</p>
            <h2 className="text-lg font-bold">
              {selectedTeam === "home"
                ? liveMatch.homeTeam
                : liveMatch.awayTeam}
            </h2>
          </div>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() =>
              setSelectedTeam((team) => (team === "home" ? "away" : "home"))
            }>
            {selectedTeam === "home" ? (
              <ChevronRight />
            ) : (
              <ChevronLeft />
            )}
            Switch team
          </Button>
        </div>
        <div className="relative z-10 mt-8 grid grid-cols-3 gap-x-3 gap-y-10">
          {teamPlayers.map((player, index) => (
            <div key={player.bookingId} className="grid justify-items-center">
              <button
                type="button"
                disabled={isCompleted}
                onClick={() =>
                  setGoalDrawer({
                    team: selectedTeam,
                    goalType: "normal",
                    scorerBookingId: player.bookingId,
                    assistBookingId: "",
                  })
                }
                className="relative grid size-16 place-items-center rounded-2xl bg-white text-slate-900 shadow-lg disabled:opacity-70">
                <Shirt className="size-9" />
                <span className="absolute bottom-1 text-[0.65rem] font-bold">
                  {index + 1}
                </span>
              </button>
              <p className="mt-2 max-w-24 truncate text-xs font-bold">
                @{player.username || player.name}
              </p>
            </div>
          ))}
          {!teamPlayers.length && (
            <p className="col-span-3 mt-24 text-center text-sm font-semibold text-white/75">
              No players assigned to this team.
            </p>
          )}
        </div>
      </section>

      {showTimeline && (
        <section className="rounded-2xl bg-card p-4 ring-1 ring-border">
          <div className="flex items-center justify-between">
            <h2 className="font-bold">Match timeline</h2>
            <button type="button" onClick={() => setShowTimeline(false)}>
              <X className="size-4" />
            </button>
          </div>
          <div className="mt-3 grid gap-2">
            {[...(liveMatch.events || [])].reverse().map((event) => (
              <div
                key={event.id}
                className="flex items-center justify-between rounded-xl bg-secondary p-3 text-sm">
                <span className="font-semibold">{event.label}</span>
                <span className="text-muted-foreground">
                  {formatMinute(event.elapsedSeconds)}
                </span>
              </div>
            ))}
            {!liveMatch.events?.length && (
              <p className="text-sm text-muted-foreground">No events yet.</p>
            )}
          </div>
        </section>
      )}

      <div className="grid grid-cols-4 gap-2 rounded-2xl bg-card p-2 ring-1 ring-border">
        <ToolButton icon={Settings} label="Manage" />
        <ToolButton
          icon={History}
          label="Timeline"
          onClick={() => setShowTimeline((visible) => !visible)}
        />
        <ToolButton
          icon={RotateCcw}
          label="Undo"
          disabled={isCompleted || Boolean(loading)}
          onClick={() => control("undo")}
        />
        <ToolButton
          icon={Palette}
          label="Theme"
          onClick={() => setPitchTheme((current) => (current + 1) % 3)}
        />
      </div>

      {!isCompleted && (
        <Button
          variant="outline"
          className="w-full"
          disabled={Boolean(loading)}
          onClick={finishMatch}>
          <Check /> {loading === "finish" ? "Finishing..." : "Finish match"}
        </Button>
      )}
      <StatusMessage message={message} />
      {goalDrawer && (
        <GoalDrawer
          goal={goalDrawer}
          setGoal={setGoalDrawer}
          match={liveMatch}
          players={players}
          loading={loading === "record-goal"}
          onClose={() => setGoalDrawer(null)}
          onSubmit={recordGoal}
        />
      )}
    </div>
  );
}

function TeamAssignment({ match, players, assignments, setAssignments }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {["home", "away"].map((team) => (
        <section key={team} className="rounded-2xl bg-card p-4 ring-1 ring-border">
          <h2 className="font-bold">
            {team === "home" ? match.homeTeam : match.awayTeam}
          </h2>
          <div className="mt-3 grid gap-2">
            {players.map((player) => {
              const selected = assignments[player.bookingId] === team;
              return (
                <button
                  key={player.bookingId}
                  type="button"
                  onClick={() =>
                    setAssignments((current) => ({
                      ...current,
                      [player.bookingId]: team,
                    }))
                  }
                  className={`flex items-center justify-between rounded-xl p-3 text-left text-sm font-semibold ring-1 ${
                    selected
                      ? "bg-primary text-primary-foreground ring-primary"
                      : "bg-secondary ring-border"
                  }`}>
                  @{player.username || player.name}
                  {selected && <Check className="size-4" />}
                </button>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

function TeamScore({
  name,
  timeouts,
  disabled,
  onRemove,
  onAdd,
  onTimeout,
}) {
  return (
    <div className="grid justify-items-center gap-2 text-center">
      <div className="grid size-10 place-items-center rounded-full bg-white/10 text-sm font-bold">
        {getInitials(name)}
      </div>
      <p className="max-w-24 truncate text-xs font-bold">{name}</p>
      <div className="flex gap-1">
        <button
          type="button"
          disabled={disabled}
          onClick={onRemove}
          className="grid size-7 place-items-center rounded-full bg-white/10 disabled:opacity-40">
          <Minus className="size-3.5" />
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={onAdd}
          className="grid size-7 place-items-center rounded-full bg-primary text-primary-foreground disabled:opacity-40">
          <Plus className="size-3.5" />
        </button>
      </div>
      <button
        type="button"
        disabled={disabled}
        onClick={onTimeout}
        className="text-[0.65rem] font-bold text-white/65">
        T/O {timeouts || 0}
      </button>
    </div>
  );
}

function GoalDrawer({
  goal,
  setGoal,
  match,
  players,
  loading,
  onClose,
  onSubmit,
}) {
  const teamPlayers = players.filter((player) => player.team === goal.team);
  const assistPlayers = teamPlayers.filter(
    (player) => player.bookingId !== goal.scorerBookingId,
  );

  return (
    <div className="fixed inset-0 z-[90] flex items-end bg-black/45">
      <button
        type="button"
        className="absolute inset-0"
        onClick={onClose}
        aria-label="Close goal drawer"
      />
      <section className="relative z-10 w-full rounded-t-3xl bg-card p-5 shadow-2xl animate-[goal-drawer-in_240ms_ease-out] sm:mx-auto sm:mb-4 sm:max-w-lg sm:rounded-3xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-primary">Live scoring</p>
            <h2 className="text-xl font-bold">Record Goal</h2>
          </div>
          <button type="button" onClick={onClose}>
            <X className="size-5" />
          </button>
        </div>

        <div className="mt-5 grid grid-cols-2 rounded-xl bg-secondary p-1">
          {["home", "away"].map((team) => (
            <button
              key={team}
              type="button"
              onClick={() =>
                setGoal({
                  ...goal,
                  team,
                  scorerBookingId:
                    players.find((player) => player.team === team)?.bookingId ||
                    "",
                  assistBookingId: "",
                })
              }
              className={`rounded-lg px-3 py-2 text-sm font-bold ${
                goal.team === team
                  ? "bg-violet-600 text-white"
                  : "text-muted-foreground"
              }`}>
              {team === "home" ? match.homeTeam : match.awayTeam}
            </button>
          ))}
        </div>

        <div className="mt-5">
          <p className="text-sm font-bold">Goal type</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {GOAL_TYPES.map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setGoal({ ...goal, goalType: value })}
                className={`rounded-full px-3 py-2 text-xs font-bold ring-1 ${
                  goal.goalType === value
                    ? "bg-violet-600 text-white ring-violet-600"
                    : "bg-card ring-border"
                }`}>
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5 grid gap-4">
          <label className="grid gap-2 text-sm font-bold">
            Scorer
            <Select
              value={goal.scorerBookingId}
              onValueChange={(value) =>
                setGoal({ ...goal, scorerBookingId: value, assistBookingId: "" })
              }>
              <SelectTrigger>
                <SelectValue placeholder="Select scorer" />
              </SelectTrigger>
              <SelectContent>
                {teamPlayers.map((player) => (
                  <SelectItem key={player.bookingId} value={player.bookingId}>
                    @{player.username || player.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>
          <label className="grid gap-2 text-sm font-bold">
            Assist
            <Select
              value={goal.assistBookingId || "none"}
              onValueChange={(value) =>
                setGoal({
                  ...goal,
                  assistBookingId: value === "none" ? "" : value,
                })
              }>
              <SelectTrigger>
                <SelectValue placeholder="No assist" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No assist</SelectItem>
                {assistPlayers.map((player) => (
                  <SelectItem key={player.bookingId} value={player.bookingId}>
                    @{player.username || player.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>
        </div>

        <Button
          className="mt-6 w-full bg-violet-600 text-white hover:bg-violet-500"
          disabled={!goal.scorerBookingId || loading}
          onClick={() => onSubmit(goal)}>
          {loading ? "Recording..." : "Record Goal"}
        </Button>
      </section>
    </div>
  );
}

function ToolButton({ icon: Icon, label, onClick, disabled }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl text-[0.65rem] font-bold text-muted-foreground hover:bg-secondary hover:text-foreground disabled:opacity-40">
      <Icon className="size-4" />
      {label}
    </button>
  );
}

function StatusMessage({ message }) {
  return message ? (
    <p className="text-sm font-semibold text-red-500">{message}</p>
  ) : null;
}

function getElapsed(match) {
  return (
    Number(match.elapsedSeconds || 0) +
    (match.timerRunning && match.timerStartedAt
      ? Math.max(
          0,
          Math.floor(
            (Date.now() - new Date(match.timerStartedAt).getTime()) / 1000,
          ),
        )
      : 0)
  );
}

function formatTimer(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
}

function formatMinute(seconds = 0) {
  return `${Math.floor(seconds / 60)}'`;
}

function getInitials(name = "") {
  return name
    .split(/\s+/)
    .map((part) => part[0] || "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function createGoalDraft(team, players) {
  return {
    team,
    goalType: "normal",
    scorerBookingId:
      players.find((player) => player.team === team)?.bookingId || "",
    assistBookingId: "",
  };
}
