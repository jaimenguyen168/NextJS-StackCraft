import { verifyWebhook } from "@clerk/nextjs/webhooks";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { CLERK_PLAN_SLUGS } from "@/features/usage/constants/plans";

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

      // Create subscription record for new users
      if (eventType === "user.created") {
        await prisma.userSubscription.upsert({
          where: { userId: id },
          create: { userId: id },
          update: {},
        });
      }
    }

    if (eventType === "user.deleted") {
      const { id } = evt.data;
      if (id) await prisma.user.deleteMany({ where: { id } });
    }

    // ── Billing events ────────────────────────────────────────────────────
    if (
      eventType === "subscription.created" ||
      eventType === "subscription.updated" ||
      eventType === "subscription.active"
    ) {
      const data = evt.data as unknown as {
        status: string;
        payer: { user_id: string };
        items: Array<{
          status: string;
          plan: { slug: string };
        }>;
      };

      const userId = data.payer?.user_id;
      if (!userId) return new Response("OK", { status: 200 });

      // Find the active item — there can be multiple items (history of plan changes)
      const activeItem = data.items?.find((item) => item.status === "active");
      const plan = activeItem
        ? (CLERK_PLAN_SLUGS[activeItem.plan.slug] ?? "FREE")
        : "FREE";

      await prisma.userSubscription.upsert({
        where: { userId },
        create: { userId, plan },
        update: { plan },
      });

      console.log(`Updated plan for ${userId} → ${plan}`);
    }

    if (eventType === "subscription.pastDue") {
      const data = evt.data as unknown as {
        payer: { user_id: string };
      };
      const userId = data.payer?.user_id;
      if (userId) {
        await prisma.userSubscription.update({
          where: { userId },
          data: { plan: "FREE" },
        });
      }
    }

    return new Response("OK", { status: 200 });
  } catch (err) {
    console.error("Webhook error:", err);
    return new Response("OK", { status: 200 });
  }
}
