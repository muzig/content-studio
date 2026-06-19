"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PenLine } from "lucide-react";

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
      <div className="max-w-2xl mx-auto px-6 py-8">
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

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <h2 className="text-xl font-semibold mb-6">选择热点创建内容</h2>
      <div className="space-y-3">
        {hotTopics.map((topic) => (
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
                    {topic._count.entries > 0 && ` · ${topic._count.entries} 条内容`}
                  </p>
                </div>
                <PenLine className="h-4 w-4 text-muted-foreground ml-4" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
