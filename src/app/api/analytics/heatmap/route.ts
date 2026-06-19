import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const days = parseInt(searchParams.get("days") || "90");

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const startDateStr = startDate.toISOString().split("T")[0];

  const scheduledPosts = await prisma.scheduledPost.findMany({
    where: {
      scheduled_date: {
        gte: startDateStr,
      },
    },
    include: {
      platform_content: true,
    },
  });

  const publishedPosts = await prisma.platformContent.findMany({
    where: {
      status: "published",
      published_at: {
        gte: startDate,
      },
    },
  });

  const heatmapData: Record<string, { scheduled: number; published: number }> =
    {};

  scheduledPosts.forEach((post) => {
    const date = post.scheduled_date;
    if (!heatmapData[date]) {
      heatmapData[date] = { scheduled: 0, published: 0 };
    }
    heatmapData[date].scheduled++;
  });

  publishedPosts.forEach((post) => {
    if (post.published_at) {
      const date = post.published_at.toISOString().split("T")[0];
      if (!heatmapData[date]) {
        heatmapData[date] = { scheduled: 0, published: 0 };
      }
      heatmapData[date].published++;
    }
  });

  const result = Object.entries(heatmapData).map(([date, counts]) => ({
    date,
    ...counts,
  }));

  return NextResponse.json({ heatmap: result });
}
