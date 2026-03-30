import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import {
  registerGitHubWebhook,
  removeGitHubWebhook,
} from "@/lib/github-webhook";
import { buildContext, fetchGitHubRepo, parseGitHubUrl } from "@/lib/github";

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId, action } = await request.json();

    if (!projectId || !action) {
      return NextResponse.json(
        { error: "projectId and action are required" },
        { status: 400 },
      );
    }

    if (action !== "register" && action !== "remove") {
      return NextResponse.json(
        { error: "action must be 'register' or 'remove'" },
        { status: 400 },
      );
    }

    // Verify user owns this project
    const project = await prisma.project.findFirst({
      where: { id: projectId, userId },
      select: { id: true, githubUrl: true },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (!project.githubUrl) {
      return NextResponse.json(
        { error: "Project has no GitHub URL set" },
        { status: 400 },
      );
    }

    const parsed = parseGitHubUrl(project.githubUrl);
    if (!parsed) {
      return NextResponse.json(
        { error: "Invalid GitHub URL on project" },
        { status: 400 },
      );
    }

    if (action === "register") {
      await registerGitHubWebhook(parsed.owner, parsed.repo);

      // Fetch and save current repo context
      try {
        const repoData = await fetchGitHubRepo(parsed.owner, parsed.repo);
        const context = buildContext(repoData);
        await prisma.projectGithubContext.upsert({
          where: { projectId },
          create: {
            projectId,
            githubUrl: project.githubUrl!,
            context,
            commitSha: repoData.latestCommitSha ?? null,
            commitMessage: repoData.latestCommitMessage ?? null,
            branch: repoData.defaultBranch ?? null,
          },
          update: {
            context,
            commitSha: repoData.latestCommitSha ?? null,
            commitMessage: repoData.latestCommitMessage ?? null,
            branch: repoData.defaultBranch ?? null,
          },
        });
      } catch (err) {
        console.warn("Context fetch failed (non-fatal):", err);
      }

      return NextResponse.json({
        ok: true,
        message: `Webhook registered for ${parsed.owner}/${parsed.repo}`,
      });
    } else {
      await removeGitHubWebhook(parsed.owner, parsed.repo);
      return NextResponse.json({
        ok: true,
        message: `Webhook removed for ${parsed.owner}/${parsed.repo}`,
      });
    }
  } catch (error) {
    console.error("Webhook setup error:", error);
    return NextResponse.json(
      { error: "Failed to manage webhook" },
      { status: 500 },
    );
  }
}

export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json(
        { error: "projectId is required" },
        { status: 400 },
      );
    }

    const project = await prisma.project.findFirst({
      where: { id: projectId, userId },
      select: { id: true, githubUrl: true },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (!project.githubUrl) {
      return NextResponse.json({ registered: false, reason: "No GitHub URL" });
    }

    const parsed = parseGitHubUrl(project.githubUrl);
    if (!parsed) {
      return NextResponse.json({
        registered: false,
        reason: "Invalid GitHub URL",
      });
    }

    const appUrl = process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL;
    if (!appUrl || !process.env.GITHUB_TOKEN) {
      return NextResponse.json({
        registered: false,
        reason: "Missing APP_URL or GITHUB_TOKEN",
      });
    }

    const webhookUrl = `${appUrl}/api/webhooks/github`;

    const res = await fetch(
      `https://api.github.com/repos/${parsed.owner}/${parsed.repo}/hooks`,
      {
        headers: {
          Accept: "application/vnd.github.v3+json",
          Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        },
      },
    );

    if (!res.ok) {
      return NextResponse.json({
        registered: false,
        reason: "Could not fetch webhooks from GitHub",
      });
    }

    const hooks = await res.json();
    const registered = hooks.some(
      (h: { config?: { url?: string } }) => h.config?.url === webhookUrl,
    );

    return NextResponse.json({
      registered,
      repo: `${parsed.owner}/${parsed.repo}`,
    });
  } catch (error) {
    console.error("Webhook check error:", error);
    return NextResponse.json(
      { error: "Failed to check webhook status" },
      { status: 500 },
    );
  }
}
