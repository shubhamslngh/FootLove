"use client";

import { useEffect, useRef, useState } from "react";
import { CreditCard, Share2, X } from "lucide-react";

import { PlayerCardDisplay } from "@/components/player-card-display";
import { Button } from "@/components/ui/button";
import { getInitials } from "@/lib/player-card";
import { cn } from "@/lib/utils";

export function PlayerCardDialog({
  user,
  stats,
  trigger = "button",
  triggerClassName,
}) {
  const [open, setOpen] = useState(false);
  const [shareStatus, setShareStatus] = useState("");
  const closeRef = useRef(null);
  const dialogRef = useRef(null);
  const triggerRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    function onKeyDown(event) {
      if (event.key === "Escape") {
        setOpen(false);
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = dialogRef.current?.querySelectorAll(
        'button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
      triggerRef.current?.focus();
    };
  }, [open]);

  async function shareCard() {
    const url = `${window.location.origin}/players/${encodeURIComponent(user.username)}`;
    setShareStatus("");
    try {
      if (navigator.share) {
        await navigator.share({
          title: `${user.name}'s SoccerSesh player card`,
          text: `Check out @${user.username}'s player card`,
          url,
        });
        setShareStatus("Shared");
      } else {
        await navigator.clipboard.writeText(url);
        setShareStatus("Link copied");
      }
    } catch (error) {
      if (error?.name !== "AbortError") setShareStatus("Could not share");
    }
  }

  return (
    <>
      {trigger === "floating" ? (
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setOpen(true)}
          className={cn(
            "fixed bottom-24 right-4 z-40 flex items-center gap-2 rounded-full bg-[#2b2729] px-3 py-2 text-sm font-black text-white shadow-[0_16px_38px_rgba(0,0,0,0.35)] ring-1 ring-white/15 transition hover:-translate-y-0.5 lg:bottom-6 lg:right-6",
            triggerClassName,
          )}
          aria-label="Open my player card">
          <Avatar user={user} />
          My Card
        </button>
      ) : (
        <Button
          ref={triggerRef}
          type="button"
          variant="outline"
          className={triggerClassName}
          onClick={() => setOpen(true)}>
          <CreditCard />
          View player card
        </Button>
      )}

      {open && (
        <div
          className="fixed inset-0 z-80 grid overflow-y-auto bg-black/75 p-3 backdrop-blur-sm"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setOpen(false);
          }}>
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label={`${user.name}'s player card`}
            className="relative m-auto grid w-full  max-w-87.5 justify-items-center gap-2 rounded-[28px] bg-card/95 p-2 shadow-2xl ring-1 ring-white/10">
            <Button
              ref={closeRef}
              type="button"
              variant="primary"
              size="icon"
              className="absolute right-3 top-3 z-30 bg-white/10 text-slate-900 shadow-md hover:bg-white"
              onClick={() => setOpen(false)}
              aria-label="Close player card">
              <X />
            </Button>
            <PlayerCardDisplay
              user={user}
              stats={stats}
              className="h-[min(500px,calc(100dvh-3rem))] w-auto max-w-full shrink-0"
            />
            <div className="flex min-h-9 w-full items-center justify-center gap-3 pb-1">
              <Button type="button" size="sm" onClick={shareCard}>
                <Share2 />
                Share card
              </Button>
              {shareStatus && (
                <p className="text-xs font-semibold text-muted-foreground">
                  {shareStatus}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Avatar({ user }) {
  return user.profileImageDataUrl ? (
    <img
      src={user.profileImageDataUrl}
      alt=""
      className="size-9 rounded-full object-cover ring-1 ring-white/25"
    />
  ) : (
    <span className="grid size-9 place-items-center rounded-full bg-white/15 text-xs">
      {getInitials(user.name)}
    </span>
  );
}
