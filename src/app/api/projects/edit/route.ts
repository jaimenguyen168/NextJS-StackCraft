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

    const { projectId, prompt } = await request.json();
    if (!projectId || !prompt) {
      return NextResponse.json(
        { error: "projectId and prompt are required" },
        { status: 400 },
      );
    }

    const project = await prisma.project.findFirst({
      where: { id: projectId, userId },
      include: { contentBlocks: true },
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

    const { text: intentJson } = await generateText({
      model,
      system: `You are an intent analysis agent. Given a user's request and a list of existing project sections, determine whether the user wants to EDIT, CREATE, or DELETE sections.

Respond ONLY with a valid JSON object. No explanation, no markdown fences.

Format:
{
  "edits": [{ "id": "block_id", "kind": "DOCUMENT" | "DIAGRAM", "instruction": "specific edit instruction" }],
  "creates": [{ "kind": "DOCUMENT" | "DIAGRAM", "title": "Section Title", "type": "snake_case_type e.g. overview, erd, flowchart, security", "instruction": "what to generate" }],
  "deletes": [{ "id": "block_id", "title": "section title" }]
}

Rules:
- If the user says "add", "create", "generate a new" etc → CREATE
- If the user references an existing section by name for changes → EDIT
- If the user says "remove", "delete", "get rid of" etc → DELETE
- Never create a section that matches an existing title
- All arrays can be empty if nothing matches`,
      prompt: `User request: "${prompt}"\n\nExisting sections:\n${blockList}\n\nReturn the JSON object.`,
    });

    let parsed: {
      edits: {
        id: string;
        kind: "DOCUMENT" | "DIAGRAM";
        instruction: string;
      }[];
      creates: {
        kind: "DOCUMENT" | "DIAGRAM";
        title: string;
        type: string;
        instruction: string;
      }[];
      deletes: { id: string; title: string }[];
    } = { edits: [], creates: [], deletes: [] };

    try {
      const cleaned = intentJson.replace(/```json|```/g, "").trim();
      parsed = JSON.parse(cleaned);
      parsed.deletes = parsed.deletes ?? [];
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

    if (
      parsed.edits.length === 0 &&
      parsed.creates.length === 0 &&
      parsed.deletes.length === 0
    ) {
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

    await Promise.all([
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

      ...parsed.creates.map(async (item) => {
        const maxOrder = Math.max(
          0,
          ...project.contentBlocks.map((b) => b.order),
        );

        if (item.kind === "DOCUMENT") {
          const { text: content } = await generateText({
            model,
            system: `You are a technical writing agent. Generate a new document section in properly formatted Markdown. Every heading, paragraph, and list must be separated by a blank line. Return ONLY the content.`,
            prompt: `Project description: ${project.description}\n\nGenerate content for a new section titled "${item.title}".\nInstruction: ${item.instruction}`,
          });
          const newBlock = await prisma.contentBlock.create({
            data: {
              projectId,
              kind: "DOCUMENT",
              type: item.type,
              title: item.title,
              content: content.trim(),
              order: maxOrder + 1,
            },
          });
          created.push({ id: newBlock.id, title: newBlock.title });
        } else {
          const { text: content } = await generateText({
            model,
            system: `You are a diagram generation agent. Generate a Mermaid diagram. Return ONLY the raw Mermaid code, no markdown fences, no explanation.`,
            prompt: `Project description: ${project.description}\n\nGenerate a new "${item.title}" diagram.\nInstruction: ${item.instruction}`,
          });
          const newBlock = await prisma.contentBlock.create({
            data: {
              projectId,
              kind: "DIAGRAM",
              type: item.type,
              title: item.title,
              content: content.trim(),
              order: maxOrder + 1,
            },
          });
          created.push({ id: newBlock.id, title: newBlock.title });
        }
      }),

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

    const updatedProject = await prisma.project.findFirst({
      where: { id: projectId },
      include: { contentBlocks: { orderBy: { order: "asc" } } },
    });

    await prisma.chatMessage.create({
      data: {
        chatId: chat.id,
        role: "ASSISTANT",
        content: responseMessage,
        snapshot: {
          edited,
          created,
          deleted,
          projectState: {
            description: updatedProject?.description ?? "",
            contentBlocks: updatedProject?.contentBlocks.map((b) => ({
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
