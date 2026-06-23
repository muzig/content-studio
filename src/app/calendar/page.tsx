"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
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
  const [rightTab, setRightTab] = useState("pending");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editItem, setEditItem] = useState<PublishItem | null>(null);
  const [editText, setEditText] = useState("");
  const [editSaving, setEditSaving] = useState(false);

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
        : publishedItems;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">加载中...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <CalendarIcon className="h-5 w-5" />
          发布日历
          {overdueCount > 0 && (
            <Badge variant="destructive" className="ml-2 animate-pulse">
              <AlertTriangle className="h-3 w-3 mr-1" />
              {overdueCount} 条过期
            </Badge>
          )}
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
                              className={`text-xs p-1 rounded cursor-pointer hover:opacity-80 flex items-center justify-between ${
                                overdue
                                  ? "bg-destructive/20 text-destructive border border-destructive/40"
                                  : getPlatformColor(post.platform_content.platform)
                              }`}
                              onClick={() => setPreviewScheduled(post)}
                            >
                              <span className="flex items-center gap-1">
                                {overdue && <AlertTriangle className="h-3 w-3" />}
                                {getPlatformLabel(post.platform_content.platform)}
                              </span>
                              <Eye className="h-3 w-3" />
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
        </div>

        <div>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">内容管理</CardTitle>
              <Tabs value={rightTab} onValueChange={setRightTab}>
                <TabsList className="w-full">
                  <TabsTrigger value="pending" className="flex-1 text-xs">
                    待排期 ({pendingItems.length})
                  </TabsTrigger>
                  <TabsTrigger value="ready" className="flex-1 text-xs">
                    就绪 ({readyItems.length})
                  </TabsTrigger>
                  <TabsTrigger value="published" className="flex-1 text-xs">
                    已发布 ({publishedItems.length})
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </CardHeader>
            <CardContent>
              {rightItems.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {rightTab === "pending"
                    ? "暂无待排期内容"
                    : rightTab === "ready"
                      ? "暂无就绪内容"
                      : "暂无已发布内容"}
                </p>
              ) : (
                <div className="space-y-2 max-h-[50vh] overflow-y-auto">
                  {rightItems.map((item) => (
                    <div
                      key={item.id}
                      className={`p-2 rounded-md hover:shadow-md transition-shadow ${getPlatformColor(
                        item.platform
                      )}`}
                      draggable={rightTab === "pending"}
                      onDragStart={() => rightTab === "pending" && setDraggedItem(item)}
                      onDragEnd={() => setDraggedItem(null)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-medium">
                          {getPlatformLabel(item.platform)}
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            className="opacity-60 hover:opacity-100"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopy(item.formatted, item.id);
                            }}
                            onMouseDown={(e) => e.stopPropagation()}
                            aria-label="复制内容"
                          >
                            {copiedId === item.id ? (
                              <Check className="h-3 w-3 text-green-600" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </button>
                          <button
                            type="button"
                            className="opacity-60 hover:opacity-100"
                            onClick={(e) => {
                              e.stopPropagation();
                              openEdit(item);
                            }}
                            onMouseDown={(e) => e.stopPropagation()}
                            aria-label="编辑内容"
                          >
                            <Pencil className="h-3 w-3" />
                          </button>
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
                      </div>
                      <div className="text-xs truncate mt-1">
                        {item.content_entry.title ||
                          item.content_entry.hot_topic?.title ||
                          "无标题"}
                      </div>
                      {item.scheduled_post && (
                        <div className="text-xs text-muted-foreground mt-1">
                          📅 {item.scheduled_post.scheduled_date}
                        </div>
                      )}
                      <div className="flex gap-1 mt-1.5">
                        {item.status === "draft" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs h-5 px-1.5"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUpdateStatus(item.id, "ready");
                            }}
                          >
                            标记就绪
                          </Button>
                        )}
                        {item.status === "ready" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs h-5 px-1.5"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUpdateStatus(item.id, "published");
                            }}
                          >
                            <Check className="h-3 w-3 mr-0.5" />
                            确认发布
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

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
                  {previewScheduled.platform_content.status === "ready" && (
                    <Button
                      size="sm"
                      onClick={() => {
                        handleUpdateStatus(
                          previewScheduled.platform_content.id,
                          "published"
                        );
                        setPreviewScheduled(null);
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
    </div>
  );
}
