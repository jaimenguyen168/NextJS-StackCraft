"use client";

import React, { useState, useMemo } from "react";
import {
  Loader2Icon,
  GitBranchIcon,
  ExternalLinkIcon,
  CheckIcon,
  FileTextIcon,
  EyeIcon,
  KeyIcon,
  ChevronLeftIcon,
} from "lucide-react";
import { FaGithub } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { useProject } from "@/trpc/hooks/use-projects";
import { useProjectSnapshot } from "@/features/projects/contexts/project-snapshot-context";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ContentBlock {
  id: string;
  kind: string;
  type: string;
  title: string;
  content: string;
  body?: string | null;
  order: number;
  sectionId?: string | null;
}

interface Section {
  id: string;
  title: string;
  order: number;
  contentBlocks: ContentBlock[];
}

// ─── Badge map ───────────────────────────────────────────────────────────────

const BADGE_MAP: Record<string, { label: string; logo: string; color: string }> = {
  react: { label: "React", logo: "react", color: "61DAFB" },
  nextjs: { label: "Next.js", logo: "nextdotjs", color: "000000" },
  "next.js": { label: "Next.js", logo: "nextdotjs", color: "000000" },
  typescript: { label: "TypeScript", logo: "typescript", color: "3178C6" },
  javascript: { label: "JavaScript", logo: "javascript", color: "F7DF1E" },
  tailwind: { label: "Tailwind CSS", logo: "tailwindcss", color: "06B6D4" },
  tailwindcss: { label: "Tailwind CSS", logo: "tailwindcss", color: "06B6D4" },
  prisma: { label: "Prisma", logo: "prisma", color: "2D3748" },
  clerk: { label: "Clerk", logo: "clerk", color: "6C47FF" },
  stripe: { label: "Stripe", logo: "stripe", color: "635BFF" },
  postgresql: { label: "PostgreSQL", logo: "postgresql", color: "4169E1" },
  postgres: { label: "PostgreSQL", logo: "postgresql", color: "4169E1" },
  redis: { label: "Redis", logo: "redis", color: "DC382D" },
  docker: { label: "Docker", logo: "docker", color: "2496ED" },
  python: { label: "Python", logo: "python", color: "3776AB" },
  nodejs: { label: "Node.js", logo: "nodedotjs", color: "339933" },
  "node.js": { label: "Node.js", logo: "nodedotjs", color: "339933" },
  express: { label: "Express", logo: "express", color: "000000" },
  mongodb: { label: "MongoDB", logo: "mongodb", color: "47A248" },
  graphql: { label: "GraphQL", logo: "graphql", color: "E10098" },
  supabase: { label: "Supabase", logo: "supabase", color: "3ECF8E" },
  vercel: { label: "Vercel", logo: "vercel", color: "000000" },
  aws: { label: "AWS", logo: "amazonaws", color: "FF9900" },
  firebase: { label: "Firebase", logo: "firebase", color: "FFCA28" },
  vue: { label: "Vue.js", logo: "vuedotjs", color: "4FC08D" },
  angular: { label: "Angular", logo: "angular", color: "DD0031" },
  convex: { label: "Convex", logo: "convex", color: "FF6F00" },
  shadcn: { label: "shadcn/ui", logo: "shadcnui", color: "000000" },
  openai: { label: "OpenAI", logo: "openai", color: "412991" },
  trpc: { label: "tRPC", logo: "trpc", color: "2596BE" },
  drizzle: { label: "Drizzle ORM", logo: "drizzle", color: "C5F74F" },
  resend: { label: "Resend", logo: "resend", color: "000000" },
  planetscale: { label: "PlanetScale", logo: "planetscale", color: "000000" },
  neon: { label: "Neon", logo: "neon", color: "00E599" },
  upstash: { label: "Upstash", logo: "upstash", color: "00E9A3" },
};

function makeBadge(tag: string): string | null {
  const b = BADGE_MAP[tag.toLowerCase().replace(/[-\s]/g, "").replace(/\./g, "")]
         ?? BADGE_MAP[tag.toLowerCase()];
  if (!b) return null;
  const label = encodeURIComponent(b.label).replace(/%20/g, "_");
  return `<img src="https://img.shields.io/badge/-${label}-black?style=for-the-badge&logoColor=white&logo=${b.logo}&color=${b.color}" alt="${b.label}" />`;
}

// ─── Section helpers ──────────────────────────────────────────────────────────

function getSectionEmoji(title: string): string {
  const t = title.toLowerCase();
  if (t.includes("require") || t.includes("spec")) return "📋";
  if (t.includes("database") || t.includes(" db") || t.includes("data model")) return "🗄️";
  if (t.includes("api")) return "🔌";
  if (t.includes("architect")) return "🏗️";
  if (t.includes("design") || t.includes("ui")) return "🎨";
  if (t.includes("feature")) return "🕹️";
  if (t.includes("security") || t.includes("auth")) return "🔒";
  if (t.includes("deploy") || t.includes("infra") || t.includes("devops")) return "🚀";
  if (t.includes("test")) return "🧪";
  if (t.includes("overview") || t.includes("intro") || t.includes("system")) return "✨";
  return "📌";
}

function toAnchor(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

/** Ensure triple-backtick code fences are balanced so nothing leaks out. */
function ensureBalancedFences(content: string): string {
  const fenceCount = (content.match(/^```/gm) ?? []).length;
  if (fenceCount % 2 !== 0) return content + "\n```";
  return content;
}

// ─── Markdown builder ─────────────────────────────────────────────────────────

function buildMarkdown(
  project: {
    name: string;
    description?: string | null;
    mainContent?: string | null;
    tags?: string[];
    githubUrl?: string | null;
  },
  sections: Section[],
  opts: { includeOverview: boolean; selectedSectionIds: Set<string> },
): string {
  const lines: string[] = [];

  const tags = project.tags ?? [];
  const badges = tags.map(makeBadge).filter(Boolean) as string[];

  const selectedSections = sections
    .filter((s) => opts.selectedSectionIds.has(s.id))
    .sort((a, b) => a.order - b.order)
    .filter((s) =>
      s.contentBlocks.some((b) =>
        b.kind === "DIAGRAM" ? !!b.body : !!b.content,
      ),
    );

  // ── Title ─────────────────────────────────────────────────────────────────
  lines.push(`# ${project.name}`);
  lines.push("");

  if (project.description) {
    lines.push(`> ${project.description}`);
    lines.push("");
  }

  // ── Badges ────────────────────────────────────────────────────────────────
  if (badges.length > 0) {
    lines.push('<div align="center">');
    lines.push(`  ${badges.join("\n  ")}`);
    lines.push("</div>");
    lines.push("");
  }

  // ── Table of contents ─────────────────────────────────────────────────────
  lines.push(`## 📋 <a name="table-of-contents">Table of Contents</a>`);
  lines.push("");

  let tocIdx = 1;
  if (opts.includeOverview && project.mainContent) {
    lines.push(`${tocIdx++}. ✨ [Introduction](#introduction)`);
  }
  for (const s of selectedSections) {
    const emoji = getSectionEmoji(s.title);
    lines.push(`${tocIdx++}. ${emoji} [${s.title}](#${toAnchor(s.title)})`);
  }
  lines.push("");

  // ── Introduction / overview ───────────────────────────────────────────────
  if (opts.includeOverview && project.mainContent) {
    lines.push("---");
    lines.push("");
    lines.push(`## <a name="introduction">✨ Introduction</a>`);
    lines.push("");
    lines.push(project.mainContent.trim());
    lines.push("");
  }

  // ── Sections ──────────────────────────────────────────────────────────────
  for (const section of selectedSections) {
    const emoji = getSectionEmoji(section.title);
    const anchor = toAnchor(section.title);

    lines.push("---");
    lines.push("");
    lines.push(`## <a name="${anchor}">${emoji} ${section.title}</a>`);
    lines.push("");

    const blocks = section.contentBlocks
      .slice()
      .sort((a, b) => a.order - b.order)
      .filter((b) => (b.kind === "DIAGRAM" ? !!b.body : !!b.content));

    for (const block of blocks) {
      lines.push(`### ${block.title}`);
      lines.push("");

      const raw = (block.kind === "DIAGRAM" ? block.body : block.content) ?? "";

      // Format bullet lines with bold labels → 👉
      const formatted = ensureBalancedFences(
        raw
          .trim()
          .split("\n")
          .map((line) => {
            if (/^[-*]\s+\*\*/.test(line)) return line.replace(/^[-*]\s+/, "👉 ");
            return line;
          })
          .join("\n"),
      );

      lines.push(formatted);
      lines.push("");
    }
  }

  // ── Footer ────────────────────────────────────────────────────────────────
  lines.push("---");
  lines.push("");
  lines.push('<div align="center">');
  lines.push(
    `  <p>Built with ❤️ using <a href="https://stackcraft.dev">StackCraft</a>${project.githubUrl ? ` · <a href="${project.githubUrl}">View Repository</a>` : ""}</p>`,
  );
  lines.push("  <p>⭐ Star this repo if you find it helpful!</p>");
  lines.push("</div>");
  lines.push("");

  return lines.join("\n");
}

// ─── Dialog ───────────────────────────────────────────────────────────────────

interface GithubPushDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Step = "configure" | "preview" | "pushing" | "done";

export function GithubPushDialog({ open, onOpenChange }: GithubPushDialogProps) {
  const { projectId } = useProjectSnapshot();
  const { project } = useProject(projectId);

  const [step, setStep] = useState<Step>("configure");
  const [previewTab, setPreviewTab] = useState<"rendered" | "markdown">("rendered");
  const [includeOverview, setIncludeOverview] = useState(true);
  const [targetFile, setTargetFile] = useState<"README.md" | "ARCHITECTURE.md">("README.md");
  const [prUrl, setPrUrl] = useState<string | null>(null);
  const [branchUrl, setBranchUrl] = useState<string | null>(null);
  const [pushError, setPushError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Build sections with their blocks
  const sections: Section[] = useMemo(() => {
    if (!project) return [];
    return (project.sections ?? [])
      .map((s) => ({
        ...s,
        contentBlocks: (project.contentBlocks ?? []).filter(
          (b) => b.sectionId === s.id,
        ),
      }))
      .sort((a, b) => a.order - b.order);
  }, [project]);

  // Selected section IDs — all on by default
  const [selectedSectionIds, setSelectedSectionIds] = useState<Set<string>>(
    () => new Set(sections.map((s) => s.id)),
  );

  // Re-init selections when sections load (first open)
  const [sectionsInited, setSectionsInited] = useState(false);
  if (!sectionsInited && sections.length > 0) {
    setSelectedSectionIds(new Set(sections.map((s) => s.id)));
    setSectionsInited(true);
  }

  if (!project) return null;

  const hasToken = !!project.githubToken;
  const hasGithubUrl = !!project.githubUrl;

  const markdown = buildMarkdown(
    {
      name: project.name,
      description: project.description,
      mainContent: project.mainContent,
      tags: project.tags,
      githubUrl: project.githubUrl,
    },
    sections,
    { includeOverview, selectedSectionIds },
  );

  const toggleSection = (id: string) => {
    setSelectedSectionIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePush = async () => {
    setStep("pushing");
    setPushError(null);

    try {
      const res = await fetch("/api/projects/github/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, markdown, targetFile }),
      });

      const data = await res.json();

      if (!res.ok) {
        setPushError(data.error ?? "Failed to push to GitHub.");
        if (data.branchUrl) setBranchUrl(data.branchUrl);
        setStep("preview");
        return;
      }

      setPrUrl(data.prUrl);
      setStep("done");
    } catch {
      setPushError("Network error — please try again.");
      setStep("preview");
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => {
      setStep("configure");
      setPrUrl(null);
      setBranchUrl(null);
      setPushError(null);
      setCopied(false);
      setTargetFile("README.md");
    }, 300);
  };

  // ── Section helpers for display ──────────────────────────────────────────────

  const blockSummary = (s: Section) => {
    const docs = s.contentBlocks.filter((b) => b.kind === "DOCUMENT");
    const diagrams = s.contentBlocks.filter((b) => b.kind === "DIAGRAM" && b.body);
    const parts: string[] = [];
    if (docs.length) parts.push(`${docs.length} doc${docs.length > 1 ? "s" : ""}`);
    if (diagrams.length) parts.push(`${diagrams.length} diagram description${diagrams.length > 1 ? "s" : ""}`);
    return parts.join(", ") || "no renderable content";
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <FaGithub className="size-4" />
            Push docs to GitHub
          </DialogTitle>
        </DialogHeader>

        {/* ── No GitHub URL ── */}
        {!hasGithubUrl && (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <FaGithub className="size-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No GitHub repository linked to this project. Add one in Settings → GitHub.
            </p>
            <Button variant="outline" size="sm" onClick={handleClose}>Close</Button>
          </div>
        )}

        {/* ── No token ── */}
        {hasGithubUrl && !hasToken && (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <div className="size-10 rounded-full bg-muted flex items-center justify-center">
              <KeyIcon className="size-5 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <p className="font-medium text-sm">GitHub token required to push</p>
              <p className="text-sm text-muted-foreground max-w-sm">
                Add a Personal Access Token in Settings → GitHub. It needs{" "}
                <strong>Contents: Read and write</strong> and{" "}
                <strong>Pull requests: Read and write</strong> permissions on this repo.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={handleClose}>Close</Button>
          </div>
        )}

        {/* ── Step: configure ── */}
        {hasGithubUrl && hasToken && step === "configure" && (
          <div className="flex flex-col gap-3 min-h-0">
            {/* Target file picker */}
            <div className="shrink-0 space-y-1.5">
              <p className="text-[11px] uppercase tracking-widest text-muted-foreground/70 px-0.5">
                Target file
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                {(["README.md", "ARCHITECTURE.md"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setTargetFile(f)}
                    className={`flex flex-col gap-0.5 px-3 py-2.5 rounded-lg border text-left transition-colors ${
                      targetFile === f
                        ? "border-primary bg-primary/5 text-foreground"
                        : "border-border/60 bg-muted/30 text-muted-foreground hover:bg-muted/50"
                    }`}
                  >
                    <code className="text-[12px] font-mono font-medium">{f}</code>
                    <span className="text-[11px]">
                      {f === "README.md"
                        ? "Overwrite the repo landing page"
                        : "Create a separate architecture doc"}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <p className="text-[12px] text-muted-foreground shrink-0">
              Choose what to include — diagrams are shown as text descriptions since GitHub doesn&apos;t render Mermaid.
            </p>

            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
              {/* Overview toggle */}
              {project.mainContent && (
                <label className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg border border-border/60 bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors">
                  <div>
                    <p className="text-[13px] font-medium">Project Overview</p>
                    <p className="text-[11px] text-muted-foreground">Abstract, requirements, design, background</p>
                  </div>
                  <Switch
                    checked={includeOverview}
                    onCheckedChange={setIncludeOverview}
                  />
                </label>
              )}

              {/* Section toggles */}
              {sections.map((s) => {
                const hasProse =
                  s.contentBlocks.some((b) => b.kind === "DOCUMENT" && b.content) ||
                  s.contentBlocks.some((b) => b.kind === "DIAGRAM" && b.body);
                return (
                  <label
                    key={s.id}
                    className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg border border-border/60 bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-[13px] font-medium">{s.title}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {hasProse ? blockSummary(s) : "no renderable content — will be skipped"}
                      </p>
                    </div>
                    <Switch
                      checked={selectedSectionIds.has(s.id)}
                      onCheckedChange={() => toggleSection(s.id)}
                      disabled={!hasProse}
                    />
                  </label>
                );
              })}
            </div>

            <Button
              size="sm"
              className="shrink-0 w-full"
              onClick={() => setStep("preview")}
            >
              Preview →
            </Button>
          </div>
        )}

        {/* ── Step: preview ── */}
        {hasGithubUrl && hasToken && step === "preview" && (
          <>
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 border border-border/60 shrink-0">
              <GitBranchIcon className="size-3.5 text-muted-foreground shrink-0" />
              <p className="text-[12px] text-muted-foreground">
                Will{" "}
                {targetFile === "README.md" ? "overwrite" : "create"}{" "}
                <code className="font-mono bg-muted px-1 py-0.5 rounded text-[11px]">
                  {targetFile}
                </code>{" "}
                on branch{" "}
                <code className="font-mono bg-muted px-1 py-0.5 rounded text-[11px]">
                  docs/stackcraft-…
                </code>{" "}
                and open a PR.
              </p>
            </div>

            <Tabs
              value={previewTab}
              onValueChange={(v) => setPreviewTab(v as "rendered" | "markdown")}
              className="flex-1 flex flex-col min-h-0"
            >
              <TabsList className="h-7 bg-muted/40 border border-border/60 p-0.5 gap-0.5 shrink-0 w-fit">
                <TabsTrigger
                  value="rendered"
                  className="h-6 text-[11px] px-3 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-sm"
                >
                  <EyeIcon className="size-3 mr-1.5" />
                  Rendered
                </TabsTrigger>
                <TabsTrigger
                  value="markdown"
                  className="h-6 text-[11px] px-3 data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-sm"
                >
                  <FileTextIcon className="size-3 mr-1.5" />
                  Markdown
                </TabsTrigger>
              </TabsList>

              <TabsContent
                value="rendered"
                className="flex-1 min-h-0 overflow-y-auto mt-2 rounded-lg border border-border/60 bg-background p-4"
              >
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
                </div>
              </TabsContent>

              <TabsContent value="markdown" className="flex-1 min-h-0 overflow-y-auto mt-2">
                <pre className="rounded-lg border border-border/60 bg-muted/40 p-4 text-[12px] font-mono whitespace-pre-wrap break-words leading-relaxed h-full overflow-y-auto">
                  {markdown}
                </pre>
              </TabsContent>
            </Tabs>

            {pushError && (
              <div className="space-y-1.5 shrink-0">
                <p className="text-xs text-destructive">{pushError}</p>
                {branchUrl && (
                  <a
                    href={branchUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-primary hover:underline"
                  >
                    <ExternalLinkIcon className="size-3" />
                    Open branch on GitHub to create PR manually
                  </a>
                )}
              </div>
            )}

            <div className="flex gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setStep("configure")}
                className="gap-1"
              >
                <ChevronLeftIcon className="size-3.5" />
                Back
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                className="flex-1"
              >
                {copied ? (
                  <><CheckIcon className="size-3.5 mr-1.5 text-green-500" />Copied</>
                ) : (
                  "Copy Markdown"
                )}
              </Button>
              <Button size="sm" className="flex-1" onClick={handlePush}>
                <FaGithub className="size-3.5 mr-1.5" />
                Push to GitHub
              </Button>
            </div>
          </>
        )}

        {/* ── Step: pushing ── */}
        {step === "pushing" && (
          <div className="flex flex-col items-center gap-3 py-10">
            <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Creating branch and opening PR...</p>
          </div>
        )}

        {/* ── Step: done ── */}
        {step === "done" && prUrl && (
          <div className="flex flex-col items-center gap-4 py-8">
            <div className="size-12 rounded-full bg-green-500/10 flex items-center justify-center">
              <CheckIcon className="size-6 text-green-500" />
            </div>
            <div className="text-center space-y-1">
              <p className="font-medium">Pull request created!</p>
              <p className="text-sm text-muted-foreground">
                Your documentation has been pushed to a new branch.
              </p>
            </div>
            <a
              href={prUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors text-sm font-medium"
            >
              <ExternalLinkIcon className="size-4" />
              View pull request
            </a>
            <Button variant="outline" size="sm" onClick={handleClose}>Close</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
