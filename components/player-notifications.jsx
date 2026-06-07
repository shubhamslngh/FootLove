"use client";

import { useCallback, useEffect, useState } from "react";
import * as Toast from "@radix-ui/react-toast";
import { CheckCircle2, X, XCircle } from "lucide-react";

export function PlayerNotifications() {
  const [queue, setQueue] = useState([]);
  const current = queue[0];

  const loadNotifications = useCallback(async () => {
    const response = await fetch("/api/notifications", { cache: "no-store" });
    if (!response.ok) return;

    const result = await response.json();
    setQueue((existing) => {
      const knownIds = new Set(existing.map((item) => item.id));
      return [
        ...existing,
        ...(result.data?.notifications || []).filter(
          (item) => !knownIds.has(item.id),
        ),
      ];
    });
  }, []);

  useEffect(() => {
    loadNotifications();
    const interval = window.setInterval(loadNotifications, 10000);
    return () => window.clearInterval(interval);
  }, [loadNotifications]);

  async function dismissCurrent() {
    if (!current) return;
    setQueue((items) => items.slice(1));
    await fetch(`/api/notifications/${current.id}/read`, { method: "POST" });
  }

  const confirmed = current?.type === "booking_confirmed";
  const StatusIcon = confirmed ? CheckCircle2 : XCircle;

  return (
    <Toast.Provider swipeDirection="right" duration={6000}>
      <Toast.Root
        open={Boolean(current)}
        onOpenChange={(open) => {
          if (!open) dismissCurrent();
        }}
        className="grid grid-cols-[auto_1fr_auto] items-start gap-3 rounded-2xl bg-card p-4 text-card-foreground shadow-[0_18px_48px_rgba(17,24,39,0.24)] ring-1 ring-border data-[state=open]:animate-[toast-in_240ms_ease-out] data-[state=closed]:animate-[toast-out_180ms_ease-in]">
        <StatusIcon
          className={`mt-0.5 size-5 ${
            confirmed ? "text-primary" : "text-red-500"
          }`}
        />
        <div>
          <Toast.Title className="text-sm font-bold">
            {current?.title}
          </Toast.Title>
          <Toast.Description className="mt-1 text-sm text-muted-foreground">
            {current?.message}
          </Toast.Description>
        </div>
        <Toast.Close
          className="grid size-8 place-items-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground"
          aria-label="Dismiss notification">
          <X className="size-4" />
        </Toast.Close>
      </Toast.Root>
      <Toast.Viewport className="fixed inset-x-3 bottom-24 z-[80] grid max-w-sm gap-2 sm:left-auto sm:right-5 sm:top-20 sm:bottom-auto sm:w-full" />
    </Toast.Provider>
  );
}
