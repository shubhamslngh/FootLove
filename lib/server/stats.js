const POINTS = {
  goal: 8,
  assist: 5,
  win: 3,
  draw: 1,
  played: 1,
  yellowCard: -1,
  redCard: -3,
  foul: -0.25,
};

const EMPTY_STATS = {
  played: 0,
  wins: 0,
  draws: 0,
  losses: 0,
  goals: 0,
  assists: 0,
  fouls: 0,
  injuries: 0,
  yellowCards: 0,
  redCards: 0,
  points: 0,
};

function getBookingPlayer(booking, users) {
  const user = booking.userId
    ? users.find((candidate) => candidate.id === booking.userId)
    : null;
  const offlineName = booking.guestUsername || booking.guestName;

  if (user) {
    return {
      key: `user:${user.id}`,
      userId: user.id,
      name: user.name,
      username: user.username || user.name,
      phone: user.phone,
      isOffline: false,
    };
  }

  if (!offlineName) return null;

  return {
    key: `offline:${booking.guestPhone || booking.id}`,
    userId: null,
    name: booking.guestName || offlineName,
    username: booking.guestUsername || offlineName,
    phone: booking.guestPhone,
    isOffline: true,
  };
}

function createRow(player) {
  return {
    ...player,
    ...EMPTY_STATS,
  };
}

function addPoints(row) {
  row.points =
    row.goals * POINTS.goal +
    row.assists * POINTS.assist +
    row.wins * POINTS.win +
    row.draws * POINTS.draw +
    row.played * POINTS.played +
    row.yellowCards * POINTS.yellowCard +
    row.redCards * POINTS.redCard +
    row.fouls * POINTS.foul;
}

function sortLeaderboard(rows) {
  return [...rows].sort(
    (first, second) =>
      second.points - first.points ||
      second.goals - first.goals ||
      second.assists - first.assists ||
      second.wins - first.wins ||
      first.redCards - second.redCards ||
      first.yellowCards - second.yellowCards ||
      first.username.localeCompare(second.username),
  );
}

function getCorrectionAdjustedGoals(events = []) {
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

export function buildLeaderboard({ matches = [], bookings = [], users = [] }) {
  const rows = new Map();
  const bookingToPlayerKey = new Map();

  function ensureRow(player) {
    if (!rows.has(player.key)) rows.set(player.key, createRow(player));
    return rows.get(player.key);
  }

  const completedMatches = matches.filter(
    (match) => match.status === "completed",
  );

  for (const match of completedMatches) {
    const matchBookings = bookings.filter(
      (booking) =>
        booking.matchId === match.id &&
        booking.status === "confirmed" &&
        ["home", "away"].includes(booking.team),
    );
    const homeScore = Number(match.homeScore || 0);
    const awayScore = Number(match.awayScore || 0);

    for (const booking of matchBookings) {
      const player = getBookingPlayer(booking, users);
      if (!player) continue;
      bookingToPlayerKey.set(booking.id, player.key);
      const row = ensureRow(player);
      row.played += 1;
      if (homeScore === awayScore) {
        row.draws += 1;
      } else if (
        (booking.team === "home" && homeScore > awayScore) ||
        (booking.team === "away" && awayScore > homeScore)
      ) {
        row.wins += 1;
      } else {
        row.losses += 1;
      }
    }

    const adjustedGoals = getCorrectionAdjustedGoals(match.events || []);
    for (const event of adjustedGoals) {
      if (event.scorerBookingId) {
        const scorerKey = bookingToPlayerKey.get(event.scorerBookingId);
        if (scorerKey && rows.has(scorerKey)) rows.get(scorerKey).goals += 1;
      }
      if (event.assistBookingId) {
        const assistKey = bookingToPlayerKey.get(event.assistBookingId);
        if (assistKey && rows.has(assistKey)) rows.get(assistKey).assists += 1;
      }
    }

    for (const event of match.events || []) {
      if (
        ["foul", "injury", "yellow_card", "red_card"].includes(event.type) &&
        event.scorerBookingId
      ) {
        const playerKey = bookingToPlayerKey.get(event.scorerBookingId);
        if (!playerKey || !rows.has(playerKey)) continue;
        const row = rows.get(playerKey);
        if (event.type === "foul") row.fouls += 1;
        if (event.type === "injury") row.injuries += 1;
        if (event.type === "yellow_card") row.yellowCards += 1;
        if (event.type === "red_card") row.redCards += 1;
      }
    }
  }

  const leaderboard = [...rows.values()].map((row) => {
    addPoints(row);
    return row;
  });

  return sortLeaderboard(leaderboard).map((row, index) => ({
    ...row,
    rank: index + 1,
  }));
}

export function sortByCategory(rows, category) {
  const sorted = [...rows].sort((first, second) => {
    if (category === "goals") {
      return (
        second.goals - first.goals ||
        second.assists - first.assists ||
        second.points - first.points ||
        first.username.localeCompare(second.username)
      );
    }
    if (category === "assists") {
      return (
        second.assists - first.assists ||
        second.goals - first.goals ||
        second.points - first.points ||
        first.username.localeCompare(second.username)
      );
    }
    if (category === "wins") {
      return (
        second.wins - first.wins ||
        second.played - first.played ||
        second.points - first.points ||
        first.username.localeCompare(second.username)
      );
    }
    if (category === "fair_play") {
      return (
        first.redCards - second.redCards ||
        first.yellowCards - second.yellowCards ||
        first.fouls - second.fouls ||
        second.played - first.played ||
        first.username.localeCompare(second.username)
      );
    }
    return (
      second.points - first.points ||
      second.goals - first.goals ||
      second.assists - first.assists ||
      second.wins - first.wins ||
      first.redCards - second.redCards ||
      first.yellowCards - second.yellowCards ||
      first.username.localeCompare(second.username)
    );
  });

  return sorted.map((row, index) => ({ ...row, rank: index + 1 }));
}
