import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const todoId = params.id;
  if (!todoId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  try {
    const todo = await prisma.todo.findUnique({
      where: {
        id: todoId,
      },
    });
    if (todo?.userId !== userId) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }
    await prisma.todo.delete({
      where: {
        id: todoId,
      },
    });
    return NextResponse.json({ message: "Todo deleted successfully" });
  } catch (error) {
    console.error("Failed to delete todo", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}
