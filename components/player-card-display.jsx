"use client";

import { PaintStrokeBackground } from "@/components/paint-stroke-background";
import { Badge } from "@/components/ui/badge";
import {
  formatPoints,
  getPlayerCardTheme,
  getInitials,
  getPlayerPosition,
  getPlayerRating,
} from "@/lib/player-card";
import { cn } from "@/lib/utils";

export function PlayerCardDisplay({ user, stats, className }) {
  const rating = getPlayerRating(stats);
  const position = getPlayerPosition(stats);
  const theme = getPlayerCardTheme(position, rating);

  return (
    <div
      className={cn(
        "relative aspect-38/52  w-full max-w-full overflow-hidden rounded-3xl bg-white p-6 text-slate-950 shadow-[0_24px_56px_rgba(0,0,0,0.25)] dark:bg-[var(--player-card-dark)] dark:text-white dark:shadow-[0_24px_56px_rgba(0,0,0,0.4)]",
        className,
      )}
      style={{ "--player-card-dark": theme.baseColor }}>
      <PaintStrokeBackground
        colors={theme.colors}
        baseColor={theme.baseColor}
        intensity={theme.intensity}
      />
      <div
        className="absolute inset-0 dark:hidden"
        style={{
          background: `radial-gradient(circle at 50% 34%, ${theme.colors[0]}24, transparent 38%), linear-gradient(180deg, transparent 0%, rgba(255,255,255,0.15) 48%, rgba(241,245,249,0.92) 100%)`,
        }}
      />
      <div
        className="absolute inset-0 hidden dark:block"
        style={{
          background: `radial-gradient(circle at 50% 34%, ${theme.glow}, transparent 38%), linear-gradient(180deg, transparent 0%, ${theme.baseColor}40 48%, rgba(10,8,10,0.92) 100%)`,
        }}
      />
      <div className="relative z-10 flex h-full flex-col">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-5xl font-black leading-none">{rating}</p>
            <p className="mt-1 text-sm font-black uppercase tracking-[0.2em]">
              {position}
            </p>
          </div>
          <Badge className="border-black/10 bg-white/55 text-slate-900 backdrop-blur-sm hover:bg-white/55 dark:border-white/20 dark:bg-black/25 dark:text-white dark:hover:bg-black/25">
            Rank {stats.rank ? `#${stats.rank}` : "-"}
          </Badge>
        </div>

        <div className="mt-5 grid flex-1 content-center justify-items-center text-center">
          <div className="grid size-36 place-items-center overflow-hidden rounded-full border-2 border-black/10 bg-slate-100 text-4xl font-black shadow-[0_14px_36px_rgba(0,0,0,0.2)] dark:border-white/35 dark:bg-[#454247] dark:shadow-[0_14px_36px_rgba(0,0,0,0.38)]">
            {user.profileImageDataUrl ? (
              <img
                src={user.profileImageDataUrl}
                alt={`${user.name} profile`}
                className="size-full object-cover"
              />
            ) : (
              getInitials(user.name)
            )}
          </div>
          <h2 className="mt-4 max-w-full truncate text-2xl font-black uppercase">
            {user.name}
          </h2>
          <p className="text-sm font-bold text-slate-600 dark:text-white/75">
            @{user.username || "user"}
          </p>
        </div>

        <div className="grid grid-cols-6 gap-2 text-center">
          <CardStat
            className="col-span-2"
            label="PTS"
            value={formatPoints(stats.points)}
          />
          <CardStat
            className="col-span-2"
            label="Matches"
            value={stats.played}
          />
          <CardStat className="col-span-2" label="Wins" value={stats.wins} />
          <CardStat className="col-span-3" label="Goals" value={stats.goals} />
          <CardStat
            className="col-span-3"
            label="Assists"
            value={stats.assists}
          />
        </div>
      </div>
    </div>
  );
}

function CardStat({ label, value, className }) {
  return (
    <div
      className={cn(
        "rounded-lg border border-black/10 bg-white/55 px-2 py-2.5 backdrop-blur-sm dark:border-white/10 dark:bg-black/25",
        className,
      )}>
      <p className="text-xl font-black">{value}</p>
      <p className="text-[0.65rem] font-black uppercase text-slate-600 dark:text-white/70">
        {label}
      </p>
    </div>
  );
}
