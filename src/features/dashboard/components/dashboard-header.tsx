"use client";

import { useUser } from "@clerk/nextjs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function DashboardHeader() {
  const { isLoaded, user } = useUser();

  const initials = user?.fullName
    ? user.fullName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : (user?.firstName?.[0]?.toUpperCase() ?? "?");

  return (
    <div className="flex items-start justify-between w-full">
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">Nice to see you</p>
        <h1 className="text-2xl lg:text-3xl font-semibold tracking-tight">
          {isLoaded ? (user?.fullName ?? user?.firstName ?? "there") : "..."}
        </h1>
      </div>

      <div className="hidden lg:flex items-center">
        <Avatar className="size-14">
          <AvatarImage src={user?.imageUrl} alt={user?.fullName ?? ""} />
          <AvatarFallback>{isLoaded ? initials : "..."}</AvatarFallback>
        </Avatar>
      </div>
    </div>
  );
}
