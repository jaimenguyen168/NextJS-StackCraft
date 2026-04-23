"use client";

import React, { useState, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2Icon, CameraIcon, CheckIcon } from "lucide-react";
import { toast } from "sonner";

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

// ─── Root ─────────────────────────────────────────────────────────────────────

export function GeneralSection() {
  const { isLoaded, user } = useUser();

  if (!isLoaded || !user) return null;

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
    </div>
  );
}
