import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ platform: string }> }
) {
  const { platform } = await params;
  const body = await request.json();
  const { style, structure, constraints } = body;

  const rule = await prisma.platformRule.findUnique({
    where: { platform },
  });

  if (!rule) {
    return NextResponse.json(
      { error: "Platform rule not found" },
      { status: 404 }
    );
  }

  const updated = await prisma.platformRule.update({
    where: { platform },
    data: {
      ...(style !== undefined && { style }),
      ...(structure !== undefined && { structure }),
      ...(constraints !== undefined && { constraints }),
      is_preset: false,
    },
  });

  return NextResponse.json({ rule: updated });
}
