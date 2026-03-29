"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { useEffect } from "react";

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}

export function SuppressWarnings() {
  useEffect(() => {
    const original = console.warn;
    console.warn = (...args: unknown[]) => {
      if (
        typeof args[0] === "string" &&
        (args[0].includes("UNSAFE_componentWillReceiveProps") ||
          args[0].includes("Extraneous non-props attributes"))
      )
        return;
      original(...args);
    };
    return () => {
      console.warn = original;
    };
  }, []);

  return null;
}
