import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { generateText } from "ai";
import { createGroq } from "@ai-sdk/groq";
import { prisma } from "@/lib/db";
import { fetchGitHubRepo, parseGitHubUrl } from "@/lib/github";
import { getProjectSnapshot } from "@/trpc/routers/projects";
import { registerGitHubWebhook } from "@/lib/github-webhook";

const groq = createGroq({ apiKey: process.env.GROQ_API_KEY });
const model = groq("meta-llama/llama-4-scout-17b-16e-instruct");
// const model = groq("llama-3.3-70b-versatile");

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ─── Mermaid validation + retry ───────────────────────────────────────────────

function validateMermaid(code: string): { valid: boolean; issues: string[] } {
  const issues: string[] = [];

  const withoutStyles = code
    .split("\n")
    .filter((line) => !line.trim().startsWith("style "))
    .join("\n");

  const withoutFrontmatter = withoutStyles
    .replace(/^---[\s\S]*?---\n/, "")
    .trim();

  if (
    !/^(graph|flowchart|erDiagram|sequenceDiagram|classDiagram|gantt|pie|journey|gitGraph|block-beta)/.test(
      withoutFrontmatter,
    )
  ) {
    issues.push("Missing or invalid diagram type declaration");
  }

  if (/\|>\s/.test(code) || /\|>$/.test(code)) {
    issues.push("Invalid edge label syntax: use -->|label| not -->|label|>");
  }

  const bare = code
    .split("\n")
    .filter((l) => /^\s+[A-Za-z0-9_]+\s+[A-Z_]{2,}$/.test(l.trim()));
  if (bare.length > 0) {
    issues.push(`Bare node labels without brackets: ${bare.join(", ")}`);
  }

  if ((code.match(/\[/g) ?? []).length !== (code.match(/\]/g) ?? []).length) {
    issues.push("Mismatched square brackets");
  }

  return { valid: issues.length === 0, issues };
}

function stripMermaid(raw: string): string {
  return raw
    .trim()
    .replace(/```mermaid|```/g, "")
    .trim()
    .split("\n")
    .filter((line) => !line.trim().startsWith("style "))
    .join("\n");
}

async function generateValidDiagram(
  systemPrompt: string,
  userPrompt: string,
  maxRetries = 2,
): Promise<string> {
  let lastCode = "";
  let lastIssues: string[] = [];

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    if (attempt > 0) await sleep(2000);

    const prompt =
      attempt === 0
        ? userPrompt
        : `The following Mermaid code has syntax errors that must be fixed:

\`\`\`
${lastCode}
\`\`\`

Issues:
${lastIssues.map((i) => `- ${i}`).join("\n")}

Fix ALL issues. Return ONLY corrected raw Mermaid. No fences, no style lines.`;

    const { text } = await generateText({
      model,
      system: systemPrompt,
      prompt,
    });
    const cleaned = stripMermaid(text);
    const { valid, issues } = validateMermaid(cleaned);

    if (valid) return cleaned;

    lastCode = cleaned;
    lastIssues = issues;
    console.warn(`Mermaid attempt ${attempt + 1} failed:`, issues);
  }

  return lastCode;
}

// ─── Route ────────────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  let projectId: string | undefined;

  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    projectId = body.projectId;
    const { githubUrl } = body;

    if (!projectId || !githubUrl) {
      return NextResponse.json(
        { error: "projectId and githubUrl are required" },
        { status: 400 },
      );
    }

    const parsed = parseGitHubUrl(githubUrl);
    if (!parsed) {
      return NextResponse.json(
        { error: "Invalid GitHub URL" },
        { status: 400 },
      );
    }

    const project = await prisma.project.findFirst({
      where: { id: projectId, userId },
    });
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    await prisma.project.update({
      where: { id: projectId },
      data: { status: "GENERATING" },
    });

    // ── 1. Fetch repo data ──────────────────────────────────────────────────
    const repoData = await fetchGitHubRepo(parsed.owner, parsed.repo);
    const context = buildContext(repoData);

    // ── 2. Save GitHub context to DB immediately ────────────────────────────
    await prisma.projectGithubContext.upsert({
      where: { projectId },
      create: {
        projectId,
        githubUrl,
        context,
        commitSha: repoData.latestCommitSha ?? null,
        commitMessage: repoData.latestCommitMessage ?? null,
        branch: repoData.defaultBranch ?? null,
      },
      update: {
        githubUrl,
        context,
        commitSha: repoData.latestCommitSha ?? null,
        commitMessage: repoData.latestCommitMessage ?? null,
        branch: repoData.defaultBranch ?? null,
      },
    });

    // ── 3. Register webhook (non-fatal) ────────────────────────────────────
    registerGitHubWebhook(parsed.owner, parsed.repo).catch((err) =>
      console.warn("Webhook registration failed (non-fatal):", err),
    );

    // ── 4. Sequential LLM generation ───────────────────────────────────────
    const description = await generateDescription(repoData, context);
    await sleep(1500);

    const mainContent = await generateMainContent(context);
    await sleep(1500);

    const tags = await generateTags(context);
    await sleep(1500);

    const systemOverview = await generateSystemOverview(context);
    await sleep(1500);

    const architectureDiagram = await generateArchitectureDiagram(
      context,
      project.name,
    );

    // ── 5. Upsert owner collaborator ────────────────────────────────────────
    await prisma.projectCollaborator.upsert({
      where: { projectId_userId: { projectId, userId } },
      create: { projectId, userId, role: "OWNER", status: "ACCEPTED" },
      update: { role: "OWNER", status: "ACCEPTED" },
    });

    // ── 6. Update project ───────────────────────────────────────────────────
    await prisma.project.update({
      where: { id: projectId },
      data: {
        description,
        mainContent,
        tags: repoData.topics?.length ? repoData.topics : tags,
        githubUrl,
      },
    });

    // ── 7. Create sections + blocks ─────────────────────────────────────────
    const reqSection = await prisma.section.create({
      data: { projectId, title: "Requirements Specification", order: 0 },
    });

    await prisma.contentBlock.createMany({
      data: [
        {
          projectId,
          sectionId: reqSection.id,
          kind: "DOCUMENT",
          type: "system_overview",
          title: "System Overview",
          content: systemOverview,
          body: null,
          order: 0,
        },
        {
          projectId,
          sectionId: reqSection.id,
          kind: "DIAGRAM",
          type: "architecture_diagram",
          title: "Architecture Diagram",
          content: architectureDiagram.mermaid,
          body: architectureDiagram.body,
          order: 1,
        },
      ],
    });

    let sectionOrder = 1;

    if (repoData.openApiSpec) {
      const apiSection = await prisma.section.create({
        data: { projectId, title: "API Reference", order: sectionOrder++ },
      });
      await prisma.contentBlock.create({
        data: {
          projectId,
          sectionId: apiSection.id,
          kind: "DOCUMENT",
          type: "openapi_spec",
          title: "API Specification",
          content: repoData.openApiSpec,
          body: null,
          order: 0,
        },
      });
    }

    if (repoData.prismaSchema) {
      await sleep(1500);
      const dbSection = await prisma.section.create({
        data: { projectId, title: "Database", order: sectionOrder++ },
      });
      const erd = await generateErd(repoData.prismaSchema, project.name);
      await prisma.contentBlock.create({
        data: {
          projectId,
          sectionId: dbSection.id,
          kind: "DIAGRAM",
          type: "erd",
          title: "Entity Relationship Diagram",
          content: erd.mermaid,
          body: erd.body,
          order: 0,
        },
      });
    }

    await prisma.project.update({
      where: { id: projectId },
      data: { status: "COMPLETE" },
    });

    const chat =
      (await prisma.projectChat.findFirst({ where: { projectId } })) ??
      (await prisma.projectChat.create({ data: { projectId } }));

    const projectState = await getProjectSnapshot(projectId);
    await prisma.chatMessage.create({
      data: {
        chatId: chat.id,
        role: "ASSISTANT",
        content: `Project bootstrapped from GitHub repo ${parsed.owner}/${parsed.repo}. Analyzed ${repoData.sourceFiles.length} source files, ${repoData.routeFiles.length} route files, and ${repoData.configFiles.length} config files.`,
        snapshot: {
          created: ["mainContent", "tags", "Requirements Specification"],
          edited: [],
          projectState,
        },
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("GitHub generate error:", error);
    if (projectId) {
      await prisma.project
        .update({ where: { id: projectId }, data: { status: "FAILED" } })
        .catch(() => {});
    }
    return NextResponse.json(
      { error: "Failed to generate from GitHub" },
      { status: 500 },
    );
  }
}

// ─── Context builder ──────────────────────────────────────────────────────────

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

  if (repo.readme) {
    parts.push(`## README\n${repo.readme.slice(0, 2000)}`);
  }

  if (repo.sourceFiles.length > 0) {
    parts.push(
      `## Source Files (${repo.sourceFiles.length} files)\n` +
        repo.sourceFiles
          .map((f) => `### ${f.path}\n\`\`\`\n${f.content}\n\`\`\``)
          .join("\n\n"),
    );
  }

  if (repo.routeFiles.length > 0) {
    parts.push(
      `## API / Route Files (${repo.routeFiles.length} files)\n` +
        repo.routeFiles
          .map((f) => `### ${f.path}\n\`\`\`\n${f.content}\n\`\`\``)
          .join("\n\n"),
    );
  }

  if (repo.configFiles.length > 0) {
    parts.push(
      `## Config Files\n` +
        repo.configFiles
          .map((f) => `### ${f.path}\n\`\`\`\n${f.content}\n\`\`\``)
          .join("\n\n"),
    );
  }

  if (repo.prismaSchema) {
    parts.push(
      `## Database Schema (Prisma)\n${repo.prismaSchema.slice(0, 2000)}`,
    );
  }

  if (repo.envExample) {
    parts.push(`## Environment Variables\n${repo.envExample}`);
  }

  if (repo.dockerCompose) {
    parts.push(`## Docker Compose\n${repo.dockerCompose}`);
  }

  if (repo.fileTree.length > 0) {
    parts.push(`## File Structure\n${repo.fileTree.slice(0, 100).join("\n")}`);
  }

  return parts.join("\n\n");
}

// ─── LLM helpers ─────────────────────────────────────────────────────────────

async function generateDescription(
  repo: Awaited<ReturnType<typeof fetchGitHubRepo>>,
  context: string,
): Promise<string> {
  const { text } = await generateText({
    model,
    system:
      "You are a technical writer. Write a single concise sentence (max 200 characters) describing what this project does based on the actual source code. Be specific — name the actual tech and purpose. No fluff.",
    prompt: `Write a one-sentence description based on reading the actual source code.

Repo name: ${repo.name}
GitHub description: ${repo.description ?? "none"}
Language: ${repo.language ?? "unknown"}

Source context:
${context.slice(0, 1500)}`,
  });
  return text.trim().replace(/^["']|["']$/g, "");
}

async function generateMainContent(context: string): Promise<string> {
  const { text } = await generateText({
    model,
    system:
      "You are a senior software architect writing a compelling project proposal document. Write like a human author presenting a vision — not like a code auditor listing what you see. Use clear ## headings and separate every section with a blank line.",
    prompt: `Based on reading this repository's source code, write a project proposal document. Your goal is to communicate the project's PURPOSE, PROBLEM, and VISION — not to list its tech stack.

## Project Abstract
4-6 sentences. What problem does this project solve? Who is it for? What makes it different from existing solutions? What is the intended impact? Write this as a vision statement, not a description of files.

## High Level Requirements
A narrative paragraph (no bullet points) describing what the system must do from the USER's perspective. Focus on user needs, workflows, and outcomes — not on implementation details.

## Conceptual Design
Describe the high-level approach: what kind of system is this (web app, extension, API, etc.), what major components exist and how they work together, how data flows through the system. You may mention key libraries where they clarify the design, but don't just list imports.

## Background
Two paragraphs. First: what is the broader problem space? What existing tools or approaches exist? Second: what limitations do those tools have, and how does this project specifically address those gaps?

## Required Resources
A bulleted list of the tools, services, frameworks, and infrastructure this project depends on.

Source code (use this to understand what the project does, not to describe it literally):
${context}`,
  });
  return text.trim();
}

async function generateSystemOverview(context: string): Promise<string> {
  const { text } = await generateText({
    model,
    system:
      "You are a senior software architect writing technical documentation for a project proposal. Focus on WHAT the system accomplishes and WHY decisions were made — not on listing files and imports. Use ## and ### headings.",
    prompt: `Based on reading this repository's source code, write a System Overview document. Write from the perspective of understanding the system's goals and design — not from the perspective of auditing its files.

## Purpose & Scope
What is this system trying to achieve? Who uses it and why? What does it explicitly NOT cover?

## System Goals
4-6 specific, measurable goals the system aims to achieve — written as outcomes, not features.

## Key Features
Bullet list with **bold feature name** followed by a description of what it does for the user. Focus on user-facing capabilities.

## User Roles
Who interacts with this system? Describe their roles and what they can do.

## Assumptions & Constraints
What assumptions is the system built on? What are its known limitations or constraints?

## Success Criteria
How will we know the system is successful? 3-5 measurable outcomes.

Source code (use this to understand the system, not to describe it literally):
${context}`,
  });
  return text.trim();
}

async function generateArchitectureDiagram(
  context: string,
  projectName: string,
): Promise<{ mermaid: string; body: string }> {
  const mermaid = await generateValidDiagram(
    `You are a senior software architect. Output ONLY raw Mermaid code.

STRICT RULES:
- Start with frontmatter block then graph TD
- Edge labels: -->|label| NOT -->|label|>
- Node labels with spaces MUST use brackets: A[My Label]
- Every node ID must be alphanumeric with no spaces
- Do NOT include any style lines
- No fences, no explanation — raw Mermaid only`,
    `Based on the actual source code, generate a Mermaid architecture diagram showing the real tech stack.

Start with:
---
title: ${projectName} — Architecture
---
graph TD

Use the actual libraries, frameworks, and services you see in the source code — not generic placeholders. Use subgraphs to group related components.
Do NOT include any style lines.

Source code context:
${context}`,
  );

  await sleep(1500);

  const { text: body } = await generateText({
    model,
    system:
      "You have read the actual source code. Write in flowing prose paragraphs — no headings, no bullet points.",
    prompt: `Based on the actual source code, write a 3-5 paragraph architectural explanation. Reference real files, libraries, and patterns you see.

Source code context:
${context}`,
  });

  return { mermaid, body: body.trim() };
}

async function generateErd(
  prismaSchema: string,
  projectName: string,
): Promise<{ mermaid: string; body: string }> {
  const mermaid = await generateValidDiagram(
    `You are a database architect. Output ONLY raw Mermaid erDiagram code.

STRICT RULES:
- Start with erDiagram
- Use proper relationship syntax: ||--o{ etc.
- No style lines, no fences, no explanation`,
    `Generate a Mermaid erDiagram from this Prisma schema. Include all models and their relationships.

Prisma schema:
${prismaSchema}`,
  );

  await sleep(1500);

  const { text: body } = await generateText({
    model,
    system:
      "Write in flowing prose paragraphs — no headings, no bullet points.",
    prompt: `Write a 2-3 paragraph explanation of the database schema for ${projectName} based on this Prisma schema.

Schema:
${prismaSchema}`,
  });

  return { mermaid, body: body.trim() };
}

async function generateTags(context: string): Promise<string[]> {
  const { text } = await generateText({
    model,
    system:
      "Respond ONLY with a JSON array of strings — no explanation, no markdown.",
    prompt: `Generate 4-7 lowercase tags based on the actual tech stack and domain visible in this source code.

Context:
${context.slice(0, 800)}

Return only a JSON array like: ["nextjs","typescript","saas"]`,
  });

  try {
    const cleaned = text
      .trim()
      .replace(/```json|```/g, "")
      .trim();
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed)) return parsed.map(String).slice(0, 8);
  } catch {}
  return [];
}
