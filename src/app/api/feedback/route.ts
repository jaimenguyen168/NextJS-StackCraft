import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { env } from "@/lib/env";

const REPO = "jaimenguyen168/NextJS-StackCraft";

const LABEL_MAP: Record<string, string> = {
  bug: "bug",
  feature: "enhancement",
  general: "feedback",
};

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await currentUser();
    const { type, title, description } = await request.json() as {
      type: "bug" | "feature" | "general";
      title: string;
      description: string;
    };

    if (!title?.trim() || !description?.trim()) {
      return NextResponse.json({ error: "Title and description are required" }, { status: 400 });
    }

    const label = LABEL_MAP[type] ?? "feedback";
    const userName = user?.fullName ?? user?.username ?? user?.primaryEmailAddress?.emailAddress ?? "Anonymous";

    const issueBody = [
      `**Submitted by:** ${userName}`,
      `**Type:** ${type}`,
      "",
      "---",
      "",
      description.trim(),
    ].join("\n");

    const res = await fetch(`https://api.github.com/repos/${REPO}/issues`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.GITHUB_FEEDBACK_TOKEN}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      body: JSON.stringify({
        title: title.trim(),
        body: issueBody,
        labels: [label],
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error("GitHub issue error:", err);
      return NextResponse.json({ error: "Failed to create issue" }, { status: 500 });
    }

    const issue = await res.json();
    return NextResponse.json({ url: issue.html_url });
  } catch (error) {
    console.error("Feedback error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
