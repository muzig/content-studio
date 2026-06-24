"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
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
  AlertTriangle,
  Check,
  Copy,
  Pencil,
  LayoutGrid,
  Rows3,
} from "lucide-react";

interface ScheduledPost {
  id: string;
  scheduled_date: string;
  scheduled_time: string | null;
  position: number;
  platform_content: {
    id: string;
    platform: string;
    status: string;
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

interface PublishItem {
  id: string;
  platform: string;
  status: string;
  formatted: string;
  content_entry: {
    title: string | null;
    body: string;
    hot_topic: {
      title: string;
    } | null;
  };
  scheduled_post: {
    scheduled_date: string;
    scheduled_time: string | null;
  } | null;
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

function isOverdue(post: ScheduledPost): boolean {
  if (post.platform_content.status === "published") return false;
  const today = formatDate(new Date());
  return post.scheduled_date < today;
}

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<"month" | "week">("week");

  function goToToday() {
    setCurrentDate(new Date());
  }
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([]);
  const [allItems, setAllItems] = useState<PublishItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggedItem, setDraggedItem] = useState<PublishItem | null>(null);
  const [previewContent, setPreviewContent] = useState<PublishItem | null>(
    null
  );
  const [previewScheduled, setPreviewScheduled] = useState<ScheduledPost | null>(
    null
  );
  const [rightTab, setRightTab] = useState("calendar");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editItem, setEditItem] = useState<PublishItem | null>(null);
  const [editText, setEditText] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const [earlyPublishTarget, setEarlyPublishTarget] = useState<ScheduledPost | null>(null);
  const [scheduleItem, setScheduleItem] = useState<PublishItem | null>(null);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [scheduleSaving, setScheduleSaving] = useState(false);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthDays = useMemo(() => {
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
    return daysList;
  }, [year, month]);

  function prevMonth() {
    setCurrentDate(new Date(year, month - 1, 1));
  }

  function nextMonth() {
    setCurrentDate(new Date(year, month + 1, 1));
  }

  function prevWeek() {
    const d = new Date(currentDate);
    d.setDate(d.getDate() - 7);
    setCurrentDate(d);
  }

  function nextWeek() {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + 7);
    setCurrentDate(d);
  }

  // Week view: compute the 7 days of the week containing currentDate
  const weekDays7 = useMemo(() => {
    const d = new Date(currentDate);
    const dayOfWeek = d.getDay(); // 0=Sun
    const start = new Date(d);
    start.setDate(start.getDate() - dayOfWeek);
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const nd = new Date(start);
      nd.setDate(nd.getDate() + i);
      days.push(nd);
    }
    return days;
  }, [currentDate]);

  const weekStartStr = formatDate(weekDays7[0]);
  const weekEndStr = formatDate(weekDays7[6]);

  // Fetch data for week view (wider range)
  const { startDateStr, endDateStr } = useMemo(() => {
    if (viewMode === "week") {
      return { startDateStr: weekStartStr, endDateStr: weekEndStr };
    }
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const start = new Date(firstDay);
    start.setDate(start.getDate() - start.getDay());
    const end = new Date(lastDay);
    end.setDate(end.getDate() + (6 - end.getDay()));
    return { startDateStr: formatDate(start), endDateStr: formatDate(end) };
  }, [viewMode, weekStartStr, weekEndStr, year, month]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [scheduleRes, publishRes] = await Promise.all([
        fetch(`/api/schedule?start=${startDateStr}&end=${endDateStr}`),
        fetch("/api/publish"),
      ]);

      const scheduleData = await scheduleRes.json();
      const publishData = await publishRes.json();

      setScheduledPosts(scheduleData.scheduledPosts || []);
      setAllItems(publishData.items || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  }, [startDateStr, endDateStr]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
        setAllItems((prev) =>
          prev.map((item) =>
            item.id === draggedItem.id
              ? { ...item, scheduled_post: { scheduled_date: dateStr, scheduled_time: null } }
              : item
          )
        );
      }
    } catch (error) {
      console.error("Error scheduling:", error);
    } finally {
      setDraggedItem(null);
    }
  }

  async function handleRemoveSchedule(id: string) {
    const post = scheduledPosts.find((p) => p.id === id);
    try {
      const res = await fetch(`/api/schedule/${id}`, { method: "DELETE" });
      if (res.ok) {
        setScheduledPosts((prev) => prev.filter((post) => post.id !== id));
        // Update allItems to remove scheduled_post reference
        if (post) {
          setAllItems((prev) =>
            prev.map((item) =>
              item.id === post.platform_content.id
                ? { ...item, scheduled_post: null }
                : item
            )
          );
        }
      }
    } catch (error) {
      console.error("Error removing schedule:", error);
    }
  }

  async function handleUpdateStatus(itemId: string, newStatus: string) {
    try {
      const res = await fetch(`/api/publish/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setAllItems((prev) =>
          prev.map((item) =>
            item.id === itemId ? { ...item, status: newStatus } : item
          )
        );
        // Also update scheduled posts if present
        setScheduledPosts((prev) =>
          prev.map((post) =>
            post.platform_content.id === itemId
              ? {
                  ...post,
                  platform_content: { ...post.platform_content, status: newStatus },
                }
              : post
          )
        );
      }
    } catch (error) {
      console.error("Error updating status:", error);
    }
  }

  function isFuture(post: ScheduledPost): boolean {
    return post.scheduled_date > todayStr;
  }

  async function handleEarlyPublish(moveToToday: boolean) {
    if (!earlyPublishTarget) return;
    const pcId = earlyPublishTarget.platform_content.id;
    try {
      await Promise.all([
        handleUpdateStatus(pcId, "published"),
        moveToToday
          ? fetch(`/api/schedule/${earlyPublishTarget.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ scheduled_date: todayStr }),
            }).then((res) => {
              if (res.ok) {
                setScheduledPosts((prev) =>
                  prev.map((p) =>
                    p.id === earlyPublishTarget.id
                      ? { ...p, scheduled_date: todayStr }
                      : p
                  )
                );
              }
            })
          : Promise.resolve(),
      ]);
    } catch (error) {
      console.error("Error publishing:", error);
    } finally {
      setEarlyPublishTarget(null);
      setPreviewScheduled(null);
    }
  }

  function openScheduleDialog(item: PublishItem) {
    setScheduleItem(item);
    setScheduleDate(item.scheduled_post?.scheduled_date || todayStr);
    setScheduleTime(item.scheduled_post?.scheduled_time || "");
  }

  async function handleSaveSchedule() {
    if (!scheduleItem) return;
    setScheduleSaving(true);
    try {
      if (scheduleItem.scheduled_post) {
        // Update existing schedule
        const existingPost = scheduledPosts.find(
          (p) => p.platform_content.id === scheduleItem.id
        );
        if (existingPost) {
          const res = await fetch(`/api/schedule/${existingPost.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              scheduled_date: scheduleDate,
              scheduled_time: scheduleTime || null,
            }),
          });
          if (res.ok) {
            const data = await res.json();
            setScheduledPosts((prev) =>
              prev.map((p) => (p.id === existingPost.id ? data.scheduledPost : p))
            );
            setAllItems((prev) =>
              prev.map((i) =>
                i.id === scheduleItem.id
                  ? {
                      ...i,
                      scheduled_post: {
                        scheduled_date: scheduleDate,
                        scheduled_time: scheduleTime || null,
                      },
                    }
                  : i
              )
            );
          }
        }
      } else {
        // Create new schedule
        const res = await fetch("/api/schedule", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            platform_content_id: scheduleItem.id,
            scheduled_date: scheduleDate,
            scheduled_time: scheduleTime || null,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          setScheduledPosts((prev) => [...prev, data.scheduledPost]);
          setAllItems((prev) =>
            prev.map((i) =>
              i.id === scheduleItem.id
                ? {
                    ...i,
                    scheduled_post: {
                      scheduled_date: scheduleDate,
                      scheduled_time: scheduleTime || null,
                    },
                  }
                : i
            )
          );
        }
      }
    } catch (error) {
      console.error("Error saving schedule:", error);
    } finally {
      setScheduleSaving(false);
      setScheduleItem(null);
    }
  }

  function handleCopy(text: string, id: string) {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  function openEdit(item: PublishItem) {
    setEditItem(item);
    setEditText(item.formatted);
  }

  async function handleSaveFormatted() {
    if (!editItem) return;
    setEditSaving(true);
    try {
      const res = await fetch(`/api/publish/${editItem.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formatted: editText }),
      });
      if (res.ok) {
        setAllItems((prev) =>
          prev.map((item) =>
            item.id === editItem.id ? { ...item, formatted: editText } : item
          )
        );
        setScheduledPosts((prev) =>
          prev.map((post) =>
            post.platform_content.id === editItem.id
              ? {
                  ...post,
                  platform_content: { ...post.platform_content, formatted: editText },
                }
              : post
          )
        );
        setEditItem(null);
      }
    } catch (error) {
      console.error("Error saving formatted:", error);
    } finally {
      setEditSaving(false);
    }
  }

  const weekDays = ["日", "一", "二", "三", "四", "五", "六"];
  const today = new Date();
  const todayStr = formatDate(today);

  // Filter items by status
  const pendingItems = allItems.filter((i) => i.status === "draft" && !i.scheduled_post);
  const readyItems = allItems.filter((i) => i.status === "ready");
  const publishedItems = allItems.filter((i) => i.status === "published");

  // Count overdue
  const overdueCount = scheduledPosts.filter(isOverdue).length;

  const rightItems =
    rightTab === "pending"
      ? pendingItems
      : rightTab === "ready"
        ? readyItems
        : rightTab === "published"
          ? publishedItems
          : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">加载中...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-6 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg sm:text-xl font-semibold flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            发布日历
            {overdueCount > 0 && (
              <Badge variant="destructive" className="ml-1 animate-pulse text-xs">
                <AlertTriangle className="h-3 w-3 mr-0.5" />
                {overdueCount}
              </Badge>
            )}
          </h2>
          <div className="flex items-center border rounded-md sm:hidden">
            <Button
              variant={viewMode === "month" ? "secondary" : "ghost"}
              size="sm"
              className="rounded-r-none px-2"
              onClick={() => setViewMode("month")}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "week" ? "secondary" : "ghost"}
              size="sm"
              className="rounded-l-none px-2"
              onClick={() => setViewMode("week")}
            >
              <Rows3 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="flex items-center justify-center gap-1.5">
          <div className="hidden sm:flex items-center border rounded-md">
            <Button
              variant={viewMode === "month" ? "secondary" : "ghost"}
              size="sm"
              className="rounded-r-none px-2"
              onClick={() => setViewMode("month")}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "week" ? "secondary" : "ghost"}
              size="sm"
              className="rounded-l-none px-2"
              onClick={() => setViewMode("week")}
            >
              <Rows3 className="h-4 w-4" />
            </Button>
          </div>
          <Button variant="outline" size="sm" className="px-2" onClick={goToToday}>
            今天
          </Button>
          <Button variant="outline" size="sm" className="px-2" onClick={viewMode === "month" ? prevMonth : prevWeek}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="font-medium text-sm min-w-[100px] text-center">
            {viewMode === "month"
              ? `${year}年${month + 1}月`
              : `${weekDays7[0].getMonth() + 1}/${weekDays7[0].getDate()} - ${weekDays7[6].getMonth() + 1}/${weekDays7[6].getDate()}`}
          </span>
          <Button variant="outline" size="sm" className="px-2" onClick={viewMode === "month" ? nextMonth : nextWeek}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content management tabs — top bar */}
      <div className="mb-4">
        <Tabs value={rightTab} onValueChange={setRightTab}>
          <TabsList>
            <TabsTrigger value="calendar" className="text-xs">
              <CalendarIcon className="h-3.5 w-3.5 mr-1" />
              日历
            </TabsTrigger>
            <TabsTrigger value="pending" className="text-xs">
              待排期 ({pendingItems.length})
            </TabsTrigger>
            <TabsTrigger value="ready" className="text-xs">
              就绪 ({readyItems.length})
            </TabsTrigger>
            <TabsTrigger value="published" className="text-xs">
              已发布 ({publishedItems.length})
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {rightTab === "calendar" ? (
      <div>
        {viewMode === "month" ? (
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
                {monthDays.map((day) => {
                  const dateStr = formatDate(day);
                  const isCurrentMonth = day.getMonth() === month;
                  const isToday = dateStr === todayStr;
                  const posts = getPostsForDate(dateStr);
                  const overduePosts = posts.filter(isOverdue);
                  const hasOverdue = overduePosts.length > 0;

                  return (
                    <div
                      key={dateStr}
                      className={`min-h-[100px] border-2 rounded-md p-2 transition-colors ${
                        isCurrentMonth ? "bg-background" : "bg-muted/50"
                      } ${
                        isToday
                          ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                          : hasOverdue
                            ? "border-destructive bg-destructive/5"
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
                          <Badge
                            variant={hasOverdue ? "destructive" : "secondary"}
                            className="ml-1 text-xs"
                          >
                            {posts.length}
                          </Badge>
                        )}
                      </div>
                      <div className="space-y-1">
                        {posts.slice(0, 3).map((post) => {
                          const overdue = isOverdue(post);
                          return (
                            <div
                              key={post.id}
                              className={`text-xs p-1.5 rounded cursor-pointer hover:opacity-80 ${
                                overdue
                                  ? "bg-destructive/20 text-destructive border border-destructive/40"
                                  : getPlatformColor(post.platform_content.platform)
                              }`}
                              onClick={() => setPreviewScheduled(post)}
                            >
                              <div className="flex items-center justify-between">
                                <span className="flex items-center gap-1 font-medium">
                                  {overdue && <AlertTriangle className="h-3 w-3" />}
                                  {getPlatformLabel(post.platform_content.platform)}
                                </span>
                              </div>
                              <div className="truncate mt-0.5">
                                {post.platform_content.content_entry.title ||
                                  post.platform_content.content_entry.hot_topic?.title ||
                                  "无标题"}
                              </div>
                            </div>
                          );
                        })}
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
          ) : (
          /* Week view — vertical layout */
          <div className="flex flex-col gap-3">
            {weekDays7.map((day) => {
              const dateStr = formatDate(day);
              const isToday = dateStr === todayStr;
              const posts = getPostsForDate(dateStr);
              const overduePosts = posts.filter(isOverdue);
              const hasOverdue = overduePosts.length > 0;
              const dayLabel = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"][day.getDay()];

              return (
                <div
                  key={dateStr}
                  className={`border-2 rounded-lg p-3 transition-colors ${
                    isToday
                      ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                      : hasOverdue
                        ? "border-destructive bg-destructive/5"
                        : "border-border bg-background"
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
                  <div className="flex items-center gap-2 mb-2">
                    {isToday && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-primary text-primary-foreground">
                        今
                      </span>
                    )}
                    <span className={`text-sm font-semibold ${isToday ? "text-primary" : ""}`}>
                      {day.getMonth() + 1}月{day.getDate()}日
                    </span>
                    <span className="text-xs text-muted-foreground">{dayLabel}</span>
                    {posts.length > 0 && (
                      <Badge variant={hasOverdue ? "destructive" : "secondary"} className="text-xs ml-auto">
                        {posts.length} 条
                      </Badge>
                    )}
                  </div>
                  {posts.length === 0 ? (
                    <div className="text-xs text-muted-foreground py-2">暂无排期</div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {posts.map((post) => {
                        const overdue = isOverdue(post);
                        const title = post.platform_content.content_entry.title ||
                          post.platform_content.content_entry.hot_topic?.title ||
                          "无标题";
                        const preview = post.platform_content.formatted?.slice(0, 80) || "";
                        return (
                          <div
                            key={post.id}
                            className={`p-2.5 rounded-md cursor-pointer hover:opacity-80 text-xs flex-1 min-w-[200px] max-w-[400px] ${
                              overdue
                                ? "bg-destructive/20 text-destructive border border-destructive/40"
                                : post.platform_content.status === "published"
                                  ? "bg-green-50 border border-green-200"
                                  : getPlatformColor(post.platform_content.platform)
                            }`}
                            onClick={() => setPreviewScheduled(post)}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="flex items-center gap-1 font-medium">
                                {overdue && <AlertTriangle className="h-3 w-3" />}
                                {getPlatformLabel(post.platform_content.platform)}
                              </span>
                              {post.platform_content.status === "published" && (
                                <Check className="h-3 w-3 text-green-600" />
                              )}
                            </div>
                            <div className="font-medium truncate">{title}</div>
                            {preview && (
                              <div className="text-muted-foreground line-clamp-2 mt-0.5">
                                {preview}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          )}
      </div>
      ) : (
      /* Content management panel */
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {rightItems.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8 col-span-full">
            {rightTab === "pending"
              ? "暂无待排期内容"
              : rightTab === "ready"
                ? "暂无就绪内容"
                : "暂无已发布内容"}
          </p>
        ) : (
          rightItems.map((item) => (
            <div
              key={item.id}
              className={`p-3 rounded-lg hover:shadow-md transition-shadow ${getPlatformColor(
                item.platform
              )}`}
              draggable={rightTab === "pending"}
              onDragStart={() => rightTab === "pending" && setDraggedItem(item)}
              onDragEnd={() => setDraggedItem(null)}
            >
              <div className="flex items-start gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium">
                      {getPlatformLabel(item.platform)}
                    </span>
                    {item.scheduled_post && (
                      <span
                        className="text-xs text-muted-foreground cursor-pointer hover:underline"
                        onClick={(e) => { e.stopPropagation(); openScheduleDialog(item); }}
                      >
                        📅 {item.scheduled_post.scheduled_date}
                      </span>
                    )}
                  </div>
                  <div className="text-xs font-medium truncate mt-1">
                    {item.content_entry.title ||
                      item.content_entry.hot_topic?.title ||
                      "无标题"}
                  </div>
                  <div className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                    {item.formatted?.slice(0, 80) || ""}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 mt-2 pt-2 border-t border-black/10">
                <button
                  type="button"
                  className="h-7 w-7 flex items-center justify-center rounded hover:bg-black/10 transition-colors"
                  onClick={(e) => { e.stopPropagation(); openScheduleDialog(item); }}
                  onMouseDown={(e) => e.stopPropagation()}
                  title="设置排期"
                >
                  <CalendarIcon className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  className="h-7 w-7 flex items-center justify-center rounded hover:bg-black/10 transition-colors"
                  onClick={(e) => { e.stopPropagation(); setPreviewContent(item); }}
                  onMouseDown={(e) => e.stopPropagation()}
                  title="预览"
                >
                  <Eye className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  className="h-7 w-7 flex items-center justify-center rounded hover:bg-black/10 transition-colors"
                  onClick={(e) => { e.stopPropagation(); handleCopy(item.formatted, item.id); }}
                  onMouseDown={(e) => e.stopPropagation()}
                  title="复制"
                >
                  {copiedId === item.id ? (
                    <Check className="h-3.5 w-3.5 text-green-600" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </button>
                <button
                  type="button"
                  className="h-7 w-7 flex items-center justify-center rounded hover:bg-black/10 transition-colors"
                  onClick={(e) => { e.stopPropagation(); openEdit(item); }}
                  onMouseDown={(e) => e.stopPropagation()}
                  title="编辑"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                {item.status === "draft" && (
                  <button
                    type="button"
                    className="ml-auto text-xs px-2 py-1 rounded hover:bg-black/10 transition-colors"
                    onClick={(e) => { e.stopPropagation(); handleUpdateStatus(item.id, "ready"); }}
                    onMouseDown={(e) => e.stopPropagation()}
                  >
                    标记就绪
                  </button>
                )}
                {item.status === "ready" && (
                  <button
                    type="button"
                    className="ml-auto text-xs px-2 py-1 rounded bg-green-100 text-green-700 hover:bg-green-200 transition-colors"
                    onClick={(e) => { e.stopPropagation(); handleUpdateStatus(item.id, "published"); }}
                    onMouseDown={(e) => e.stopPropagation()}
                  >
                    确认发布
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
      )}

      {/* Preview pending content */}
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
                  内容预览
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
                <div className="flex justify-end gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      handleCopy(previewContent.formatted, previewContent.id)
                    }
                  >
                    {copiedId === previewContent.id ? (
                      <Check className="h-4 w-4 mr-1 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4 mr-1" />
                    )}
                    {copiedId === previewContent.id ? "已复制" : "复制"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      openEdit(previewContent);
                      setPreviewContent(null);
                    }}
                  >
                    <Pencil className="h-4 w-4 mr-1" />
                    编辑
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Preview scheduled content */}
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
                  {isOverdue(previewScheduled) && (
                    <span className="text-destructive ml-2">
                      ⚠️ 已过期未发布
                    </span>
                  )}
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
                    onClick={() =>
                      handleCopy(
                        previewScheduled.platform_content.formatted,
                        previewScheduled.platform_content.id
                      )
                    }
                  >
                    {copiedId === previewScheduled.platform_content.id ? (
                      <Check className="h-4 w-4 mr-1 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4 mr-1" />
                    )}
                    {copiedId === previewScheduled.platform_content.id
                      ? "已复制"
                      : "复制"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      openEdit({
                        id: previewScheduled.platform_content.id,
                        platform: previewScheduled.platform_content.platform,
                        status: previewScheduled.platform_content.status,
                        formatted: previewScheduled.platform_content.formatted,
                        content_entry: previewScheduled.platform_content.content_entry,
                        scheduled_post: {
                          scheduled_date: previewScheduled.scheduled_date,
                          scheduled_time: previewScheduled.scheduled_time,
                        },
                      });
                      setPreviewScheduled(null);
                    }}
                  >
                    <Pencil className="h-4 w-4 mr-1" />
                    编辑
                  </Button>
                  {previewScheduled.platform_content.status !== "published" && (
                    <Button
                      size="sm"
                      onClick={() => {
                        if (isFuture(previewScheduled)) {
                          setEarlyPublishTarget(previewScheduled);
                        } else {
                          handleUpdateStatus(
                            previewScheduled.platform_content.id,
                            "published"
                          );
                          setPreviewScheduled(null);
                        }
                      }}
                    >
                      <Check className="h-4 w-4 mr-1" />
                      确认发布
                    </Button>
                  )}
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

      {/* Edit formatted content dialog */}
      <Dialog
        open={!!editItem}
        onOpenChange={(open) => !open && setEditItem(null)}
      >
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          {editItem && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Badge className={getPlatformColor(editItem.platform)}>
                    {getPlatformLabel(editItem.platform)}
                  </Badge>
                  <span>
                    {editItem.content_entry.title ||
                      editItem.content_entry.hot_topic?.title ||
                      "编辑内容"}
                  </span>
                </DialogTitle>
                <DialogDescription>编辑发布内容</DialogDescription>
              </DialogHeader>
              <div className="mt-4 space-y-4">
                <Textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  rows={10}
                  className="font-mono text-sm"
                />
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    onClick={() => setEditItem(null)}
                  >
                    取消
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleCopy(editText, editItem.id)}
                  >
                    {copiedId === editItem.id ? (
                      <Check className="h-4 w-4 mr-1 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4 mr-1" />
                    )}
                    {copiedId === editItem.id ? "已复制" : "复制"}
                  </Button>
                  <Button
                    onClick={handleSaveFormatted}
                    disabled={editSaving}
                  >
                    {editSaving ? "保存中..." : "保存"}
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Early publish confirmation dialog */}
      <Dialog
        open={!!earlyPublishTarget}
        onOpenChange={(open) => !open && setEarlyPublishTarget(null)}
      >
        <DialogContent className="max-w-md">
          {earlyPublishTarget && (
            <>
              <DialogHeader>
                <DialogTitle>提前发布</DialogTitle>
                <DialogDescription>
                  该内容排期为 {earlyPublishTarget.scheduled_date}，是否将排期挪到今日（{todayStr}）？
                </DialogDescription>
              </DialogHeader>
              <div className="flex justify-end gap-2 mt-4">
                <Button
                  variant="ghost"
                  onClick={() => setEarlyPublishTarget(null)}
                >
                  取消
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleEarlyPublish(false)}
                >
                  直接发布
                </Button>
                <Button onClick={() => handleEarlyPublish(true)}>
                  <Check className="h-4 w-4 mr-1" />
                  发布并移至今日
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Schedule dialog */}
      <Dialog
        open={!!scheduleItem}
        onOpenChange={(open) => !open && setScheduleItem(null)}
      >
        <DialogContent className="max-w-sm">
          {scheduleItem && (
            <>
              <DialogHeader>
                <DialogTitle>设置发布时间</DialogTitle>
                <DialogDescription>
                  {scheduleItem.content_entry.title ||
                    scheduleItem.content_entry.hot_topic?.title ||
                    "无标题"}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">日期</label>
                  <Input
                    type="date"
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">时间（可选）</label>
                  <Input
                    type="time"
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    onClick={() => setScheduleItem(null)}
                  >
                    取消
                  </Button>
                  {scheduleItem.scheduled_post && (
                    <Button
                      variant="outline"
                      onClick={async () => {
                        const existingPost = scheduledPosts.find(
                          (p) => p.platform_content.id === scheduleItem.id
                        );
                        if (existingPost) {
                          await handleRemoveSchedule(existingPost.id);
                        }
                        setScheduleItem(null);
                      }}
                    >
                      取消排期
                    </Button>
                  )}
                  <Button
                    onClick={handleSaveSchedule}
                    disabled={scheduleSaving || !scheduleDate}
                  >
                    {scheduleSaving ? "保存中..." : "确认排期"}
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
