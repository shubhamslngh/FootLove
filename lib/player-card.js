export function getEmptyPlayerStats(user) {
  return {
    key: `user:${user.id}`,
    userId: user.id,
    name: user.name,
    username: user.username || user.name,
    isOffline: false,
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
    rank: null,
  };
}

export function canHavePlayerCard(user) {
  return (
    user?.role === "player" ||
    (user?.role === "manager" &&
      user?.hostVerificationStatus === "approved")
  );
}

export function getPlayerRating(stats) {
  const score =
    45 +
    Math.min(18, stats.played * 2) +
    Math.min(16, stats.goals * 3) +
    Math.min(12, stats.assists * 2) +
    Math.min(8, stats.wins * 2) -
    Math.min(6, stats.redCards * 2 + stats.yellowCards);
  return Math.max(45, Math.min(99, Math.round(score)));
}

export function getPlayerPosition(stats) {
  if (stats.goals >= stats.assists + 2) return "ST";
  if (stats.assists > stats.goals) return "CAM";
  if (stats.wins >= 3 && stats.goals + stats.assists <= stats.wins) return "CM";
  return "FW";
}

export function getPlayerCardTheme(position, rating) {
  const positionThemes = {
    ST: {
      baseColor: "#2b171d",
      glow: "rgba(255, 72, 93, 0.28)",
      colors: ["#ff485d", "#ff7849", "#ffad5b", "#d92f55"],
    },
    FW: {
      baseColor: "#281a18",
      glow: "rgba(255, 126, 57, 0.26)",
      colors: ["#ff713d", "#ff9d45", "#f5c45c", "#e14b36"],
    },
    CAM: {
      baseColor: "#20182d",
      glow: "rgba(167, 94, 255, 0.3)",
      colors: ["#a75eff", "#d77bff", "#54c7ff", "#7658e8"],
    },
    CM: {
      baseColor: "#14262a",
      glow: "rgba(45, 212, 191, 0.27)",
      colors: ["#2dd4bf", "#4ade80", "#67e8f9", "#35a99a"],
    },
  };
  const theme = positionThemes[position] || positionThemes.FW;
  const tierAccent =
    rating >= 85 ? "#ffe27a" : rating >= 75 ? "#f4f7ff" : theme.colors[1];

  return {
    ...theme,
    colors: [...theme.colors, tierAccent],
    intensity: rating >= 85 ? 1.35 : rating >= 75 ? 1.15 : 0.95,
  };
}

export function getInitials(name = "") {
  return name
    .split(/\s+/)
    .map((part) => part[0] || "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function formatPoints(points = 0) {
  return Number.isInteger(points) ? points : Number(points).toFixed(2);
}
