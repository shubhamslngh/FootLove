import Link from "next/link";
import { UserPlus } from "lucide-react";

import { SignupForm } from "@/components/signup-form";
import { ThemeToggle } from "@/components/theme-toggle";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SignupPage() {
  return (
    <main className="min-h-screen bg-background px-4 py-6 text-foreground">
      <section className="mx-auto flex min-h-[calc(100vh-48px)] w-full max-w-md flex-col justify-between">
        <div className="space-y-6">
          <div className="space-y-3 pt-6">
            <div className="flex items-center justify-between gap-3">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-card text-primary shadow-[0_10px_28px_rgba(17,24,39,0.08)] ring-1 ring-border">
                <UserPlus className="size-6" />
              </div>
              <ThemeToggle />
            </div>
            <div>
              <p className="text-sm font-semibold text-primary">FootLove</p>
              <h1 className="mt-2 text-4xl font-bold leading-tight tracking-normal">Join pickup matches faster</h1>
            </div>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Create account</CardTitle>
              <CardDescription>Players book slots. Managers host matches and submit venues.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <SignupForm />
              <p className="text-center text-sm text-muted-foreground">
                Already have an account? <Link href="/login" className="font-semibold text-primary">Login</Link>
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}
