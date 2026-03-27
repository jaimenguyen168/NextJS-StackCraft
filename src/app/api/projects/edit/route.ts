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
      include: { documents: true, diagrams: true },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    let chat = await prisma.projectChat.findFirst({ where: { projectId } });
    if (!chat) {
      chat = await prisma.projectChat.create({ data: { projectId } });
    }

    await prisma.chatMessage.create({
      data: { chatId: chat.id, role: "USER", content: prompt },
    });

    const lastMessage = await prisma.chatMessage.findFirst({
      where: { chatId: chat.id, role: "ASSISTANT" },
      orderBy: { createdAt: "desc" },
    });
    const lastSnapshot = lastMessage?.snapshot ?? null;

    const sectionList = [
      ...project.documents.map((d) => `Document: "${d.title}" (id: ${d.id})`),
      ...project.diagrams.map((d) => `Diagram: "${d.title}" (id: ${d.id})`),
    ].join("\n");

    const { text: intentJson } = await generateText({
      model,
      system: `You are an intent analysis agent. Given a user's request and a list of existing project sections, determine whether the user wants to EDIT, CREATE, or DELETE sections.

Respond ONLY with a valid JSON object. No explanation, no markdown fences.

Format:
{
  "edits": [{ "id": "section_id", "type": "document" | "diagram", "instruction": "specific edit instruction" }],
  "creates": [{ "type": "document" | "diagram", "title": "Section Title", "sectionType": "a short snake_case identifier e.g. overview, tech_stack, security, deployment, flowchart, erd, sequence", "instruction": "what to generate" }],
  "deletes": [{ "id": "section_id", "type": "document" | "diagram", "title": "section title" }]
}

Rules:
- If the user says "add", "create", "generate a new" etc → it's a CREATE
- If the user references an existing section by name for changes → it's an EDIT
- If the user says "remove", "delete", "get rid of" etc → it's a DELETE
- Never add a create entry that matches an existing section title
- sectionType should be a short snake_case string describing the content type — be creative, there are no restrictions
- All arrays can be empty if nothing matches`,
      prompt: `User request: "${prompt}"

Existing sections:
${sectionList}

Return the JSON object.`,
    });

    let parsed: {
      edits: {
        id: string;
        type: "document" | "diagram";
        instruction: string;
      }[];
      creates: {
        type: "document" | "diagram";
        title: string;
        sectionType: string;
        instruction: string;
      }[];
      deletes: { id: string; type: "document" | "diagram"; title: string }[];
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
        { error: "Failed to parse intent", raw: intentJson },
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
        message: "No sections were identified. Try being more specific.",
        edited: [],
        created: [],
        deleted: [],
      });
    }

    const edited: { id: string; type: string; title: string }[] = [];
    const created: { id: string; type: string; title: string }[] = [];
    const deleted: { id: string; type: string; title: string }[] = [];

    await Promise.all([
      // Edits
      ...parsed.edits.map(async (target) => {
        if (target.type === "document") {
          const doc = project.documents.find((d) => d.id === target.id);
          if (!doc) return;

          const { text: newContent } = await generateText({
            model,
            system: `You are a technical writing agent. Apply the edit instruction to the document content and return the full updated content in properly formatted Markdown. Every heading, paragraph, and list must be separated by a blank line. Return ONLY the updated content.`,
            prompt: `Current content of "${doc.title}":\n${doc.content}\n\nEdit instruction: ${target.instruction}\n\nReturn the full updated content.`,
          });

          await prisma.document.update({
            where: { id: doc.id },
            data: { content: newContent.trim() },
          });
          edited.push({ id: doc.id, type: "document", title: doc.title });
        }

        if (target.type === "diagram") {
          const diagram = project.diagrams.find((d) => d.id === target.id);
          if (!diagram) return;

          const { text: newContent } = await generateText({
            model,
            system: `You are a diagram editing agent. Apply the edit to the Mermaid diagram and return the full updated Mermaid code. Return ONLY the raw Mermaid code, no markdown fences, no explanation.`,
            prompt: `Current Mermaid diagram "${diagram.title}":\n${diagram.content}\n\nEdit instruction: ${target.instruction}\n\nReturn the full updated Mermaid code.`,
          });

          await prisma.diagram.update({
            where: { id: diagram.id },
            data: { content: newContent.trim() },
          });
          edited.push({
            id: diagram.id,
            type: "diagram",
            title: diagram.title,
          });
        }
      }),

      // Creates
      ...parsed.creates.map(async (item) => {
        if (item.type === "document") {
          const { text: content } = await generateText({
            model,
            system: `You are a technical writing agent. Generate a new document section in properly formatted Markdown. Every heading, paragraph, and list must be separated by a blank line. Return ONLY the content.`,
            prompt: `Project description: ${project.description}\n\nGenerate content for a new section titled "${item.title}".\nInstruction: ${item.instruction}`,
          });

          const maxOrder = Math.max(
            0,
            ...project.documents.map((d) => d.order),
          );
          const newDoc = await prisma.document.create({
            data: {
              projectId,
              type: item.sectionType,
              title: item.title,
              content: content.trim(),
              order: maxOrder + 1,
            },
          });
          created.push({
            id: newDoc.id,
            type: "document",
            title: newDoc.title,
          });
        }

        if (item.type === "diagram") {
          const { text: content } = await generateText({
            model,
            system: `You are a diagram generation agent. Generate a Mermaid diagram based on the instruction. Return ONLY the raw Mermaid code, no markdown fences, no explanation.`,
            prompt: `Project description: ${project.description}\n\nGenerate a new "${item.title}" diagram.\nInstruction: ${item.instruction}`,
          });

          const maxOrder = Math.max(0, ...project.diagrams.map((d) => d.order));
          const newDiagram = await prisma.diagram.create({
            data: {
              projectId,
              type: item.sectionType,
              title: item.title,
              content: content.trim(),
              order: maxOrder + 1,
            },
          });
          created.push({
            id: newDiagram.id,
            type: "diagram",
            title: newDiagram.title,
          });
        }
      }),

      // Deletes
      ...parsed.deletes.map(async (target) => {
        if (target.type === "document") {
          const doc = project.documents.find((d) => d.id === target.id);
          if (!doc) return;
          await prisma.document.delete({ where: { id: doc.id } });
          deleted.push({ id: doc.id, type: "document", title: doc.title });
        }

        if (target.type === "diagram") {
          const diagram = project.diagrams.find((d) => d.id === target.id);
          if (!diagram) return;
          await prisma.diagram.delete({ where: { id: diagram.id } });
          deleted.push({
            id: diagram.id,
            type: "diagram",
            title: diagram.title,
          });
        }
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
      include: {
        documents: { orderBy: { order: "asc" } },
        diagrams: { orderBy: { order: "asc" } },
      },
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
            documents: updatedProject?.documents.map((d) => ({
              id: d.id,
              title: d.title,
              type: d.type,
              content: d.content,
              order: d.order,
            })),
            diagrams: updatedProject?.diagrams.map((d) => ({
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
