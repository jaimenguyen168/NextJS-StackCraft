"use client";

import React, { useState } from "react";
import PageHeader from "@/components/page-header";
import { cn } from "@/lib/utils";
import {
  NAV_ITEMS,
  NavId,
  SECTIONS,
} from "@/features/settings/constants/settings-navs";

export default function SettingsView() {
  const [active, setActive] = useState<NavId>("general");

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <PageHeader title="Settings" />

      <div className="flex flex-1 min-h-0 overflow-hidden">
        <div className="flex flex-col lg:flex-row flex-1 min-h-0 max-w-7xl mx-auto w-full px-6 lg:px-12 pt-6 lg:pt-8">
          <nav className="shrink-0 lg:w-52 xl:w-60">
            <div className="flex lg:flex-col overflow-x-auto lg:overflow-x-visible gap-1 p-2">
              {NAV_ITEMS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActive(item.id)}
                  className={cn(
                    "shrink-0 text-left px-3 py-2 rounded-md text-sm transition-colors whitespace-nowrap",
                    active === item.id
                      ? "bg-muted font-medium text-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </nav>

          <main className="flex-1 overflow-y-auto">
            <div className="p-4 lg:p-8">{SECTIONS[active]}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
