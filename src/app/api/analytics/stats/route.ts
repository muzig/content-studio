import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const days = parseInt(searchParams.get("days") || "30");

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const startDateStr = startDate.toISOString().split("T")[0];

  const publishedPosts = await prisma.platformContent.findMany({
    where: {
      status: "published",
      published_at: {
        gte: startDate,
      },
    },
    include: {
      scheduled_post: true,
    },
  });

  const scheduledPosts = await prisma.scheduledPost.findMany({
    where: {
      scheduled_date: {
        gte: startDateStr,
      },
    },
  });

  const totalPublished = publishedPosts.length;
  const totalScheduled = scheduledPosts.length;
  const dailyAverage = totalPublished / days;

  const platformCounts: Record<string, number> = {};
  publishedPosts.forEach((post) => {
    platformCounts[post.platform] = (platformCounts[post.platform] || 0) + 1;
  });

  const publishedDates = new Set(
    publishedPosts
      .filter((p) => p.published_at)
      .map((p) => p.published_at!.toISOString().split("T")[0])
  );

  let maxStreak = 0;
  let currentStreak = 0;
  const today = new Date();
  for (let i = 0; i < days; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];

    if (publishedDates.has(dateStr)) {
      currentStreak++;
      maxStreak = Math.max(maxStreak, currentStreak);
    } else {
      currentStreak = 0;
    }
  }

  return NextResponse.json({
    totalPublished,
    totalScheduled,
    dailyAverage: Math.round(dailyAverage * 10) / 10,
    maxStreak,
    platformCounts,
  });
}
