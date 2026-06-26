import { redirect } from "next/navigation";
import { Trophy } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { WorldCupBrowser } from "@/components/world-cup-browser";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/server/auth";
import { getWorldCupOverview } from "@/lib/server/world-cup";

export default async function WorldCupPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  let overview = null;
  let errorMessage = "";

  try {
    overview = await getWorldCupOverview();
  } catch (error) {
    errorMessage = "Tournament data is temporarily unavailable.";
  }

  return (
    <AppShell user={user}>
      <div className="space-y-6">
        <section className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-emerald-950 via-emerald-800 to-teal-600 p-6 text-white shadow-[0_20px_50px_rgba(6,78,59,0.3)] sm:p-8">
          <div className="absolute -right-12 -top-12 size-56 rounded-full bg-white/10" />
          <div className="relative max-w-xl">
            <Badge className="bg-white/15 text-white ring-1 ring-white/20">
              Canada · Mexico · United States
            </Badge>
            <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">
              FIFA World Cup 2026
            </h1>
            <p className="mt-3 text-sm font-medium text-white/80 sm:text-base">
              Follow fixtures, participating nations, and match updates.
            </p>
            <div className="mt-5 flex flex-wrap gap-3 text-sm font-bold">
              <span className="rounded-full bg-black/20 px-4 py-2">48 teams</span>
              <span className="rounded-full bg-black/20 px-4 py-2">104 matches</span>
              <span className="rounded-full bg-black/20 px-4 py-2">16 host cities</span>
            </div>
          </div>
          <Trophy className="absolute bottom-5 right-6 size-24 text-white/15 sm:size-32" />
        </section>

        {errorMessage ? (
          <Card>
            <CardHeader>
              <CardTitle>World Cup data needs configuration</CardTitle>
            </CardHeader>
            <CardContent className="text-sm font-medium text-muted-foreground">
              {errorMessage}
            </CardContent>
          </Card>
        ) : (
          <WorldCupBrowser overview={overview} />
        )}
      </div>
    </AppShell>
  );
}
