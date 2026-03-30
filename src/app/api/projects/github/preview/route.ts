import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { fetchGitHubRepo, parseGitHubUrl } from "@/lib/github";

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { githubUrl } = await request.json();
    if (!githubUrl) {
      return NextResponse.json(
        { error: "githubUrl is required" },
        { status: 400 },
      );
    }

    const parsed = parseGitHubUrl(githubUrl.trim());
    if (!parsed) {
      return NextResponse.json(
        {
          error:
            "Invalid GitHub URL. Use https://github.com/owner/repo format.",
        },
        { status: 400 },
      );
    }

    const repo = await fetchGitHubRepo(parsed.owner, parsed.repo);

    return NextResponse.json({
      name: repo.name,
      description: repo.description,
      language: repo.language,
      topics: repo.topics,
      stars: repo.stars,
      hasSchema: !!repo.prismaSchema,
      hasOpenApi: !!repo.openApiSpec,
      routeCount: repo.routeFiles.length,
    });
  } catch (error) {
    console.error("GitHub preview error:", error);
    return NextResponse.json(
      { error: "Repository not found or is private." },
      { status: 404 },
    );
  }
}
