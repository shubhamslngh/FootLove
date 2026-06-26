import Link from "next/link";
import Image from "next/image";

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
                          <div className="flex h-auto items-center justify-center overflow-hidden rounded-2xl">
                            <Image
                              src="/Logo.png"
                              alt="SoccerSesh logo"
                              width={144}
                              height={80}
                              className="h-auto w-auto object-contain"
                              priority
                            />
                          </div>
              <ThemeToggle />
            </div>
            <div>
              {/* <p className="text-sm font-semibold text-primary">SoccerSesh</p> */}
              <h1 className="mt-2 font-extralight text-4xl text-center font-bold leading-tight tracking-normal">
                Join pickup matches faster
              </h1>
            </div>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Create account</CardTitle>
              <CardDescription>
                We will guide you through a few quick steps.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <SignupForm />
              <p className="text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link href="/login" className="font-semibold text-primary">
                  Login
                </Link>
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}
