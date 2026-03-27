import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { generateText } from "ai";
import { createGroq } from "@ai-sdk/groq";
import { prisma } from "@/lib/db";
import { DocumentType, DiagramType } from "@/generated/prisma/enums";

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

    const sectionList = [
      ...project.documents.map((d) => `Document: "${d.title}" (id: ${d.id})`),
      ...project.diagrams.map((d) => `Diagram: "${d.title}" (id: ${d.id})`),
    ].join("\n");

    const { text: intentJson } = await generateText({
      model,
      system: `You are an intent analysis agent. Given a user's request and a list of existing project sections, determine whether the user wants to EDIT existing sections or CREATE new ones.

Respond ONLY with a valid JSON object. No explanation, no markdown fences.

Format:
{
  "edits": [{ "id": "section_id", "type": "document" | "diagram", "instruction": "specific edit instruction" }],
  "creates": [{ "type": "document" | "diagram", "title": "Section Title", "diagramType": "ARCHITECTURE | ERD | SEQUENCE | FLOWCHART | null", "documentType": "OVERVIEW | TECH_STACK | TIMELINE | API_STRUCTURE | TASKS | null", "instruction": "what to generate" }]
}

Rules:
- If the user says "add", "create", "generate a new", "I want a flowchart" etc → it's a CREATE, not an edit
- If the user references an existing section by name → it's an EDIT
- Never add a create entry that matches an existing section title
- For creates: set diagramType if it's a diagram (ARCHITECTURE, ERD, SEQUENCE, FLOWCHART), set documentType if it's a document, otherwise null
- Both arrays can be empty if nothing matches`,
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
        diagramType: string | null;
        documentType: string | null;
        instruction: string;
      }[];
    } = { edits: [], creates: [] };

    try {
      const cleaned = intentJson.replace(/```json|```/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      return NextResponse.json(
        { error: "Failed to parse intent", raw: intentJson },
        { status: 500 },
      );
    }

    if (parsed.edits.length === 0 && parsed.creates.length === 0) {
      return NextResponse.json({
        message: "No sections were identified. Try being more specific.",
        edited: [],
        created: [],
      });
    }

    const edited: { id: string; type: string; title: string }[] = [];
    const created: { id: string; type: string; title: string }[] = [];

    await Promise.all([
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
              type: (item.documentType ?? "OVERVIEW") as DocumentType,
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
              type: (item.diagramType ?? "FLOWCHART") as DiagramType,
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
    ]);

    const parts = [];
    if (edited.length)
      parts.push(`Updated: ${edited.map((e) => e.title).join(", ")}`);
    if (created.length)
      parts.push(`Created: ${created.map((e) => e.title).join(", ")}`);

    return NextResponse.json({
      message: parts.join(" · "),
      edited,
      created,
    });
  } catch (error) {
    console.error("Edit route error:", error);
    return NextResponse.json(
      { error: "Failed to process edit" },
      { status: 500 },
    );
  }
}
