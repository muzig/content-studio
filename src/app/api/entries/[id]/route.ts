import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const entry = await prisma.contentEntry.findUnique({
    where: { id },
    include: {
      hot_topic: true,
      platforms: true,
    },
  });

  if (!entry) {
    return NextResponse.json({ error: "Entry not found" }, { status: 404 });
  }

  return NextResponse.json({ entry });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { title, body: entryBody } = body;

  const entry = await prisma.contentEntry.findUnique({
    where: { id },
  });

  if (!entry) {
    return NextResponse.json({ error: "Entry not found" }, { status: 404 });
  }

  const updated = await prisma.contentEntry.update({
    where: { id },
    data: {
      ...(title !== undefined && { title: title || null }),
      ...(entryBody !== undefined && { body: entryBody }),
    },
    include: {
      hot_topic: true,
      platforms: true,
    },
  });

  return NextResponse.json({ entry: updated });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const entry = await prisma.contentEntry.findUnique({
    where: { id },
  });

  if (!entry) {
    return NextResponse.json({ error: "Entry not found" }, { status: 404 });
  }

  await prisma.contentEntry.delete({
    where: { id },
  });

  return NextResponse.json({ success: true });
}
