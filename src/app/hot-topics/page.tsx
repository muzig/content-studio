"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { HotTopicCard } from "@/components/hot-topic-card";
import { HotTopicForm } from "@/components/hot-topic-form";
import { Search } from "lucide-react";

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
  const [showForm, setShowForm] = useState(false);

  const fetchHotTopics = useCallback(async () => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);

    const res = await fetch(`/api/hot-topics?${params.toString()}`);
    const data = await res.json();
    setHotTopics(data.hotTopics || []);
    setLoading(false);
  }, [search]);

  useEffect(() => {
    fetchHotTopics();
  }, [fetchHotTopics]);

  async function handleCreate(data: {
    title: string;
    content: string;
    url?: string;
    tags?: string[];
  }) {
    const res = await fetch("/api/hot-topics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      setShowForm(false);
      fetchHotTopics();
    }
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/hot-topics/${id}`, { method: "DELETE" });
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
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">热点收集</h2>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? "取消" : "+ 添加热点"}
        </Button>
      </div>

      {showForm && (
        <div className="mb-6">
          <HotTopicForm onSubmit={handleCreate} />
        </div>
      )}

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="搜索热点..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {hotTopics.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg mb-2">还没有热点</p>
          <p className="text-sm">点击上方按钮添加第一个热点</p>
        </div>
      ) : (
        <div className="space-y-4">
          {hotTopics.map((topic) => (
            <HotTopicCard
              key={topic.id}
              hotTopic={topic}
              onDelete={handleDelete}
              onCreateContent={handleCreateContent}
            />
          ))}
        </div>
      )}
    </div>
  );
}
