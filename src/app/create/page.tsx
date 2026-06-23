"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PenLine, FileText } from "lucide-react";

type TimeRange = "all" | "today" | "week" | "month";

const TIME_RANGES: { value: TimeRange; label: string }[] = [
  { value: "all", label: "全部" },
  { value: "today", label: "今天" },
  { value: "week", label: "本周" },
  { value: "month", label: "本月" },
];

function getDateThreshold(range: TimeRange): Date | null {
  if (range === "all") return null;
  const now = new Date();
  if (range === "today") {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }
  if (range === "week") {
    const day = now.getDay() || 7;
    return new Date(now.getFullYear(), now.getMonth(), now.getDate() - day + 1);
  }
  // month
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

interface HotTopic {
  id: string;
  title: string;
  content: string;
  created_at: string;
  _count: { entries: number };
}

export default function CreatePage() {
  const router = useRouter();
  const [hotTopics, setHotTopics] = useState<HotTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<TimeRange>("all");

  const filtered = useMemo(() => {
    const threshold = getDateThreshold(timeRange);
    if (!threshold) return hotTopics;
    return hotTopics.filter((t) => new Date(t.created_at) >= threshold);
  }, [hotTopics, timeRange]);

  const withDrafts = useMemo(
    () => filtered.filter((t) => t._count.entries > 0),
    [filtered]
  );
  const pending = useMemo(
    () => filtered.filter((t) => t._count.entries === 0),
    [filtered]
  );

  useEffect(() => {
    async function fetchHotTopics() {
      const res = await fetch("/api/hot-topics");
      const data = await res.json();
      setHotTopics(data.hotTopics || []);
      setLoading(false);
    }
    fetchHotTopics();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">加载中...</p>
      </div>
    );
  }

  if (hotTopics.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 lg:px-6 py-8">
        <div className="text-center py-12">
          <p className="text-lg mb-2">还没有热点</p>
          <p className="text-sm text-muted-foreground mb-4">
            请先添加热点，然后再创建内容
          </p>
          <Button onClick={() => router.push("/hot-topics")}>
            去添加热点
          </Button>
        </div>
      </div>
    );
  }

  if (filtered.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 lg:px-6 py-8">
        <h2 className="text-xl font-semibold mb-4">选择热点创建内容</h2>
        <div className="flex gap-2 mb-6">
          {TIME_RANGES.map((r) => (
            <Button
              key={r.value}
              variant={timeRange === r.value ? "default" : "outline"}
              size="sm"
              onClick={() => setTimeRange(r.value)}
            >
              {r.label}
            </Button>
          ))}
        </div>
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-sm">该时间范围内没有热点</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 lg:px-6 py-8">
      <h2 className="text-xl font-semibold mb-4">选择热点创建内容</h2>

      <div className="flex gap-2 mb-6">
        {TIME_RANGES.map((r) => (
          <Button
            key={r.value}
            variant={timeRange === r.value ? "default" : "outline"}
            size="sm"
            onClick={() => setTimeRange(r.value)}
          >
            {r.label}
          </Button>
        ))}
      </div>

      {withDrafts.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-medium">已有草稿</h3>
            <Badge variant="secondary" className="text-xs">{withDrafts.length}</Badge>
          </div>
          <div className="space-y-3">
            {withDrafts.map((topic) => (
              <Card
                key={topic.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => router.push(`/create/${topic.id}`)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium">{topic.title}</h3>
                      {topic.content && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {topic.content}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(topic.created_at).toLocaleDateString("zh-CN")}
                        {` · ${topic._count.entries} 条内容`}
                      </p>
                    </div>
                    <PenLine className="h-4 w-4 text-muted-foreground ml-4" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {pending.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <PenLine className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-medium text-muted-foreground">待创作</h3>
            <Badge variant="outline" className="text-xs">{pending.length}</Badge>
          </div>
          <div className="space-y-3">
            {pending.map((topic) => (
              <Card
                key={topic.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => router.push(`/create/${topic.id}`)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium">{topic.title}</h3>
                      {topic.content && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {topic.content}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(topic.created_at).toLocaleDateString("zh-CN")}
                      </p>
                    </div>
                    <PenLine className="h-4 w-4 text-muted-foreground ml-4" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
