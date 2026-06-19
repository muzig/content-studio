import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  const tag = searchParams.get("tag") || "";

  const where: Record<string, unknown> = {};

  if (search) {
    where.OR = [
      { title: { contains: search } },
      { content: { contains: search } },
    ];
  }

  if (tag) {
    where.tags = { contains: tag };
  }

  const hotTopics = await prisma.hotTopic.findMany({
    where,
    orderBy: { created_at: "desc" },
    include: {
      _count: {
        select: { entries: true },
      },
    },
  });

  return NextResponse.json({ hotTopics });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { title, content, url, tags } = body;

  if (!title) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  const hotTopic = await prisma.hotTopic.create({
    data: {
      title,
      content: content || "",
      url: url || null,
      tags: tags ? JSON.stringify(tags) : null,
    },
  });

  return NextResponse.json({ hotTopic }, { status: 201 });
}
