import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { title, body: entryBody } = body;

  const entry = await prisma.contentEntry.update({
    where: { id },
    data: {
      ...(title !== undefined && { title: title || null }),
      ...(entryBody !== undefined && { body: entryBody }),
    },
    include: { platforms: true },
  });

  return NextResponse.json(entry);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  await prisma.contentEntry.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
