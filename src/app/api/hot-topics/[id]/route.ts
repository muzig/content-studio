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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const hotTopic = await prisma.hotTopic.findUnique({
    where: { id },
  });

  if (!hotTopic) {
    return NextResponse.json({ error: "Hot topic not found" }, { status: 404 });
  }

  const updated = await prisma.hotTopic.update({
    where: { id },
    data: {
      ...(body.title !== undefined && { title: body.title }),
      ...(body.content !== undefined && { content: body.content }),
      ...(body.url !== undefined && { url: body.url || null }),
      ...(body.tags !== undefined && {
        tags: body.tags ? JSON.stringify(body.tags) : null,
      }),
    },
  });

  return NextResponse.json({ hotTopic: updated });
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
