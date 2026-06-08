import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarCheck, ExternalLink, MessageCircle, UsersRound } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import {
  AddCommunityMatchForm,
  CreateCommunityForm,
} from "@/components/community-actions";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCurrentUser } from "@/lib/server/auth";
import { readDb } from "@/lib/server/db";
import { formatDisplayDate } from "@/lib/utils";

export default async function CommunitiesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const db = await readDb();

  const eligibleMatches = db.matches.filter(
    (match) =>
      match.status === "completed" &&
      (match.hostUserId === user.id ||
        db.bookings.some(
          (booking) =>
            booking.matchId === match.id &&
            booking.userId === user.id &&
            booking.status === "confirmed",
        )),
  );

  return (
    <AppShell user={user}>
      <div className="space-y-6">
        <div>
          <p className="text-sm font-semibold text-primary">Community</p>
          <h1 className="text-3xl font-bold">Explore communities</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Find local groups, join their WhatsApp chat, and follow matches
            they have played.
          </p>
        </div>

        {!db.communities.length ? (
          <Card className="mx-auto max-w-lg">
            <CardHeader className="text-center">
              <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-secondary text-primary">
                <UsersRound className="size-6" />
              </div>
              <CardTitle className="pt-2">Create the first community</CardTitle>
              <CardDescription>
                Add a name, description, and WhatsApp group link.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CreateCommunityForm />
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
            <Card className="h-fit">
              <CardHeader>
                <CardTitle>Create community</CardTitle>
                <CardDescription>
                  Start a local group for regular players.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CreateCommunityForm />
              </CardContent>
            </Card>

            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">All communities</h2>
                <Badge variant="secondary">{db.communities.length}</Badge>
              </div>
              <div className="grid gap-3">
                {db.communities.map((community) => {
                  const history = db.communityMatches
                    .filter((item) => item.communityId === community.id)
                    .map((item) =>
                      db.matches.find((match) => match.id === item.matchId),
                    )
                    .filter(Boolean);
                  const alreadyAdded = new Set(history.map((match) => match.id));
                  const availableMatches = eligibleMatches.filter(
                    (match) => !alreadyAdded.has(match.id),
                  );

                  return (
                    <Card key={community.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex min-w-0 items-center gap-3">
                            {community.logoDataUrl ? (
                              <img
                                src={community.logoDataUrl}
                                alt={`${community.name} logo`}
                                className="size-12 shrink-0 rounded-full bg-white object-cover p-1 ring-1 ring-border"
                              />
                            ) : (
                              <div className="grid size-12 shrink-0 place-items-center rounded-full bg-secondary text-lg font-bold text-primary">
                                {community.name.slice(0, 2).toUpperCase()}
                              </div>
                            )}
                            <div className="min-w-0">
                              <CardTitle>{community.name}</CardTitle>
                              <CardDescription className="mt-1">
                                {community.description}
                              </CardDescription>
                            </div>
                          </div>
                          <Badge variant="secondary">
                            {history.length} matches
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="grid gap-4">
                        <Link
                          href={community.whatsappUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex w-fit items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-bold text-primary-foreground">
                          <MessageCircle className="size-4" />
                          Join WhatsApp group
                          <ExternalLink className="size-3.5" />
                        </Link>

                        <div className="grid gap-2">
                          <p className="flex items-center gap-2 text-sm font-bold">
                            <CalendarCheck className="size-4 text-primary" />
                            Matches played
                          </p>
                          {history.length ? (
                            history.map((match) => (
                              <Link
                                key={match.id}
                                href={`/matches/${match.id}`}
                                className="flex items-center justify-between gap-3 rounded-xl bg-secondary p-3 text-sm">
                                <span className="font-semibold">{match.title}</span>
                                <span className="text-xs text-muted-foreground">
                                  {formatDisplayDate(match.date)}
                                </span>
                              </Link>
                            ))
                          ) : (
                            <p className="rounded-xl bg-secondary p-3 text-sm text-muted-foreground">
                              No completed matches added yet.
                            </p>
                          )}
                        </div>

                        {community.createdByUserId === user.id && (
                          <AddCommunityMatchForm
                            communityId={community.id}
                            matches={availableMatches}
                          />
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </section>
          </div>
        )}
      </div>
    </AppShell>
  );
}
