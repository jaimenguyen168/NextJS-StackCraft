import { generateText } from "ai";
import { createGroq } from "@ai-sdk/groq";

// ─── Model ────────────────────────────────────────────────────────────────────

export const groq = createGroq({ apiKey: process.env.GROQ_API_KEY });
export const model = groq("meta-llama/llama-4-scout-17b-16e-instruct");
// const model = groq("llama-3.3-70b-versatile");

// ─── Mermaid system prompt ────────────────────────────────────────────────────

export const MERMAID_SYSTEM_PROMPT = `You are a senior software architect and Mermaid diagram expert. Output ONLY raw Mermaid code — no markdown fences, no explanation, no preamble.

STRICT RULES:
- Start with the diagram type (graph TD, graph LR, erDiagram, etc.)
- Frontmatter title block (--- title: ... ---) must come BEFORE the diagram type if included
- Edge labels: -->|label| NOT -->|label|>
- Node labels with spaces MUST use brackets: A[My Label] not A My Label
- Every node ID must be alphanumeric with no spaces
- Subgraph names must not contain special characters
- Do NOT include any style lines
- No markdown fences, no explanation, no preamble — raw Mermaid only`;

// ─── Mermaid validation ───────────────────────────────────────────────────────

export function validateMermaid(code: string): {
  valid: boolean;
  issues: string[];
} {
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

  const bareNodeLines = code
    .split("\n")
    .filter((line) => /^\s+[A-Za-z0-9_]+\s+[A-Z_]{2,}$/.test(line.trim()));
  if (bareNodeLines.length > 0) {
    issues.push(
      `Bare node labels without brackets: ${bareNodeLines.join(", ")}`,
    );
  }

  if ((code.match(/\[/g) ?? []).length !== (code.match(/\]/g) ?? []).length) {
    issues.push("Mismatched square brackets");
  }

  return { valid: issues.length === 0, issues };
}

// ─── Strip Mermaid fences + style lines ──────────────────────────────────────

export function stripMermaid(raw: string): string {
  return raw
    .trim()
    .replace(/```mermaid|```/g, "")
    .trim()
    .split("\n")
    .filter((line) => !line.trim().startsWith("style "))
    .join("\n");
}

// ─── Generate valid Mermaid with retry ───────────────────────────────────────

export async function generateValidDiagram(
  systemPrompt: string,
  userPrompt: string,
  maxRetries = 2,
): Promise<string> {
  let lastCode = "";
  let lastIssues: string[] = [];

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const prompt =
      attempt === 0
        ? userPrompt
        : `The following Mermaid code has syntax errors that must be fixed:

\`\`\`
${lastCode}
\`\`\`

Issues found:
${lastIssues.map((i) => `- ${i}`).join("\n")}

Fix ALL issues and return ONLY the corrected raw Mermaid code. No fences, no style lines, no explanation.`;

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

  console.error(
    "Could not produce valid Mermaid after retries, using last attempt",
  );
  return lastCode;
}

// ─── Generate diagram body prose ─────────────────────────────────────────────

export async function generateDiagramBody(
  title: string,
  diagramContent: string,
  repoContext?: string | null,
): Promise<string> {
  const { text } = await generateText({
    model,
    system:
      "You are a senior software architect writing clear technical documentation. Write in flowing prose paragraphs — no headings, no bullet points.",
    prompt: `Write a 3–5 paragraph explanation of the following Mermaid diagram titled "${title}". Walk through what the diagram shows, how the components relate, and what it means for the system as a whole.
${repoContext ? `\nRepository context for reference:\n${repoContext}` : ""}

Diagram:
${diagramContent}`,
  });
  return text.trim();
}

// ─── Ensure Mermaid frontmatter title ────────────────────────────────────────

export function ensureMermaidTitle(
  mermaid: string,
  projectName: string,
): string {
  if (mermaid.trimStart().startsWith("---")) return mermaid;
  return `---\ntitle: ${projectName} — Block Diagram\n---\n${mermaid}`;
}
