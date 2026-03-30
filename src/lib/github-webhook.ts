const GITHUB_API = "https://api.github.com";

const githubHeaders = {
  Accept: "application/vnd.github.v3+json",
  "Content-Type": "application/json",
  ...(process.env.GITHUB_TOKEN
    ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` }
    : {}),
};

// ─── Register a webhook on a repo ────────────────────────────────────────────

export async function registerGitHubWebhook(
  owner: string,
  repo: string,
): Promise<void> {
  const appUrl = process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL;
  const secret = process.env.GITHUB_WEBHOOK_SECRET;

  if (!appUrl || !secret || !process.env.GITHUB_TOKEN) {
    console.warn(
      "Webhook registration skipped: missing APP_URL, GITHUB_WEBHOOK_SECRET, or GITHUB_TOKEN",
    );
    return;
  }

  const webhookUrl = `${appUrl}/api/webhooks/github`;

  // Check if webhook already exists to avoid duplicates
  const existing = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/hooks`, {
    headers: githubHeaders,
  });

  if (existing.ok) {
    const hooks = await existing.json();
    const alreadyRegistered = hooks.some(
      (h: { config?: { url?: string } }) => h.config?.url === webhookUrl,
    );
    if (alreadyRegistered) {
      console.log(`Webhook already registered for ${owner}/${repo}`);
      return;
    }
  }

  const res = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/hooks`, {
    method: "POST",
    headers: githubHeaders,
    body: JSON.stringify({
      name: "web",
      active: true,
      events: ["push", "pull_request"],
      config: {
        url: webhookUrl,
        content_type: "json",
        secret,
        insecure_ssl: "0",
      },
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      `GitHub webhook registration failed: ${res.status} — ${JSON.stringify(err)}`,
    );
  }

  console.log(`Webhook registered for ${owner}/${repo} → ${webhookUrl}`);
}

// ─── Remove a webhook from a repo ────────────────────────────────────────────

export async function removeGitHubWebhook(
  owner: string,
  repo: string,
): Promise<void> {
  const appUrl = process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl || !process.env.GITHUB_TOKEN) return;

  const webhookUrl = `${appUrl}/api/webhooks/github`;

  const existing = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/hooks`, {
    headers: githubHeaders,
  });
  if (!existing.ok) return;

  const hooks = await existing.json();
  const hook = hooks.find(
    (h: { id: number; config?: { url?: string } }) =>
      h.config?.url === webhookUrl,
  );
  if (!hook) return;

  await fetch(`${GITHUB_API}/repos/${owner}/${repo}/hooks/${hook.id}`, {
    method: "DELETE",
    headers: githubHeaders,
  });

  console.log(`Webhook removed for ${owner}/${repo}`);
}
