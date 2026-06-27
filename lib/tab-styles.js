export const tabListSurfaceClassName =
  "rounded-2xl bg-card p-1.5 shadow-[0_12px_30px_rgba(17,24,39,0.12)] ring-1 ring-border backdrop-blur-xl";

export const tabListClassName =
  `inline-flex items-center justify-center gap-1 ${tabListSurfaceClassName}`;

export const tabTriggerBaseClassName =
  "relative inline-flex min-h-12 items-center justify-center overflow-hidden whitespace-nowrap rounded-xl px-4 text-sm font-bold text-muted-foreground transition-all duration-300 disabled:pointer-events-none disabled:opacity-50 hover:bg-secondary hover:text-foreground";

export const tabTriggerActiveClassName =
  "data-[state=active]:text-foreground data-[state=active]:shadow-[0_10px_20px_rgba(15,23,42,0.12)]";

export const tabTriggerOrbClassName =
  "data-[state=active]:before:pointer-events-none data-[state=active]:before:absolute data-[state=active]:before:inset-0 data-[state=active]:before:rounded-[inherit] data-[state=active]:before:bg-gradient-to-br data-[state=active]:before:from-green-900/20 data-[state=active]:before:via-background/60 data-[state=active]:before:to-background/30 data-[state=active]:before:shadow-[inset_5px_5px_12px_rgba(255,255,255,0.55),inset_-6px_-8px_14px_rgba(15,23,42,0.08),0_14px_25px_rgba(15,23,42,0.18)] data-[state=active]:before:ring-1 data-[state=active]:before:ring-white/40 data-[state=active]:before:backdrop-blur-xl dark:data-[state=active]:before:from-white/15 dark:data-[state=active]:before:via-background/45 dark:data-[state=active]:before:to-background/20 dark:data-[state=active]:before:ring-white/15";

export const tabActiveOrbSurfaceClassName =
  "pointer-events-none absolute inset-0 rounded-[inherit] bg-gradient-to-br from-green-900/20 via-background/60 to-background/30 shadow-[inset_5px_5px_12px_rgba(255,255,255,0.55),inset_-6px_-8px_14px_rgba(15,23,42,0.08),0_14px_25px_rgba(15,23,42,0.18)] ring-1 ring-white/40 backdrop-blur-xl dark:from-white/15 dark:via-background/45 dark:to-background/20 dark:ring-white/15";
