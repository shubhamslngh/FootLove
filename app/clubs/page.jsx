import { redirect } from "next/navigation";
import { MapPin, Shield, Swords, Users } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import {
  ChallengeClubForm,
  ChallengeResponseActions,
  CreateClubForm,
  JoinClubButton,
} from "@/components/club-actions";
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

export default async function ClubsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const db = await readDb();

  const memberships = db.clubMemberships.filter(
    (membership) =>
      membership.userId === user.id && membership.status === "active",
  );
  const memberClubIds = new Set(memberships.map((item) => item.clubId));
  const captainClubs = db.clubs.filter(
    (club) => club.captainUserId === user.id,
  );
  const incoming = db.clubChallenges.filter(
    (challenge) =>
      challenge.status === "pending" &&
      captainClubs.some((club) => club.id === challenge.challengedClubId),
  );
  const challengeHistory = db.clubChallenges
    .filter(
      (challenge) =>
        memberClubIds.has(challenge.challengerClubId) ||
        memberClubIds.has(challenge.challengedClubId),
    )
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const clubById = new Map(db.clubs.map((club) => [club.id, club]));

  return (
    <AppShell user={user}>
      <div className="space-y-6">
        <div>
          <p className="text-sm font-semibold text-primary">Clubs</p>
          <h1 className="text-3xl font-bold">Build your team</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Create a club, recruit players, and challenge other teams.
          </p>
        </div>

        {incoming.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Incoming challenges</h2>
              <Badge>{incoming.length}</Badge>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {incoming.map((challenge) => (
                <Card key={challenge.id}>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      {clubById.get(challenge.challengerClubId)?.name} vs{" "}
                      {clubById.get(challenge.challengedClubId)?.name}
                    </CardTitle>
                    <CardDescription>
                      {challenge.proposedDate || "Date open"} at{" "}
                      {challenge.proposedTime || "time open"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-3">
                    {challenge.venueNote && (
                      <p className="text-sm">{challenge.venueNote}</p>
                    )}
                    {challenge.message && (
                      <p className="rounded-xl bg-secondary p-3 text-sm">
                        {challenge.message}
                      </p>
                    )}
                    <ChallengeResponseActions challengeId={challenge.id} />
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
          <Card className="h-fit">
            <CardHeader>
              <CardTitle>Create a club</CardTitle>
              <CardDescription>
                You become captain and can send challenges.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CreateClubForm />
            </CardContent>
          </Card>

          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Discover clubs</h2>
              <Badge variant="secondary">{db.clubs.length}</Badge>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {db.clubs.map((club) => {
                const memberCount = db.clubMemberships.filter(
                  (membership) =>
                    membership.clubId === club.id &&
                    membership.status === "active",
                ).length;
                const isMember = memberClubIds.has(club.id);
                const canChallenge =
                  captainClubs.length > 0 &&
                  !captainClubs.some((item) => item.id === club.id);
                return (
                  <Card key={club.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-3">
                          {club.logoDataUrl ? (
                            <img
                              src={club.logoDataUrl}
                              alt={`${club.name} logo`}
                              className="size-12 shrink-0 rounded-full bg-white object-cover p-1 ring-1 ring-border"
                            />
                          ) : (
                            <div className="grid size-12 shrink-0 place-items-center rounded-full bg-secondary text-lg font-bold text-primary">
                              {club.name.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0">
                            <CardTitle>{club.name}</CardTitle>
                            <CardDescription className="mt-1 flex items-center gap-1">
                              <MapPin className="size-3.5" /> {club.city}
                            </CardDescription>
                          </div>
                        </div>
                        {club.captainUserId === user.id && <Badge>Captain</Badge>}
                      </div>
                    </CardHeader>
                    <CardContent className="grid gap-3">
                      <p className="text-sm text-muted-foreground">
                        {club.description || "Ready for the next fixture."}
                      </p>
                      <div className="flex items-center gap-4 text-xs font-semibold">
                        <span className="inline-flex items-center gap-1">
                          <Users className="size-4 text-primary" />
                          {memberCount} members
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Shield className="size-4 text-primary" />
                          Team
                        </span>
                      </div>
                      {!isMember && <JoinClubButton clubId={club.id} />}
                      {isMember && (
                        <Badge variant="secondary" className="w-fit">
                          Member
                        </Badge>
                      )}
                      {canChallenge && (
                        <ChallengeClubForm
                          captainClubs={captainClubs}
                          targetClub={club}
                        />
                      )}
                    </CardContent>
                  </Card>
                );
              })}
              {!db.clubs.length && (
                <div className="rounded-2xl bg-card p-5 text-sm font-semibold text-muted-foreground ring-1 ring-border md:col-span-2">
                  No clubs yet. Create the first team.
                </div>
              )}
            </div>
          </section>
        </div>

        {challengeHistory.length > 0 && (
          <section className="space-y-3">
            <h2 className="flex items-center gap-2 text-lg font-bold">
              <Swords className="size-5 text-primary" /> Challenge history
            </h2>
            <div className="grid gap-2">
              {challengeHistory.map((challenge) => (
                <div
                  key={challenge.id}
                  className="flex items-center justify-between gap-3 rounded-2xl bg-card p-4 ring-1 ring-border">
                  <div>
                    <p className="font-bold">
                      {clubById.get(challenge.challengerClubId)?.name} vs{" "}
                      {clubById.get(challenge.challengedClubId)?.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {challenge.proposedDate || "Date open"} ·{" "}
                      {challenge.venueNote || "Venue open"}
                    </p>
                  </div>
                  <Badge
                    variant={
                      challenge.status === "accepted" ? "default" : "secondary"
                    }>
                    {challenge.status}
                  </Badge>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </AppShell>
  );
}
