import React from "react";

export default function ErrorFallback() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center gap-2 text-muted-foreground">
      <p className="text-sm">Something went wrong.</p>
    </div>
  );
}
