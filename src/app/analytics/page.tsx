"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3,
  TrendingUp,
  Calendar as CalendarIcon,
  Flame,
} from "lucide-react";

interface Stats {
  totalPublished: number;
  totalScheduled: number;
  dailyAverage: number;
  maxStreak: number;
  platformCounts: Record<string, number>;
}

interface HeatmapDay {
  date: string;
  scheduled: number;
  published: number;
}

interface TrendData {
  platform: string;
  data: { date: string; count: number }[];
}

export default function AnalyticsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [heatmap, setHeatmap] = useState<HeatmapDay[]>([]);
  const [trends, setTrends] = useState<TrendData[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("30");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, heatmapRes, trendRes] = await Promise.all([
        fetch(`/api/analytics/stats?days=${timeRange}`),
        fetch(`/api/analytics/heatmap?days=${timeRange}`),
        fetch(`/api/analytics/trend?days=${timeRange}`),
      ]);

      const statsData = await statsRes.json();
      const heatmapData = await heatmapRes.json();
      const trendData = await trendRes.json();

      setStats(statsData);
      setHeatmap(heatmapData.heatmap || []);
      setTrends(trendData.trends || []);
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function getPlatformLabel(platform: string): string {
    const labels: Record<string, string> = {
      tweets: "推文",
      xiaohongshu: "小红书",
      zhihu: "知乎",
    };
    return labels[platform] || platform;
  }

  function getPlatformColor(platform: string): string {
    const colors: Record<string, string> = {
      tweets: "text-blue-500",
      xiaohongshu: "text-red-500",
      zhihu: "text-purple-500",
    };
    return colors[platform] || "text-gray-500";
  }

  function getHeatmapColor(count: number): string {
    if (count === 0) return "bg-muted";
    if (count === 1) return "bg-primary/20";
    if (count === 2) return "bg-primary/40";
    if (count === 3) return "bg-primary/60";
    return "bg-primary/80";
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">加载中...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          数据分析
        </h2>
        <Tabs value={timeRange} onValueChange={setTimeRange}>
          <TabsList>
            <TabsTrigger value="7">近7天</TabsTrigger>
            <TabsTrigger value="30">近30天</TabsTrigger>
            <TabsTrigger value="90">近90天</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">已发布</CardTitle>
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalPublished}</div>
              <p className="text-xs text-muted-foreground">
                近{timeRange}天发布内容
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">待发布</CardTitle>
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalScheduled}</div>
              <p className="text-xs text-muted-foreground">已排期待发布</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">日均发布</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.dailyAverage}</div>
              <p className="text-xs text-muted-foreground">条/天</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">最长连续</CardTitle>
              <Flame className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.maxStreak}</div>
              <p className="text-xs text-muted-foreground">天连续发布</p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">发布热力图</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1">
              {heatmap.map((day) => {
                const date = new Date(day.date);
                const isCurrentMonth =
                  date.getMonth() === new Date().getMonth();

                return (
                  <div
                    key={day.date}
                    className={`aspect-square rounded-sm ${getHeatmapColor(
                      day.published
                    )} ${!isCurrentMonth ? "opacity-50" : ""}`}
                    title={`${day.date}: ${day.published} 已发布, ${day.scheduled} 待发布`}
                  />
                );
              })}
            </div>
            <div className="flex items-center justify-end gap-2 mt-2">
              <span className="text-xs text-muted-foreground">少</span>
              <div className="flex gap-1">
                <div className="w-3 h-3 rounded-sm bg-muted" />
                <div className="w-3 h-3 rounded-sm bg-primary/20" />
                <div className="w-3 h-3 rounded-sm bg-primary/40" />
                <div className="w-3 h-3 rounded-sm bg-primary/60" />
                <div className="w-3 h-3 rounded-sm bg-primary/80" />
              </div>
              <span className="text-xs text-muted-foreground">多</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">平台对比</CardTitle>
          </CardHeader>
          <CardContent>
            {stats && Object.keys(stats.platformCounts).length > 0 ? (
              <div className="space-y-4">
                {Object.entries(stats.platformCounts)
                  .sort(([, a], [, b]) => b - a)
                  .map(([platform, count]) => {
                    const maxCount = Math.max(
                      ...Object.values(stats.platformCounts)
                    );
                    const percentage = (count / maxCount) * 100;

                    return (
                      <div key={platform}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">
                            {getPlatformLabel(platform)}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {count} 条
                          </span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${getPlatformColor(
                              platform
                            ).replace("text-", "bg-")}`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                暂无数据
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">发布趋势</CardTitle>
        </CardHeader>
        <CardContent>
          {trends.length > 0 ? (
            <div className="space-y-4">
              {trends.map((trend) => (
                <div key={trend.platform}>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline">
                      {getPlatformLabel(trend.platform)}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {trend.data.reduce((sum, d) => sum + d.count, 0)} 条
                    </span>
                  </div>
                  <div className="flex items-end gap-1 h-20">
                    {trend.data.map((d) => {
                      const maxCount = Math.max(
                        ...trend.data.map((t) => t.count)
                      );
                      const height =
                        maxCount > 0 ? (d.count / maxCount) * 100 : 0;

                      return (
                        <div
                          key={d.date}
                          className={`flex-1 rounded-t ${getPlatformColor(
                            trend.platform
                          ).replace("text-", "bg-")}`}
                          style={{ height: `${height}%` }}
                          title={`${d.date}: ${d.count} 条`}
                        />
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              暂无趋势数据
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
