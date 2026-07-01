"use client";

import Link from "next/link";
import { CreditCard, Settings, Swords, Users } from "lucide-react";

import { MatchManagementActions } from "@/components/match-management-actions";
import { MatchScoringConsole } from "@/components/match-scoring-console";
import { PlayerRosterItem } from "@/components/player-roster-item";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

export function MatchHostTabs({
  match,
  bookings,
  remaining,
  hostBooking,
  defaultTab = "players",
  canUpdateScore = false,
}) {
  const confirmed = bookings.filter((booking) => booking.status === "confirmed");
  const players = confirmed.map((booking, index) => ({
    bookingId: booking.id,
    team: booking.team || (index % 2 === 0 ? "home" : "away"),
    name:
      booking.player?.name || booking.guestName || booking.guestUsername || "Unknown player",
    username: booking.player?.username || booking.guestUsername,
    phone: booking.player?.phone || booking.guestPhone,
    isOffline: !booking.userId,
  }));
  const paid = bookings.filter((booking) =>
    ["paid", "paid_pending_verification", "payment_claimed", "confirmed"].includes(
      booking.paymentStatus,
    ),
  );

  return (
    <Tabs defaultValue={defaultTab} className="w-full">
      <TabsList className="grid h-auto w-full grid-cols-4 rounded-2xl">
        <TabsTrigger value="players" className="gap-1 px-2">
          <Users className="size-4" />
          Players
        </TabsTrigger>
        <TabsTrigger value="payments" className="gap-1 px-2">
          <CreditCard className="size-4" />
          Payments
        </TabsTrigger>
        <TabsTrigger value="result" className="gap-1 px-2">
          <Swords className="size-4" />
          Result
        </TabsTrigger>
        <TabsTrigger value="settings" className="gap-1 px-2">
          <Settings className="size-4" />
          Settings
        </TabsTrigger>
      </TabsList>

      <TabsContent value="players">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-3 text-lg">
              Player roster
              <Badge variant="secondary">
                {confirmed.length} confirmed
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <div className="flex items-center justify-between rounded-2xl bg-secondary p-3 text-sm">
              <span className="font-semibold">{bookings.length} total bookings</span>
              <span className="text-muted-foreground">{remaining} slots left</span>
            </div>
            {bookings.map((booking) => (
              <PlayerRosterItem
                key={booking.id}
                booking={booking}
                confirmedByName={booking.confirmedByName}
              />
            ))}
            {!bookings.length && (
              <p className="text-sm text-muted-foreground">
                No players have joined this match.
              </p>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="payments">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-3 text-lg">
              Payments
              <Badge variant="secondary">{paid.length} paid</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {bookings.map((booking) => (
              <div
                key={booking.id}
                className="grid gap-2 rounded-2xl bg-secondary p-3 text-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold">
                      {booking.player?.name || booking.guestName || "Unknown player"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {booking.player?.phone || booking.guestPhone || "No phone"}
                    </p>
                  </div>
                  <Badge variant="outline">
                    {booking.paymentStatus || "not recorded"}
                  </Badge>
                </div>
                <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 border-t border-border pt-2">
                  <dt className="text-muted-foreground">Reference</dt>
                  <dd className="break-all text-right font-semibold">
                    {booking.paymentReference || "Not provided"}
                  </dd>
                  <dt className="text-muted-foreground">Booking</dt>
                  <dd className="text-right font-semibold">{booking.status}</dd>
                </dl>
              </div>
            ))}
            {!bookings.length && (
              <p className="text-sm text-muted-foreground">
                No payment records are available.
              </p>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="result">
        <Card>
          <CardContent className="grid gap-4 p-4">
            <div className="flex items-center justify-between rounded-2xl bg-secondary p-4">
              <div>
                <p className="font-bold">{match.homeTeam}</p>
                <p className="text-sm text-muted-foreground">{match.awayTeam}</p>
              </div>
              <p className="text-3xl font-black">
                {match.homeScore ?? 0} : {match.awayScore ?? 0}
              </p>
            </div>
            {canUpdateScore && match.status === "completed" ? (
              <MatchScoringConsole
                match={match}
                players={players}
                canManageCompleted
              />
            ) : (
              <Button asChild>
                <Link href={`/matches/${match.id}/score`}>
                  <Swords />
                  {match.status === "completed"
                    ? "View match stats"
                    : "Open scoring"}
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="settings">
        <MatchManagementActions match={match} hostBooking={hostBooking} />
      </TabsContent>
    </Tabs>
  );
}
