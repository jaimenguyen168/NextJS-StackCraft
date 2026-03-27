import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

type ClerkUser = {
  username?: string | null;
  emailAddresses?: { emailAddress: string }[];
};

export function createUsername(user: ClerkUser | null | undefined): string {
  if (!user) return "anonymous";

  if (user.username) return user.username;

  const email = user.emailAddresses?.[0]?.emailAddress ?? "";
  return email
    .split("@")[0]
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-");
}
