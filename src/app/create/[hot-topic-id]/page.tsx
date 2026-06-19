"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Save, Sparkles, RefreshCw } from "lucide-react";

interface HotTopic {
  id: string;
  title: string;
  content: string;
  url: string | null;
  tags: string | null;
}

interface PlatformContent {
  id: string;
  platform: string;
  formatted: string;
  status: string;
}

interface Entry {
  id: string;
  title: string | null;
  body: string;
  hot_topic: HotTopic | null;
  platforms: PlatformContent[];
}

export default function CreatePage() {
  const params = useParams();
  const router = useRouter();
  const hotTopicId = params["hot-topic-id"] as string;

  const [hotTopic, setHotTopic] = useState<HotTopic | null>(null);
  const [entry, setEntry] = useState<Entry | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [activeTab, setActiveTab] = useState("tweets");

  const fetchData = useCallback(async () => {
    try {
      const hotTopicRes = await fetch(`/api/hot-topics/${hotTopicId}`);
      if (!hotTopicRes.ok) {
        router.push("/hot-topics");
        return;
      }
      const hotTopicData = await hotTopicRes.json();
      setHotTopic(hotTopicData.hotTopic);

      if (hotTopicData.hotTopic.entries?.length > 0) {
        const existingEntry = hotTopicData.hotTopic.entries[0];
        setEntry(existingEntry);
        setTitle(existingEntry.title || "");
        setComment(existingEntry.body || "");
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  }, [hotTopicId, router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleSave() {
    if (!hotTopic) return;

    setSaving(true);
    try {
      if (entry) {
        const res = await fetch(`/api/entries/${entry.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, body: comment }),
        });
        if (res.ok) {
          const data = await res.json();
          setEntry(data.entry);
        }
      } else {
        const res = await fetch("/api/entries", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            hot_topic_id: hotTopic.id,
            title,
            body: comment,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          setEntry(data.entry);
        }
      }
    } catch (error) {
      console.error("Error saving:", error);
    } finally {
      setSaving(false);
    }
  }

  async function handleGenerate() {
    if (!entry) {
      await handleSave();
    }

    const entryId = entry?.id;
    if (!entryId) return;

    setGenerating(true);
    try {
      const res = await fetch(`/api/entries/${entryId}/generate`, {
        method: "POST",
      });
      if (res.ok) {
        const data = await res.json();
        setEntry((prev) =>
          prev ? { ...prev, platforms: data.platforms } : prev
        );
      }
    } catch (error) {
      console.error("Error generating:", error);
    } finally {
      setGenerating(false);
    }
  }

  async function handleRegeneratePlatform(platform: string) {
    if (!entry) return;

    setGenerating(true);
    try {
      const res = await fetch(`/api/entries/${entry.id}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platforms: [platform] }),
      });
      if (res.ok) {
        const data = await res.json();
        setEntry((prev) => {
          if (!prev) return prev;
          const updatedPlatforms = prev.platforms.map((p) =>
            p.platform === platform ? data.platforms[0] : p
          );
          return { ...prev, platforms: updatedPlatforms };
        });
      }
    } catch (error) {
      console.error("Error regenerating:", error);
    } finally {
      setGenerating(false);
    }
  }

  function getPlatformLabel(platform: string): string {
    const labels: Record<string, string> = {
      tweets: "推文",
      xiaohongshu: "小红书",
      zhihu: "知乎",
    };
    return labels[platform] || platform;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">加载中...</p>
      </div>
    );
  }

  if (!hotTopic) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">热点不存在</p>
      </div>
    );
  }

  const tags = hotTopic.tags ? JSON.parse(hotTopic.tags) : [];

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="sm" onClick={() => router.push("/hot-topics")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          返回
        </Button>
        <h2 className="text-xl font-semibold">内容创作</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">热点原文</CardTitle>
          </CardHeader>
          <CardContent>
            <h3 className="font-medium mb-2">{hotTopic.title}</h3>
            {hotTopic.content && (
              <p className="text-sm text-muted-foreground mb-3 whitespace-pre-wrap">
                {hotTopic.content}
              </p>
            )}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag: string, index: number) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">我的评论</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">标题</label>
              <Input
                placeholder="内容标题（可选）"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">
                评论/想法
              </label>
              <Textarea
                placeholder="写多少都行，AI 会自动适配..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={6}
              />
              <p className="text-xs text-muted-foreground mt-1">
                写得越多，AI 越侧重润色；写得越少，AI 越会展开创作
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={saving} className="flex-1">
                <Save className="h-4 w-4 mr-2" />
                {saving ? "保存中..." : "保存草稿"}
              </Button>
              <Button
                onClick={handleGenerate}
                disabled={generating}
                className="flex-1"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                {generating ? "生成中..." : "生成全部平台"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {entry && entry.platforms.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-base">平台内容</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                {entry.platforms.map((p) => (
                  <TabsTrigger key={p.platform} value={p.platform}>
                    {getPlatformLabel(p.platform)}
                  </TabsTrigger>
                ))}
              </TabsList>
              {entry.platforms.map((p) => (
                <TabsContent key={p.platform} value={p.platform}>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Badge
                        variant={
                          p.status === "draft"
                            ? "secondary"
                            : p.status === "ready"
                              ? "default"
                              : "outline"
                        }
                      >
                        {p.status === "draft"
                          ? "草稿"
                          : p.status === "ready"
                            ? "就绪"
                            : "已发布"}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRegeneratePlatform(p.platform)}
                        disabled={generating}
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        重新生成
                      </Button>
                    </div>
                    <div className="bg-muted p-4 rounded-md whitespace-pre-wrap text-sm">
                      {p.formatted || "暂无内容，请先生成"}
                    </div>
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
