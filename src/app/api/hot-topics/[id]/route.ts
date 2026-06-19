import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const hotTopic = await prisma.hotTopic.findUnique({
    where: { id },
    include: {
      entries: {
        include: {
          platforms: true,
        },
        orderBy: { created_at: "desc" },
      },
    },
  });

  if (!hotTopic) {
    return NextResponse.json({ error: "Hot topic not found" }, { status: 404 });
  }

  return NextResponse.json({ hotTopic });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const hotTopic = await prisma.hotTopic.findUnique({
    where: { id },
  });

  if (!hotTopic) {
    return NextResponse.json({ error: "Hot topic not found" }, { status: 404 });
  }

  await prisma.hotTopic.delete({
    where: { id },
  });

  return NextResponse.json({ success: true });
}
