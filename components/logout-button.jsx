"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";

export function LogoutButton() {
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <Button
      type="button"
      variant="destructive"
      size="sm"
      className="h-8 gap-1 px-2 text-xs sm:h-9 sm:px-3 sm:text-sm"
      onClick={logout}>
      <LogOut /> Logout
    </Button>
  );
}
