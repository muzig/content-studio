"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Eye,
} from "lucide-react";

interface ScheduledPost {
  id: string;
  scheduled_date: string;
  scheduled_time: string | null;
  position: number;
  platform_content: {
    id: string;
    platform: string;
    formatted: string;
    content_entry: {
      title: string | null;
      body: string;
      hot_topic: {
        title: string;
      } | null;
    };
  };
}

interface PendingContent {
  id: string;
  platform: string;
  formatted: string;
  content_entry: {
    title: string | null;
    body: string;
    hot_topic: {
      title: string;
    } | null;
  };
}

function formatDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

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
    tweets: "bg-blue-100 text-blue-800",
    xiaohongshu: "bg-red-100 text-red-800",
    zhihu: "bg-purple-100 text-purple-800",
  };
  return colors[platform] || "bg-gray-100 text-gray-800";
}

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());

  function goToToday() {
    setCurrentDate(new Date());
  }
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([]);
  const [pendingContent, setPendingContent] = useState<PendingContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggedItem, setDraggedItem] = useState<PendingContent | null>(null);
  const [previewContent, setPreviewContent] = useState<PendingContent | null>(
    null
  );
  const [previewScheduled, setPreviewScheduled] = useState<ScheduledPost | null>(
    null
  );

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const { startDateStr, endDateStr, days } = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const start = new Date(firstDay);
    start.setDate(start.getDate() - start.getDay());
    const end = new Date(lastDay);
    end.setDate(end.getDate() + (6 - end.getDay()));

    const daysList: Date[] = [];
    const current = new Date(start);
    while (current <= end) {
      daysList.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    return {
      startDateStr: formatDate(start),
      endDateStr: formatDate(end),
      days: daysList,
    };
  }, [year, month]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [scheduleRes, publishRes] = await Promise.all([
        fetch(`/api/schedule?start=${startDateStr}&end=${endDateStr}`),
        fetch("/api/publish?status=draft"),
      ]);

      const scheduleData = await scheduleRes.json();
      const publishData = await publishRes.json();

      setScheduledPosts(scheduleData.scheduledPosts || []);
      setPendingContent(
        (publishData.items || []).map(
          (item: {
            id: string;
            platform: string;
            formatted: string;
            content_entry: {
              title: string | null;
              body: string;
              hot_topic: { title: string } | null;
            };
          }) => ({
            id: item.id,
            platform: item.platform,
            formatted: item.formatted,
            content_entry: {
              title: item.content_entry.title,
              body: item.content_entry.body,
              hot_topic: item.content_entry.hot_topic,
            },
          })
        )
      );
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  }, [startDateStr, endDateStr]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function prevMonth() {
    setCurrentDate(new Date(year, month - 1, 1));
  }

  function nextMonth() {
    setCurrentDate(new Date(year, month + 1, 1));
  }

  function getPostsForDate(dateStr: string): ScheduledPost[] {
    return scheduledPosts.filter((post) => post.scheduled_date === dateStr);
  }

  async function handleDrop(dateStr: string) {
    if (!draggedItem) return;

    try {
      const res = await fetch("/api/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform_content_id: draggedItem.id,
          scheduled_date: dateStr,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setScheduledPosts((prev) => [...prev, data.scheduledPost]);
        setPendingContent((prev) =>
          prev.filter((item) => item.id !== draggedItem.id)
        );
      }
    } catch (error) {
      console.error("Error scheduling:", error);
    } finally {
      setDraggedItem(null);
    }
  }

  async function handleRemoveSchedule(id: string) {
    try {
      const res = await fetch(`/api/schedule/${id}`, { method: "DELETE" });
      if (res.ok) {
        setScheduledPosts((prev) => prev.filter((post) => post.id !== id));
      }
    } catch (error) {
      console.error("Error removing schedule:", error);
    }
  }

  const weekDays = ["日", "一", "二", "三", "四", "五", "六"];
  const today = new Date();
  const todayStr = formatDate(today);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">加载中...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <CalendarIcon className="h-5 w-5" />
          发布日历
        </h2>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={goToToday}
            disabled={`${year}年${month + 1}月` === `${today.getFullYear()}年${today.getMonth() + 1}月`}
          >
            今天
          </Button>
          <Button variant="outline" size="sm" onClick={prevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="font-medium min-w-[120px] text-center">
            {year}年{month + 1}月
          </span>
          <Button variant="outline" size="sm" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-7 gap-1 mb-2">
                {weekDays.map((day) => (
                  <div
                    key={day}
                    className="text-center text-sm font-medium text-muted-foreground py-2"
                  >
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {days.map((day) => {
                  const dateStr = formatDate(day);
                  const isCurrentMonth = day.getMonth() === month;
                  const isToday = dateStr === todayStr;
                  const posts = getPostsForDate(dateStr);

                  return (
                    <div
                      key={dateStr}
                      className={`min-h-[100px] border-2 rounded-md p-2 transition-colors ${
                        isCurrentMonth ? "bg-background" : "bg-muted/50"
                      } ${
                        isToday
                          ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                          : "border-border"
                      }`}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.currentTarget.classList.add("bg-primary/10");
                      }}
                      onDragLeave={(e) => {
                        e.currentTarget.classList.remove("bg-primary/10");
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.currentTarget.classList.remove("bg-primary/10");
                        handleDrop(dateStr);
                      }}
                    >
                      <div
                        className={`text-sm mb-1 flex items-center gap-1 ${
                          isCurrentMonth ? "font-medium" : "text-muted-foreground"
                        }`}
                      >
                        {isToday && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-primary text-primary-foreground">
                            今
                          </span>
                        )}
                        <span className={isToday ? "font-bold text-primary" : ""}>
                          {day.getDate()}
                        </span>
                        {posts.length > 0 && (
                          <Badge variant="secondary" className="ml-1 text-xs">
                            {posts.length}
                          </Badge>
                        )}
                      </div>
                      <div className="space-y-1">
                        {posts.slice(0, 3).map((post) => (
                          <div
                            key={post.id}
                            className={`text-xs p-1 rounded cursor-pointer hover:opacity-80 flex items-center justify-between ${getPlatformColor(
                              post.platform_content.platform
                            )}`}
                            onClick={() => setPreviewScheduled(post)}
                          >
                            <span>
                              {getPlatformLabel(post.platform_content.platform)}
                            </span>
                            <Eye className="h-3 w-3" />
                          </div>
                        ))}
                        {posts.length > 3 && (
                          <div className="text-xs text-muted-foreground">
                            +{posts.length - 3} 更多
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">待排期内容</CardTitle>
            </CardHeader>
            <CardContent>
              {pendingContent.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  暂无待排期内容
                </p>
              ) : (
                <div className="space-y-2">
                  {pendingContent.map((item) => (
                    <div
                      key={item.id}
                      className={`p-2 rounded-md hover:shadow-md transition-shadow ${getPlatformColor(
                        item.platform
                      )}`}
                      draggable
                      onDragStart={() => setDraggedItem(item)}
                      onDragEnd={() => setDraggedItem(null)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-medium">
                          {getPlatformLabel(item.platform)}
                        </div>
                        <button
                          type="button"
                          className="opacity-60 hover:opacity-100"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewContent(item);
                          }}
                          onMouseDown={(e) => e.stopPropagation()}
                          aria-label="查看内容"
                        >
                          <Eye className="h-3 w-3" />
                        </button>
                      </div>
                      <div className="text-xs truncate mt-1">
                        {item.content_entry.title ||
                          item.content_entry.hot_topic?.title ||
                          "无标题"}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog
        open={!!previewContent}
        onOpenChange={(open) => !open && setPreviewContent(null)}
      >
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          {previewContent && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Badge className={getPlatformColor(previewContent.platform)}>
                    {getPlatformLabel(previewContent.platform)}
                  </Badge>
                  <span>
                    {previewContent.content_entry.title ||
                      previewContent.content_entry.hot_topic?.title ||
                      "无标题"}
                  </span>
                </DialogTitle>
                <DialogDescription>
                  待排期内容预览
                </DialogDescription>
              </DialogHeader>
              <div className="mt-4">
                <div className="text-xs font-medium text-muted-foreground mb-2">
                  关联热点
                </div>
                <div className="p-3 bg-muted rounded-md text-sm mb-4">
                  {previewContent.content_entry.hot_topic?.title || "无"}
                </div>
                <div className="text-xs font-medium text-muted-foreground mb-2">
                  内容正文
                </div>
                <div className="p-3 bg-muted rounded-md text-sm whitespace-pre-wrap">
                  {previewContent.formatted || "暂无内容"}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!previewScheduled}
        onOpenChange={(open) => !open && setPreviewScheduled(null)}
      >
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          {previewScheduled && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Badge
                    className={getPlatformColor(
                      previewScheduled.platform_content.platform
                    )}
                  >
                    {getPlatformLabel(
                      previewScheduled.platform_content.platform
                    )}
                  </Badge>
                  <span>
                    {previewScheduled.platform_content.content_entry.title ||
                      previewScheduled.platform_content.content_entry.hot_topic
                        ?.title ||
                      "无标题"}
                  </span>
                </DialogTitle>
                <DialogDescription>
                  排期于 {previewScheduled.scheduled_date}
                  {previewScheduled.scheduled_time &&
                    ` ${previewScheduled.scheduled_time}`}
                </DialogDescription>
              </DialogHeader>
              <div className="mt-4">
                <div className="text-xs font-medium text-muted-foreground mb-2">
                  关联热点
                </div>
                <div className="p-3 bg-muted rounded-md text-sm mb-4">
                  {previewScheduled.platform_content.content_entry.hot_topic
                    ?.title || "无"}
                </div>
                <div className="text-xs font-medium text-muted-foreground mb-2">
                  内容正文
                </div>
                <div className="p-3 bg-muted rounded-md text-sm whitespace-pre-wrap">
                  {previewScheduled.platform_content.formatted || "暂无内容"}
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      handleRemoveSchedule(previewScheduled.id);
                      setPreviewScheduled(null);
                    }}
                  >
                    取消排期
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
