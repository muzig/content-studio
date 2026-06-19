import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateForAllPlatforms } from "@/lib/ai";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const entry = await prisma.contentEntry.findUnique({
    where: { id },
    include: { hot_topic: true },
  });

  if (!entry) {
    return NextResponse.json({ error: "Entry not found" }, { status: 404 });
  }

  const hotTopicContent = entry.hot_topic
    ? `${entry.hot_topic.title}\n${entry.hot_topic.content}`
    : entry.title || "";

  if (!hotTopicContent && !entry.body) {
    return NextResponse.json(
      { error: "No content to generate from" },
      { status: 400 }
    );
  }

  const platformRules = await prisma.platformRule.findMany();

  if (platformRules.length === 0) {
    return NextResponse.json(
      { error: "No platform rules configured" },
      { status: 400 }
    );
  }

  const results = await generateForAllPlatforms(
    hotTopicContent,
    entry.body,
    platformRules
  );

  const platformContents = await Promise.all(
    Object.entries(results).map(async ([platform, formatted]) => {
      const rule = platformRules.find((r) => r.platform === platform);

      const record = await prisma.platformContent.upsert({
        where: {
          content_entry_id_platform: {
            content_entry_id: id,
            platform,
          },
        },
        update: {
          formatted,
          style_rules_snapshot: rule ? JSON.stringify(rule) : null,
          status: "draft",
        },
        create: {
          content_entry_id: id,
          platform,
          formatted,
          style_rules_snapshot: rule ? JSON.stringify(rule) : null,
          status: "draft",
        },
      });

      return record;
    })
  );

  return NextResponse.json({ platforms: platformContents });
}
