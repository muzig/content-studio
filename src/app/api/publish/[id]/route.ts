import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { status, formatted } = body;

  const validStatuses = ["draft", "ready", "published"];
  if (status && !validStatuses.includes(status)) {
    return NextResponse.json(
      { error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` },
      { status: 400 }
    );
  }

  const record = await prisma.platformContent.update({
    where: { id },
    data: {
      ...(status && { status }),
      ...(formatted !== undefined && { formatted }),
      ...(status === "published" && { published_at: new Date() }),
    },
  });

  return NextResponse.json(record);
}
