"use client";

import { useState } from "react";
import { PaletteIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useUpdateProjectColor } from "@/trpc/hooks/use-projects";
import { useTheme } from "next-themes";

interface ColorPickerRowProps {
  projectId: string;
  mainColorLight?: string | null;
  mainColorDark?: string | null;
}

export function ColorPickerRow({
  projectId,
  mainColorLight,
  mainColorDark,
}: ColorPickerRowProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const activeColor = isDark
    ? (mainColorDark ?? mainColorLight)
    : mainColorLight;

  const [open, setOpen] = useState(false);
  const [hex, setHex] = useState(
    activeColor?.startsWith("#") ? activeColor : "#10b981",
  );
  const updateColor = useUpdateProjectColor(projectId);

  const apply = (color: string) => {
    setHex(color);
    updateColor.mutate({
      id: projectId,
      mainColorLight: isDark ? (mainColorLight ?? null) : color,
      mainColorDark: isDark ? color : (mainColorDark ?? null),
    });
  };

  const handleHexCommit = () => {
    const cleaned = hex.startsWith("#") ? hex : `#${hex}`;
    if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(cleaned)) apply(cleaned);
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
              style={{ backgroundColor: activeColor ?? undefined }}
              suppressHydrationWarning
            />
            <PaletteIcon className="size-3 text-muted-foreground/50 group-hover:text-muted-foreground transition-colors" />
          </div>
        </button>
      </PopoverTrigger>
      <PopoverContent side="top" align="start" className="w-52 p-3 space-y-3">
        <p className="text-[11px] uppercase tracking-widest text-muted-foreground/50">
          {isDark ? "Dark cover color" : "Light cover color"}
        </p>

        {/* Native color palette */}
        <input
          type="color"
          value={hex}
          onChange={(e) => setHex(e.target.value)}
          onBlur={(e) => apply(e.target.value)}
          className="w-full h-32 rounded-md cursor-pointer border-0 bg-transparent p-0"
        />

        {/* Hex input */}
        <div className="flex items-center gap-1.5">
          <span
            className="size-6 rounded-md border border-border/60 shrink-0"
            style={{ backgroundColor: hex }}
            suppressHydrationWarning
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
