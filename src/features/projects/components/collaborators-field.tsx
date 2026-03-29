"use client";

import React, { useState } from "react";
import { Trash2Icon, SearchIcon, CheckIcon, Loader2Icon } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverAnchor,
} from "@/components/ui/popover";
import { useSearchUsers } from "@/trpc/hooks/use-users";
import { useProjectSnapshot } from "@/features/projects/contexts/project-snapshot-context";
import {
  useInviteCollaborator,
  useRemoveCollaborator,
} from "@/trpc/hooks/use-projects";
import { toast } from "sonner";

const statusStyles: Record<string, string> = {
  PENDING: "text-yellow-600 dark:text-yellow-400",
  ACCEPTED: "text-green-600 dark:text-green-400",
  DECLINED: "text-destructive",
};

interface CollaboratorsFieldProps {
  collaborators: {
    id: string;
    role: string;
    status: string;
    user: {
      id: string;
      username: string;
      name?: string | null;
      imageUrl?: string | null;
    };
  }[];
}

export function CollaboratorsField({ collaborators }: CollaboratorsFieldProps) {
  const { projectId } = useProjectSnapshot();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const invite = useInviteCollaborator(projectId);
  const remove = useRemoveCollaborator(projectId);
  const { data: searchResults, isFetching } = useSearchUsers(query);

  const collaboratorUserIds = new Set(collaborators.map((c) => c.user.id));

  const handleSelect = (username: string) => {
    setOpen(false);
    setQuery("");
    invite.mutate(
      { projectId, username },
      {
        onSuccess: () => toast.success(`Invited ${username}`),
        onError: () => toast.error("Failed to invite user"),
      },
    );
  };

  return (
    <div className="space-y-2">
      {collaborators.length > 0 && (
        <div className="space-y-1">
          {collaborators.map((c) => (
            <div
              key={c.id}
              className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-muted/40 group"
            >
              <div className="size-5 rounded-full overflow-hidden bg-muted border border-border/60 shrink-0">
                {c.user.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={c.user.imageUrl}
                    alt={c.user.name ?? c.user.username}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[9px] font-medium text-muted-foreground">
                    {(c.user.name ?? c.user.username).slice(0, 2).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] text-foreground truncate">
                  {c.user.name ?? c.user.username}
                </p>
                <p
                  className={`text-[11px] capitalize ${statusStyles[c.status] ?? "text-muted-foreground"}`}
                >
                  {c.status === "PENDING"
                    ? "Invite pending"
                    : c.status === "DECLINED"
                      ? "Declined"
                      : c.role.toLowerCase()}
                </p>
              </div>
              {c.role !== "OWNER" && (
                <button
                  onClick={() => remove.mutate({ collaboratorId: c.id })}
                  className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 hover:text-destructive"
                >
                  <Trash2Icon className="size-3 text-muted-foreground" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <Popover open={open && query.length > 1} onOpenChange={setOpen}>
        <PopoverAnchor asChild>
          <div className="relative">
            <SearchIcon className="absolute left-2 top-1/2 -translate-y-1/2 size-3 text-muted-foreground pointer-events-none" />
            <Input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setOpen(true);
              }}
              onFocus={() => setOpen(true)}
              className="text-[13px] h-7 bg-muted/40 border-border/60 focus-visible:ring-0 pl-6"
              placeholder="Search by name, username or email..."
            />
            {isFetching && (
              <Loader2Icon className="absolute right-2 top-1/2 -translate-y-1/2 size-3 text-muted-foreground animate-spin" />
            )}
          </div>
        </PopoverAnchor>
        <PopoverContent
          className="p-0 w-[var(--radix-popover-trigger-width)]"
          onOpenAutoFocus={(e) => e.preventDefault()}
          side="bottom"
          align="start"
          sideOffset={4}
        >
          <Command>
            <CommandList>
              <CommandEmpty className="py-3 text-center text-[12px] text-muted-foreground">
                No users found.
              </CommandEmpty>
              {searchResults && searchResults.length > 0 && (
                <CommandGroup>
                  {searchResults.map((user) => {
                    const alreadyAdded = collaboratorUserIds.has(user.id);
                    return (
                      <CommandItem
                        key={user.id}
                        onSelect={() =>
                          !alreadyAdded && handleSelect(user.username)
                        }
                        className="flex items-center gap-2 px-2 py-1.5 cursor-pointer"
                        disabled={alreadyAdded}
                      >
                        <div className="size-6 rounded-full overflow-hidden bg-muted border border-border/60 shrink-0">
                          {user.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={user.imageUrl}
                              alt={user.name ?? user.username}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[9px] font-medium text-muted-foreground">
                              {(user.name ?? user.username)
                                .slice(0, 2)
                                .toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] truncate">
                            {user.name ?? user.username}
                          </p>
                          <p className="text-[11px] text-muted-foreground truncate">
                            @{user.username}
                          </p>
                        </div>
                        {alreadyAdded && (
                          <CheckIcon className="size-3 text-muted-foreground shrink-0" />
                        )}
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
