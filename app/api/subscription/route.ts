import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export async function POST() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  //Capture Payment (with Stripe later )
  try {
    await prisma.user.findUniqueOrThrow({
      where: { id: userId },
    });
    const subscriptionEnds = new Date();
    subscriptionEnds.setMonth(subscriptionEnds.getMonth() + 1); //1 month subscription
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        isSubscribed: true,
        subscriptionEndsAt: subscriptionEnds,
      },
    });
    return NextResponse.json(
      { message: "Subscription successful", user: updatedUser },
      { status: 200 },
    );
  } catch (error) {
    console.error("Subscription error:", error);
    return NextResponse.json(
      { error: "Payment processing failed" },
      { status: 500 },
    );
  }
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isSubscribed: true, subscriptionEndsAt: true },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    const now = new Date();
    if (user.subscriptionEndsAt && user.subscriptionEndsAt < now) {
      // Update subscription status if expired
      await prisma.user.update({
        where: { id: userId },
        data: {
          isSubscribed: false,
          subscriptionEndsAt: null,
        },
      });
      return NextResponse.json(
        { isSubscribed: false, subscriptionEndsAt: user.subscriptionEndsAt },
        { status: 200 },
      );
    }
    return NextResponse.json(
      {
        isSubscribed: user.isSubscribed,
        subscriptionEndsAt: user.subscriptionEndsAt,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Fetch subscription error:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscription status" },
      { status: 500 },
    );
  }
}
