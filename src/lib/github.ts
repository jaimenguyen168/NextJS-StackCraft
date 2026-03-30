const GITHUB_API = "https://api.github.com";

const headers = {
  Accept: "application/vnd.github.v3+json",
  ...(process.env.GITHUB_TOKEN
    ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` }
    : {}),
};

// ─── Types ────────────────────────────────────────────────────────────────────

export type GitHubRepoData = {
  name: string;
  description: string | null;
  language: string | null;
  topics: string[];
  stars: number;
  defaultBranch: string | null;
  latestCommitSha: string | null;
  latestCommitMessage: string | null;
  packageJson: Record<string, unknown> | null;
  readme: string | null;
  prismaSchema: string | null;
  envExample: string | null;
  dockerCompose: string | null;
  openApiSpec: string | null;
  fileTree: string[];
  routeFiles: { path: string; content: string }[];
  sourceFiles: { path: string; content: string }[];
  configFiles: { path: string; content: string }[];
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, { headers });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

async function fetchRaw(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: { ...headers, Accept: "application/vnd.github.v3.raw" },
    });
    if (!res.ok) return null;
    return res.text();
  } catch {
    return null;
  }
}

async function fetchFile(
  owner: string,
  repo: string,
  path: string,
): Promise<string | null> {
  return fetchRaw(`${GITHUB_API}/repos/${owner}/${repo}/contents/${path}`);
}

// ─── File tree ────────────────────────────────────────────────────────────────

type TreeItem = { path: string; type: string };
type TreeResponse = { tree: TreeItem[] };

async function fetchFileTree(owner: string, repo: string): Promise<string[]> {
  const data = await fetchJson<TreeResponse>(
    `${GITHUB_API}/repos/${owner}/${repo}/git/trees/HEAD?recursive=1`,
  );
  if (!data) return [];
  return data.tree
    .filter((item) => item.type === "blob")
    .map((item) => item.path);
}

// ─── Framework detection ──────────────────────────────────────────────────────

type Framework =
  | "nextjs"
  | "react"
  | "vue"
  | "nuxt"
  | "express"
  | "fastapi"
  | "django"
  | "rails"
  | "laravel"
  | "spring"
  | "flutter"
  | "unknown";

function detectFramework(
  tree: string[],
  packageJson: Record<string, unknown> | null,
  language: string | null,
): Framework {
  const deps = {
    ...((packageJson?.dependencies as Record<string, unknown>) ?? {}),
    ...((packageJson?.devDependencies as Record<string, unknown>) ?? {}),
  };

  if (deps["next"]) return "nextjs";
  if (deps["nuxt"] || deps["nuxt3"]) return "nuxt";
  if (deps["react"]) return "react";
  if (deps["vue"]) return "vue";
  if (deps["express"] || deps["fastify"] || deps["hono"]) return "express";

  const lang = language?.toLowerCase();
  if (lang === "python") {
    if (tree.some((p) => p.includes("manage.py"))) return "django";
    return "fastapi";
  }
  if (lang === "ruby") return "rails";
  if (lang === "php") return "laravel";
  if (lang === "java" || lang === "kotlin") return "spring";
  if (lang === "dart") return "flutter";

  return "unknown";
}

// ─── Source file patterns by framework ───────────────────────────────────────

const SOURCE_PATTERNS: Record<Framework, RegExp[]> = {
  nextjs: [
    /^src\/app\/(page|layout|loading|error)\.(tsx|ts|jsx|js)$/,
    /^src\/app\/[^/]+\/(page|layout)\.(tsx|ts|jsx|js)$/,
    /^src\/components\/[^/]+\.(tsx|ts|jsx|js)$/,
    /^src\/lib\/[^/]+\.(ts|js)$/,
    /^src\/hooks\/[^/]+\.(ts|tsx)$/,
    /^src\/middleware\.(ts|js)$/,
    /^middleware\.(ts|js)$/,
    /^next\.config\.(ts|js|mjs)$/,
  ],
  react: [
    /^src\/(App|main|index)\.(tsx|ts|jsx|js)$/,
    /^src\/components\/[^/]+\.(tsx|jsx)$/,
    /^src\/pages\/[^/]+\.(tsx|jsx)$/,
    /^src\/hooks\/[^/]+\.(ts|tsx)$/,
    /^src\/services\/[^/]+\.(ts|js)$/,
    /^vite\.config\.(ts|js)$/,
  ],
  vue: [
    /^src\/(App|main)\.(vue|ts|js)$/,
    /^src\/components\/[^/]+\.vue$/,
    /^src\/views\/[^/]+\.vue$/,
    /^src\/router\/(index|routes)\.(ts|js)$/,
    /^src\/store\/[^/]+\.(ts|js)$/,
    /^vite\.config\.(ts|js)$/,
  ],
  nuxt: [
    /^pages\/[^/]+\.vue$/,
    /^components\/[^/]+\.vue$/,
    /^composables\/[^/]+\.(ts|js)$/,
    /^server\/api\/[^/]+\.(ts|js)$/,
    /^nuxt\.config\.(ts|js)$/,
  ],
  express: [
    /^(src\/)?(index|app|server|main)\.(ts|js)$/,
    /^src\/routes\/[^/]+\.(ts|js)$/,
    /^src\/controllers\/[^/]+\.(ts|js)$/,
    /^src\/models\/[^/]+\.(ts|js)$/,
    /^src\/middleware\/[^/]+\.(ts|js)$/,
    /^src\/services\/[^/]+\.(ts|js)$/,
  ],
  fastapi: [
    /^(app\/)?(main|app)\.(py)$/,
    /^app\/routers\/[^/]+\.py$/,
    /^app\/models\/[^/]+\.py$/,
    /^app\/schemas\/[^/]+\.py$/,
    /^requirements\.txt$/,
    /^pyproject\.toml$/,
  ],
  django: [
    /^[^/]+\/models\.py$/,
    /^[^/]+\/views\.py$/,
    /^[^/]+\/urls\.py$/,
    /^[^/]+\/serializers\.py$/,
    /^[^/]+\/settings\.py$/,
    /^requirements\.txt$/,
  ],
  rails: [
    /^app\/models\/[^/]+\.rb$/,
    /^app\/controllers\/[^/]+\.rb$/,
    /^config\/routes\.rb$/,
    /^Gemfile$/,
  ],
  laravel: [
    /^app\/Models\/[^/]+\.php$/,
    /^app\/Http\/Controllers\/[^/]+\.php$/,
    /^routes\/(web|api)\.php$/,
    /^composer\.json$/,
  ],
  spring: [
    /^src\/main\/java\/.*\/(controller|service|repository|model)\/[^/]+\.java$/,
    /^src\/main\/resources\/application\.(properties|yml)$/,
    /^pom\.xml$/,
    /^build\.gradle$/,
  ],
  flutter: [
    /^lib\/main\.dart$/,
    /^lib\/screens\/[^/]+\.dart$/,
    /^lib\/widgets\/[^/]+\.dart$/,
    /^lib\/models\/[^/]+\.dart$/,
    /^lib\/services\/[^/]+\.dart$/,
    /^pubspec\.yaml$/,
  ],
  unknown: [
    /^(src\/)?(main|index|app)\.(ts|js|py|rb|go|rs|java|kt|swift|dart)$/,
    /^src\/[^/]+\.(ts|js|py)$/,
  ],
};

const CONFIG_PATTERNS: RegExp[] = [
  /^(tsconfig|jsconfig)\.json$/,
  /^tailwind\.config\.(ts|js)$/,
  /^vite\.config\.(ts|js)$/,
  /^next\.config\.(ts|js|mjs)$/,
  /^requirements\.txt$/,
  /^pyproject\.toml$/,
  /^Gemfile$/,
  /^composer\.json$/,
  /^pom\.xml$/,
  /^pubspec\.yaml$/,
  /^Cargo\.toml$/,
  /^go\.mod$/,
];

const ROUTE_PATTERNS: RegExp[] = [
  /^src\/app\/api\/.*\/route\.(ts|js)$/,
  /^src\/trpc\/routers\/.*\.(ts|js)$/,
  /^routes\/.*\.(ts|js|py|rb|php)$/,
  /^controllers\/.*\.(ts|js|py|rb|php)$/,
  /^api\/.*\.(ts|js)$/,
  /^app\/routers\/.*\.py$/,
  /^app\/Http\/Controllers\/.*\.php$/,
  /^server\/api\/.*\.(ts|js)$/,
];

const MAX_CHARS = 1500;
const MAX_SOURCE_FILES = 8;
const MAX_ROUTE_FILES = 6;
const MAX_CONFIG_FILES = 3;

async function fetchMatchingFiles(
  owner: string,
  repo: string,
  tree: string[],
  patterns: RegExp[],
  limit: number,
): Promise<{ path: string; content: string }[]> {
  const matches = tree
    .filter((path) => patterns.some((p) => p.test(path)))
    .slice(0, limit);

  const results = await Promise.all(
    matches.map(async (path) => {
      const content = await fetchFile(owner, repo, path);
      return content ? { path, content: content.slice(0, MAX_CHARS) } : null;
    }),
  );

  return results.filter(Boolean) as { path: string; content: string }[];
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function parseGitHubUrl(
  url: string,
): { owner: string; repo: string } | null {
  try {
    const cleaned = url.replace(/\.git$/, "").replace(/\/$/, "");
    const match = cleaned.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (!match) return null;
    return { owner: match[1], repo: match[2] };
  } catch {
    return null;
  }
}

export async function fetchGitHubRepo(
  owner: string,
  repo: string,
): Promise<GitHubRepoData> {
  type RepoMeta = {
    name: string;
    description: string | null;
    language: string | null;
    topics: string[];
    stargazers_count: number;
    default_branch: string;
  };

  type CommitResponse = {
    sha: string;
    commit: { message: string };
  };

  const [meta, tree] = await Promise.all([
    fetchJson<RepoMeta>(`${GITHUB_API}/repos/${owner}/${repo}`),
    fetchFileTree(owner, repo),
  ]);

  const defaultBranch = meta?.default_branch ?? "main";

  // Fetch latest commit info
  const latestCommit = await fetchJson<CommitResponse>(
    `${GITHUB_API}/repos/${owner}/${repo}/commits/${defaultBranch}`,
  );

  // README
  const readmePaths = [
    "README.md",
    "readme.md",
    "README.mdx",
    "docs/README.md",
  ];
  let readme: string | null = null;
  for (const path of readmePaths) {
    if (tree.includes(path)) {
      readme = await fetchFile(owner, repo, path);
      if (readme) break;
    }
  }

  // OpenAPI spec
  const openApiPaths = [
    "openapi.json",
    "openapi.yaml",
    "openapi.yml",
    "swagger.json",
    "swagger.yaml",
    "docs/openapi.json",
    "api/openapi.json",
  ];
  let openApiSpec: string | null = null;
  for (const path of openApiPaths) {
    if (tree.includes(path)) {
      openApiSpec = await fetchFile(owner, repo, path);
      if (openApiSpec) break;
    }
  }

  // package.json — needed for framework detection
  const packageJsonRaw = await fetchFile(owner, repo, "package.json");
  let packageJson: Record<string, unknown> | null = null;
  if (packageJsonRaw) {
    try {
      packageJson = JSON.parse(packageJsonRaw);
    } catch {}
  }

  const framework = detectFramework(tree, packageJson, meta?.language ?? null);

  const [
    prismaSchema,
    envExample,
    dockerCompose,
    routeFiles,
    sourceFiles,
    configFiles,
  ] = await Promise.all([
    tree.includes("prisma/schema.prisma")
      ? fetchFile(owner, repo, "prisma/schema.prisma")
      : Promise.resolve(null),
    (() => {
      const p = tree.find((f) => f === ".env.example" || f === ".env.sample");
      return p ? fetchFile(owner, repo, p) : Promise.resolve(null);
    })(),
    (() => {
      const p = tree.find(
        (f) => f === "docker-compose.yml" || f === "docker-compose.yaml",
      );
      return p ? fetchFile(owner, repo, p) : Promise.resolve(null);
    })(),
    fetchMatchingFiles(owner, repo, tree, ROUTE_PATTERNS, MAX_ROUTE_FILES),
    fetchMatchingFiles(
      owner,
      repo,
      tree,
      SOURCE_PATTERNS[framework] ?? SOURCE_PATTERNS.unknown,
      MAX_SOURCE_FILES,
    ),
    fetchMatchingFiles(owner, repo, tree, CONFIG_PATTERNS, MAX_CONFIG_FILES),
  ]);

  return {
    name: meta?.name ?? repo,
    description: meta?.description ?? null,
    language: meta?.language ?? null,
    topics: meta?.topics ?? [],
    stars: meta?.stargazers_count ?? 0,
    defaultBranch,
    latestCommitSha: latestCommit?.sha ?? null,
    latestCommitMessage: latestCommit?.commit.message.split("\n")[0] ?? null,
    packageJson,
    readme: readme ? readme.slice(0, 2000) : null,
    prismaSchema,
    envExample,
    dockerCompose,
    openApiSpec,
    fileTree: tree.slice(0, 150),
    routeFiles,
    sourceFiles,
    configFiles,
  };
}
