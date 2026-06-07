"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

export function AdminApprovedItem({ summary, badge, children }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-2xl bg-secondary">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-3 p-3 text-left"
        onClick={() => setExpanded((current) => !current)}
        aria-expanded={expanded}>
        <div className="min-w-0">{summary}</div>
        <div className="flex shrink-0 items-center gap-2">
          {badge}
          <ChevronDown
            className={`size-4 text-muted-foreground transition-transform duration-200 ${
              expanded ? "rotate-180" : ""
            }`}
          />
        </div>
      </button>
      <div
        className={`grid overflow-hidden transition-[grid-template-rows,opacity] duration-200 ${
          expanded
            ? "grid-rows-[1fr] opacity-100"
            : "grid-rows-[0fr] opacity-0"
        }`}>
        <div className="min-h-0">
          <div className="grid gap-3 border-t border-border p-3">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
