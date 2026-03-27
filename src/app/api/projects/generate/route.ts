import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { generateText } from "ai";
import { createGroq } from "@ai-sdk/groq";
import { prisma } from "@/lib/db";

const groq = createGroq({ apiKey: process.env.GROQ_API_KEY });
const model = groq("llama-3.3-70b-versatile");

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
        content: `Generate full project blueprint for: "${project.description}"`,
      },
    });

    generateAll(projectId, project.description, chat.id).catch(async () => {
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

const sections: {
  kind: "DOCUMENT" | "DIAGRAM";
  type: string;
  title: string;
  order: number;
  system: string;
  prompt: (description: string) => string;
}[] = [
  {
    kind: "DOCUMENT",
    type: "overview",
    title: "Project Overview",
    order: 0,
    system:
      "You are a senior software architect. Always respond with properly formatted Markdown. Every heading, paragraph, and list must be separated by a blank line (two newlines). Never output a wall of text on a single line.",
    prompt: (d) =>
      `Based on this project description, write a clear project overview in Markdown. Include: project goals, target users, core value proposition, and key features. Description: ${d}`,
  },
  {
    kind: "DOCUMENT",
    type: "tech_stack",
    title: "Tech Stack",
    order: 1,
    system:
      "You are a senior software architect. Always respond with properly formatted Markdown. Every heading, paragraph, and list must be separated by a blank line (two newlines). Never output a wall of text on a single line.",
    prompt: (d) =>
      `Based on this project description, recommend a modern tech stack in Markdown. Include: frontend, backend, database, auth, hosting, and why each was chosen. Description: ${d}`,
  },
  {
    kind: "DOCUMENT",
    type: "timeline",
    title: "Timeline",
    order: 2,
    system:
      "You are a senior software architect. Always respond with properly formatted Markdown. Every heading, paragraph, and list must be separated by a blank line (two newlines). Never output a wall of text on a single line.",
    prompt: (d) =>
      `Based on this project description, create a realistic development timeline in Markdown. Break it into phases (MVP, v1, v2) with estimated durations and milestones. Description: ${d}`,
  },
  {
    kind: "DOCUMENT",
    type: "api_structure",
    title: "API Structure",
    order: 3,
    system:
      "You are a senior software architect. Always respond with properly formatted Markdown. Every heading, paragraph, and list must be separated by a blank line (two newlines). Never output a wall of text on a single line.",
    prompt: (d) =>
      `Based on this project description, design the REST API structure in Markdown. Include endpoints, HTTP methods, request/response shapes. Description: ${d}`,
  },
  {
    kind: "DOCUMENT",
    type: "tasks",
    title: "Tasks & User Stories",
    order: 4,
    system:
      "You are a senior software architect. Always respond with properly formatted Markdown. Every heading, paragraph, and list must be separated by a blank line (two newlines). Never output a wall of text on a single line.",
    prompt: (d) =>
      `Based on this project description, break down the work into user stories and tasks in Markdown. Group by feature area. Description: ${d}`,
  },
  {
    kind: "DIAGRAM",
    type: "architecture",
    title: "System Architecture",
    order: 0,
    system: "You are a senior software architect.",
    prompt: (d) =>
      `Based on this project description, generate a Mermaid system architecture diagram. Use graph TD syntax. Only output the raw Mermaid code, no markdown fences, no explanation. Description: ${d}`,
  },
  {
    kind: "DIAGRAM",
    type: "erd",
    title: "Entity Relationship Diagram",
    order: 1,
    system: "You are a senior software architect.",
    prompt: (d) =>
      `Based on this project description, generate a single unified Mermaid ERD diagram. Use erDiagram syntax ONCE at the top. Include ALL entities in one diagram. Only output the raw Mermaid code, no markdown fences, no explanation. Description: ${d}`,
  },
];

async function generateAll(
  projectId: string,
  description: string,
  chatId: string,
) {
  const results = await Promise.allSettled(
    sections.map((section) => generateSection(projectId, description, section)),
  );

  results.forEach((result, i) => {
    if (result.status === "rejected") {
      console.error(
        `❌ Failed to generate "${sections[i].title}":`,
        result.reason,
      );
    }
  });

  const created = results
    .filter((r) => r.status === "fulfilled")
    .map(
      (r) =>
        (r as PromiseFulfilledResult<{ kind: string; title: string }>).value,
    );

  await prisma.project.update({
    where: { id: projectId },
    data: { status: "COMPLETE" },
  });

  const finalProject = await prisma.project.findFirst({
    where: { id: projectId },
    include: { contentBlocks: { orderBy: { order: "asc" } } },
  });

  await prisma.chatMessage.create({
    data: {
      chatId,
      role: "ASSISTANT",
      content: `Generated ${created.length} sections: ${created.map((c) => c.title).join(", ")}`,
      snapshot: {
        created,
        edited: [],
        projectState: {
          description: finalProject?.description ?? "",
          contentBlocks: finalProject?.contentBlocks.map((b) => ({
            id: b.id,
            kind: b.kind,
            type: b.type,
            title: b.title,
            content: b.content,
            body: b.body,
            order: b.order,
          })),
        },
      },
    },
  });
}

async function generateSection(
  projectId: string,
  description: string,
  section: (typeof sections)[number],
) {
  const { text } = await generateText({
    model,
    system: section.system,
    prompt: section.prompt(description),
  });

  await prisma.contentBlock.create({
    data: {
      projectId,
      kind: section.kind,
      type: section.type,
      title: section.title,
      content: text.trim(),
      order: section.order,
    },
  });

  return { kind: section.kind, title: section.title };
}
