"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { HotTopicCard } from "@/components/hot-topic-card";
import { HotTopicParser } from "@/components/hot-topic-parser";
import { Search, Sparkles } from "lucide-react";

interface HotTopic {
  id: string;
  title: string;
  source: string;
  content: string;
  url: string | null;
  tags: string | null;
  created_at: string;
  _count: {
    entries: number;
  };
}

export default function HotTopicsPage() {
  const router = useRouter();
  const [hotTopics, setHotTopics] = useState<HotTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<"today" | "week" | "month" | null>("week");
  const [showParser, setShowParser] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      return !!localStorage.getItem("hot-topic-parser-state");
    } catch {
      return false;
    }
  });

  const fetchHotTopics = useCallback(async () => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);

    const res = await fetch(`/api/hot-topics?${params.toString()}`);
    const data = await res.json();
    setHotTopics(data.hotTopics || []);
    setLoading(false);
  }, [search]);

  // Time range filter (applied first, so tags reflect filtered topics)
  const timeFilteredTopics = useMemo(() => {
    if (!timeRange) return hotTopics;
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    let cutoff: Date;
    if (timeRange === "today") {
      cutoff = today;
    } else if (timeRange === "week") {
      cutoff = new Date(today);
      cutoff.setDate(cutoff.getDate() - cutoff.getDay());
    } else {
      cutoff = new Date(now.getFullYear(), now.getMonth(), 1);
    }
    return hotTopics.filter((topic) => new Date(topic.created_at) >= cutoff);
  }, [hotTopics, timeRange]);

  // Extract tags from time-filtered topics
  const allTags = useMemo(() => {
    const tagMap = new Map<string, number>();
    timeFilteredTopics.forEach((topic) => {
      if (topic.tags) {
        const parsed = JSON.parse(topic.tags) as string[];
        parsed.forEach((tag) => {
          tagMap.set(tag, (tagMap.get(tag) || 0) + 1);
        });
      }
    });
    return Array.from(tagMap.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([tag, count]) => ({ tag, count }));
  }, [timeFilteredTopics]);

  // Final filtered topics (time + tag)
  const filteredTopics = useMemo(() => {
    if (!selectedTag) return timeFilteredTopics;
    return timeFilteredTopics.filter((topic) => {
      if (!topic.tags) return false;
      const parsed = JSON.parse(topic.tags) as string[];
      return parsed.includes(selectedTag);
    });
  }, [timeFilteredTopics, selectedTag]);

  useEffect(() => {
    fetchHotTopics();
  }, [fetchHotTopics]);

  async function handleDelete(id: string) {
    const res = await fetch(`/api/hot-topics/${id}`, { method: "DELETE" });
    if (res.ok) {
      fetchHotTopics();
    }
  }

  async function handleUpdate(
    id: string,
    data: { title: string; content: string; url?: string; tags?: string[] }
  ) {
    const res = await fetch(`/api/hot-topics/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      fetchHotTopics();
    }
  }

  function handleCreateContent(hotTopicId: string) {
    router.push(`/create/${hotTopicId}`);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">加载中...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 lg:px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">热点收集</h2>
        <Button onClick={() => setShowParser(!showParser)}>
          <Sparkles className="h-4 w-4 mr-2" />
          {showParser ? "取消" : "AI 导入"}
        </Button>
      </div>

      {showParser && (
        <div className="mb-6 border rounded-lg p-4 bg-card">
          <h3 className="text-sm font-medium mb-3">粘贴热点新闻文本，AI 自动解析导入</h3>
          <HotTopicParser
            onComplete={() => { setShowParser(false); fetchHotTopics(); }}
            onCancel={() => setShowParser(false)}
          />
        </div>
      )}

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="搜索热点..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {(allTags.length > 0 || hotTopics.length > 0) && (
        <div className="space-y-2 mb-4">
          <div className="flex flex-wrap gap-1.5">
            {(["today", "week", "month"] as const).map((range) => (
              <Badge
                key={range}
                variant={timeRange === range ? "default" : "outline"}
                className="cursor-pointer text-xs"
                onClick={() => setTimeRange(timeRange === range ? null : range)}
              >
                {range === "today" ? "今日" : range === "week" ? "本周" : "本月"}
              </Badge>
            ))}
          </div>
          {allTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              <Badge
                variant={selectedTag === null ? "default" : "outline"}
                className="cursor-pointer text-xs"
                onClick={() => setSelectedTag(null)}
              >
                全部 ({timeFilteredTopics.length})
              </Badge>
              {allTags.map(({ tag, count }) => (
                <Badge
                  key={tag}
                  variant={selectedTag === tag ? "default" : "outline"}
                  className="cursor-pointer text-xs"
                  onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                >
                  {tag} ({count})
                </Badge>
              ))}
            </div>
          )}
        </div>
      )}

      {filteredTopics.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg mb-2">
            {selectedTag || timeRange ? "没有匹配的热点" : "还没有热点"}
          </p>
          <p className="text-sm">
            {selectedTag || timeRange ? "尝试调整筛选条件" : "点击「AI 导入」粘贴热点新闻文本自动生成"}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTopics.map((topic) => (
            <HotTopicCard
              key={topic.id}
              hotTopic={topic}
              onDelete={handleDelete}
              onCreateContent={handleCreateContent}
              onUpdate={handleUpdate}
            />
          ))}
        </div>
      )}
    </div>
  );
}
