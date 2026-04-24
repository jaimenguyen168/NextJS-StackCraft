import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { generateText } from "ai";
import {
  model,
  MERMAID_SYSTEM_PROMPT,
  generateValidDiagram,
  generateDiagramBody,
} from "@/lib/generation";
import { prisma } from "@/lib/db";
import { getProjectSnapshot } from "@/trpc/routers/projects";
import { getPlanFromClaims } from "@/features/usage/constants/plans";
import { checkEditTokens, consumeEditTokens } from "@/features/usage/lib/usage";

// ─── Types ────────────────────────────────────────────────────────────────────

type IntentEdit = {
  id: string;
  kind: "DOCUMENT" | "DIAGRAM";
  instruction: string;
  editBody?: boolean;
};

type IntentCreate = {
  kind: "DOCUMENT" | "DIAGRAM";
  title: string;
  type: string;
  instruction: string;
  body?: boolean;
  sectionId?: string | null;
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

// ─── OpenAPI spec generation ──────────────────────────────────────────────────

async function generateOpenApiSpec(
  instruction: string,
  projectDescription: string,
  maxRetries = 2,
): Promise<string> {
  let lastJson = "";

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const prompt =
      attempt === 0
        ? `Project description: ${projectDescription}

Generate a valid OpenAPI 3.0 JSON spec for this project's API.
Instruction: ${instruction}

Return ONLY the raw JSON object. No markdown fences, no explanation, no preamble.`
        : `The following OpenAPI spec has JSON syntax errors. Fix it and return ONLY valid JSON:

${lastJson}

Return ONLY the corrected raw JSON. No fences, no explanation.`;

    const { text } = await generateText({
      model,
      system: `You are an API documentation expert. Generate valid OpenAPI 3.0 JSON specifications.

STRICT RULES:
- Return ONLY a valid JSON object starting with {
- Must include: openapi, info, paths fields at minimum
- Use "openapi": "3.0.0"
- All path operations must include summary, responses
- Response objects must include description
- No markdown fences, no explanation, no preamble — raw JSON only`,
      prompt,
    });

    const cleaned = text
      .trim()
      .replace(/```json|```/g, "")
      .trim();

    try {
      JSON.parse(cleaned);
      return cleaned;
    } catch {
      lastJson = cleaned;
      console.warn(`OpenAPI attempt ${attempt + 1} failed: invalid JSON`);
    }
  }

  return lastJson;
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const { userId, has } = await auth();
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
        githubContext: true,
      },
    });
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const repoContext = project.githubContext?.context ?? null;

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
      .map((b) => {
        const base = `${b.kind === "DIAGRAM" ? "Diagram" : "Document"}: "${b.title}" (id: ${b.id}, type: ${b.type})`;
        if (b.kind === "DIAGRAM") {
          return `${base} [explanation/body: ${b.body ? "yes" : "no"}]`;
        }
        return base;
      })
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
    { "id": "block_id", "kind": "DOCUMENT" | "DIAGRAM", "instruction": "specific edit instruction", "editBody": false }
  ],
  "creates": [
    { "kind": "DOCUMENT" | "DIAGRAM", "title": "Block Title", "type": "snake_case_type", "instruction": "what to generate", "body": true, "sectionId": "existing_section_id_or_null" }
  ],
  "createSections": [
    {
      "title": "Section Title",
      "blocks": [
        { "kind": "DOCUMENT" | "DIAGRAM", "title": "Block Title", "type": "snake_case_type", "instruction": "what to generate", "body": true, "sectionId": null }
      ]
    }
  ],
  "deletes": [
    { "id": "block_id", "title": "block title" }
  ]
}

Rules:
- Always set "body": true on DIAGRAM blocks — every diagram must have a prose explanation generated alongside it
- Set "editBody": true when the user asks to edit, update, or add an explanation/description/body to an existing diagram
- Match section and block names LOOSELY — partial or approximate names should match:
  e.g. "require specs" → "Requirements Specification", "arch" → "Architecture", "block diagram" → find the block named "Block Diagram"
- If the user asks to add a block "under", "inside", "in", or "to" an existing section, use "creates" with the matched section's id in "sectionId" — do NOT create a new section
- Use "createSections" ONLY when the user explicitly asks to create a brand new section that does not exist yet
- Use "edits" when the user references an existing block by full or partial name for changes
- Use "deletes" when the user says "remove", "delete", or "get rid of"
- Never create a block or section with a title that already exists
- All arrays can be empty if nothing matches
- "type" should be a short snake_case identifier. Supported types include:
  overview, architecture, class_diagram, erd, flowchart, timeline, security, api_structure, tasks
  openapi_spec → use this type when the user asks for "API spec", "OpenAPI", "Swagger spec", or "API documentation spec"
- For openapi_spec: always use kind "DOCUMENT" — the content will be raw JSON, not Markdown`,
      prompt: `User request: "${prompt}"

Existing sections (match loosely by name, use the id when referencing):
${sectionList || "None"}

Existing blocks (match loosely by name, use the id when referencing):
${blockList || "None"}

IMPORTANT: If the user says to add something "under", "to", or "inside" an existing section, put it in "creates" with the sectionId set to that section's id. Only use "createSections" for brand new sections.

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

    const plan = getPlanFromClaims(has);
    const tokenCheck = await checkEditTokens(userId, plan);
    if (!tokenCheck.allowed) {
      await prisma.chatMessage.create({
        data: {
          chatId: chat.id,
          role: "ASSISTANT",
          content:
            "Monthly edit token limit reached. Upgrade your plan to continue editing.",
          snapshot: lastSnapshot ?? undefined,
        },
      });
      return NextResponse.json(
        {
          error: "Monthly edit token limit reached. Upgrade to continue.",
          code: "TOKEN_LIMIT",
        },
        { status: 402 },
      );
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
      // ── Edits ──────────────────────────────────────────────────────────
      ...parsed.edits.map(async (target) => {
        const block = project.contentBlocks.find((b) => b.id === target.id);
        if (!block) return;

        if (block.kind === "DOCUMENT") {
          const isOpenApi = block.type === "openapi_spec";
          const newContent = isOpenApi
            ? await generateOpenApiSpec(target.instruction, project.description)
            : await (async () => {
                const { text } = await generateText({
                  model,
                  system: `You are a technical writing agent. Apply the edit instruction and return the full updated content in properly formatted Markdown. Every heading, paragraph, and list must be separated by a blank line. Return ONLY the updated content.`,
                  prompt: `Current content of "${block.title}":
${block.content}

Edit instruction: ${target.instruction}
${repoContext ? `\nRepository context for reference:\n${repoContext}` : ""}

Return the full updated content.`,
                });
                return text.trim();
              })();

          await prisma.contentBlock.update({
            where: { id: block.id },
            data: { content: newContent },
          });
        } else {
          const newContent = await generateValidDiagram(
            MERMAID_SYSTEM_PROMPT,
            `Current Mermaid diagram "${block.title}":
\`\`\`
${block.content}
\`\`\`

Edit instruction: ${target.instruction}
${repoContext ? `\nRepository context for reference:\n${repoContext}` : ""}

Return ONLY the corrected raw Mermaid code. No fences, no explanation.`,
          );

          let newBody = block.body ?? null;
          if (block.body || target.editBody) {
            newBody = await generateDiagramBody(
              block.title,
              newContent,
              repoContext,
            );
          }

          await prisma.contentBlock.update({
            where: { id: block.id },
            data: { content: newContent, body: newBody },
          });
        }
        edited.push({ id: block.id, title: block.title });
      }),

      // ── Loose creates ───────────────────────────────────────────────────
      ...parsed.creates.map(async (item, i) => {
        const content = await generateBlockContent(
          item,
          project.description,
          repoContext,
        );
        let body: string | null = null;
        if (item.kind === "DIAGRAM") {
          body = await generateDiagramBody(item.title, content, repoContext);
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
            sectionId: item.sectionId ?? null,
          },
        });
        created.push({ id: newBlock.id, title: newBlock.title });
      }),

      // ── Section creates ─────────────────────────────────────────────────
      ...parsed.createSections.map(async (sectionItem, si) => {
        const section = await prisma.section.create({
          data: {
            projectId,
            title: sectionItem.title,
            order: maxSectionOrder + 1 + si,
          },
        });

        for (const [bi, blockItem] of sectionItem.blocks.entries()) {
          const content = await generateBlockContent(
            blockItem,
            project.description,
            repoContext,
          );
          let body: string | null = null;
          if (blockItem.kind === "DIAGRAM") {
            body = await generateDiagramBody(
              blockItem.title,
              content,
              repoContext,
            );
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

      // ── Deletes ─────────────────────────────────────────────────────────
      ...parsed.deletes.map(async (target) => {
        const block = project.contentBlocks.find((b) => b.id === target.id);
        if (!block) return;
        await prisma.contentBlock.delete({ where: { id: block.id } });
        deleted.push({ id: block.id, title: block.title });
      }),
    ]);

    const estimatedTokens =
      edited.length * 5000 +
      created.length * 6000 +
      parsed.createSections.reduce((acc, s) => acc + s.blocks.length * 6000, 0);

    await consumeEditTokens(userId, plan, estimatedTokens);

    const parts = [];
    if (edited.length)
      parts.push(`Updated: ${edited.map((e) => e.title).join(", ")}`);
    if (created.length)
      parts.push(`Created: ${created.map((e) => e.title).join(", ")}`);
    if (deleted.length)
      parts.push(`Deleted: ${deleted.map((e) => e.title).join(", ")}`);
    const responseMessage = parts.join(" · ");

    const projectState = await getProjectSnapshot(projectId);

    await prisma.chatMessage.create({
      data: {
        chatId: chat.id,
        role: "ASSISTANT",
        content: responseMessage,
        snapshot: { edited, created, deleted, projectState },
        tokensUsed: estimatedTokens,
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
  repoContext: string | null,
): Promise<string> {
  if (item.type === "openapi_spec") {
    return generateOpenApiSpec(item.instruction, projectDescription);
  }

  if (item.kind === "DOCUMENT") {
    const { text } = await generateText({
      model,
      system: `You are a technical writing agent. Generate a new document section in properly formatted Markdown. Every heading, paragraph, and list must be separated by a blank line. Return ONLY the content.`,
      prompt: `Project description: ${projectDescription}
${repoContext ? `\nRepository context (use this to generate accurate content):\n${repoContext}` : ""}

Generate content for a new section titled "${item.title}".
Instruction: ${item.instruction}`,
    });
    return text.trim();
  } else {
    return generateValidDiagram(
      MERMAID_SYSTEM_PROMPT,
      `Project description: ${projectDescription}
${repoContext ? `\nRepository context:\n${repoContext}` : ""}

Generate a "${item.title}" Mermaid diagram.
Instruction: ${item.instruction}`,
    );
  }
}
