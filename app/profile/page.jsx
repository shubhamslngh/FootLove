import { redirect } from "next/navigation";
import { CalendarCheck, Goal, ShieldCheck, Trophy } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { LogoutButton } from "@/components/logout-button";
import { ProfileForm } from "@/components/profile-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/server/auth";
import { readDb } from "@/lib/server/db";
import { ROLES } from "@/lib/server/roles";

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const db = await readDb();
  const userBookings = db.bookings.filter(
    (booking) => booking.userId === user.id,
  );
  const confirmedBookings = userBookings.filter(
    (booking) => booking.status === "confirmed",
  );
  const hostedMatches = db.matches.filter(
    (match) => match.hostUserId === user.id,
  );
  const completedMatches = db.matches.filter(
    (match) =>
      match.status === "completed" &&
      (match.hostUserId === user.id ||
        confirmedBookings.some((booking) => booking.matchId === match.id)),
  );
  const goals = db.matches.reduce(
    (total, match) =>
      total +
      (match.events || []).filter(
        (event) => event.type === "goal" && event.scorerUserId === user.id,
      ).length,
    0,
  );
  const stats =
    user.role === ROLES.PLAYER
      ? [
          { label: "Bookings", value: userBookings.length, icon: CalendarCheck },
          { label: "Played", value: completedMatches.length, icon: Trophy },
          { label: "Goals", value: goals, icon: Goal },
        ]
      : [
          { label: "Hosted", value: hostedMatches.length, icon: CalendarCheck },
          {
            label: "Completed",
            value: hostedMatches.filter((match) => match.status === "completed")
              .length,
            icon: Trophy,
          },
          {
            label: "Players confirmed",
            value: db.bookings.filter(
              (booking) =>
                booking.status === "confirmed" &&
                hostedMatches.some((match) => match.id === booking.matchId),
            ).length,
            icon: ShieldCheck,
          },
        ];

  return (
    <AppShell user={user}>
      <div className="mx-auto grid max-w-4xl gap-5">
        <div>
          <p className="text-sm font-semibold text-primary">Profile</p>
          <div className="mt-1 flex items-center justify-between gap-3">
            <div>
              <h1 className="text-3xl font-bold">{user.name}</h1>
              <p className="text-sm text-muted-foreground">
                @{user.username || "user"}
              </p>
            </div>
            <Badge variant="secondary">{user.role}</Badge>
          </div>
        </div>

        <section className="grid grid-cols-3 gap-3">
          {stats.map(({ label, value, icon: Icon }) => (
            <Card key={label}>
              <CardContent className="p-4">
                <Icon className="size-5 text-primary" />
                <p className="mt-3 text-2xl font-bold">{value}</p>
                <p className="text-xs font-semibold text-muted-foreground">
                  {label}
                </p>
              </CardContent>
            </Card>
          ))}
        </section>

        <Card>
          <CardHeader>
            <CardTitle>Manage profile</CardTitle>
          </CardHeader>
          <CardContent>
            <ProfileForm user={user} />
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <LogoutButton />
        </div>
      </div>
    </AppShell>
  );
}
