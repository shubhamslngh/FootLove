"use client";

import { useEffect, useState } from "react";
import {
  ClipboardCheck,
  LayoutDashboard,
  MapPinned,
  ShieldCheck,
} from "lucide-react";

const tabs = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "hosts", label: "Hosts", icon: ShieldCheck },
  { id: "venues", label: "Venues", icon: MapPinned },
  { id: "bookings", label: "Bookings", icon: ClipboardCheck },
];

export function AdminDashboardTabs({
  overview,
  hosts,
  venues,
  bookings,
}) {
  const [activeTab, setActiveTab] = useState("overview");
  const [isCondensed, setIsCondensed] = useState(false);
  const panels = [
    { id: "overview", content: overview },
    { id: "hosts", content: hosts },
    { id: "venues", content: venues },
    { id: "bookings", content: bookings },
  ];

  useEffect(() => {
    function onScroll() {
      setIsCondensed(window.scrollY > 380);
    }

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <div className="sticky top-20 z-100 -mx-4 px-4 py-2 sm:-mx-6 sm:px-6 lg:hidden">
        <div
          className={`grid w-full grid-cols-4 gap-1 rounded-t-2xl ease-in-out transition-transform rounded-b-2xl ${isCondensed ? "rounded-b-none" : ""}  bg-card p-1.5 shadow-[0_12px_30px_rgba(17,24,39,0.12)] ring-1 ring-border ring-t-border ring-b-0 transition-colors duration-300 `}
          role="tablist"
          aria-label="Admin management">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                id={`admin-tab-${tab.id}`}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-controls={`admin-panel-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex min-w-0 min-h-12 items-center justify-center overflow-hidden rounded-xl px-1 font-bold transition-[color,box-shadow,transform,background-color] duration-300 ${
                  isActive
                    ? "text-foreground shadow-[0_10px_20px_rgba(15,23,42,0.12)]"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}>
                {isActive && (
                  <span className="pointer-events-none absolute inset-0 rounded-[inherit] bg-linear-to-br from-green-900/20 via-background/60 to-background/30 shadow-[inset_5px_5px_12px_rgba(255,255,255,0.55),inset_-6px_-8px_14px_rgba(15,23,42,0.08),0_14px_25px_rgba(15,23,42,0.18)] ring-1 ring-white/40 backdrop-blur-xl dark:from-white/15 dark:via-background/45 dark:to-background/20 dark:ring-black/15" />
                )}
                <span
                  className={`relative z-10 flex min-w-0 flex-col items-center justify-center gap-1 transition-transform duration-300 ${
                    isCondensed ? "scale-[0.92] " : "scale-100"
                  }`}>
                  <Icon className="size-4" />
                  <span className="truncate text-[0.65rem]">{tab.label}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-3 lg:hidden">
        {panels.map((panel) => (
          <div
            key={panel.id}
            id={`admin-panel-${panel.id}`}
            role="tabpanel"
            aria-labelledby={`admin-tab-${panel.id}`}
            hidden={activeTab !== panel.id}>
            {panel.content}
          </div>
        ))}
      </div>

      <section className="hidden gap-5 lg:grid lg:grid-cols-[1fr_360px]">
        <div>{overview}</div>
        <div className="space-y-5">
          {hosts}
          {venues}
          {bookings}
        </div>
      </section>
    </>
  );
}
