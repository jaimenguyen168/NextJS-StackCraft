import { generateText } from "ai";
import { createGroq } from "@ai-sdk/groq";

// ─── Model ────────────────────────────────────────────────────────────────────

export const groq = createGroq({ apiKey: process.env.GROQ_API_KEY });
export const model = groq("meta-llama/llama-4-scout-17b-16e-instruct");
// const model = groq("llama-3.3-70b-versatile");

// ─── Rate-limit aware retry ───────────────────────────────────────────────────
// Groq returns a 429 with a `retry-after` header (in seconds).
// We read that header and wait the indicated time before retrying.
// We also set maxRetries: 0 on every generateText call so the AI SDK
// does NOT do its own fast-retry (which burns the remaining token budget
// before our backoff can kick in).

async function withRateLimitRetry<T>(
  fn: () => Promise<T>,
  maxAttempts = 4,
): Promise<T> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err: unknown) {
      const e = err as {
        message?: string;
        statusCode?: number;
        responseHeaders?: Record<string, string>;
      };

      const isRateLimit =
        e.statusCode === 429 ||
        (typeof e.message === "string" &&
          e.message.includes("rate_limit_exceeded"));

      // Rethrow non-rate-limit errors or if we're out of attempts
      if (!isRateLimit || attempt === maxAttempts - 1) throw err;

      // Respect Groq's retry-after header; fall back to 20 s * 2^attempt
      const retryAfterSec = e.responseHeaders?.["retry-after"]
        ? parseInt(e.responseHeaders["retry-after"], 10)
        : null;
      const delayMs =
        retryAfterSec != null && !Number.isNaN(retryAfterSec)
          ? (retryAfterSec + 3) * 1_000
          : 20_000 * Math.pow(2, attempt);

      console.warn(
        `[generation] Rate limit hit — waiting ${delayMs}ms (attempt ${attempt + 1}/${maxAttempts})`,
      );
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  // Should never reach here
  throw new Error("[generation] Exhausted all retry attempts");
}

// ─── Mermaid system prompt ────────────────────────────────────────────────────

export const MERMAID_SYSTEM_PROMPT = `You are a senior software architect and Mermaid diagram expert. Output ONLY raw Mermaid code — no markdown fences, no explanation, no preamble.

STRICT RULES — violating any of these will cause a render failure:

1. Start with the diagram type on its own line: graph TD, graph LR, sequenceDiagram, erDiagram, etc.
2. Optional frontmatter (--- title: ... ---) MUST come BEFORE the diagram type line.
3. Edge label syntax: A -->|label| B   ← correct
                      A -->|label|> B  ← WRONG, never use |>
4. Node IDs must be alphanumeric only — NO spaces, NO hyphens.
   Use camelCase or PascalCase: MyNode, apiServer, dbLayer
5. Node labels with spaces MUST use bracket syntax: MyNode[My Node Label]
6. Subgraph names are display labels only — they are NOT node IDs.
   NEVER reference a subgraph name in an edge. Only reference actual node IDs.
   WRONG: subgraph Agent Functions ... end   then later: AgentFunctions -->|x| Other
   RIGHT: subgraph AgentFunctions [Agent Functions] ... end   then: AgentFunctions -->|x| Other
   OR: define explicit nodes inside the subgraph and reference those instead.
7. Every node ID used in an edge (A --> B) MUST be defined somewhere in the diagram.
8. Do NOT duplicate subgraph declarations with the same name.
9. Do NOT include any "style" lines.
10. No markdown fences, no explanation, no preamble — raw Mermaid only.`;

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

  // 1. Must have a valid diagram type
  if (
    !/^(graph|flowchart|erDiagram|sequenceDiagram|classDiagram|gantt|pie|journey|gitGraph|block-beta)/.test(
      withoutFrontmatter,
    )
  ) {
    issues.push("Missing or invalid diagram type declaration");
  }

  // 2. Invalid |> edge label syntax
  if (/\|>/.test(code)) {
    issues.push("Invalid edge label syntax: use -->|label| not -->|label|>");
  }

  // 3. Mismatched square brackets
  if ((code.match(/\[/g) ?? []).length !== (code.match(/\]/g) ?? []).length) {
    issues.push("Mismatched square brackets");
  }

  // 4. Mismatched parentheses (common in rounded-node syntax)
  const openParens = (code.match(/\(/g) ?? []).length;
  const closeParens = (code.match(/\)/g) ?? []).length;
  if (openParens !== closeParens) {
    issues.push("Mismatched parentheses in node definitions");
  }

  // 5. Duplicate subgraph declarations
  const subgraphNames = [...code.matchAll(/^\s*subgraph\s+(\S+)/gm)].map(
    (m) => m[1],
  );
  const seen = new Set<string>();
  for (const name of subgraphNames) {
    if (seen.has(name)) {
      issues.push(`Duplicate subgraph declaration: "${name}"`);
    }
    seen.add(name);
  }

  // 6. Node IDs with spaces used directly in edges (catches "Agent Functions -->")
  if (/[A-Za-z]\s+[A-Za-z]+\s*-->/.test(code)) {
    issues.push(
      "Node ID with spaces used in edge — node IDs must be alphanumeric with no spaces",
    );
  }

  // 7. Markdown fences accidentally included
  if (/```/.test(code)) {
    issues.push("Markdown code fences found in output — remove them");
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

    const { text } = await withRateLimitRetry(() =>
      generateText({ model, system: systemPrompt, prompt, maxRetries: 0 }),
    );
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
  const { text } = await withRateLimitRetry(() =>
    generateText({
      model,
      maxRetries: 0,
      system:
        "You are a senior software architect writing clear technical documentation. Write in flowing prose paragraphs — no headings, no bullet points.",
      prompt: `Write a 3–5 paragraph explanation of the following Mermaid diagram titled "${title}". Walk through what the diagram shows, how the components relate, and what it means for the system as a whole.
${repoContext ? `\nRepository context for reference:\n${repoContext}` : ""}

Diagram:
${diagramContent}`,
    }),
  );
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
