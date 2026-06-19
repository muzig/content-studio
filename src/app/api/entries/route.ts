import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { hot_topic_id, title, body: content } = body;

  if (!hot_topic_id) {
    return NextResponse.json(
      { error: "hot_topic_id is required" },
      { status: 400 }
    );
  }

  const hotTopic = await prisma.hotTopic.findUnique({
    where: { id: hot_topic_id },
  });

  if (!hotTopic) {
    return NextResponse.json(
      { error: "Hot topic not found" },
      { status: 404 }
    );
  }

  const entry = await prisma.contentEntry.create({
    data: {
      hot_topic_id,
      title: title || null,
      body: content || "",
    },
    include: {
      hot_topic: true,
      platforms: true,
    },
  });

  return NextResponse.json({ entry }, { status: 201 });
}
