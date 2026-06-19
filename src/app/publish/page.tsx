"use client";

import { useState, useEffect, useCallback } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PublishCard } from "@/components/publish-card";

interface PublishItem {
  id: string;
  platform: string;
  formatted: string;
  status: string;
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

export default function PublishPage() {
  const [items, setItems] = useState<PublishItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [platformFilter, setPlatformFilter] = useState("all");

  const fetchItems = useCallback(async () => {
    const params = new URLSearchParams();
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (platformFilter !== "all") params.set("platform", platformFilter);

    const res = await fetch(`/api/publish?${params.toString()}`);
    const data = await res.json();
    setItems(data.items || []);
    setLoading(false);
  }, [statusFilter, platformFilter]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const draft = items.filter((i) => i.status === "draft");
  const ready = items.filter((i) => i.status === "ready");
  const published = items.filter((i) => i.status === "published");

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">加载中...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <h2 className="text-xl font-semibold mb-6">发布管理</h2>

      <div className="flex items-center gap-4 mb-6">
        <Tabs value={statusFilter} onValueChange={setStatusFilter}>
          <TabsList>
            <TabsTrigger value="all">全部</TabsTrigger>
            <TabsTrigger value="draft">草稿</TabsTrigger>
            <TabsTrigger value="ready">就绪</TabsTrigger>
            <TabsTrigger value="published">已发布</TabsTrigger>
          </TabsList>
        </Tabs>

        <Select value={platformFilter} onValueChange={(v) => setPlatformFilter(v ?? "all")}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部平台</SelectItem>
            <SelectItem value="tweets">推文</SelectItem>
            <SelectItem value="xiaohongshu">小红书</SelectItem>
            <SelectItem value="zhihu">知乎</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <Column title="草稿" items={draft} />
        <Column title="就绪" items={ready} />
        <Column title="已发布" items={published} />
      </div>
    </div>
  );
}

function Column({ title, items }: { title: string; items: PublishItem[] }) {
  return (
    <div>
      <h3 className="text-sm font-medium text-muted-foreground mb-3">
        {title} ({items.length})
      </h3>
      <div className="space-y-3">
        {items.map((item) => (
          <PublishCard key={item.id} item={item} />
        ))}
        {items.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">
            暂无内容
          </p>
        )}
      </div>
    </div>
  );
}
