"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { CalendarPlus, LayoutDashboard, Medal, Trophy, UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { LogoutButton } from "@/components/logout-button";
import { PlayerNotifications } from "@/components/player-notifications";
import { ThemeToggle } from "@/components/theme-toggle";
import { canHostMatch, ROLES } from "@/lib/server/roles";

const navItems = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/matches", label: "Matches", icon: Trophy },
  { href: "/leaderboard", label: "Ranks", icon: Medal },
  { href: "/host", label: "Host", icon: CalendarPlus },
  { href: "/profile", label: "Profile", icon: UserRound },
];

export function AppShell({ children, user }) {
  const canHost = canHostMatch(user);
  const pathname = usePathname();
  const [isCondensed, setIsCondensed] = useState(false);

  useEffect(() => {
    function onScroll() {
      setIsCondensed(window.scrollY > 24);
    }

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <main className="min-h-screen  bg-background pb-20">
      <header
        className={`sticky top-0 z-40 bg-background/10 backdrop-blur-md transition-all duration-300 ${
          isCondensed ? "bg-background/70" : ""
        }`}>
        <div className="mx-auto flex min-h-16 max-w-6xl items-center justify-between px-4 py-2">
          <Link href="/dashboard" className="flex items-center gap-2 leading-tight">
            <div className="flex h-20 w-36 origin-left items-center justify-center overflow-hidden rounded-2xl">
              <Image
                src="/Logo.png"
                alt="SoccerSesh logo"
                width={144}
                height={40}
                className={`h-30 w-auto origin-left object-contain transition-transform duration-300 ease-in-out ${
                  isCondensed ? "scale-[0.86]" : "scale-100"
                }`}
                priority
              />
            </div>
          </Link>
          <div
            className={`flex items-center transition-all duration-300 ${
              isCondensed ? "gap-1.5" : "gap-2"
            }`}>
            {user && (
              <p
                className={`hidden font-semibold text-muted-foreground transition-all duration-300 sm:block ${
                  isCondensed ? "scale-95 text-sm opacity-85" : "scale-100 text-sm opacity-100"
                }`}>
                {user.name} ·{" "}
                {user.role === ROLES.MANAGER && canHost
                  ? "verified host"
                  : user.role}
              </p>
            )}
            {canHost && (
              <Button asChild size="sm" className="h-8 px-2 text-xs sm:h-9 sm:px-3 sm:text-sm">
                <Link href="/host">Host</Link>
              </Button>
            )}
            <ThemeToggle />
            {user && <LogoutButton />}
          </div>
        </div>
      </header>
      <div className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-6">{children}</div>
      {user?.role === ROLES.PLAYER && <PlayerNotifications />}
      {user && (
        <nav className="fixed  inset-x-3 bottom-3 z-50 rounded-xl bg-shadow-[0_18px_44px_rgba(17,24,39,0.18)] ring-1 ring-border backdrop-blur-xl lg:hidden">
          <div
            className={`grid ${
              canHost ? "grid-cols-5" : "grid-cols-4"
            }`}>
            {navItems
              .filter((item) => item.href !== "/host" || canHost)
              .map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/dashboard" && pathname?.startsWith(`${item.href}/`));

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`relative flex min-h-16 flex-col items-center justify-center gap-1 overflow-hidden px-1 text-xs font-bold transition-all duration-300 ${
                      isActive
                        ? "text-foreground"
                        : "text-muted-foreground"
                    }`}>
                    {isActive && (
                      <span className="pointer-events-auto absolute inset-1 rounded-xl bg-linear-to-br from-green-800/20 via-background/60 to-background/30 shadow-[inset_5px_5px_12px_rgba(255,255,255,0.55),inset_-6px_-8px_14px_rgba(15,23,42,0.08),0_14px_25px_rgba(15,23,42,0.18)] ring-1 ring-white/40 backdrop-blur-xl dark:from-white/15 dark:via-background/45 dark:to-background/20 dark:ring-white/15" />
                    )}
                    <span className="relative z-10 flex flex-col items-center justify-center gap-1">
                      <item.icon className={`transition-transform duration-300 ${
                        isActive ? "size-5 scale-105" : "size-5"
                      }`} />
                      {item.label}
                    </span>
                  </Link>
                );
              })}
          </div>
        </nav>
      )}
    </main>
  );
}
