import React from "react";

export function SettingsSection({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 px-1">
        <Icon className="size-3 text-muted-foreground" />
        <p className="text-[11px] uppercase tracking-widest text-muted-foreground/80">
          {title}
        </p>
      </div>
      {children}
    </div>
  );
}
