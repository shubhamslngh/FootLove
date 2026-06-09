import Link from "next/link";
import { redirect } from "next/navigation";
import {
  CalendarPlus,
  MapPinned,
  Shield,
  Sparkles,
  UsersRound,
} from "lucide-react";

import { AdminDashboardTabs } from "@/components/admin-dashboard-tabs";
import { AdminApprovedItem } from "@/components/admin-approved-item";
import { AppShell } from "@/components/app-shell";
import { BookingApprovalActions } from "@/components/booking-approval-actions";
import { HostVerificationActions } from "@/components/host-verification-actions";
import { LottieAnimation } from "@/components/lottie-animation";
import { ManagerApplicationForm } from "@/components/manager-application-form";
import { MatchCard } from "@/components/match-card";
import { PendingBookingCard } from "@/components/pending-booking-card";
import { VenueApprovalActions } from "@/components/venue-approval-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/server/auth";
import { readDb, withVenue } from "@/lib/server/db";
import { formatDisplayDate } from "@/lib/utils";
import {
  canBookMatch,
  canHostMatch,
  canManagePlatform,
  ROLES,
} from "@/lib/server/roles";

const playerCategories = [
  {
    title: "Casual",
    description: "Open pickup games nearby",
    icon: Sparkles,
    tone: "bg-emerald-500/12 text-emerald-600 dark:text-emerald-300",
    animation: "/Football3.lottie",
    href: "/matches",
  },
  {
    title: "Community",
    description: "Play with local football groups",
    icon: UsersRound,
    tone: "bg-sky-500/12 text-sky-600 dark:text-sky-300",
    animation: "/Football1.lottie",
    href: "/communities",
  },
  {
    title: "Clubs",
    description: "Join organized club sessions",
    icon: Shield,
    tone: "bg-violet-500/12 text-violet-600 dark:text-violet-300",
    animation: "/Football2.lottie",
    href: "/clubs",
  },
];

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const db = await readDb();
  const canHost = canHostMatch(user);
  const canBook = canBookMatch(user.role);
  const isAdmin = canManagePlatform(user.role);
  const userBookings = db.bookings.filter(
    (booking) => booking.userId === user.id,
  );
  const pendingBookings = db.bookings.filter(
    (booking) => booking.status === "pending",
  ).map((booking) => ({
    ...booking,
    match: db.matches.find((match) => match.id === booking.matchId),
    player: db.users.find((candidate) => candidate.id === booking.userId),
  })).filter((booking) => booking.match && booking.player);
  const pendingVenues = db.venues
    .filter((venue) => venue.status === "pending")
    .map((venue) => ({
      ...venue,
      manager: db.users.find(
        (candidate) => candidate.id === venue.submittedByUserId,
      ),
    }));
  const approvedVenues = db.venues
    .filter((venue) => !venue.status || venue.status === "approved")
    .map((venue) => ({
      ...venue,
      manager: db.users.find(
        (candidate) => candidate.id === venue.submittedByUserId,
      ),
    }));
  const inactiveVenues = db.venues
    .filter((venue) => venue.status === "inactive")
    .map((venue) => ({
      ...venue,
      manager: db.users.find(
        (candidate) => candidate.id === venue.submittedByUserId,
      ),
    }));
  const pendingManagers = db.users.filter(
    (candidate) =>
      (candidate.role === ROLES.MANAGER &&
        candidate.hostVerificationStatus === "pending") ||
      (candidate.role === ROLES.PLAYER &&
        candidate.managerApplicationStatus === "pending"),
  );
  const approvedManagers = db.users.filter(
    (candidate) =>
      candidate.role === ROLES.MANAGER &&
      candidate.hostVerificationStatus === "approved",
  );
  const matches = db.matches.map((match) => {
    const matchBookings = db.bookings.filter(
      (booking) => booking.matchId === match.id,
    );
    return {
      ...withVenue(match, db.venues),
      pendingCount: matchBookings.filter(
        (booking) => booking.status === "pending",
      ).length,
      userBooking:
        matchBookings.find((booking) => booking.userId === user.id) || null,
    };
  });
  const now = new Date();
  const getMatchDateTime = (match) =>
    new Date(`${match.date}T${match.time || "00:00"}`);
  const upcomingMatches = matches
    .filter((match) => getMatchDateTime(match) >= now)
    .sort((a, b) => getMatchDateTime(b) - getMatchDateTime(a));
  const pastMatches = matches
    .filter((match) => getMatchDateTime(match) < now)
    .sort((a, b) => getMatchDateTime(b) - getMatchDateTime(a));
  const participatedMatches = userBookings
    .filter((booking) => booking.status === "confirmed")
    .map((booking) => ({
      match: matches.find((match) => match.id === booking.matchId),
      booking,
    }))
    .filter((item) => item.match);

  const playerHomePanel = (
    <div className="space-y-6">
      <div>
        <h1 className="mt-1 text-3xl font-bold tracking-normal">
          Find your next game
        </h1>
      </div>

      <div className="mx-auto grid grid-cols-1 gap-4 min-[420px]:grid-cols-2 lg:grid-cols-3">
        {playerCategories.map((category) => {
          const Icon = category.icon;

          return (
            <Link
              key={category.title}
              href={category.href}
              className="theme-reactive-card group relative min-h-44 overflow-hidden rounded-2xl bg-card p-4 shadow-[0_14px_34px_rgba(17,24,39,0.08)] ring-1 ring-border perspective-[700px] transition active:scale-[0.98] sm:min-h-48 sm:p-5">
              <div className="pointer-events-none absolute -right-5 -top-5 size-36 rounded-full bg-gradient-to-br from-white/80 via-background/60 to-background/30 shadow-[inset_5px_5px_12px_rgba(255,255,255,0.55),inset_-6px_-8px_14px_rgba(15,23,42,0.08),0_14px_25px_rgba(15,23,42,0.18)] ring-1 ring-white/40 backdrop-blur-xl transition-transform duration-300 [transform:rotateX(8deg)_rotateY(-10deg)_translateZ(8px)] group-hover:[transform:rotateX(3deg)_rotateY(-5deg)_translateZ(14px)_scale(1.03)] dark:from-white/15 dark:via-background/45 dark:to-background/20 dark:ring-white/15 sm:size-40" />
              <LottieAnimation
                src={category.animation}
                className="pointer-events-none absolute -right-3 -top-5 z-10 size-32 opacity-90 drop-shadow-[0_12px_10px_rgba(15,23,42,0.22)] transition-transform duration-300 transform-[translateZ(24px)] group-hover:scale-110 sm:size-36"
              />
              <div className="relative z-20 mt-24 transition-transform duration-300 group-hover:-translate-y-1 sm:mt-28">
                <h2 className="text-base font-extrabold tracking-tight text-foreground drop-shadow-[0_2px_1px_rgba(255,255,255,0.65)] sm:text-lg dark:drop-shadow-[0_2px_2px_rgba(0,0,0,0.65)]">
                  {category.title}
                </h2>
                <p className="mt-1 max-w-44 text-xs font-medium leading-5 text-foreground/75 drop-shadow-[0_1px_1px_rgba(255,255,255,0.7)] sm:text-sm dark:drop-shadow-[0_1px_2px_rgba(0,0,0,0.7)]">
                  {category.description}
                </p>
              </div>
            </Link>
          );
        })}
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold">My participated matches</h2>
          <Badge variant="secondary">{participatedMatches.length}</Badge>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {participatedMatches.map(({ match, booking }) => (
            <MatchCard
              key={booking.id}
              match={match}
              canBook
              existingBooking={booking}
              pendingCount={match.pendingCount}
            />
          ))}
          {!participatedMatches.length && (
            <div className="rounded-2xl bg-card p-5 text-sm font-semibold text-muted-foreground shadow-[0_14px_34px_rgba(17,24,39,0.08)] ring-1 ring-border md:col-span-2">
              Matches you book or join will appear here.
            </div>
          )}
        </div>
      </section>

      <section className="border-t border-border pt-4">
        <ManagerApplicationForm status={user.managerApplicationStatus} />
      </section>
    </div>
  );

  const managementOverviewPanel = (
    <div className="space-y-5">
      {user.role === ROLES.MANAGER && !canHost && (
        <Card>
          <CardHeader>
            <Badge
              className="w-fit"
              variant={
                user.hostVerificationStatus === "rejected"
                  ? "outline"
                  : "secondary"
              }>
              {user.hostVerificationStatus === "rejected"
                ? "Verification rejected"
                : "Verification pending"}
            </Badge>
            <CardTitle className="text-lg">
              Host access requires admin approval
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {user.hostVerificationStatus === "rejected"
              ? "Your payment method was not approved. Contact an admin to update and resubmit your details."
              : "Your UPI details and payment QR are being reviewed. You can host matches after approval."}
          </CardContent>
        </Card>
      )}
      <div className="rounded-[28px] bg-foreground p-5 text-background shadow-[0_18px_40px_rgba(17,24,39,0.18)]">
        <Badge variant="secondary">{user.role} dashboard</Badge>
        <h1 className="mt-4 text-3xl font-bold tracking-normal">
          {user.role === ROLES.MANAGER
            ? canHost
              ? "Host, fill, and run football matches"
              : "Complete verification to host matches"
            : canHost
              ? "Host, fill, and run football matches"
              : "Find and book football matches"}
        </h1>
        <p className="mt-3 text-sm text-background/80">
          {user.role === ROLES.MANAGER && !canHost
            ? "Your submitted payment method must be approved by an admin."
            : canHost
              ? "Submit venues, publish matches, add payment details, and confirm players."
              : "Browse hosted matches, pay through UPI, and book available slots."}
        </p>
        <div className="mt-5 flex gap-2">
          {canHost && (
            <Button asChild variant="secondary">
              <Link href="/host">
                <CalendarPlus /> Host match
              </Link>
            </Button>
          )}
          <Button
            asChild
            variant="outline"
            className="bg-background/10 text-background ring-background/20 hover:bg-background/15 hover:text-background">
            <Link href="/matches">View matches</Link>
          </Button>
        </div>
      </div>

      {canHost && pendingBookings.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-primary">
                Action required
              </p>
              <h2 className="text-lg font-bold">Booking confirmations</h2>
            </div>
            <Badge variant="secondary">{pendingBookings.length}</Badge>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {pendingBookings.map((booking) => (
              <PendingBookingCard key={booking.id} booking={booking} />
            ))}
          </div>
        </section>
      )}

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Upcoming matches</h2>
          <Button asChild variant="ghost" size="sm">
            <Link href="/matches">All</Link>
          </Button>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {upcomingMatches.map((match) => (
            <MatchCard
              key={match.id}
              match={match}
              canBook={canBook}
              existingBooking={match.userBooking}
              pendingCount={match.pendingCount}
              showPending={canHost}
            />
          ))}
          {!upcomingMatches.length && (
            <div className="rounded-3xl bg-card p-5 text-sm font-semibold text-muted-foreground shadow-[0_14px_34px_rgba(17,24,39,0.08)] ring-1 ring-border md:col-span-2">
              {canHost
                ? "No matches yet. Submit a venue, wait for approval, then publish your first match."
                : "No matches have been published yet."}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-bold">Past matches</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {pastMatches.map((match) => (
            <MatchCard
              key={match.id}
              match={match}
              pendingCount={match.pendingCount}
              showPending={canHost}
            />
          ))}
          {!pastMatches.length && (
            <div className="rounded-2xl bg-card p-5 text-sm font-semibold text-muted-foreground ring-1 ring-border md:col-span-2">
              Past matches will appear here.
            </div>
          )}
        </div>
      </div>
    </div>
  );
  const overviewPanel =
    user.role === ROLES.PLAYER ? playerHomePanel : managementOverviewPanel;

  const hostsPanel = (
    <Card>
              <CardHeader>
                <CardTitle className="text-lg">Host verification</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-bold">Pending requests</p>
                  <Badge variant="secondary">{pendingManagers.length}</Badge>
                </div>
                {pendingManagers.length ? (
                  pendingManagers.map((manager) => (
                    <div
                      key={manager.id}
                      className="grid gap-3 rounded-2xl bg-secondary p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-bold">{manager.name}</p>
                          <p className="text-xs text-muted-foreground">
                            Request ID: {manager.id}
                          </p>
                        </div>
                        <Badge variant="secondary">
                          {manager.role === ROLES.PLAYER
                            ? "player upgrade"
                            : "new host"}
                        </Badge>
                      </div>

                      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 border-y border-border py-3 text-sm">
                        <dt className="text-muted-foreground">Phone</dt>
                        <dd className="text-right font-semibold">
                          {manager.phone}
                        </dd>
                        <dt className="text-muted-foreground">Account</dt>
                        <dd className="text-right font-semibold">
                          {manager.role === ROLES.PLAYER
                            ? "Existing player"
                            : "Manager signup"}
                        </dd>
                        <dt className="text-muted-foreground">Submitted</dt>
                        <dd className="text-right font-semibold">
                          {new Intl.DateTimeFormat("en-IN", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          }).format(
                            new Date(
                              manager.managerApplicationSubmittedAt ||
                                manager.hostVerificationSubmittedAt ||
                                manager.createdAt,
                            ),
                          )}
                        </dd>
                        <dt className="text-muted-foreground">UPI ID</dt>
                        <dd className="break-all text-right font-semibold">
                          {manager.paymentMethod?.upiId || "Not provided"}
                        </dd>
                        <dt className="text-muted-foreground">Payee name</dt>
                        <dd className="text-right font-semibold">
                          {manager.paymentMethod?.payeeName || "Not provided"}
                        </dd>
                      </dl>

                      <div>
                        <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
                          Payment QR
                        </p>
                        {manager.paymentMethod?.qrCodeDataUrl ? (
                          <a
                            href={manager.paymentMethod.qrCodeDataUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-block">
                            <img
                              className="size-40 rounded-2xl bg-white object-contain p-2 ring-1 ring-border"
                              src={manager.paymentMethod.qrCodeDataUrl}
                              alt={`${manager.name} payment QR code`}
                            />
                          </a>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            No payment QR provided.
                          </p>
                        )}
                      </div>
                      <HostVerificationActions managerId={manager.id} />
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl bg-secondary p-3 text-muted-foreground">
                    No managers are waiting for verification.
                  </div>
                )}
                <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
                  <p className="font-bold">Approved hosts</p>
                  <Badge variant="secondary">{approvedManagers.length}</Badge>
                </div>
                {approvedManagers.length ? (
                  approvedManagers.map((manager) => (
                    <AdminApprovedItem
                      key={manager.id}
                      summary={
                        <div>
                          <p className="font-bold">{manager.name}</p>
                          <p className="truncate text-sm text-muted-foreground">
                            {manager.phone}
                          </p>
                        </div>
                      }
                      badge={<Badge>verified</Badge>}>
                      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 border-y border-border py-3">
                        <dt className="text-muted-foreground">UPI ID</dt>
                        <dd className="break-all text-right font-semibold">
                          {manager.paymentMethod?.upiId || "Not provided"}
                        </dd>
                        <dt className="text-muted-foreground">Payee</dt>
                        <dd className="text-right font-semibold">
                          {manager.paymentMethod?.payeeName || "Not provided"}
                        </dd>
                        <dt className="text-muted-foreground">Approved</dt>
                        <dd className="text-right font-semibold">
                          {manager.hostVerifiedAt
                            ? formatDisplayDate(manager.hostVerifiedAt)
                            : "Approved"}
                        </dd>
                      </dl>
                      {manager.paymentMethod?.qrCodeDataUrl && (
                        <a
                          href={manager.paymentMethod.qrCodeDataUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="w-fit">
                          <img
                            className="size-28 rounded-xl bg-white object-contain p-2 ring-1 ring-border"
                            src={manager.paymentMethod.qrCodeDataUrl}
                            alt={`${manager.name} payment QR code`}
                          />
                        </a>
                      )}
                      <HostVerificationActions
                        managerId={manager.id}
                        approved
                      />
                    </AdminApprovedItem>
                  ))
                ) : (
                  <div className="rounded-2xl bg-secondary p-3 text-muted-foreground">
                    No hosts have been approved yet.
                  </div>
                )}
              </CardContent>
    </Card>
  );

  const venuesPanel = (
    <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MapPinned className="size-5 text-primary" /> Venue approvals
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-bold">Pending venues</p>
                  <Badge variant="secondary">{pendingVenues.length}</Badge>
                </div>
                {pendingVenues.length ? (
                  pendingVenues.map((venue) => (
                    <div
                      key={venue.id}
                      className="rounded-2xl bg-secondary p-3">
                      <p className="font-bold">{venue.name}</p>
                      <p className="mt-1 text-muted-foreground">
                        {venue.area}, {venue.city}
                      </p>
                      {venue.address && (
                        <p className="mt-1 text-muted-foreground">
                          {venue.address}
                        </p>
                      )}
                      <p className="mt-1 text-muted-foreground">
                        Submitted by {venue.manager?.name || "Manager"}
                      </p>
                      <div className="mt-3">
                        <VenueApprovalActions venueId={venue.id} />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl bg-secondary p-3 text-muted-foreground">
                    No venues are waiting for approval.
                  </div>
                )}
                <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
                  <p className="font-bold">Approved venues</p>
                  <Badge variant="secondary">{approvedVenues.length}</Badge>
                </div>
                {approvedVenues.length ? (
                  approvedVenues.map((venue) => (
                    <AdminApprovedItem
                      key={venue.id}
                      summary={
                        <div>
                          <p className="font-bold">{venue.name}</p>
                          <p className="truncate text-sm text-muted-foreground">
                            {venue.area}, {venue.city}
                          </p>
                        </div>
                      }
                      badge={<Badge>active</Badge>}>
                      {venue.address && (
                        <p className="text-muted-foreground">
                          {venue.address}
                        </p>
                      )}
                      <p className="text-muted-foreground">
                        Managed by {venue.manager?.name || "Admin"}
                      </p>
                      {venue.mapUrl && (
                        <a
                          href={venue.mapUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="font-semibold text-primary">
                          Open map
                        </a>
                      )}
                      <VenueApprovalActions venueId={venue.id} approved />
                    </AdminApprovedItem>
                  ))
                ) : (
                  <div className="rounded-2xl bg-secondary p-3 text-muted-foreground">
                    No venues have been approved yet.
                  </div>
                )}
                <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
                  <p className="font-bold">Inactive venues</p>
                  <Badge variant="secondary">{inactiveVenues.length}</Badge>
                </div>
                {inactiveVenues.length ? (
                  inactiveVenues.map((venue) => (
                    <div
                      key={venue.id}
                      className="grid gap-3 rounded-2xl bg-secondary p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-bold">{venue.name}</p>
                          <p className="text-muted-foreground">
                            {venue.area}, {venue.city}
                          </p>
                        </div>
                        <Badge variant="outline">inactive</Badge>
                      </div>
                      <p className="text-muted-foreground">
                        Managed by {venue.manager?.name || "Admin"}
                      </p>
                      <VenueApprovalActions venueId={venue.id} inactive />
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl bg-secondary p-3 text-muted-foreground">
                    No venues are inactive.
                  </div>
                )}
              </CardContent>
    </Card>
  );

  const bookingsPanel = (
    <Card>
              <CardHeader>
                <CardTitle className="text-lg">Booking approvals</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {pendingBookings.length ? (
                  pendingBookings.map((booking) => (
                    <div
                      key={booking.id}
                      className="grid gap-3 rounded-2xl bg-secondary p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-bold">{booking.player.name}</p>
                          <p className="text-muted-foreground">
                            {booking.match.title}
                          </p>
                        </div>
                        <Badge variant="secondary">pending</Badge>
                      </div>
                      <div className="grid gap-1 text-muted-foreground">
                        <p>
                          {formatDisplayDate(booking.match.date)} ·{" "}
                          {booking.match.time}
                        </p>
                        <p>Slot: {booking.slotRole}</p>
                        <p>
                          Payment: {booking.paymentStatus || "pending"}
                        </p>
                        {booking.paymentReference && (
                          <p>Reference: {booking.paymentReference}</p>
                        )}
                      </div>
                      <BookingApprovalActions bookingId={booking.id} />
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl bg-secondary p-3 text-muted-foreground">
                    No bookings are waiting for approval.
                  </div>
                )}
              </CardContent>
    </Card>
  );

  return (
    <AppShell user={user}>
      {isAdmin ? (
        <AdminDashboardTabs
          overview={overviewPanel}
          hosts={hostsPanel}
          venues={venuesPanel}
          bookings={bookingsPanel}
        />
      ) : (
        overviewPanel
      )}
    </AppShell>
  );
}
