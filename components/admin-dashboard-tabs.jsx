"use client";

import { useState } from "react";
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
  const panels = [
    { id: "overview", content: overview },
    { id: "hosts", content: hosts },
    { id: "venues", content: venues },
    { id: "bookings", content: bookings },
  ];

  return (
    <>
      <div className="sticky top-[76px] z-30 -mx-4 bg-background/90 px-4 py-2 backdrop-blur-xl sm:-mx-6 sm:px-6 lg:hidden">
        <div
          className="grid grid-cols-4 gap-1 rounded-2xl bg-card p-1.5 shadow-[0_12px_30px_rgba(17,24,39,0.12)] ring-1 ring-border"
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
                className={`flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl px-1 text-[0.65rem] font-bold transition ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}>
                <Icon className="size-4" />
                <span>{tab.label}</span>
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
