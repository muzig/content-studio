import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { scheduled_date, scheduled_time, position } = body;

  const scheduledPost = await prisma.scheduledPost.findUnique({
    where: { id },
  });

  if (!scheduledPost) {
    return NextResponse.json(
      { error: "Scheduled post not found" },
      { status: 404 }
    );
  }

  const updated = await prisma.scheduledPost.update({
    where: { id },
    data: {
      ...(scheduled_date !== undefined && { scheduled_date }),
      ...(scheduled_time !== undefined && { scheduled_time }),
      ...(position !== undefined && { position }),
    },
    include: {
      platform_content: {
        include: {
          content_entry: {
            include: {
              hot_topic: true,
            },
          },
        },
      },
    },
  });

  return NextResponse.json({ scheduledPost: updated });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const scheduledPost = await prisma.scheduledPost.findUnique({
    where: { id },
  });

  if (!scheduledPost) {
    return NextResponse.json(
      { error: "Scheduled post not found" },
      { status: 404 }
    );
  }

  await prisma.scheduledPost.delete({
    where: { id },
  });

  return NextResponse.json({ success: true });
}
