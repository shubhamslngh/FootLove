import Link from "next/link";
import { MapPin, Search, Shield, Sparkles, Trophy, UserRound, UsersRound } from "lucide-react";

import { ThemeToggle } from "@/components/theme-toggle";
import { readDb } from "@/lib/server/db";

const categories = [
  { title: "Casual", subtitle: "Open pickup games nearby", href: "/matches", icon: Sparkles, tone: "bg-emerald-500/12 text-emerald-600 dark:text-emerald-300" },
  { title: "Community", subtitle: "Play with local groups", href: "/matches", icon: UsersRound, tone: "bg-sky-500/12 text-sky-600 dark:text-sky-300" },
  { title: "Clubs", subtitle: "Join organized sessions", href: "/matches", icon: Shield, tone: "bg-violet-500/12 text-violet-600 dark:text-violet-300" },
  { title: "Tournaments", subtitle: "Compete for the table", href: "/matches", icon: Trophy, tone: "bg-amber-500/12 text-amber-600 dark:text-amber-300" },
];

export default async function Home() {
  const db = await readDb();
  const cities = Array.from(new Set(db.venues.map((venue) => venue.city).filter(Boolean))).sort();

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto flex min-h-screen w-full max-w-md flex-col px-5 pb-8 pt-5 sm:max-w-2xl">
        <header className="flex items-center justify-between gap-3">
          <Link href="/dashboard" aria-label="Open profile" className="flex size-11 shrink-0 items-center justify-center rounded-full bg-card text-foreground shadow-[0_8px_24px_rgba(17,24,39,0.08)] ring-1 ring-border">
            <UserRound className="size-5" />
          </Link>
          <label className="relative min-w-0 flex-1">
            <MapPin className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <select defaultValue="all" aria-label="Select city" className="h-11 w-full appearance-none rounded-full border-0 bg-card pl-10 pr-5 text-center text-sm font-semibold text-foreground shadow-[0_8px_24px_rgba(17,24,39,0.08)] outline-none ring-1 ring-border">
              <option value="all">All cities</option>
              {cities.map((city) => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </label>
          <ThemeToggle />
        </header>

        <div className="mt-8">
          <p className="text-sm font-semibold text-primary">FootLove</p>
          <h1 className="mt-2 text-4xl font-bold leading-tight tracking-normal text-foreground">Find your next football slot.</h1>
        </div>

        <label className="relative mt-6 block">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
          <input type="search" placeholder="Search matches, clubs, venues" className="h-14 w-full rounded-2xl border-0 bg-card pl-12 pr-4 text-base font-medium text-foreground shadow-[0_12px_30px_rgba(17,24,39,0.08)] outline-none ring-1 ring-border placeholder:text-muted-foreground" />
        </label>

        <div className="mt-7 grid grid-cols-2 gap-3">
          {categories.map((category) => (
            <Link key={category.title} href={category.href} className="theme-reactive-card min-h-40 rounded-[28px] bg-card p-4 shadow-[0_14px_34px_rgba(17,24,39,0.08)] ring-1 ring-border transition active:scale-[0.98]">
              <div className={`flex size-11 items-center justify-center rounded-2xl ${category.tone}`}>
                <category.icon className="size-5" />
              </div>
              <div className="mt-7">
                <h2 className="text-xl font-bold tracking-normal">{category.title}</h2>
                <p className="mt-1 text-sm font-medium leading-5 text-muted-foreground">{category.subtitle}</p>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-7 rounded-[28px] bg-foreground p-5 text-background shadow-[0_18px_40px_rgba(17,24,39,0.18)]">
          <p className="text-sm font-semibold text-background/70">Nearby matches</p>
          <div className="mt-3 flex items-end justify-between gap-4">
            <div>
              <p className="text-3xl font-bold">{db.matches.length}</p>
              <p className="mt-1 text-sm text-background/70">open sessions listed</p>
            </div>
            <Link href="/matches" className="rounded-full bg-background px-4 py-2 text-sm font-bold text-foreground">Explore</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
