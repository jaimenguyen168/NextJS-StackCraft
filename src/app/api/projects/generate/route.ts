import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { generateText } from "ai";
import { createGroq } from "@ai-sdk/groq";
import { prisma } from "@/lib/db";
import { DiagramType, DocumentType } from "@/generated/prisma/enums";

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

async function generateAll(
  projectId: string,
  description: string,
  chatId: string,
) {
  const results = await Promise.allSettled([
    generateDocument(projectId, description, "OVERVIEW", 0),
    generateDocument(projectId, description, "TECH_STACK", 1),
    generateDocument(projectId, description, "TIMELINE", 2),
    generateDocument(projectId, description, "API_STRUCTURE", 3),
    generateDocument(projectId, description, "TASKS", 4),
    generateDiagram(projectId, description, "ARCHITECTURE", 0),
    generateDiagram(projectId, description, "ERD", 1),
  ]);

  const created = results
    .filter((r) => r.status === "fulfilled")
    .map(
      (r) =>
        (r as PromiseFulfilledResult<{ type: string; title: string }>).value,
    );

  await prisma.project.update({
    where: { id: projectId },
    data: { status: "COMPLETE" },
  });

  const finalProject = await prisma.project.findFirst({
    where: { id: projectId },
    include: {
      documents: { orderBy: { order: "asc" } },
      diagrams: { orderBy: { order: "asc" } },
    },
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
          documents: finalProject?.documents.map((d) => ({
            id: d.id,
            title: d.title,
            type: d.type,
            content: d.content,
            order: d.order,
          })),
          diagrams: finalProject?.diagrams.map((d) => ({
            id: d.id,
            title: d.title,
            type: d.type,
            content: d.content,
            order: d.order,
          })),
        },
      },
    },
  });
}

const documentPrompts: Record<string, string> = {
  OVERVIEW: `You are a senior software architect. Based on this project description, write a clear project overview in Markdown. Include: project goals, target users, core value proposition, and key features. Description: `,
  TECH_STACK: `You are a senior software architect. Based on this project description, recommend a modern tech stack in Markdown. Include: frontend, backend, database, auth, hosting, and why each was chosen. Description: `,
  TIMELINE: `You are a senior software architect. Based on this project description, create a realistic development timeline in Markdown. Break it into phases (MVP, v1, v2) with estimated durations and milestones. Description: `,
  API_STRUCTURE: `You are a senior software architect. Based on this project description, design the REST API structure in Markdown. Include endpoints, HTTP methods, request/response shapes. Description: `,
  TASKS: `You are a senior software architect. Based on this project description, break down the work into user stories and tasks in Markdown. Group by feature area. Description: `,
};

const documentTitles: Record<string, string> = {
  OVERVIEW: "Project Overview",
  TECH_STACK: "Tech Stack",
  TIMELINE: "Timeline",
  API_STRUCTURE: "API Structure",
  TASKS: "Tasks & User Stories",
};

const diagramPrompts: Record<string, string> = {
  ARCHITECTURE: `You are a senior software architect. Based on this project description, generate a Mermaid system architecture diagram. Use graph TD syntax. Only output the raw Mermaid code, no markdown fences, no explanation. Description: `,
  ERD: `You are a senior software architect. Based on this project description, generate a Mermaid ERD diagram. Use erDiagram syntax. Only output the raw Mermaid code, no markdown fences, no explanation. Description: `,
};

const diagramTitles: Record<string, string> = {
  ARCHITECTURE: "System Architecture",
  ERD: "Entity Relationship Diagram",
};

async function generateDocument(
  projectId: string,
  description: string,
  type: string,
  order: number,
) {
  const { text } = await generateText({
    model,
    system:
      "You are a senior software architect. Always respond with properly formatted Markdown. Every heading, paragraph, and list must be separated by a blank line (two newlines). Never output a wall of text on a single line.",
    prompt: `${documentPrompts[type]}${description}`,
  });

  await prisma.document.create({
    data: {
      projectId,
      type: type as DocumentType,
      title: documentTitles[type],
      content: text.trim(),
      order,
    },
  });

  return { type: "document", title: documentTitles[type] };
}

async function generateDiagram(
  projectId: string,
  description: string,
  type: string,
  order: number,
) {
  const { text } = await generateText({
    model,
    prompt: `${diagramPrompts[type]}${description}`,
  });

  await prisma.diagram.create({
    data: {
      projectId,
      type: type as DiagramType,
      title: diagramTitles[type],
      content: text.trim(),
      order,
    },
  });

  return { type: "diagram", title: diagramTitles[type] };
}
