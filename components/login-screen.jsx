import Link from "next/link";
import Image from "next/image";

import { LoginForm } from "@/components/login-form";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function LoginScreen() {
  return (
    <main className="min-h-screen bg-background px-4 py-6 text-foreground">
      <section className="mx-auto flex min-h-[calc(100vh-48px)] w-full max-w-md flex-col justify-between">
        <div className="space-y-6">
          <div className="space-y-3 pt-6">
            <div className="flex items-center justify-between gap-3">
              <div className="flex h-auto items-center justify-center overflow-hidden rounded-2xl">
                <Image
                  src="/Logo.png"
                  alt="SoccerSesh logo"
                  width={144}
                  height={80}
                  className="object-contain"
                  priority
                />
              </div>
              <ThemeToggle />
            </div>
            <div>
              <h1 className="text-center mt-2 text-4xl font-bold leading-tight tracking-normal">
                Run matches from your pocket
              </h1>
            </div>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Login</CardTitle>
              <CardDescription>
                Use your mobile number and 6-digit PIN.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <LoginForm />
              <p className="text-center text-sm text-muted-foreground">
                New here?{" "}
                <Link
                  href="/signup"
                  className="font-semibold text-primary">
                  Create an account
                </Link>
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}
