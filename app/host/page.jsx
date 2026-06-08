import { redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { HostMatchForm } from "@/components/host-match-form";
import { getCurrentUser } from "@/lib/server/auth";
import { readDb } from "@/lib/server/db";
import { canHostMatch } from "@/lib/server/roles";

export default async function HostPage({ searchParams }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!canHostMatch(user)) redirect("/dashboard");

  const db = await readDb();
  const { edit } = await searchParams;
  const initialMatch = edit
    ? db.matches.find(
        (match) =>
          match.id === edit &&
          (match.hostUserId === user.id || user.role === "admin"),
      )
    : null;
  const visibleVenues = db.venues.filter((venue) => venue.status !== "rejected");
  const approvedVenues = visibleVenues.filter((venue) => !venue.status || venue.status === "approved");

  return (
    <AppShell user={user}>
      <section className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <div className="space-y-5">
          <div>
            <p className="text-sm font-semibold text-primary">Hosting</p>
            <h1 className="text-3xl font-bold tracking-normal">Host a match</h1>
            {/* <p className="mt-2 text-sm text-muted-foreground">Submit venues for admin approval, add payment details, then publish slots for players.</p> */}
          </div>
          <HostMatchForm
            venues={visibleVenues}
            paymentMethod={user.paymentMethod}
            initialMatch={initialMatch}
          />
        </div>

       
      </section>
    </AppShell>
  );
}
