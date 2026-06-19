import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const days = parseInt(searchParams.get("days") || "30");

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const publishedPosts = await prisma.platformContent.findMany({
    where: {
      status: "published",
      published_at: {
        gte: startDate,
      },
    },
  });

  const platformTrends: Record<string, Record<string, number>> = {};

  publishedPosts.forEach((post) => {
    if (!post.published_at) return;

    const date = post.published_at.toISOString().split("T")[0];
    const platform = post.platform;

    if (!platformTrends[platform]) {
      platformTrends[platform] = {};
    }

    platformTrends[platform][date] =
      (platformTrends[platform][date] || 0) + 1;
  });

  const trendData = Object.entries(platformTrends).map(
    ([platform, dates]) => ({
      platform,
      data: Object.entries(dates)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date)),
    })
  );

  return NextResponse.json({ trends: trendData });
}
