import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;
  if (!WEBHOOK_SECRET) {
    throw new Error("Please add WEBHOOK_SECRET to your environment variables");
  }

  const headersPayload = await headers();
  const svix_id = headersPayload.get("svix-id");
  const svix_timestamp = headersPayload.get("svix-timestamp");
  const svix_signature = headersPayload.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    console.error("Missing Svix headers");
    return new Response("Missing Svix headers", { status: 400 });
  }

  const payload = await req.json();
  const body = JSON.stringify(payload);

  let event: WebhookEvent;
  try {
    const webhook = new Webhook(WEBHOOK_SECRET);
    event = webhook.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (error) {
    console.error("Webhook verification failed:", error);
    return new Response("Invalid signature", { status: 400 });
  }

  const { id } = event.data;
  const eventType = event.type;

  console.log("Received event:", eventType, "for user ID:", id);

  if (eventType === "user.created") {
    try {
      const { email_addresses, primary_email_address_id } = event.data;
      console.log("Email addresses:", email_addresses);
      console.log("Primary email ID:", primary_email_address_id);

      const primaryEmail = email_addresses.find(
        (email) => email.id === primary_email_address_id,
      );

      if (!primaryEmail) {
        console.error("Primary email not found");
        return new Response("Primary email not found", { status: 400 });
      }

      await prisma.user.create({
        data: {
          id: event.data.id!,
          email: primaryEmail.email_address,
          isSubscribed: false,
        },
      });

      console.log("User created successfully:", event.data.id);
      return new Response("User created", { status: 201 });
    } catch (error) {
      console.error("Error creating user:", error);
      return new Response("Error creating user", { status: 500 });
    }
  }
  /* Handling test webhooks where primary email might be missing 
  if (eventType === "user.created") {
  try {
    const { email_addresses, primary_email_address_id } = event.data;
    console.log("Email addresses:", email_addresses);
    console.log("Primary email ID:", primary_email_address_id);

    const primaryEmail = email_addresses.find(
      (email) => email.id === primary_email_address_id,
    );

    if (!primaryEmail) {
      console.error("Primary email not found - this is likely a test webhook");
      return new Response("Primary email not found (test webhook)", { status: 200 }); // Return 200 for test webhooks
    }

    await prisma.user.create({
      data: {
        id: event.data.id!,
        email: primaryEmail.email_address,
        isSubscribed: false,
      },
    });

    console.log("User created successfully:", event.data.id);
    return new Response("User created", { status: 201 });
  } catch (error) {
    console.error("Error creating user:", error);
    return new Response("Error creating user", { status: 500 });
  }
}
  */

  return new Response("Webhook received successfully", { status: 200 });
}
