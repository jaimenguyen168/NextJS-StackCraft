import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { parseGitHubUrl } from "@/lib/github";

const GITHUB_API = "https://api.github.com";

// ─── GitHub helpers ───────────────────────────────────────────────────────────

async function githubRequest<T>(
  url: string,
  options: RequestInit,
  token: string,
): Promise<{ ok: boolean; status: number; data: T }> {
  const res = await fetch(url, {
    ...options,
    headers: {
      Accept: "application/vnd.github.v3+json",
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });
  const data = (await res.json()) as T;
  return { ok: res.ok, status: res.status, data };
}

async function getDefaultBranch(
  owner: string,
  repo: string,
  token: string,
): Promise<string> {
  const { data } = await githubRequest<{ default_branch?: string }>(
    `${GITHUB_API}/repos/${owner}/${repo}`,
    { method: "GET" },
    token,
  );
  return data.default_branch ?? "main";
}

async function getLatestCommitSha(
  owner: string,
  repo: string,
  branch: string,
  token: string,
): Promise<string | null> {
  const { ok, data } = await githubRequest<{ object?: { sha?: string } }>(
    `${GITHUB_API}/repos/${owner}/${repo}/git/ref/heads/${branch}`,
    { method: "GET" },
    token,
  );
  if (!ok) return null;
  return data.object?.sha ?? null;
}

async function createBranch(
  owner: string,
  repo: string,
  branchName: string,
  sha: string,
  token: string,
): Promise<boolean> {
  const { ok } = await githubRequest(
    `${GITHUB_API}/repos/${owner}/${repo}/git/refs`,
    {
      method: "POST",
      body: JSON.stringify({ ref: `refs/heads/${branchName}`, sha }),
    },
    token,
  );
  return ok;
}

async function getFileInfo(
  owner: string,
  repo: string,
  path: string,
  branch: string,
  token: string,
): Promise<{ sha: string; content: string } | null> {
  const { ok, data } = await githubRequest<{ sha?: string; content?: string }>(
    `${GITHUB_API}/repos/${owner}/${repo}/contents/${path}?ref=${branch}`,
    { method: "GET" },
    token,
  );
  if (!ok || !data.sha) return null;
  const content = data.content
    ? Buffer.from(data.content.replace(/\n/g, ""), "base64").toString("utf8")
    : "";
  return { sha: data.sha, content };
}

async function putFile(
  owner: string,
  repo: string,
  path: string,
  content: string,
  message: string,
  branch: string,
  token: string,
  existingSha?: string | null,
): Promise<boolean> {
  const encoded = Buffer.from(content, "utf8").toString("base64");
  const { ok } = await githubRequest(
    `${GITHUB_API}/repos/${owner}/${repo}/contents/${path}`,
    {
      method: "PUT",
      body: JSON.stringify({
        message,
        content: encoded,
        branch,
        ...(existingSha ? { sha: existingSha } : {}),
      }),
    },
    token,
  );
  return ok;
}

async function createPullRequest(
  owner: string,
  repo: string,
  head: string,
  base: string,
  title: string,
  body: string,
  token: string,
): Promise<{ url: string | null; error: string | null }> {
  const { ok, data } = await githubRequest<{
    html_url?: string;
    message?: string;
    errors?: { message?: string }[];
  }>(
    `${GITHUB_API}/repos/${owner}/${repo}/pulls`,
    {
      method: "POST",
      body: JSON.stringify({ title, body, head, base }),
    },
    token,
  );
  if (!ok) {
    const detail =
      data.errors?.[0]?.message ?? data.message ?? "GitHub rejected the request";
    return { url: null, error: detail };
  }
  return { url: data.html_url ?? null, error: null };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 40)
    .replace(/-$/, "");
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { projectId, markdown: clientMarkdown, targetFile: rawTarget } = body;
    const targetFile: string =
      rawTarget === "README.md" || rawTarget === "ARCHITECTURE.md"
        ? rawTarget
        : "ARCHITECTURE.md";

    if (!projectId) {
      return NextResponse.json(
        { error: "projectId is required" },
        { status: 400 },
      );
    }

    // ── Load project ──────────────────────────────────────────────────────────
    const project = await prisma.project.findFirst({
      where: { id: projectId, userId },
      include: { contentBlocks: true },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (!project.githubUrl) {
      return NextResponse.json(
        { error: "No GitHub repository linked to this project." },
        { status: 400 },
      );
    }

    if (!project.githubToken) {
      return NextResponse.json(
        {
          error:
            "No GitHub token set. Add a Personal Access Token in project settings.",
        },
        { status: 400 },
      );
    }

    const parsed = parseGitHubUrl(project.githubUrl);
    if (!parsed) {
      return NextResponse.json(
        { error: "Invalid GitHub URL stored on project." },
        { status: 400 },
      );
    }

    const { owner, repo } = parsed;
    const token = project.githubToken;

    // Use client-provided markdown (already filtered/formatted by user's choices)
    const markdown: string =
      typeof clientMarkdown === "string" && clientMarkdown.length > 0
        ? clientMarkdown
        : `# ${project.name}\n\n*No content selected.*\n`;

    // ── Get default branch + latest SHA ───────────────────────────────────────
    const defaultBranch = await getDefaultBranch(owner, repo, token);
    const latestSha = await getLatestCommitSha(owner, repo, defaultBranch, token);

    if (!latestSha) {
      return NextResponse.json(
        {
          error:
            "Could not read repository. Check your token has Contents: Read and write permission.",
        },
        { status: 422 },
      );
    }

    // ── Create named branch (or reuse if it already exists) ───────────────────
    const projectSlug = slugify(project.name) || "project";
    const branchName = `docs/stackcraft-${projectSlug}`;

    // createBranch returns false if branch already exists (422 from GitHub) — that's fine,
    // we'll just push to it. Only fail on unexpected errors.
    await createBranch(owner, repo, branchName, latestSha, token);

    // ── Push target file ──────────────────────────────────────────────────────
    const targetInfo = await getFileInfo(owner, repo, targetFile, branchName, token);

    const fileOk = await putFile(
      owner,
      repo,
      targetFile,
      markdown,
      `docs: ${targetFile === "README.md" ? "overwrite README" : "add ARCHITECTURE.md"} generated by StackCraft`,
      branchName,
      token,
      targetInfo?.sha ?? null,
    );

    if (!fileOk) {
      return NextResponse.json(
        { error: `Failed to push ${targetFile} to GitHub.` },
        { status: 422 },
      );
    }

    // ── If target is ARCHITECTURE.md, also patch README to link to it ─────────
    // (When target IS README.md we already wrote it above — skip this block.)
    if (targetFile === "ARCHITECTURE.md") {
    const installBlock = project.contentBlocks?.find((b) => b.type === "installation");
    const featuresBlock = project.contentBlocks?.find((b) => b.type === "features");

    const readmeLines: string[] = [];
    readmeLines.push(`# ${project.name}`);
    readmeLines.push("");
    if (project.description) {
      readmeLines.push(`> ${project.description}`);
      readmeLines.push("");
    }
    readmeLines.push(
      `> 📐 See [ARCHITECTURE.md](./ARCHITECTURE.md) for full system design and architecture documentation.`,
    );
    readmeLines.push("");

    // TOC
    const tocEntries: string[] = [];
    if (featuresBlock) tocEntries.push(`1. 🕹️ [Features](#features)`);
    if (installBlock) tocEntries.push(`${tocEntries.length + 1}. 🚀 [Installation](#installation)`);
    if (tocEntries.length > 0) {
      readmeLines.push(`## 📋 Table of Contents`);
      readmeLines.push("");
      readmeLines.push(tocEntries.join("\n"));
      readmeLines.push("");
    }

    if (featuresBlock?.content) {
      readmeLines.push("---");
      readmeLines.push("");
      readmeLines.push(`## <a name="features">🕹️ Features</a>`);
      readmeLines.push("");
      readmeLines.push(featuresBlock.content.trim());
      readmeLines.push("");
    }

    if (installBlock?.content) {
      readmeLines.push("---");
      readmeLines.push("");
      readmeLines.push(`## <a name="installation">🚀 Installation</a>`);
      readmeLines.push("");
      // Ensure no unclosed code fences bleed into footer
      const installContent = installBlock.content.trim();
      const fenceCount = (installContent.match(/^```/gm) ?? []).length;
      readmeLines.push(fenceCount % 2 !== 0 ? installContent + "\n```" : installContent);
      readmeLines.push("");
    }

    readmeLines.push("---");
    readmeLines.push("");
    readmeLines.push('<div align="center">');
    readmeLines.push(
      `  <p>Built with ❤️ using <a href="https://stackcraft.dev">StackCraft</a></p>`,
    );
    readmeLines.push("  <p>⭐ Star this repo if you find it helpful!</p>");
    readmeLines.push("</div>");
    readmeLines.push("");

    const newReadme = readmeLines.join("\n");

    const readmeInfo = await getFileInfo(owner, repo, "README.md", branchName, token);
    // Non-fatal — ARCHITECTURE.md is still pushed even if README write fails
    await putFile(
      owner,
      repo,
      "README.md",
      newReadme,
      `docs: overwrite README with structured project documentation`,
      branchName,
      token,
      readmeInfo?.sha ?? null,
    );
    } // end if (targetFile === "ARCHITECTURE.md")

    // ── Open pull request ─────────────────────────────────────────────────────
    const prBody = targetFile === "README.md"
      ? `## Documentation Update

This pull request overwrites \`README.md\` with a generated documentation page for **${project.name}**.

### What's included

- Project overview and description
- Features & non-features
- Installation guide

---
*Generated by [StackCraft](https://stackcraft.dev)*`
      : `## Architecture Documentation

This pull request adds \`ARCHITECTURE.md\` — a generated architecture document for **${project.name}** — and adds a link to it at the top of \`README.md\`.

### What's included

- \`ARCHITECTURE.md\` with the full architecture document
- A one-line pointer added to the top of \`README.md\`

---
*Generated by [StackCraft](https://stackcraft.dev)*`;

    const pr = await createPullRequest(
      owner,
      repo,
      branchName,
      defaultBranch,
      targetFile === "README.md"
        ? `docs: update README for ${project.name}`
        : `docs: add architecture documentation for ${project.name}`,
      prBody,
      token,
    );

    if (!pr.url) {
      // Branch + file pushed OK — return a partial success with the branch URL
      // so the user can open the PR themselves.
      const branchUrl = `https://github.com/${owner}/${repo}/compare/${branchName}?expand=1`;
      return NextResponse.json(
        {
          error: pr.error
            ? `Branch pushed but PR creation failed: ${pr.error}. Your token may need "Pull requests: Read and write" permission.`
            : "Branch pushed but failed to create pull request. You may open it manually.",
          branchUrl,
        },
        { status: 422 },
      );
    }

    return NextResponse.json({ ok: true, prUrl: pr.url, branch: branchName });
  } catch (error) {
    console.error("GitHub push error:", error);
    return NextResponse.json(
      { error: "Failed to push to GitHub." },
      { status: 500 },
    );
  }
}
