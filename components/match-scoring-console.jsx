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
  Shuffle,
  Swords,
  X,
  Goal,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

export function MatchScoringConsole({
  match,
  players,
  canManageCompleted = false,
}) {
  const router = useRouter();
  const [scoringPlayers, setScoringPlayers] = useState(players);
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
  const [playerAction, setPlayerAction] = useState(null);
  const [showManage, setShowManage] = useState(false);
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [teamNameDraft, setTeamNameDraft] = useState({
    homeTeam: match.homeTeam,
    awayTeam: match.awayTeam,
  });
  const [offlinePlayer, setOfflinePlayer] = useState({ name: "", phone: "" });
  const [playerLookup, setPlayerLookup] = useState({
    status: "idle",
    player: null,
    alreadyAdded: false,
    message: "",
  });
  const [loading, setLoading] = useState("");
  const [message, setMessage] = useState("");
  const isLive = liveMatch.status === "live";
  const isCompleted = liveMatch.status === "completed";

  useEffect(() => {
    setScoringPlayers(players);
    setAssignments((current) =>
      Object.fromEntries(
        players.map((player, index) => [
          player.bookingId,
          current[player.bookingId] ||
            player.team ||
            (index % 2 === 0 ? "home" : "away"),
        ]),
      ),
    );
  }, [players]);

  useEffect(() => {
    setTeamNameDraft({
      homeTeam: liveMatch.homeTeam,
      awayTeam: liveMatch.awayTeam,
    });
  }, [liveMatch.homeTeam, liveMatch.awayTeam]);

  useEffect(() => {
    setScoringPlayers((current) =>
      current.map((player) => ({
        ...player,
        team: player.team || assignments[player.bookingId],
      })),
    );
  }, [assignments]);

  useEffect(() => {
    if (!showAddPlayer || offlinePlayer.phone.length !== 10) {
      setPlayerLookup({
        status: "idle",
        player: null,
        alreadyAdded: false,
        message: "",
      });
      return undefined;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setPlayerLookup({
        status: "checking",
        player: null,
        alreadyAdded: false,
        message: "",
      });
      try {
        const response = await fetch(
          `/api/matches/${match.id}/offline-player?phone=${encodeURIComponent(
            offlinePlayer.phone,
          )}`,
          { signal: controller.signal },
        );
        const result = await response.json();
        if (!response.ok) {
          setPlayerLookup({
            status: "error",
            player: null,
            alreadyAdded: false,
            message: result?.error?.message || "Could not look up player",
          });
          return;
        }
        setPlayerLookup({
          status: result.data.found ? "found" : "not-found",
          player: result.data.player || null,
          alreadyAdded: Boolean(result.data.alreadyAdded),
          message: "",
        });
      } catch (error) {
        if (error.name === "AbortError") return;
        setPlayerLookup({
          status: "error",
          player: null,
          alreadyAdded: false,
          message: "Could not look up player",
        });
      }
    }, 250);

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [showAddPlayer, offlinePlayer.phone, match.id]);

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
        assignments: scoringPlayers.map((player) => ({
          bookingId: player.bookingId,
          team: assignments[player.bookingId],
        })),
      },
      "kickoff",
    );
    if (updated) {
      setScoringPlayers((current) =>
        current.map((player) => ({
          ...player,
          team: assignments[player.bookingId] || player.team,
        })),
      );
      router.refresh();
    }
  }

  function randomizeAssignments() {
    setAssignments(() => {
      const shuffled = shufflePlayers(scoringPlayers);
      const homeCount = Math.ceil(shuffled.length / 2);
      return Object.fromEntries(
        shuffled.map((player, index) => [
          player.bookingId,
          index < homeCount ? "home" : "away",
        ]),
      );
    });
  }

  async function addOfflinePlayer() {
    const nextTeam = isLive
      ? selectedTeam
      : Object.values(assignments).filter((team) => team === "home").length <=
          Object.values(assignments).filter((team) => team === "away").length
        ? "home"
        : "away";
    setLoading("offline-player");
    setMessage("");
    const response = await fetch(`/api/matches/${match.id}/offline-player`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...offlinePlayer, team: nextTeam }),
    });
    const result = await response.json();
    setLoading("");
    if (!response.ok) {
      setMessage(result?.error?.message || "Could not add offline player");
      return;
    }

    const booking = result.data.booking;
    const registeredPlayer = result.data.player;
    const player = {
      bookingId: booking.id,
      team: booking.team || nextTeam,
      name: registeredPlayer?.name || booking.guestName,
      username: registeredPlayer?.username || booking.guestUsername,
      phone: registeredPlayer?.phone || booking.guestPhone,
      isOffline: !registeredPlayer,
    };
    setScoringPlayers((current) => [...current, player]);
    setAssignments((current) => ({
      ...current,
      [player.bookingId]: player.team,
    }));
    setShowAddPlayer(false);
    setOfflinePlayer({ name: "", phone: "" });
    setPlayerLookup({
      status: "idle",
      player: null,
      alreadyAdded: false,
      message: "",
    });
    setMessage("");
    router.refresh();
  }

  async function updateTeamNames() {
    setLoading("team-names");
    setMessage("");
    const response = await fetch(`/api/matches/${match.id}/manage`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(teamNameDraft),
    });
    const result = await response.json();
    setLoading("");
    if (!response.ok) {
      setMessage(result?.error?.message || "Could not update team names");
      return;
    }
    setLiveMatch(result.data.match);
    setMessage("");
    router.refresh();
  }

  async function removePlayer(bookingId) {
    setLoading(`remove-${bookingId}`);
    setMessage("");
    const response = await fetch(`/api/matches/${match.id}/manage`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId }),
    });
    const result = await response.json();
    setLoading("");
    if (!response.ok) {
      setMessage(result?.error?.message || "Could not remove player");
      return;
    }
    setScoringPlayers((current) =>
      current.filter((player) => player.bookingId !== bookingId),
    );
    setAssignments((current) => {
      const next = { ...current };
      delete next[bookingId];
      return next;
    });
    setMessage("");
    router.refresh();
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

  async function recordPlayerEvent(type) {
    if (!playerAction) return;
    const updated = await request(
      `/api/matches/${match.id}/score`,
      {
        team: playerAction.team,
        playerEventType: type,
        playerBookingId: playerAction.player.bookingId,
      },
      `player-event-${type}`,
    );
    if (updated) setPlayerAction(null);
  }

  const control = (action, extra = {}) =>
    request(`/api/matches/${match.id}/control`, { action, ...extra }, action);

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
          scoringPlayers={scoringPlayers}
          assignments={assignments}
          setAssignments={setAssignments}
          onRandomize={randomizeAssignments}
          showAddPlayer={showAddPlayer}
          setShowAddPlayer={setShowAddPlayer}
          offlinePlayer={offlinePlayer}
          setOfflinePlayer={setOfflinePlayer}
          playerLookup={playerLookup}
          onAddOfflinePlayer={addOfflinePlayer}
          addingOfflinePlayer={loading === "offline-player"}
        />
        <Button
          className="w-full"
          disabled={!scoringPlayers.length || Boolean(loading)}
          onClick={kickoff}>
          <Swords /> {loading === "kickoff" ? "Starting..." : "Kick off match"}
        </Button>
        {!scoringPlayers.length && (
          <p className="text-sm font-semibold text-muted-foreground">
            Confirm players before kicking off.
          </p>
        )}
        <StatusMessage message={message} />
      </div>
    );
  }

  const activePlayers = scoringPlayers.map((player) => ({
    ...player,
    team: player.team || assignments[player.bookingId],
  }));

  if (isCompleted) {
    return (
      <div className="grid gap-4">
        <MatchStats match={liveMatch} players={activePlayers} />
        {canManageCompleted && (
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => setShowManage(true)}>
            <Settings />
            Match settings
          </Button>
        )}
        <StatusMessage message={message} />
        {showManage && (
          <ManageDrawer
            match={liveMatch}
            players={activePlayers}
            loading={loading}
            isCompleted
            teamNameDraft={teamNameDraft}
            setTeamNameDraft={setTeamNameDraft}
            showAddPlayer={false}
            setShowAddPlayer={setShowAddPlayer}
            offlinePlayer={offlinePlayer}
            setOfflinePlayer={setOfflinePlayer}
            playerLookup={playerLookup}
            onClose={() => setShowManage(false)}
            onSaveTeamNames={updateTeamNames}
            onAddPlayer={addOfflinePlayer}
            onRemovePlayer={removePlayer}
          />
        )}
      </div>
    );
  }

  const teamPlayers = activePlayers.filter(
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
            onAdd={() => setGoalDrawer(createGoalDraft("home", activePlayers))}
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
            onAdd={() => setGoalDrawer(createGoalDraft("away", activePlayers))}
            onTimeout={() => control("timeout", { team: "away" })}
          />
        </div>
      </header>

      <Button
        className="w-full bg-violet-600 text-white hover:bg-violet-500"
        disabled={Boolean(loading)}
        onClick={() =>
          control(liveMatch.phase === "half_time" ? "second_half" : "half_time")
        }>
        {liveMatch.phase === "half_time" ? "Start Second Half" : "Half Time"}
      </Button>

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
            {selectedTeam === "home" ? <ChevronRight /> : <ChevronLeft />}
            Switch team
          </Button>
        </div>
        <div className="relative z-10 mt-8 grid grid-cols-3 gap-x-3 gap-y-10">
          {teamPlayers.map((player, index) => (
            <div key={player.bookingId} className="grid justify-items-center">
              <button
                type="button"
                disabled={isCompleted}
                onClick={() => setPlayerAction({ team: selectedTeam, player })}
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
        <ToolButton
          icon={Settings}
          label="Manage"
          onClick={() => setShowManage(true)}
        />
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

      <Button
        variant="outline"
        className="w-full"
        disabled={Boolean(loading)}
        onClick={finishMatch}>
        <Check /> {loading === "finish" ? "Finishing..." : "Finish match"}
      </Button>
      <StatusMessage message={message} />
      {goalDrawer && (
        <GoalDrawer
          goal={goalDrawer}
          setGoal={setGoalDrawer}
          match={liveMatch}
          players={activePlayers}
          loading={loading === "record-goal"}
          onClose={() => setGoalDrawer(null)}
          onSubmit={recordGoal}
        />
      )}
      {playerAction && (
        <PlayerActionDrawer
          action={playerAction}
          loading={loading}
          onClose={() => setPlayerAction(null)}
          onGoal={() => {
            setGoalDrawer({
              team: playerAction.team,
              goalType: "normal",
              scorerBookingId: playerAction.player.bookingId,
              assistBookingId: "",
            });
            setPlayerAction(null);
          }}
          onEvent={recordPlayerEvent}
        />
      )}
      {showManage && (
        <ManageDrawer
          match={liveMatch}
          players={activePlayers}
          loading={loading}
          isCompleted={isCompleted}
          teamNameDraft={teamNameDraft}
          setTeamNameDraft={setTeamNameDraft}
          showAddPlayer={showAddPlayer}
          setShowAddPlayer={setShowAddPlayer}
          offlinePlayer={offlinePlayer}
          setOfflinePlayer={setOfflinePlayer}
          playerLookup={playerLookup}
          onClose={() => setShowManage(false)}
          onSaveTeamNames={updateTeamNames}
          onAddPlayer={addOfflinePlayer}
          onRemovePlayer={removePlayer}
        />
      )}
    </div>
  );
}

function TeamAssignment({
  match,
  scoringPlayers,
  assignments,
  setAssignments,
  onRandomize,
  showAddPlayer,
  setShowAddPlayer,
  offlinePlayer,
  setOfflinePlayer,
  playerLookup,
  onAddOfflinePlayer,
  addingOfflinePlayer,
}) {
  const teamMeta = {
    home: {
      name: match.homeTeam,
      direction: "normal",
      accent: "bg-emerald-400 text-emerald-950",
    },
    away: {
      name: match.awayTeam,
      direction: "reverse",
      accent: "bg-sky-300 text-sky-950",
    },
  };

  return (
    <section className="overflow-hidden rounded-2xl bg-card ring-1 ring-border">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
        <div>
          <p className="text-xs font-bold uppercase text-muted-foreground">
            Team selection
          </p>
          <h2 className="text-lg font-bold">Set the match lineup</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setShowAddPlayer((visible) => !visible);
              setOfflinePlayer({ name: "", phone: "" });
            }}>
            <Plus /> {showAddPlayer ? "Close" : "Add player"}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!scoringPlayers.length}
            onClick={onRandomize}>
            <Shuffle /> Randomize teams
          </Button>
        </div>
      </div>

      {showAddPlayer && (
        <div className="grid gap-3 border-b border-border p-4">
          <div className="grid gap-3 md:grid-cols-[1fr_auto]">
            <Input
              value={offlinePlayer.phone}
              onChange={(event) =>
                setOfflinePlayer((current) => ({
                  ...current,
                  phone: event.target.value.replace(/\D/g, "").slice(0, 10),
                }))
              }
              inputMode="numeric"
              placeholder="Enter mobile number"
            />
            <Button
              type="button"
              className="md:min-w-44"
              disabled={
                addingOfflinePlayer ||
                offlinePlayer.phone.trim().length < 10 ||
                playerLookup.status === "checking" ||
                playerLookup.alreadyAdded ||
                (playerLookup.status !== "found" &&
                  offlinePlayer.name.trim().length < 2)
              }
              onClick={onAddOfflinePlayer}>
              <Plus />{" "}
              {addingOfflinePlayer
                ? "Adding..."
                : playerLookup.status === "found"
                  ? "Add registered player"
                  : "Add offline player"}
            </Button>
          </div>

          {playerLookup.status === "checking" && (
            <p className="text-sm font-semibold text-muted-foreground">
              Checking registered players...
            </p>
          )}

          {playerLookup.status === "found" && (
            <div className="rounded-2xl bg-secondary p-3 text-sm">
              <p className="font-bold">
                @{playerLookup.player?.username || playerLookup.player?.name}
              </p>
              <p className="text-muted-foreground">
                {playerLookup.player?.name}
                {playerLookup.alreadyAdded
                  ? " is already added."
                  : " found in registered users."}
              </p>
            </div>
          )}

          {playerLookup.status === "not-found" && (
            <Input
              value={offlinePlayer.name}
              onChange={(event) =>
                setOfflinePlayer((current) => ({
                  ...current,
                  name: event.target.value,
                }))
              }
              placeholder="Offline player name"
            />
          )}

          {playerLookup.status === "error" && (
            <p className="text-sm font-semibold text-red-500">
              {playerLookup.message}
            </p>
          )}
        </div>
      )}

      <div className="relative min-h-[520px] overflow-hidden bg-[#168447] p-3 text-white sm:p-5">
        <div className="pointer-events-none absolute inset-3 rounded-xl border-2 border-white/65 sm:inset-5" />
        <div className="pointer-events-none absolute inset-x-3 top-1/2 border-t-2 border-white/60 sm:hidden" />
        <div className="pointer-events-none absolute bottom-5 left-1/2 top-5 hidden border-l-2 border-white/60 sm:block" />
        <div className="pointer-events-none absolute left-1/2 top-1/2 size-24 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/60" />
        <div className="relative z-10 grid min-h-[490px] gap-4 sm:grid-cols-2">
          {["home", "away"].map((team) => {
            const teamPlayers = scoringPlayers.filter(
              (player) => assignments[player.bookingId] === team,
            );
            return (
              <LineupSide
                key={team}
                team={team}
                meta={teamMeta[team]}
                players={teamPlayers}
                onTogglePlayer={(bookingId) =>
                  setAssignments((current) => ({
                    ...current,
                    [bookingId]: team === "home" ? "away" : "home",
                  }))
                }
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}

function LineupSide({ team, meta, players, onTogglePlayer }) {
  const rows = getLineupRows(players);

  return (
    <div className="grid min-h-[238px] grid-rows-[auto_1fr] gap-4 rounded-xl bg-black/10 p-3 backdrop-blur-[1px] sm:bg-transparent sm:p-2">
      <div
        className={`flex items-center justify-between gap-3 ${
          meta.direction === "reverse"
            ? "sm:flex-row-reverse sm:text-right"
            : ""
        }`}>
        <div>
          <p className="text-[0.65rem] font-bold uppercase text-white/70">
            {team === "home" ? "Home lineup" : "Away lineup"}
          </p>
          <h3 className="max-w-48 truncate text-base font-bold">{meta.name}</h3>
        </div>
        <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold">
          {players.length} players
        </span>
      </div>

      <div
        className={`grid content-around gap-4 ${
          meta.direction === "reverse" ? "sm:[direction:rtl]" : ""
        }`}>
        {rows.map((row, rowIndex) => (
          <div
            key={`${team}-${rowIndex}`}
            className="flex justify-center gap-3 sm:gap-4">
            {row.map((player) => (
              <button
                key={player.bookingId}
                type="button"
                onClick={() => onTogglePlayer(player.bookingId)}
                className="grid justify-items-center gap-1 text-center sm:[direction:ltr]">
                <span
                  className={`relative grid size-14 place-items-center rounded-2xl shadow-lg ring-2 ring-white/80 ${meta.accent}`}>
                  <Shirt className="size-8" />
                  <span className="absolute bottom-1 text-[0.6rem] font-black">
                    {players.findIndex(
                      (candidate) => candidate.bookingId === player.bookingId,
                    ) + 1}
                  </span>
                </span>
                <span className="max-w-20 truncate text-[0.7rem] font-bold leading-tight text-white drop-shadow">
                  @{player.username || player.name}
                </span>
              </button>
            ))}
          </div>
        ))}
        {!players.length && (
          <div className="grid min-h-40 place-items-center rounded-xl border border-dashed border-white/35 text-center text-sm font-semibold text-white/75">
            Tap players from the other side to move them here.
          </div>
        )}
      </div>
    </div>
  );
}

function TeamScore({ name, timeouts, disabled, onRemove, onAdd, onTimeout }) {
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

function MatchStats({ match, players }) {
  const stats = getMatchStats(match, players);
  const [activeTab, setActiveTab] = useState("summary");
  const tabs = [
    ["summary", "Summary"],
    ["stats", "Stats"],
    ["lineups", "Lineups"],
    ["log", "Log"],
  ];

  return (
    <section className="overflow-hidden rounded-2xl bg-card shadow-[0_18px_42px_rgba(0,0,0,0.18)] ring-1 ring-border">
      <div className="bg-[#101218] p-5 text-white">
        <div className="text-center">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-white/55">
            Full time
          </p>
          <h2 className="mt-1 text-lg font-bold text-primary">
            {stats.resultLabel}
          </h2>
        </div>

        <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <ResultTeam name={match.homeTeam} score={stats.homeScore} />
          <div className="grid justify-items-center text-center">
            <p className="text-5xl font-black leading-none">
              {stats.homeScore} - {stats.awayScore}
            </p>
            <p className="mt-2 rounded-full bg-white/10 px-3 py-1 text-[0.65rem] font-black uppercase text-white/65">
              Final score
            </p>
          </div>
          <ResultTeam
            name={match.awayTeam}
            score={stats.awayScore}
            align="right"
          />
        </div>

        <div className="mt-5 grid grid-cols-2 gap-4 text-sm">
          <ResultScorerList
            goals={stats.goalRows.home}
            empty="No goals recorded"
          />
          <ResultScorerList
            goals={stats.goalRows.away}
            empty="No goals recorded"
            align="right"
          />
        </div>
      </div>

      <div className="grid grid-cols-4 border-b border-border bg-card text-sm font-black">
        {tabs.map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setActiveTab(value)}
            className={`border-b-2 px-2 py-3 ${
              activeTab === value
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground"
            }`}>
            {label}
          </button>
        ))}
      </div>

      <div className="bg-card p-4 text-foreground">
        {activeTab === "summary" && <ResultSummary stats={stats} />}
        {activeTab === "stats" && <ResultStats stats={stats} />}
        {activeTab === "lineups" && (
          <ResultLineups match={match} stats={stats} />
        )}
        {activeTab === "log" && <ResultLog events={match.events || []} />}
      </div>
    </section>
  );
}

function ResultTeam({ name, score, align = "left" }) {
  return (
    <div
      className={`grid gap-2 ${
        align === "right" ? "justify-items-end text-right" : ""
      }`}>
      <div className="grid size-12 place-items-center rounded-full bg-white/10 text-sm font-black">
        {getInitials(name)}
      </div>
      <div>
        <p className="max-w-28 truncate text-sm font-bold">{name}</p>
        <p className="text-xs font-bold text-white/55">{score} goals</p>
      </div>
    </div>
  );
}

function ResultMetric({ label, value, tone = "primary" }) {
  const tones = {
    primary: "from-primary/20 to-primary/5 text-primary",
    accent: "from-accent/25 to-accent/5 text-accent-foreground",
    danger: "from-red-500/20 to-red-500/5 text-red-500",
  };

  return (
    <div
      className={`rounded-2xl bg-gradient-to-br p-3 text-center ${tones[tone]}`}>
      <p className="text-2xl font-black">{value}</p>
      <p className="text-xs font-bold uppercase text-muted-foreground">
        {label}
      </p>
    </div>
  );
}

function ResultSummary({ stats }) {
  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-3 gap-2">
        <ResultMetric label="Goals" value={stats.goals.length} tone="primary" />
        <ResultMetric label="Assists" value={stats.assistCount} tone="accent" />
        <ResultMetric
          label="Cards"
          value={stats.yellowCards + stats.redCards}
          tone="danger"
        />
      </div>

      <section className="grid gap-2">
        <h3 className="text-sm font-black">Goal contributions</h3>
        <div className="grid gap-2 md:grid-cols-2">
          {stats.contributors.map((player) => (
            <ResultContributor key={player.key} player={player} />
          ))}
          {!stats.contributors.length && (
            <EmptyResultText>No goal contributions recorded</EmptyResultText>
          )}
        </div>
      </section>

      <section className="grid gap-2">
        <h3 className="text-sm font-black">Cards & injuries</h3>
        <div className="grid gap-2 md:grid-cols-2">
          {stats.disciplineRows.map((row) => (
            <ResultDisciplineRow key={row.key} row={row} />
          ))}
          {!stats.disciplineRows.length && (
            <EmptyResultText>No cards</EmptyResultText>
          )}
        </div>
      </section>
    </div>
  );
}

function ResultStats({ stats }) {
  return (
    <div className="grid gap-3">
      <ResultCompare
        label="Goals"
        home={stats.teamGoals.home}
        away={stats.teamGoals.away}
      />
      <ResultCompare
        label="Assists"
        home={stats.teamAssists.home}
        away={stats.teamAssists.away}
      />
      <ResultCompare
        label="Fouls"
        home={stats.teamFouls.home}
        away={stats.teamFouls.away}
      />
      <ResultCompare
        label="Yellow cards"
        home={stats.teamYellowCards.home}
        away={stats.teamYellowCards.away}
      />
      <ResultCompare
        label="Red cards"
        home={stats.teamRedCards.home}
        away={stats.teamRedCards.away}
      />
      <ResultCompare
        label="Injuries"
        home={stats.teamInjuries.home}
        away={stats.teamInjuries.away}
      />
    </div>
  );
}

function ResultLineups({ match, stats }) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <ResultTeamSheet title={match.homeTeam} players={stats.teamSheets.home} />
      <ResultTeamSheet
        title={match.awayTeam}
        players={stats.teamSheets.away}
        align="right"
      />
    </div>
  );
}

function ResultLog({ events }) {
  // Only show important event types in the log and color-code them
  const IMPORTANT = new Set([
    "goal",
    "score_correction",
    "yellow_card",
    "red_card",
    "injury",
    "half_time",
    "second_half",
    "full_time",
  ]);

  const EVENT_CLASSES = {
    goal: "bg-gradient-to-r from-emerald-600 to-emerald-500 text-white",
    score_correction: "bg-yellow-400 text-black",
    yellow_card: "bg-yellow-300 text-black",
    red_card: "bg-red-500 text-white",
    injury: "bg-slate-800 text-white",
    // neutral/control events: use transparent background + subtle ring so they remain visible in both themes
    half_time: "bg-transparent text-muted-foreground ring-1 ring-border",
    second_half: "bg-transparent text-muted-foreground ring-1 ring-border",
    full_time: "bg-transparent text-muted-foreground ring-1 ring-border",
  };

  const filtered = [...(events || [])]
    .filter((e) => IMPORTANT.has(e.type))
    .reverse();

  function getCompactLabel(event) {
    const prefix = {
      goal: "⚽",
      score_correction: "↺",
      yellow_card: "🟨",
      red_card: "🟥",
      injury: "✚",
      half_time: "HT",
      second_half: "2H",
      full_time: "FT",
    }[event.type];

    if (event.type === "goal") {
      return `${prefix} ${event.scorerName ? `@${event.scorerName}` : "Goal"}`;
    }
    if (["yellow_card", "red_card", "injury"].includes(event.type)) {
      return `${prefix} ${event.scorerName ? `@${event.scorerName}` : "player"}`;
    }
    return `${prefix} ${event.label}`;
  }

  return (
    <section className="grid gap-2">
      {filtered.map((event) => (
        <div
          key={event.id}
          className={`flex items-center justify-between gap-2 rounded-md p-2 text-xs sm:p-3 sm:text-sm ${
            EVENT_CLASSES[event.type] || "bg-secondary"
          }`}>
          <span className="min-w-0 truncate font-semibold">
            {getCompactLabel(event)}
          </span>
          <span className="shrink-0 text-muted-foreground text-[0.65rem]">
            {formatMinute(event.elapsedSeconds)}
          </span>
        </div>
      ))}
      {!filtered.length && (
        <EmptyResultText>No important match events</EmptyResultText>
      )}
    </section>
  );
}

function ResultScorerList({ goals, empty, align = "left" }) {
  return (
    <div
      className={`grid gap-1 ${align === "right" ? "justify-items-end text-right" : ""}`}>
      {goals.map((goal) => (
        <div key={goal.key} className="min-w-0">
          <p className="truncate text-xs font-black text-white">
            @{goal.scorerName}{" "}
            <span className="text-white/65">{goal.minute}</span>
            {goal.isOwnGoal && (
              <span className="ml-1 rounded-full bg-red-500 px-1.5 py-0.5 text-[0.55rem] text-white">
                OG
              </span>
            )}
          </p>
          {goal.assistName && (
            <p className="truncate text-[0.68rem] font-bold text-white/55">
              Assist @{goal.assistName}
            </p>
          )}
        </div>
      ))}
      {!goals.length && (
        <p className="text-xs font-bold text-white/45">{empty}</p>
      )}
    </div>
  );
}

function ResultContributor({ player }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-card p-3 ring-1 ring-border">
      <div className="min-w-0">
        <p className="truncate font-bold">@{player.name}</p>
        <p className="text-xs font-semibold text-muted-foreground">
          {player.teamName}
        </p>
      </div>
      <div className="flex shrink-0 gap-1">
        <ResultBadge label="G" value={player.goals} tone="goal" />
        <ResultBadge label="A" value={player.assists} tone="assist" />
      </div>
    </div>
  );
}

function ResultDisciplineRow({ row }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-secondary p-3 text-sm">
      <div className="min-w-0">
        <p className="truncate font-bold">@{row.name}</p>
        <p className="text-xs font-semibold text-muted-foreground">
          {row.teamName}
        </p>
      </div>
      <div className="flex shrink-0 gap-1">
        <ResultBadge
          label="YC"
          value={row.yellowCards}
          tone="yellow"
          hideZero
        />
        <ResultBadge label="RC" value={row.redCards} tone="red" hideZero />
        <ResultBadge label="I" value={row.injuries} tone="injury" hideZero />
      </div>
    </div>
  );
}

function ResultTeamSheet({ title, players, align = "left" }) {
  return (
    <section className="overflow-hidden rounded-2xl bg-secondary ring-1 ring-border">
      <div
        className={`flex items-center justify-between gap-3 bg-card p-3 ${
          align === "right" ? "flex-row-reverse text-right" : ""
        }`}>
        <div>
          <p className="text-xs font-black uppercase text-muted-foreground">
            Team
          </p>
          <h3 className="font-black">{title}</h3>
        </div>
        <div className="grid size-11 place-items-center rounded-full bg-primary text-sm font-black text-primary-foreground">
          {getInitials(title)}
        </div>
      </div>
      <div className="grid gap-2 p-3">
        {players.map((player) => (
          <div
            key={player.key}
            className={`flex items-center justify-between gap-3 rounded-xl bg-card p-3 ${
              align === "right" ? "flex-row-reverse text-right" : ""
            }`}>
            <p className="min-w-0 truncate text-sm font-bold">@{player.name}</p>
            <div className="flex shrink-0 gap-1">
              <ResultBadge label="G" value={player.goals} tone="goal" />
              <ResultBadge label="A" value={player.assists} tone="assist" />
            </div>
          </div>
        ))}
        {!players.length && (
          <EmptyResultText>No players listed</EmptyResultText>
        )}
      </div>
    </section>
  );
}

function ResultBadge({ label, value, tone, hideZero = false }) {
  const tones = {
    goal: "bg-primary text-primary-foreground",
    assist: "bg-accent text-accent-foreground",
    yellow: "bg-yellow-300 text-yellow-950",
    red: "bg-red-500 text-white",
    injury: "bg-slate-800 text-white",
  };

  if (hideZero && !value) return null;

  const content =
    tone === "goal" ? (
      <>
        <Goal className="w-3 h-3 mr-1" />
        {value}
      </>
    ) : (
      <>
        {value}
        {label}
      </>
    );

  return (
    <span
      className={`inline-flex min-w-10 items-center justify-center rounded-full px-2 py-1 text-xs font-black ${
        value ? tones[tone] : "bg-secondary text-muted-foreground"
      }`}>
      {content}
    </span>
  );
}

function ResultCompare({ label, home, away }) {
  const total = Math.max(1, home + away);

  return (
    <div className="rounded-xl bg-card p-3">
      <div className="flex items-center justify-between text-sm font-bold">
        <span>{home}</span>
        <span className="text-muted-foreground">{label}</span>
        <span>{away}</span>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-1 overflow-hidden rounded-full bg-secondary">
        <div className="flex justify-end">
          <div
            className="h-2 rounded-l-full bg-primary"
            style={{ width: `${(home / total) * 100}%` }}
          />
        </div>
        <div>
          <div
            className="h-2 rounded-r-full bg-accent"
            style={{ width: `${(away / total) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function EmptyResultText({ children }) {
  return (
    <p className="rounded-xl bg-card p-3 font-semibold text-muted-foreground">
      {children}
    </p>
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
                setGoal({
                  ...goal,
                  scorerBookingId: value,
                  assistBookingId: "",
                })
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

function PlayerActionDrawer({ action, loading, onClose, onGoal, onEvent }) {
  const playerName = action.player.username || action.player.name;
  const eventLoading = loading.startsWith("player-event-");

  return (
    <div className="fixed inset-0 z-[90] flex items-end bg-black/45">
      <button
        type="button"
        className="absolute inset-0"
        onClick={onClose}
        aria-label="Close player actions"
      />
      <section className="relative z-10 w-full rounded-t-3xl bg-card p-5 shadow-2xl animate-[goal-drawer-in_240ms_ease-out] sm:mx-auto sm:mb-4 sm:max-w-lg sm:rounded-3xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-primary">@{playerName}</p>
            <h2 className="text-xl font-bold">Player action</h2>
          </div>
          <button type="button" onClick={onClose}>
            <X className="size-5" />
          </button>
        </div>

        <div className="mt-5 grid gap-2">
          <Button
            type="button"
            className="w-full bg-violet-600 text-white hover:bg-violet-500"
            disabled={Boolean(loading)}
            onClick={onGoal}>
            Record goal
          </Button>
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={eventLoading}
              onClick={() => onEvent("foul")}>
              Foul
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={eventLoading}
              onClick={() => onEvent("injury")}>
              Injured
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={eventLoading}
              onClick={() => onEvent("yellow_card")}>
              Yellow card
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={eventLoading}
              onClick={() => onEvent("red_card")}>
              Red card
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

function ManageDrawer({
  match,
  players,
  loading,
  isCompleted,
  teamNameDraft,
  setTeamNameDraft,
  showAddPlayer,
  setShowAddPlayer,
  offlinePlayer,
  setOfflinePlayer,
  playerLookup,
  onClose,
  onSaveTeamNames,
  onAddPlayer,
  onRemovePlayer,
}) {
  const addingPlayer = loading === "offline-player";

  return (
    <div className="fixed inset-0 z-[90] flex items-end bg-black/45">
      <button
        type="button"
        className="absolute inset-0"
        onClick={onClose}
        aria-label="Close match management"
      />
      <section className="relative z-10 w-full rounded-t-3xl bg-card p-5 shadow-2xl animate-[goal-drawer-in_240ms_ease-out] sm:mx-auto sm:mb-4 sm:max-w-lg sm:rounded-3xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-primary">Match setup</p>
            <h2 className="text-xl font-bold">Manage</h2>
          </div>
          <button type="button" onClick={onClose}>
            <X className="size-5" />
          </button>
        </div>

        <div className="mt-5 grid max-h-[72vh] gap-5 overflow-y-auto pr-1">
          <section className="grid gap-3">
            <h3 className="text-sm font-bold">Team names</h3>
            <div className="grid gap-2 sm:grid-cols-2">
              <Input
                value={teamNameDraft.homeTeam}
                onChange={(event) =>
                  setTeamNameDraft((current) => ({
                    ...current,
                    homeTeam: event.target.value,
                  }))
                }
                placeholder="Home team"
              />
              <Input
                value={teamNameDraft.awayTeam}
                onChange={(event) =>
                  setTeamNameDraft((current) => ({
                    ...current,
                    awayTeam: event.target.value,
                  }))
                }
                placeholder="Away team"
              />
            </div>
            <Button
              type="button"
              variant="outline"
              disabled={
                loading === "team-names" ||
                !teamNameDraft.homeTeam.trim() ||
                !teamNameDraft.awayTeam.trim()
              }
              onClick={onSaveTeamNames}>
              {loading === "team-names" ? "Saving..." : "Save team names"}
            </Button>
          </section>

          <section className="grid gap-3">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-bold">Players</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isCompleted}
                onClick={() => {
                  setShowAddPlayer((visible) => !visible);
                  setOfflinePlayer({ name: "", phone: "" });
                }}>
                <Plus /> {showAddPlayer ? "Close" : "Add player"}
              </Button>
            </div>

            {showAddPlayer && (
              <div className="grid gap-3 rounded-2xl bg-secondary p-3">
                <Input
                  value={offlinePlayer.phone}
                  onChange={(event) =>
                    setOfflinePlayer((current) => ({
                      ...current,
                      phone: event.target.value.replace(/\D/g, "").slice(0, 10),
                    }))
                  }
                  inputMode="numeric"
                  placeholder="Enter mobile number"
                />
                {playerLookup.status === "found" && (
                  <p className="text-sm font-semibold">
                    @
                    {playerLookup.player?.username || playerLookup.player?.name}
                    <span className="font-medium text-muted-foreground">
                      {" "}
                      {playerLookup.alreadyAdded ? "is already added" : "found"}
                    </span>
                  </p>
                )}
                {playerLookup.status === "not-found" && (
                  <Input
                    value={offlinePlayer.name}
                    onChange={(event) =>
                      setOfflinePlayer((current) => ({
                        ...current,
                        name: event.target.value,
                      }))
                    }
                    placeholder="Offline player name"
                  />
                )}
                {playerLookup.status === "checking" && (
                  <p className="text-sm font-semibold text-muted-foreground">
                    Checking registered players...
                  </p>
                )}
                {playerLookup.status === "error" && (
                  <p className="text-sm font-semibold text-red-500">
                    {playerLookup.message}
                  </p>
                )}
                <Button
                  type="button"
                  disabled={
                    addingPlayer ||
                    isCompleted ||
                    offlinePlayer.phone.length < 10 ||
                    playerLookup.status === "checking" ||
                    playerLookup.alreadyAdded ||
                    (playerLookup.status !== "found" &&
                      offlinePlayer.name.trim().length < 2)
                  }
                  onClick={onAddPlayer}>
                  {addingPlayer
                    ? "Adding..."
                    : playerLookup.status === "found"
                      ? "Add registered player"
                      : "Add offline player"}
                </Button>
              </div>
            )}

            <div className="grid gap-2">
              {players.map((player) => (
                <div
                  key={player.bookingId}
                  className="flex items-center justify-between gap-3 rounded-2xl bg-secondary p-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">
                      @{player.username || player.name}
                    </p>
                    <p className="text-xs font-semibold text-muted-foreground">
                      {player.team === "home" ? match.homeTeam : match.awayTeam}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={
                      isCompleted || loading === `remove-${player.bookingId}`
                    }
                    onClick={() => onRemovePlayer(player.bookingId)}>
                    {loading === `remove-${player.bookingId}`
                      ? "Removing..."
                      : "Remove"}
                  </Button>
                </div>
              ))}
              {!players.length && (
                <p className="rounded-2xl bg-secondary p-3 text-sm font-semibold text-muted-foreground">
                  No players in this match.
                </p>
              )}
            </div>
          </section>
        </div>
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

function getMatchStats(match, players) {
  const events = match.events || [];
  const goals = getCorrectionAdjustedGoals(events);
  const scorerCounts = new Map();
  const assistCounts = new Map();
  const playerStats = new Map(
    players.map((player) => [
      player.bookingId,
      {
        key: player.bookingId,
        name: player.username || player.name,
        team: player.team,
        teamName: player.team === "home" ? match.homeTeam : match.awayTeam,
        goals: 0,
        assists: 0,
        yellowCards: 0,
        redCards: 0,
        injuries: 0,
      },
    ]),
  );
  const teamGoals = { home: 0, away: 0 };
  const teamAssists = { home: 0, away: 0 };
  const teamFouls = { home: 0, away: 0 };
  const teamCards = { home: 0, away: 0 };
  const teamYellowCards = { home: 0, away: 0 };
  const teamRedCards = { home: 0, away: 0 };
  const teamInjuries = { home: 0, away: 0 };
  const goalRows = { home: [], away: [] };

  function getEventPlayer(bookingId, fallbackName, team) {
    if (bookingId && playerStats.has(bookingId))
      return playerStats.get(bookingId);
    const key = fallbackName || bookingId;
    if (!key) return null;
    if (!playerStats.has(key)) {
      playerStats.set(key, {
        key,
        name: fallbackName,
        team,
        teamName: team === "home" ? match.homeTeam : match.awayTeam,
        goals: 0,
        assists: 0,
        yellowCards: 0,
        redCards: 0,
        injuries: 0,
      });
    }
    return playerStats.get(key);
  }

  goals.forEach((event) => {
    if (event.team) teamGoals[event.team] = (teamGoals[event.team] || 0) + 1;
    const scorerName =
      event.scorerName ||
      players.find((player) => player.bookingId === event.scorerBookingId)
        ?.username ||
      players.find((player) => player.bookingId === event.scorerBookingId)
        ?.name;
    if (scorerName) {
      scorerCounts.set(scorerName, (scorerCounts.get(scorerName) || 0) + 1);
    }
    const scorer = getEventPlayer(
      event.scorerBookingId,
      scorerName,
      event.team,
    );
    if (scorer) scorer.goals += 1;

    const assistName =
      event.assistName ||
      players.find((player) => player.bookingId === event.assistBookingId)
        ?.username ||
      players.find((player) => player.bookingId === event.assistBookingId)
        ?.name;
    if (assistName) {
      assistCounts.set(assistName, (assistCounts.get(assistName) || 0) + 1);
    }
    const assister = getEventPlayer(
      event.assistBookingId,
      assistName,
      event.team,
    );
    if (assister) assister.assists += 1;

    if (assistName && event.team) {
      teamAssists[event.team] = (teamAssists[event.team] || 0) + 1;
    }
    if (event.team) {
      goalRows[event.team].push({
        key: event.id,
        scorerName: scorerName || "player",
        assistName,
        minute: formatMinute(event.elapsedSeconds),
        isOwnGoal: event.goalType === "own_goal",
      });
    }
  });

  events
    .filter((event) => event.type === "foul")
    .forEach((event) => {
      if (event.team) teamFouls[event.team] = (teamFouls[event.team] || 0) + 1;
    });

  events
    .filter((event) => ["yellow_card", "red_card"].includes(event.type))
    .forEach((event) => {
      if (event.team) teamCards[event.team] = (teamCards[event.team] || 0) + 1;
      if (event.team && event.type === "yellow_card") {
        teamYellowCards[event.team] = (teamYellowCards[event.team] || 0) + 1;
      }
      if (event.team && event.type === "red_card") {
        teamRedCards[event.team] = (teamRedCards[event.team] || 0) + 1;
      }
      const player = getEventPlayer(
        event.scorerBookingId,
        event.scorerName,
        event.team,
      );
      if (player && event.type === "yellow_card") player.yellowCards += 1;
      if (player && event.type === "red_card") player.redCards += 1;
    });

  events
    .filter((event) => event.type === "injury")
    .forEach((event) => {
      if (event.team)
        teamInjuries[event.team] = (teamInjuries[event.team] || 0) + 1;
      const player = getEventPlayer(
        event.scorerBookingId,
        event.scorerName,
        event.team,
      );
      if (player) player.injuries += 1;
    });

  const homeScore = Number(match.homeScore || 0);
  const awayScore = Number(match.awayScore || 0);
  const resultLabel =
    homeScore === awayScore
      ? "Match drawn"
      : `${homeScore > awayScore ? match.homeTeam : match.awayTeam} won`;
  const playersWithStats = [...playerStats.values()];
  const sortContributions = (first, second) =>
    second.goals + second.assists - (first.goals + first.assists) ||
    second.goals - first.goals ||
    second.assists - first.assists ||
    first.name.localeCompare(second.name);

  return {
    homeScore,
    awayScore,
    resultLabel,
    goals,
    assistCount: goals.filter((event) => event.assistBookingId).length,
    assists: [...assistCounts.entries()]
      .map(([name, assistCount]) => ({ name, assists: assistCount }))
      .sort(
        (first, second) =>
          second.assists - first.assists ||
          first.name.localeCompare(second.name),
      )
      .slice(0, 5),
    fouls: events.filter((event) => event.type === "foul").length,
    injuries: events.filter((event) => event.type === "injury").length,
    yellowCards: events.filter((event) => event.type === "yellow_card").length,
    redCards: events.filter((event) => event.type === "red_card").length,
    homeTimeouts: events.filter(
      (event) => event.type === "timeout" && event.team === "home",
    ).length,
    awayTimeouts: events.filter(
      (event) => event.type === "timeout" && event.team === "away",
    ).length,
    teamGoals,
    teamAssists,
    teamFouls,
    teamCards,
    teamYellowCards,
    teamRedCards,
    teamInjuries,
    goalRows,
    contributors: playersWithStats
      .filter((player) => player.goals || player.assists)
      .sort(sortContributions)
      .slice(0, 8),
    disciplineRows: playersWithStats
      .filter(
        (player) => player.yellowCards || player.redCards || player.injuries,
      )
      .sort(
        (first, second) =>
          second.redCards - first.redCards ||
          second.yellowCards - first.yellowCards ||
          second.injuries - first.injuries ||
          first.name.localeCompare(second.name),
      ),
    teamSheets: {
      home: playersWithStats
        .filter((player) => player.team === "home")
        .sort(sortContributions),
      away: playersWithStats
        .filter((player) => player.team === "away")
        .sort(sortContributions),
    },
    scorers: [...scorerCounts.entries()]
      .map(([name, goalCount]) => ({ name, goals: goalCount }))
      .sort(
        (first, second) =>
          second.goals - first.goals || first.name.localeCompare(second.name),
      )
      .slice(0, 5),
  };
}

function getCorrectionAdjustedGoals(events) {
  return events.reduce((countedGoals, event) => {
    if (event.type === "goal" && Number(event.change ?? 1) > 0) {
      countedGoals.push(event);
      return countedGoals;
    }

    if (event.type === "score_correction" && Number(event.change) < 0) {
      const goalIndex = countedGoals.findLastIndex(
        (goal) => goal.team === event.team,
      );
      if (goalIndex >= 0) countedGoals.splice(goalIndex, 1);
    }

    return countedGoals;
  }, []);
}

function shufflePlayers(players) {
  const shuffled = [...players];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [
      shuffled[swapIndex],
      shuffled[index],
    ];
  }
  return shuffled;
}

function getLineupRows(players) {
  const count = players.length;
  if (count <= 3) return players.map((player) => [player]);

  const rowSizes =
    count <= 5
      ? [1, count - 3, 2]
      : count <= 7
        ? [1, 2, count - 3]
        : [1, 3, Math.ceil((count - 4) / 2), Math.floor((count - 4) / 2)];

  const rows = [];
  let cursor = 0;
  rowSizes.forEach((size) => {
    const row = players.slice(cursor, cursor + size).filter(Boolean);
    if (row.length) rows.push(row);
    cursor += size;
  });
  return rows;
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
