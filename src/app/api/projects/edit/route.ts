import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { generateText } from "ai";
import { createGroq } from "@ai-sdk/groq";
import { prisma } from "@/lib/db";

const groq = createGroq({ apiKey: process.env.GROQ_API_KEY });
const model = groq("llama-3.3-70b-versatile");

async function getFullProjectSnapshot(projectId: string) {
  const project = await prisma.project.findFirst({
    where: { id: projectId },
    include: {
      contentBlocks: { orderBy: { order: "asc" } },
      sections: {
        where: { parentId: null },
        orderBy: { order: "asc" },
        include: { children: { orderBy: { order: "asc" } } },
      },
    },
  });

  return {
    name: project?.name ?? "",
    description: project?.description ?? "",
    mainColor: project?.mainColor ?? null,
    mainContent: project?.mainContent ?? null,
    imageUrl: project?.imageUrl ?? null,
    githubUrl: project?.githubUrl ?? null,
    contentBlocks:
      project?.contentBlocks.map((b) => ({
        id: b.id,
        kind: b.kind,
        type: b.type,
        title: b.title,
        content: b.content,
        body: b.body,
        order: b.order,
        sectionId: b.sectionId,
      })) ?? [],
    sections:
      project?.sections.map((s) => ({
        id: s.id,
        title: s.title,
        order: s.order,
        parentId: s.parentId,
        children: s.children.map((c) => ({
          id: c.id,
          title: c.title,
          order: c.order,
          parentId: c.parentId,
        })),
      })) ?? [],
  };
}

type IntentEdit = {
  id: string;
  kind: "DOCUMENT" | "DIAGRAM";
  instruction: string;
};

type IntentCreate = {
  kind: "DOCUMENT" | "DIAGRAM";
  title: string;
  type: string;
  instruction: string;
  body?: boolean;
};

type IntentCreateSection = {
  title: string;
  blocks: IntentCreate[];
};

type IntentDelete = {
  id: string;
  title: string;
};

type ParsedIntent = {
  edits: IntentEdit[];
  creates: IntentCreate[];
  createSections: IntentCreateSection[];
  deletes: IntentDelete[];
};

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId, prompt } = await request.json();
    if (!projectId || !prompt) {
      return NextResponse.json(
        { error: "projectId and prompt are required" },
        { status: 400 },
      );
    }

    const project = await prisma.project.findFirst({
      where: { id: projectId, userId },
      include: {
        contentBlocks: true,
        sections: true,
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    let chat = await prisma.projectChat.findFirst({ where: { projectId } });
    if (!chat) chat = await prisma.projectChat.create({ data: { projectId } });

    await prisma.chatMessage.create({
      data: { chatId: chat.id, role: "USER", content: prompt },
    });

    const lastMessage = await prisma.chatMessage.findFirst({
      where: { chatId: chat.id, role: "ASSISTANT" },
      orderBy: { createdAt: "desc" },
    });
    const lastSnapshot = lastMessage?.snapshot ?? null;

    const blockList = project.contentBlocks
      .map(
        (b) =>
          `${b.kind === "DIAGRAM" ? "Diagram" : "Document"}: "${b.title}" (id: ${b.id})`,
      )
      .join("\n");

    const sectionList = project.sections
      .map((s) => `Section: "${s.title}" (id: ${s.id})`)
      .join("\n");

    const { text: intentJson } = await generateText({
      model,
      system: `You are an intent analysis agent. Given a user's request and a list of existing project sections and blocks, determine what the user wants to do.

Respond ONLY with a valid JSON object. No explanation, no markdown fences.

Format:
{
  "edits": [
    { "id": "block_id", "kind": "DOCUMENT" | "DIAGRAM", "instruction": "specific edit instruction" }
  ],
  "creates": [
    { "kind": "DOCUMENT" | "DIAGRAM", "title": "Block Title", "type": "snake_case_type", "instruction": "what to generate", "body": false }
  ],
  "createSections": [
    {
      "title": "Section Title",
      "blocks": [
        { "kind": "DOCUMENT" | "DIAGRAM", "title": "Block Title", "type": "snake_case_type", "instruction": "what to generate", "body": true }
      ]
    }
  ],
  "deletes": [
    { "id": "block_id", "title": "block title" }
  ]
}

Rules:
- Use "createSections" when the user asks to "add a section", "create a ... section", or asks for grouped content (e.g. "architecture section with a class diagram and explanation")
- Each section can contain multiple blocks — include all blocks the user asked for inside that section
- Set "body": true on DIAGRAM blocks when the user asks for an explanation, description, or commentary on the diagram
- Use "creates" only for loose standalone blocks not inside a section
- Use "edits" when the user references an existing block by name for changes
- Use "deletes" when the user says "remove", "delete", or "get rid of"
- Never create a block or section with a title that already exists
- All arrays can be empty if nothing matches
- "type" should be a short snake_case identifier like: overview, architecture, class_diagram, erd, flowchart, timeline, security, api_structure, tasks`,
      prompt: `User request: "${prompt}"

Existing sections:
${sectionList || "None"}

Existing blocks:
${blockList || "None"}

Return the JSON object.`,
    });

    let parsed: ParsedIntent = {
      edits: [],
      creates: [],
      createSections: [],
      deletes: [],
    };

    try {
      const cleaned = intentJson.replace(/```json|```/g, "").trim();
      const raw = JSON.parse(cleaned);
      parsed = {
        edits: raw.edits ?? [],
        creates: raw.creates ?? [],
        createSections: raw.createSections ?? [],
        deletes: raw.deletes ?? [],
      };
    } catch {
      await prisma.chatMessage.create({
        data: {
          chatId: chat.id,
          role: "ASSISTANT",
          content:
            "Sorry, I couldn't understand your request. Please try again.",
          snapshot: lastSnapshot ?? undefined,
        },
      });
      return NextResponse.json(
        { error: "Failed to parse intent" },
        { status: 500 },
      );
    }

    const hasWork =
      parsed.edits.length > 0 ||
      parsed.creates.length > 0 ||
      parsed.createSections.length > 0 ||
      parsed.deletes.length > 0;

    if (!hasWork) {
      await prisma.chatMessage.create({
        data: {
          chatId: chat.id,
          role: "ASSISTANT",
          content: "No sections were identified. Try being more specific.",
          snapshot: lastSnapshot ?? undefined,
        },
      });
      return NextResponse.json({
        message: "No sections were identified.",
        edited: [],
        created: [],
        deleted: [],
      });
    }

    const edited: { id: string; title: string }[] = [];
    const created: { id: string; title: string }[] = [];
    const deleted: { id: string; title: string }[] = [];

    const maxBlockOrder = Math.max(
      0,
      ...project.contentBlocks.map((b) => b.order),
    );
    const maxSectionOrder = Math.max(
      0,
      ...project.sections.map((s) => s.order),
    );

    await Promise.all([
      // ── Edits ────────────────────────────────────────────────────────────
      ...parsed.edits.map(async (target) => {
        const block = project.contentBlocks.find((b) => b.id === target.id);
        if (!block) return;

        if (block.kind === "DOCUMENT") {
          const { text: newContent } = await generateText({
            model,
            system: `You are a technical writing agent. Apply the edit instruction and return the full updated content in properly formatted Markdown. Every heading, paragraph, and list must be separated by a blank line. Return ONLY the updated content.`,
            prompt: `Current content of "${block.title}":\n${block.content}\n\nEdit instruction: ${target.instruction}\n\nReturn the full updated content.`,
          });
          await prisma.contentBlock.update({
            where: { id: block.id },
            data: { content: newContent.trim() },
          });
        } else {
          const { text: newContent } = await generateText({
            model,
            system: `You are a diagram editing agent. Apply the edit to the Mermaid diagram and return the full updated Mermaid code. Return ONLY the raw Mermaid code, no markdown fences, no explanation.`,
            prompt: `Current Mermaid diagram "${block.title}":\n${block.content}\n\nEdit instruction: ${target.instruction}\n\nReturn the full updated Mermaid code.`,
          });
          await prisma.contentBlock.update({
            where: { id: block.id },
            data: { content: newContent.trim() },
          });
        }
        edited.push({ id: block.id, title: block.title });
      }),

      // ── Loose creates ────────────────────────────────────────────────────
      ...parsed.creates.map(async (item, i) => {
        const content = await generateBlockContent(item, project.description);
        let body: string | null = null;
        if (item.kind === "DIAGRAM" && item.body) {
          body = await generateDiagramBody(item.title, content);
        }
        const newBlock = await prisma.contentBlock.create({
          data: {
            projectId,
            kind: item.kind,
            type: item.type,
            title: item.title,
            content: content.trim(),
            body,
            order: maxBlockOrder + 1 + i,
          },
        });
        created.push({ id: newBlock.id, title: newBlock.title });
      }),

      // ── Section creates ──────────────────────────────────────────────────
      ...parsed.createSections.map(async (sectionItem, si) => {
        const section = await prisma.section.create({
          data: {
            projectId,
            title: sectionItem.title,
            order: maxSectionOrder + 1 + si,
          },
        });

        // Generate blocks sequentially so body can reference diagram content
        for (const [bi, blockItem] of sectionItem.blocks.entries()) {
          const content = await generateBlockContent(
            blockItem,
            project.description,
          );
          let body: string | null = null;
          if (blockItem.kind === "DIAGRAM" && blockItem.body) {
            body = await generateDiagramBody(blockItem.title, content);
          }
          await prisma.contentBlock.create({
            data: {
              projectId,
              sectionId: section.id,
              kind: blockItem.kind,
              type: blockItem.type,
              title: blockItem.title,
              content: content.trim(),
              body,
              order: bi,
            },
          });
        }

        created.push({ id: section.id, title: sectionItem.title });
      }),

      // ── Deletes ──────────────────────────────────────────────────────────
      ...parsed.deletes.map(async (target) => {
        const block = project.contentBlocks.find((b) => b.id === target.id);
        if (!block) return;
        await prisma.contentBlock.delete({ where: { id: block.id } });
        deleted.push({ id: block.id, title: block.title });
      }),
    ]);

    const parts = [];
    if (edited.length)
      parts.push(`Updated: ${edited.map((e) => e.title).join(", ")}`);
    if (created.length)
      parts.push(`Created: ${created.map((e) => e.title).join(", ")}`);
    if (deleted.length)
      parts.push(`Deleted: ${deleted.map((e) => e.title).join(", ")}`);
    const responseMessage = parts.join(" · ");

    const projectState = await getFullProjectSnapshot(projectId);

    await prisma.chatMessage.create({
      data: {
        chatId: chat.id,
        role: "ASSISTANT",
        content: responseMessage,
        snapshot: {
          edited,
          created,
          deleted,
          projectState,
        },
      },
    });

    return NextResponse.json({
      message: responseMessage,
      edited,
      created,
      deleted,
    });
  } catch (error) {
    console.error("Edit route error:", error);
    return NextResponse.json(
      { error: "Failed to process edit" },
      { status: 500 },
    );
  }
}

// ─── Generation helpers ───────────────────────────────────────────────────────

async function generateBlockContent(
  item: IntentCreate,
  projectDescription: string,
): Promise<string> {
  if (item.kind === "DOCUMENT") {
    const { text } = await generateText({
      model,
      system: `You are a technical writing agent. Generate a new document section in properly formatted Markdown. Every heading, paragraph, and list must be separated by a blank line. Return ONLY the content.`,
      prompt: `Project description: ${projectDescription}\n\nGenerate content for a new section titled "${item.title}".\nInstruction: ${item.instruction}`,
    });
    return text.trim();
  } else {
    const { text } = await generateText({
      model,
      system: `You are a diagram generation agent. Generate a Mermaid diagram. Return ONLY the raw Mermaid code, no markdown fences, no explanation.`,
      prompt: `Project description: ${projectDescription}\n\nGenerate a new "${item.title}" diagram.\nInstruction: ${item.instruction}`,
    });
    return text.trim();
  }
}

async function generateDiagramBody(
  title: string,
  diagramContent: string,
): Promise<string> {
  const { text } = await generateText({
    model,
    system: `You are a senior software architect writing clear technical documentation. Write in flowing prose paragraphs — no headings, no bullet points.`,
    prompt: `Write a 3–5 paragraph explanation of the following Mermaid diagram titled "${title}". Walk through what the diagram shows, how the components relate, and what it means for the system as a whole.

Diagram:
${diagramContent}`,
  });
  return text.trim();
}
