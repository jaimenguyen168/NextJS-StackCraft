"use client";

import React, { useState, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2Icon, CameraIcon, CheckIcon, EyeIcon, EyeOffIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import { useMe, useSetOpenaiKey, useRemoveOpenaiKey } from "@/trpc/hooks/use-users";

// ─── Row wrapper ──────────────────────────────────────────────────────────────

function SettingRow({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-4 py-5 border-b border-border last:border-0">
      <div className="sm:w-48 shrink-0">
        <p className="text-sm font-medium">{label}</p>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
}

// ─── Avatar upload ────────────────────────────────────────────────────────────

function AvatarField() {
  const { user } = useUser();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    try {
      await user.setProfileImage({ file });
      toast.success("Profile image updated");
    } catch (err) {
      toast.error("Failed to update profile image");
      console.error(err);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  return (
    <div className="flex items-center gap-4">
      <div className="relative group">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={user?.imageUrl}
          alt={user?.fullName ?? "Avatar"}
          className="size-16 rounded-full object-cover border border-border"
        />
        <button
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
        >
          {uploading ? (
            <Loader2Icon className="size-4 text-white animate-spin" />
          ) : (
            <CameraIcon className="size-4 text-white" />
          )}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={handleFileChange}
        />
      </div>
      <div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? (
            <>
              <Loader2Icon className="size-3 animate-spin" />
              Uploading...
            </>
          ) : (
            "Change photo"
          )}
        </Button>
        <p className="text-xs text-muted-foreground mt-1">
          JPG, PNG or GIF. Max 10MB.
        </p>
      </div>
    </div>
  );
}

// ─── Name field ───────────────────────────────────────────────────────────────

function NameField() {
  const { user } = useUser();
  const [firstName, setFirstName] = useState(user?.firstName ?? "");
  const [lastName, setLastName] = useState(user?.lastName ?? "");
  const [saving, setSaving] = useState(false);

  const isDirty =
    firstName !== (user?.firstName ?? "") ||
    lastName !== (user?.lastName ?? "");

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await user.update({ firstName, lastName });
      toast.success("Name updated");
    } catch {
      toast.error("Failed to update name");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">First name</Label>
          <Input
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="h-9 focus-visible:ring-0"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Last name</Label>
          <Input
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="h-9 focus-visible:ring-0"
          />
        </div>
      </div>
      {isDirty && (
        <Button size="sm" onClick={handleSave} disabled={saving}>
          {saving ? (
            <Loader2Icon className="size-3 animate-spin" />
          ) : (
            <CheckIcon className="size-3" />
          )}
          Save
        </Button>
      )}
    </div>
  );
}

// ─── Email field ──────────────────────────────────────────────────────────────

function EmailField() {
  const { user } = useUser();
  const primaryEmail = user?.primaryEmailAddress?.emailAddress ?? "";

  return (
    <div className="space-y-2">
      <Input
        value={primaryEmail}
        readOnly
        className="h-9 max-w-sm bg-muted/40 focus-visible:ring-0 cursor-default"
      />
      <p className="text-xs text-muted-foreground">
        To change your email address, use{" "}
        <button
          className="underline hover:text-foreground transition-colors"
          onClick={() => {
            // Opens Clerk's built-in profile management modal
            const btn = document.querySelector<HTMLElement>(
              ".cl-userButtonTrigger",
            );
            btn?.click();
          }}
        >
          account settings
        </button>
        . Email changes require verification.
      </p>
    </div>
  );
}

// ─── OpenAI key field ─────────────────────────────────────────────────────────

function OpenAIKeyField({ hasKey }: { hasKey: boolean }) {
  const [draft, setDraft] = useState("");
  const [show, setShow] = useState(false);
  const setKey = useSetOpenaiKey();
  const removeKey = useRemoveOpenaiKey();

  const save = () => {
    if (!draft.trim()) return;
    setKey.mutate({ key: draft.trim() }, { onSuccess: () => { toast.success("OpenAI key saved"); setDraft(""); } });
  };

  return (
    <div className="space-y-2 max-w-sm">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Input
            type={show ? "text" : "password"}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") save(); }}
            className="h-9 pr-9 focus-visible:ring-0"
            placeholder={hasKey ? "Key saved — paste new one to replace" : "sk-..."}
          />
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            {show ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
          </button>
        </div>
        {draft.trim() && (
          <Button size="sm" onClick={save} disabled={setKey.isPending}>
            {setKey.isPending ? <Loader2Icon className="size-3 animate-spin" /> : <CheckIcon className="size-3" />}
            Save
          </Button>
        )}
        {hasKey && !draft.trim() && (
          <Button
            size="sm"
            variant="outline"
            className="text-muted-foreground hover:text-destructive"
            onClick={() => removeKey.mutate(undefined, { onSuccess: () => toast.success("OpenAI key removed") })}
            disabled={removeKey.isPending}
          >
            {removeKey.isPending ? <Loader2Icon className="size-3 animate-spin" /> : <Trash2Icon className="size-3" />}
            Remove
          </Button>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        {hasKey ? "✓ Key is saved and encrypted." : "Used for logo generation. Encrypted at rest, never shared."}{" "}
        <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground transition-colors">
          Get a key →
        </a>
      </p>
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export function GeneralSection() {
  const { isLoaded, user: clerkUser } = useUser();
  const { user } = useMe();

  if (!isLoaded || !clerkUser) return null;

  return (
    <div className="space-y-1">
      <div className="mb-6">
        <h2 className="text-lg font-semibold">Profile</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your profile information.
        </p>
      </div>

      <SettingRow label="Photo">
        <AvatarField />
      </SettingRow>

      <SettingRow
        label="Name"
        description="Your display name across the platform."
      >
        <NameField />
      </SettingRow>

      <SettingRow label="Email" description="Your primary email address.">
        <EmailField />
      </SettingRow>

      <SettingRow
        label="OpenAI key"
        description="Used for AI logo generation (~$0.04/image)."
      >
        <OpenAIKeyField hasKey={user?.hasOpenaiKey ?? false} />
      </SettingRow>
    </div>
  );
}
