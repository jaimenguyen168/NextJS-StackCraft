"use client";

import { useState } from "react";
import { CheckIcon, PaletteIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useUpdateProjectColor } from "@/trpc/hooks/use-projects";
import { cn } from "@/lib/utils";

const PRESET_COLORS = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#14b8a6",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#f43f5e",
  "#fb923c",
  "#facc15",
  "#4ade80",
  "#2dd4bf",
  "#60a5fa",
  "#a78bfa",
  "#f472b6",
  "#b45309",
  "#15803d",
  "#1d4ed8",
  "#7c3aed",
  "#1e293b",
  "#475569",
  "#94a3b8",
  "#ffffff",
];

interface ColorPickerRowProps {
  projectId: string;
  mainColor?: string | null;
}

export function ColorPickerRow({ projectId, mainColor }: ColorPickerRowProps) {
  const [open, setOpen] = useState(false);
  const [hex, setHex] = useState(
    mainColor?.startsWith("#") ? mainColor : "#10b981",
  );
  const updateColor = useUpdateProjectColor(projectId);

  const apply = (color: string) => {
    setHex(color);
    updateColor.mutate({ id: projectId, mainColor: color });
  };

  const handleHexCommit = () => {
    const cleaned = hex.startsWith("#") ? hex : `#${hex}`;
    if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(cleaned)) {
      apply(cleaned);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="group w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded-md hover:bg-muted/60 transition-colors text-left">
          <span className="text-[13px] font-medium text-foreground">
            Cover color
          </span>
          <div className="flex items-center gap-1.5 shrink-0">
            <span
              className="size-4 rounded-sm border border-border/60 shrink-0"
              style={{
                backgroundColor: mainColor ?? "oklch(0.6487 0.1538 150.3071)",
              }}
            />
            <PaletteIcon className="size-3 text-muted-foreground/50 group-hover:text-muted-foreground transition-colors" />
          </div>
        </button>
      </PopoverTrigger>
      <PopoverContent side="right" align="start" className="w-52 p-3 space-y-3">
        <p className="text-[11px] uppercase tracking-widest text-muted-foreground/50">
          Cover color
        </p>

        {/* Swatch grid */}
        <div className="grid grid-cols-6 gap-1.5">
          {PRESET_COLORS.map((color) => (
            <button
              key={color}
              onClick={() => apply(color)}
              className={cn(
                "size-6 rounded-md border transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-ring",
                color === "#ffffff" ? "border-border" : "border-transparent",
              )}
              style={{ backgroundColor: color }}
              title={color}
            >
              {mainColor === color && (
                <CheckIcon
                  className={cn(
                    "size-3 mx-auto",
                    color === "#ffffff" || color === "#facc15"
                      ? "text-black"
                      : "text-white",
                  )}
                />
              )}
            </button>
          ))}
        </div>

        {/* Custom hex input */}
        <div className="flex items-center gap-1.5">
          <span
            className="size-6 rounded-md border border-border/60 shrink-0"
            style={{ backgroundColor: hex }}
          />
          <Input
            value={hex}
            onChange={(e) => setHex(e.target.value)}
            onBlur={handleHexCommit}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleHexCommit();
            }}
            className="h-7 text-[13px] font-mono bg-muted/40 border-border/60 focus-visible:ring-0"
            placeholder="#000000"
            maxLength={7}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
