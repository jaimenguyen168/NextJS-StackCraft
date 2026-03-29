import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { generateText } from "ai";
import { createGroq } from "@ai-sdk/groq";
import { prisma } from "@/lib/db";
import { getProjectSnapshot } from "@/trpc/routers/projects";

const groq = createGroq({ apiKey: process.env.GROQ_API_KEY });
const model = groq("llama-3.3-70b-versatile");

const PRIMARY_COLOR = "oklch(0.6487 0.1538 150.3071)";

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId } = await request.json();
    if (!projectId) {
      return NextResponse.json(
        { error: "projectId is required" },
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

    const chat = await prisma.projectChat.create({ data: { projectId } });
    await prisma.chatMessage.create({
      data: {
        chatId: chat.id,
        role: "USER",
        content: `Bootstrap project info for: "${project.description}"`,
      },
    });

    bootstrapProject(
      projectId,
      userId,
      project.name,
      project.description,
      chat.id,
    ).catch(async (err) => {
      console.error("Bootstrap error:", err);
      await prisma.project.update({
        where: { id: projectId },
        data: { status: "FAILED" },
      });
      await prisma.chatMessage.create({
        data: {
          chatId: chat.id,
          role: "ASSISTANT",
          content: "Generation failed. Please try regenerating the project.",
        },
      });
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Generate error:", error);
    return NextResponse.json(
      { error: "Failed to start generation" },
      { status: 500 },
    );
  }
}

async function bootstrapProject(
  projectId: string,
  userId: string,
  projectName: string,
  description: string,
  chatId: string,
) {
  // All four LLM calls run in parallel
  const [mainContent, tags, systemOverview, blockDiagram] = await Promise.all([
    generateMainContent(description),
    generateTags(description),
    generateSystemOverview(description),
    generateBlockDiagram(description, projectName),
  ]);

  // Upsert the owner as a collaborator
  await prisma.projectCollaborator.upsert({
    where: { projectId_userId: { projectId, userId } },
    create: { projectId, userId, role: "OWNER" },
    update: { role: "OWNER" },
  });

  // Stamp the project identity fields
  await prisma.project.update({
    where: { id: projectId },
    data: {
      mainColor: PRIMARY_COLOR,
      mainContent,
      tags,
    },
  });

  // Scaffold the starter Requirements Specification section
  const section = await prisma.section.create({
    data: {
      projectId,
      title: "Requirements Specification",
      order: 0,
    },
  });

  await prisma.contentBlock.createMany({
    data: [
      {
        projectId,
        sectionId: section.id,
        kind: "DOCUMENT",
        type: "system_overview",
        title: "System Overview",
        content: systemOverview,
        body: null,
        order: 0,
      },
      {
        projectId,
        sectionId: section.id,
        kind: "DIAGRAM",
        type: "block_diagram",
        title: "Block Diagram",
        content: blockDiagram.mermaid,
        body: blockDiagram.body,
        order: 1,
      },
    ],
  });

  await prisma.project.update({
    where: { id: projectId },
    data: { status: "COMPLETE" },
  });

  await prisma.chatMessage.create({
    data: {
      chatId,
      role: "ASSISTANT",
      content:
        "Project bootstrapped with abstract, tags, and a starter Requirements Specification section. You can now add and generate more sections.",
      snapshot: {
        created: [
          "mainContent",
          "tags",
          "collaborator",
          "Requirements Specification",
        ],
        edited: [],
        projectState: await getProjectSnapshot(projectId),
      },
    },
  });
}

// ─── Mermaid helper ───────────────────────────────────────────────────────────

/**
 * Ensures the Mermaid string opens with a frontmatter title block.
 * If the model already produced one, it's left untouched.
 * Otherwise we inject one from the project name as a fallback.
 */
function ensureMermaidTitle(mermaid: string, projectName: string): string {
  if (mermaid.trimStart().startsWith("---")) return mermaid;
  return `---\ntitle: ${projectName} — Block Diagram\n---\n${mermaid}`;
}

// ─── LLM helpers ─────────────────────────────────────────────────────────────

async function generateMainContent(description: string): Promise<string> {
  const { text } = await generateText({
    model,
    system:
      "You are a senior software architect writing a project proposal document. Always respond with properly formatted Markdown. Use clear ## headings, separate every section with a blank line, and write in a professional but accessible tone.",
    prompt: `Based on this project description, write a structured project document in Markdown with the following five sections. Each section MUST start with its exact ## heading.

## Project Abstract
A polished 4–6 sentence summary covering the project's goal, what makes it different from existing solutions, how it works at a high level, and its intended impact.

## High Level Requirements
A clear narrative paragraph (no bullet points) describing the core functional requirements — what the system must do from the user's perspective.

## Conceptual Design
A paragraph describing the high-level technical approach: what AI models, APIs, or platforms will be used, how the components connect, and how data flows through the system.

## Background
Two paragraphs. The first covers why this problem matters and what existing tools exist. The second explains their limitations and the gap this project fills — be specific about shortcomings of current solutions.

## Required Resources
A short bulleted list of the tools, services, frameworks, and infrastructure needed to build and run the project.

Project description: ${description}`,
  });

  return text.trim();
}

async function generateSystemOverview(description: string): Promise<string> {
  const { text } = await generateText({
    model,
    system:
      "You are a senior software architect writing a detailed technical document. Always respond with properly formatted Markdown. Use ## and ### headings, separate every section with a blank line. Be specific and technical.",
    prompt: `Based on this project description, write a comprehensive System Overview document in Markdown. Include all of the following sections with their exact headings:

## Purpose & Scope
Explain what the system does, who it is for, and what it explicitly does NOT cover (scope boundaries).

## System Goals
A numbered list of 4–6 specific, measurable goals the system aims to achieve.

## Key Features
A bulleted list of the major features and capabilities. Each bullet should have a **bold feature name** followed by a brief description.

## User Roles
Describe the different types of users interacting with the system (e.g. end user, admin, collaborator) and what each can do.

## Assumptions & Constraints
A short bulleted list of technical or business assumptions the system is built on, and any known constraints (time, budget, platform, etc.).

## Success Criteria
How will we know the system is successful? List 3–5 measurable outcomes or acceptance criteria.

Project description: ${description}`,
  });

  return text.trim();
}

async function generateBlockDiagram(
  description: string,
  projectName: string,
): Promise<{ mermaid: string; body: string }> {
  // Mermaid code and prose explanation generated in parallel
  const [mermaidResult, bodyResult] = await Promise.all([
    generateText({
      model,
      system:
        "You are a senior software architect. You output only raw Mermaid code — no markdown fences, no explanation, no preamble.",
      prompt: `Based on this project description, generate a detailed Mermaid block diagram.

Your output MUST begin with a Mermaid frontmatter title block, then graph TD, like this:

---
title: ${projectName} — Block Diagram
---
graph TD

The diagram MUST represent all of the following layers and their connections:
- Frontend: UI framework, key pages/views, component library
- API / Backend: server framework, API style (REST, GraphQL, tRPC, etc.), key route groups or handlers
- Auth: authentication provider or service and where it intercepts requests
- Database: ORM and underlying database engine
- AI / LLM: the AI model or API, what triggers it, and how responses flow back
- External services: any third-party APIs, storage, email, payment, etc.
- Infrastructure: hosting or deployment platform

Use short, descriptive node labels. Use subgraphs to visually group related nodes (e.g. subgraph Frontend, subgraph Backend). Show directional arrows with brief edge labels where the relationship needs clarification.

Only output raw Mermaid — no fences, no explanation.

Project description: ${description}`,
    }),
    generateText({
      model,
      system:
        "You are a senior software architect writing clear technical documentation. Respond in well-structured Markdown prose with no headings and no bullet points — flowing paragraphs only.",
      prompt: `Based on this project description, write a 4–6 paragraph technical explanation of the system's block diagram.

Your explanation must walk through the diagram layer by layer:
1. Open with a one-sentence overview of what the diagram shows as a whole.
2. Describe how users interact with the frontend and what the key UI surfaces are.
3. Explain how requests move from the frontend through the API/backend layer, including how authentication is enforced.
4. Describe the database layer — what ORM is used, what data is persisted, and how the backend reads and writes to it.
5. Explain the AI/LLM integration — what triggers an LLM call, what model or API is used, and how the response is handled and returned.
6. Cover any external services and their role in the system.
7. Close with a sentence on how these layers together deliver the product's core value.

Write in flowing paragraphs, no bullet points, no headings.

Project description: ${description}`,
    }),
  ]);

  const mermaid = ensureMermaidTitle(mermaidResult.text.trim(), projectName);

  return {
    mermaid,
    body: bodyResult.text.trim(),
  };
}

async function generateTags(description: string): Promise<string[]> {
  const { text } = await generateText({
    model,
    system:
      "You are a project tagging assistant. Respond ONLY with a JSON array of strings — no explanation, no markdown fences, no preamble.",
    prompt: `Generate 4–7 concise lowercase tags for this project. Tags should reflect the domain, tech type, and key concepts. Return only a JSON array like: ["ai","web-app","education"]

Project description: ${description}`,
  });

  try {
    const cleaned = text
      .trim()
      .replace(/```json|```/g, "")
      .trim();
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed)) return parsed.map(String).slice(0, 8);
  } catch {
    // safe default
  }
  return [];
}
