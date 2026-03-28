import { verifyWebhook } from "@clerk/nextjs/webhooks";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const evt = await verifyWebhook(req);
    const eventType = evt.type;

    if (eventType === "user.created" || eventType === "user.updated") {
      const {
        id,
        email_addresses,
        first_name,
        last_name,
        username,
        image_url,
      } = evt.data;

      const email = email_addresses?.[0]?.email_address ?? "";
      const baseUsername =
        username ??
        email
          .split("@")[0]
          .toLowerCase()
          .replace(/[^a-z0-9-]/g, "-");

      // Handle username collisions
      let generatedUsername = baseUsername;
      let attempt = 1;
      while (true) {
        const existing = await prisma.user.findUnique({
          where: { username: generatedUsername },
        });
        if (!existing || existing.id === id) break;
        generatedUsername = `${baseUsername}-${attempt++}`;
      }

      await prisma.user.upsert({
        where: { id },
        update: {
          name: `${first_name ?? ""} ${last_name ?? ""}`.trim() || null,
          email,
          imageUrl: image_url ?? null,
          username: generatedUsername,
        },
        create: {
          id,
          username: generatedUsername,
          name: `${first_name ?? ""} ${last_name ?? ""}`.trim() || null,
          email,
          imageUrl: image_url ?? null,
        },
      });
    }

    if (eventType === "user.deleted") {
      const { id } = evt.data;
      if (id) await prisma.user.deleteMany({ where: { id } });
    }

    return new Response("OK", { status: 200 });
  } catch (err) {
    console.error("Webhook error:", err);
    // Still return 200 so Clerk doesn't retry — log the error for debugging
    return new Response("OK", { status: 200 });
  }
}
