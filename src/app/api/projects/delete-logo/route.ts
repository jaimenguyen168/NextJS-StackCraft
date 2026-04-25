import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { deleteImage } from "@/lib/r2";

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId } = await request.json() as { projectId: string };
    if (!projectId) {
      return NextResponse.json({ error: "projectId is required" }, { status: 400 });
    }

    const project = await prisma.project.findFirst({
      where: { id: projectId, userId },
      select: { logoUrl: true },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Only delete if the logo lives in our R2 bucket
    if (project.logoUrl?.startsWith(env.R2_PUBLIC_URL)) {
      const key = project.logoUrl.slice(env.R2_PUBLIC_URL.length + 1);
      await deleteImage(key).catch(() => null);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("delete-logo error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete logo" },
      { status: 500 },
    );
  }
}
