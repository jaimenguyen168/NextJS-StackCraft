import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/db";
import { fetchGitHubRepo, parseGitHubUrl } from "@/lib/github";

// ─── Signature verification ───────────────────────────────────────────────────

function verifySignature(payload: string, signature: string): boolean {
  const secret = process.env.GITHUB_WEBHOOK_SECRET;
  if (!secret) return false;

  const expected = `sha256=${crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex")}`;

  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expected),
    );
  } catch {
    return false;
  }
}

// ─── Context builder (same as generate route) ─────────────────────────────────

function buildContext(
  repo: Awaited<ReturnType<typeof fetchGitHubRepo>>,
): string {
  const parts: string[] = [];

  if (repo.packageJson) {
    const pkg = repo.packageJson as Record<string, unknown>;
    const deps = Object.keys((pkg.dependencies as object) ?? {});
    const devDeps = Object.keys((pkg.devDependencies as object) ?? {});
    parts.push(`## Tech Stack
Language: ${repo.language ?? "Unknown"}
Main dependencies: ${deps.join(", ")}
Dev dependencies: ${devDeps.join(", ")}`);
  }

  if (repo.readme) parts.push(`## README\n${repo.readme.slice(0, 2000)}`);

  if (repo.sourceFiles.length > 0) {
    parts.push(
      `## Source Files\n` +
        repo.sourceFiles
          .map((f) => `### ${f.path}\n\`\`\`\n${f.content}\n\`\`\``)
          .join("\n\n"),
    );
  }

  if (repo.routeFiles.length > 0) {
    parts.push(
      `## API / Route Files\n` +
        repo.routeFiles
          .map((f) => `### ${f.path}\n\`\`\`\n${f.content}\n\`\`\``)
          .join("\n\n"),
    );
  }

  if (repo.prismaSchema) {
    parts.push(`## Database Schema\n${repo.prismaSchema.slice(0, 2000)}`);
  }

  if (repo.envExample)
    parts.push(`## Environment Variables\n${repo.envExample}`);
  if (repo.fileTree.length > 0) {
    parts.push(`## File Structure\n${repo.fileTree.slice(0, 100).join("\n")}`);
  }

  return parts.join("\n\n");
}

// ─── Route ────────────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const payload = await request.text();
    const signature = request.headers.get("x-hub-signature-256") ?? "";
    const event = request.headers.get("x-github-event") ?? "";

    // Verify signature
    if (!verifySignature(payload, signature)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const body = JSON.parse(payload);
    const repoFullName: string = body.repository?.full_name;
    if (!repoFullName) {
      return NextResponse.json({ ok: true, skipped: "no repo" });
    }

    // Only handle push to default branch or merged PR
    const defaultBranch: string = body.repository?.default_branch ?? "main";
    const isDefaultPush =
      event === "push" && body.ref === `refs/heads/${defaultBranch}`;
    const isMergedPR =
      event === "pull_request" &&
      body.action === "closed" &&
      body.pull_request?.merged === true &&
      body.pull_request?.base?.ref === defaultBranch;

    if (!isDefaultPush && !isMergedPR) {
      return NextResponse.json({ ok: true, skipped: "irrelevant event" });
    }

    // Extract commit info
    const commitSha: string | null =
      body.after ?? body.pull_request?.merge_commit_sha ?? null;
    const commitMessage: string | null =
      body.head_commit?.message?.split("\n")[0] ??
      body.pull_request?.title ??
      null;

    const githubUrl = `https://github.com/${repoFullName}`;

    // Find all projects linked to this repo
    const projects = await prisma.project.findMany({
      where: { githubUrl },
      select: { id: true },
    });

    if (projects.length === 0) {
      return NextResponse.json({ ok: true, skipped: "no matching projects" });
    }

    const parsed = parseGitHubUrl(githubUrl);
    if (!parsed) {
      return NextResponse.json({ ok: true, skipped: "could not parse url" });
    }

    // Re-fetch repo and update context for all linked projects
    // Fire and forget — don't block the response
    updateProjectContexts(
      projects.map((p) => p.id),
      parsed.owner,
      parsed.repo,
      githubUrl,
      commitSha,
      commitMessage,
    ).catch((err) => console.error("Context update error:", err));

    return NextResponse.json({
      ok: true,
      event,
      repo: repoFullName,
      projects: projects.length,
    });
  } catch (error) {
    console.error("GitHub webhook error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 },
    );
  }
}

async function updateProjectContexts(
  projectIds: string[],
  owner: string,
  repo: string,
  githubUrl: string,
  commitSha: string | null,
  commitMessage: string | null,
): Promise<void> {
  const repoData = await fetchGitHubRepo(owner, repo);
  const context = buildContext(repoData);

  await Promise.all(
    projectIds.map((projectId) =>
      prisma.projectGithubContext.upsert({
        where: { projectId },
        create: {
          projectId,
          githubUrl,
          context,
          commitSha,
          commitMessage,
          branch: repoData.defaultBranch ?? null,
        },
        update: {
          context,
          commitSha,
          commitMessage,
          branch: repoData.defaultBranch ?? null,
        },
      }),
    ),
  );

  console.log(
    `Updated repoContext for ${projectIds.length} project(s) via webhook — commit: ${commitSha}`,
  );
}
