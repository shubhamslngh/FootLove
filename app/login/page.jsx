import Link from "next/link";
import { ShieldCheck } from "lucide-react";

import { LoginForm } from "@/components/login-form";
import { ThemeToggle } from "@/components/theme-toggle";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-background px-4 py-6 text-foreground">
      <section className="mx-auto flex min-h-[calc(100vh-48px)] w-full max-w-md flex-col justify-between">
        <div className="space-y-6">
          <div className="space-y-3 pt-6">
            <div className="flex items-center justify-between gap-3">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-card text-primary shadow-[0_10px_28px_rgba(17,24,39,0.08)] ring-1 ring-border">
                <ShieldCheck className="size-6" />
              </div>
              <ThemeToggle />
            </div>
            <div>
              <p className="text-sm font-semibold text-primary">FootLove</p>
              <h1 className="mt-2 text-4xl font-bold leading-tight tracking-normal">Run matches from your pocket</h1>
            </div>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Login</CardTitle>
              <CardDescription>Use your phone number and password.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <LoginForm />
              <p className="text-center text-sm text-muted-foreground">
                New here? <Link href="/signup" className="font-semibold text-primary">Create an account</Link>
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}
