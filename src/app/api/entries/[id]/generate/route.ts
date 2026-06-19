import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { formatForPlatform } from "@/lib/templates";
import type { Platform } from "@/lib/types";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { platforms } = (await request.json()) as { platforms: Platform[] };

  if (!platforms || !Array.isArray(platforms) || platforms.length === 0) {
    return NextResponse.json(
      { error: "platforms array is required" },
      { status: 400 }
    );
  }

  const entry = await prisma.contentEntry.findUnique({ where: { id } });
  if (!entry) {
    return NextResponse.json({ error: "Entry not found" }, { status: 404 });
  }

  const results = await Promise.all(
    platforms.map(async (platform) => {
      const formatted = formatForPlatform(platform, entry.body);

      const record = await prisma.platformPublish.upsert({
        where: {
          content_entry_id_platform: {
            content_entry_id: id,
            platform,
          },
        },
        update: { formatted, status: "draft" },
        create: {
          content_entry_id: id,
          platform,
          formatted,
          status: "draft",
        },
      });

      return {
        id: record.id,
        platform: record.platform,
        formatted: record.formatted,
        status: record.status,
      };
    })
  );

  return NextResponse.json({ platforms: results });
}
