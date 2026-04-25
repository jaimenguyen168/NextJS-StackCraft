"use client";

import React, { useState } from "react";
import {
  GlobeIcon,
  TagIcon,
  UsersIcon,
  ImageIcon,
  LinkIcon,
  TriangleAlertIcon,
  Trash2Icon,
  GitPullRequestIcon,
} from "lucide-react";
import { FaGithub } from "react-icons/fa";
import { Separator } from "@/components/ui/separator";
import { useProject } from "@/trpc/hooks/use-projects";
import { useProjectSnapshot } from "@/features/projects/contexts/project-snapshot-context";
import { useRouter } from "next/navigation";
import { useMe } from "@/trpc/hooks/use-users";
import { ProjectDeleteDialog } from "@/features/projects/components/project-delete-dialog";
import { CollaboratorsField } from "@/features/projects/components/collaborators-field";
import { GithubPushDialog } from "@/features/projects/components/github-push-dialog";
import { SettingsSection } from "@/features/projects/components/settings/settings-section";
import { PublishedToggle } from "@/features/projects/components/settings/published-toggle";
import { GithubUrlField } from "@/features/projects/components/settings/github-url-field";
import { LogoUrlField } from "@/features/projects/components/settings/logo-url-field";
import { ProjectImagesField } from "@/features/projects/components/settings/project-images-field";
import { TagsField } from "@/features/projects/components/settings/tags-field";
import { ProjectLinksField } from "@/features/projects/components/settings/project-links-field";

export function ProjectSettings() {
  const { projectId } = useProjectSnapshot();
  const { project } = useProject(projectId);
  const { user } = useMe();
  const router = useRouter();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [pushOpen, setPushOpen] = useState(false);

  if (!project) return null;

  return (
    <div className="space-y-5 py-3 px-6">
      <SettingsSection icon={GlobeIcon} title="Visibility">
        <PublishedToggle
          published={project.published}
          username={project.username}
          slug={project.slug}
        />
      </SettingsSection>

      <Separator />

      <SettingsSection icon={FaGithub} title="GitHub">
        <GithubUrlField value={project.githubUrl} token={project.githubToken} />
        {project.githubUrl && (
          <button
            onClick={() => setPushOpen(true)}
            className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted/60 transition-colors text-[13px] text-muted-foreground hover:text-foreground mt-1"
          >
            <GitPullRequestIcon className="size-3.5 shrink-0" />
            Push docs to GitHub
          </button>
        )}
        <GithubPushDialog open={pushOpen} onOpenChange={setPushOpen} />
      </SettingsSection>

      <Separator />

      <SettingsSection icon={ImageIcon} title="Logo">
        <LogoUrlField
          value={project.logoUrl}
          hasOpenaiKey={user?.hasOpenaiKey ?? false}
        />
      </SettingsSection>

      <Separator />

      <SettingsSection icon={ImageIcon} title="Images">
        <ProjectImagesField images={project.images ?? []} />
      </SettingsSection>

      <Separator />

      <SettingsSection icon={TagIcon} title="Tags">
        <TagsField tags={project.tags ?? []} />
      </SettingsSection>

      <Separator />

      <SettingsSection icon={LinkIcon} title="Links">
        <ProjectLinksField links={project.links ?? []} />
      </SettingsSection>

      <Separator />

      <SettingsSection icon={UsersIcon} title="Collaborators">
        <CollaboratorsField collaborators={project.collaborators ?? []} />
      </SettingsSection>

      <Separator />

      <SettingsSection icon={TriangleAlertIcon} title="Danger Zone">
        <button
          onClick={() => setDeleteOpen(true)}
          className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-destructive hover:bg-destructive/10 transition-colors text-[13px]"
        >
          <Trash2Icon className="size-3.5" />
          Delete project
        </button>
        <ProjectDeleteDialog
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          projectId={project.id}
          projectName={project.name}
          onSuccess={() => router.push("/projects")}
        />
      </SettingsSection>

      <div className="h-8 w-full shrink-0" />
    </div>
  );
}
