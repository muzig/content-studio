import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get("start");
  const endDate = searchParams.get("end");

  const where: Record<string, unknown> = {};

  if (startDate && endDate) {
    where.scheduled_date = {
      gte: startDate,
      lte: endDate,
    };
  } else if (startDate) {
    where.scheduled_date = { gte: startDate };
  } else if (endDate) {
    where.scheduled_date = { lte: endDate };
  }

  const scheduledPosts = await prisma.scheduledPost.findMany({
    where,
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
    orderBy: [{ scheduled_date: "asc" }, { position: "asc" }],
  });

  return NextResponse.json({ scheduledPosts });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { platform_content_id, scheduled_date, scheduled_time } = body;

  if (!platform_content_id || !scheduled_date) {
    return NextResponse.json(
      { error: "platform_content_id and scheduled_date are required" },
      { status: 400 }
    );
  }

  const platformContent = await prisma.platformContent.findUnique({
    where: { id: platform_content_id },
  });

  if (!platformContent) {
    return NextResponse.json(
      { error: "Platform content not found" },
      { status: 404 }
    );
  }

  const existingCount = await prisma.scheduledPost.count({
    where: { scheduled_date },
  });

  const scheduledPost = await prisma.scheduledPost.create({
    data: {
      platform_content_id,
      scheduled_date,
      scheduled_time: scheduled_time || null,
      position: existingCount,
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

  return NextResponse.json({ scheduledPost }, { status: 201 });
}
