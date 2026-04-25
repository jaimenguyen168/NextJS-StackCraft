import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { createOpenAI } from "@ai-sdk/openai";
import { experimental_generateImage as generateImage } from "ai";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { decrypt } from "@/lib/encryption";
import { deleteImage } from "@/lib/r2";

export type LogoStyle = "flat" | "glassy" | "3d" | "gradient" | "neon" | "illustrated";

const STYLE_PROMPTS: Record<LogoStyle, string> = {
  flat: "Flat vector style, bold solid-color geometric shapes, clean and modern.",
  glassy: "Glassmorphism style, frosted glass surfaces, subtle inner glow, soft light refractions, translucent layers.",
  "3d": "3D rendered icon, volumetric shapes, soft ambient occlusion, gentle depth and highlights, modern app icon feel.",
  gradient: "Smooth vibrant gradient colors flowing through bold shapes, fluid and dynamic.",
  neon: "Neon glow effect, vivid electrified outlines with soft bloom, cyberpunk energy.",
  illustrated: "Hand-crafted illustration style, expressive linework with flat fills, playful and detailed.",
};

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId, style = "flat" } = await request.json() as {
      projectId: string;
      style?: LogoStyle;
    };

    if (!projectId) {
      return NextResponse.json({ error: "projectId is required" }, { status: 400 });
    }

    const [project, user] = await Promise.all([
      prisma.project.findFirst({
        where: { id: projectId, userId },
        select: {
          name: true,
          description: true,
          mainContent: true,
          tags: true,
          links: { select: { label: true } },
          logoUrl: true,
        },
      }),
      prisma.user.findUnique({
        where: { id: userId },
        select: { openaiApiKey: true },
      }),
    ]);

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (!user?.openaiApiKey) {
      return NextResponse.json(
        { error: "No OpenAI key saved. Add one in the AI section of settings." },
        { status: 422 },
      );
    }

    // Delete old logo from R2 if it was generated (lives under our public URL)
    if (project.logoUrl?.startsWith(env.R2_PUBLIC_URL)) {
      const oldKey = project.logoUrl.slice(env.R2_PUBLIC_URL.length + 1);
      await deleteImage(oldKey).catch(() => null); // best-effort
    }

    // Build a rich prompt from project context
    const tags = (project.tags ?? []).slice(0, 8).join(", ");
    const linkLabels = (project.links ?? []).map((l) => l.label).join(", ");
    // Truncate mainContent to avoid going over token limits
    const abstract = project.mainContent?.slice(0, 600).trim();

    const contextParts = [project.description];
    if (abstract) contextParts.push(abstract);
    if (tags) contextParts.push(`Technologies: ${tags}`);
    if (linkLabels) contextParts.push(`Features: ${linkLabels}`);
    const context = contextParts.join(". ");

    const styleGuide = STYLE_PROMPTS[style] ?? STYLE_PROMPTS.flat;

    const prompt =
      `Logo icon for a software project called "${project.name}". ` +
      `Project context: ${context}. ` +
      `Style: ${styleGuide} ` +
      "Completely transparent background. Single centered icon, no text, no letterforms, no watermarks, no frames, no borders.";

    const openai = createOpenAI({ apiKey: decrypt(user.openaiApiKey) });
    const { image } = await generateImage({
      model: openai.image("gpt-image-1"),
      prompt,
      size: "1024x1024",
      providerOptions: { openai: { background: "transparent", quality: "medium" } },
    });

    const imgBuffer = Buffer.from(image.base64, "base64");

    // Upload new logo to R2
    const s3 = new S3Client({
      region: "auto",
      endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: env.R2_ACCESS_KEY_ID,
        secretAccessKey: env.R2_SECRET_ACCESS_KEY,
      },
    });

    const key = `logos/${projectId}/${crypto.randomUUID()}.png`;
    await s3.send(
      new PutObjectCommand({
        Bucket: env.R2_BUCKET_NAME,
        Key: key,
        Body: imgBuffer,
        ContentType: "image/png",
      }),
    );

    const logoUrl = `${env.R2_PUBLIC_URL}/${key}`;
    await prisma.project.update({ where: { id: projectId }, data: { logoUrl } });

    return NextResponse.json({ url: logoUrl });
  } catch (error) {
    console.error("generate-logo error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate logo" },
      { status: 500 },
    );
  }
}
