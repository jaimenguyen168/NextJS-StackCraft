import type { Metadata } from "next";
import { Space_Grotesk, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { TRPCReactProvider } from "@/trpc/client";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "StackCraft",
    template: "%s | StackCraft",
  },
  description:
    "Describe your project idea and get a full technical blueprint in seconds — schema, architecture, timeline, and more.",
  icons: {
    icon: [
      { url: "/logo.svg", media: "(prefers-color-scheme: light)" },
      { url: "/logo.svg", media: "(prefers-color-scheme: dark)" },
    ],
  },
};
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <TRPCReactProvider>
        <html
          lang="en"
          className={`${spaceGrotesk.variable} ${geistMono.variable} h-full antialiased`}
          suppressHydrationWarning
        >
          <body className="min-h-full flex flex-col">
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              {children}
              <Toaster />
            </ThemeProvider>
          </body>
        </html>
      </TRPCReactProvider>
    </ClerkProvider>
  );
}
