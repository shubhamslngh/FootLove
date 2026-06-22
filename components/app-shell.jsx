import Link from "next/link";
import Image from "next/image";
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

  return (
    <main className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 bg-background/10 backdrop-blur-md ">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-2">
          <Link href="/dashboard" className="flex items-center gap-2 leading-tight">
           <div className="flex h-30 items-center justify-center overflow-hidden rounded-2xl">
                            <Image
                              src="/Logo.png"
                              alt="SoccerSesh logo"
                              width={144}
                              height={40}
                              className="object-contain"
                              priority
                            />
                          </div>
                         
            <div>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            {user && (
              <p className="hidden text-sm font-semibold text-muted-foreground sm:block">
                {user.name} ·{" "}
                {user.role === ROLES.MANAGER && canHost
                  ? "verified host"
                  : user.role}
              </p>
            )}
            {canHost && (
              <Button asChild size="sm">
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
        <nav className="fixed inset-x-3 bottom-3 z-50 rounded-[28px] bg-card/95 shadow-[0_18px_44px_rgba(17,24,39,0.18)] ring-1 ring-border backdrop-blur-xl lg:hidden">
          <div
            className={`grid ${
              canHost ? "grid-cols-5" : "grid-cols-4"
            }`}>
            {navItems
              .filter((item) => item.href !== "/host" || canHost)
              .map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex min-h-16 flex-col items-center justify-center gap-1 text-xs font-bold text-muted-foreground">
                  <item.icon className="size-5" />
                  {item.label}
                </Link>
              ))}
          </div>
        </nav>
      )}
    </main>
  );
}
