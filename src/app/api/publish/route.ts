import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const platform = searchParams.get("platform");

  const where: Record<string, string> = {};
  if (status) where.status = status;
  if (platform) where.platform = platform;

  const items = await prisma.platformContent.findMany({
    where,
    include: {
      content_entry: {
        include: {
          hot_topic: true,
        },
      },
      scheduled_post: true,
    },
    orderBy: { updated_at: "desc" },
  });

  return NextResponse.json({ items });
}
