import { auth } from "@clerk/nextjs/server";
import { getPresignedImageUploadUrl, getPublicImageUrl } from "@/lib/r2";
import { NextResponse } from "next/server";

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
];

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { filename, contentType } = await req.json();

    if (!filename || !contentType)
      return NextResponse.json(
        { error: "filename and contentType are required" },
        { status: 400 },
      );

    if (!ALLOWED_TYPES.includes(contentType))
      return NextResponse.json(
        { error: "Only image files are allowed" },
        { status: 400 },
      );

    const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
    const key = `projects/${userId}/${Date.now()}-${safeName}`;

    const uploadUrl = await getPresignedImageUploadUrl(key, contentType);
    const publicUrl = getPublicImageUrl(key);

    return NextResponse.json({ uploadUrl, publicUrl });
  } catch (error) {
    console.error("Image upload error:", error);
    return NextResponse.json(
      { error: "Failed to generate upload URL" },
      { status: 500 },
    );
  }
}
