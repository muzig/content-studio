"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Save,
  Sparkles,
  RefreshCw,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  ChevronsUpDown,
} from "lucide-react";

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

interface GenerationStatus {
  platform: string;
  status: "pending" | "generating" | "success" | "error";
  message?: string;
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
  const [comment, setComment] = useState("");
  const [activeTab, setActiveTab] = useState("x");
  const [generationStatus, setGenerationStatus] = useState<GenerationStatus[]>(
    []
  );
  const [error, setError] = useState<string | null>(null);
  const [copiedPlatform, setCopiedPlatform] = useState<string | null>(null);
  const [expandAll, setExpandAll] = useState(false);

  const PLATFORMS = ["x", "weibo", "xiaohongshu", "zhihu"];
  const PLATFORM_LABELS: Record<string, string> = {
    x: "X",
    weibo: "微博",
    xiaohongshu: "小红书",
    zhihu: "知乎",
  };

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

  async function handleSave(): Promise<string | undefined> {
    if (!hotTopic) return;

    setSaving(true);
    try {
      if (entry) {
        const res = await fetch(`/api/entries/${entry.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ body: comment }),
        });
        if (res.ok) {
          const data = await res.json();
          setEntry(data.entry);
          return data.entry.id;
        }
      } else {
        const res = await fetch("/api/entries", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            hot_topic_id: hotTopic.id,
            body: comment,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          setEntry(data.entry);
          return data.entry.id;
        }
      }
    } catch (error) {
      console.error("Error saving:", error);
    } finally {
      setSaving(false);
    }
  }

  async function handleGenerate() {
    setError(null);

    let entryId = entry?.id;
    if (!entryId) {
      entryId = await handleSave();
    }
    if (!entryId) return;

    setGenerating(true);
    setGenerationStatus(
      PLATFORMS.map((p) => ({ platform: p, status: "pending" }))
    );

    try {
      const res = await fetch(`/api/entries/${entryId}/generate`, {
        method: "POST",
      });

      if (res.ok) {
        const data = await res.json();
        setEntry((prev) =>
          prev ? { ...prev, platforms: data.platforms } : prev
        );
        setGenerationStatus((prev) =>
          prev.map((s) => ({ ...s, status: "success" }))
        );
      } else {
        const errorData = await res.json().catch(() => ({}));
        const errorMessage = errorData.error || `生成失败 (${res.status})`;
        setError(errorMessage);
        setGenerationStatus((prev) =>
          prev.map((s) => ({ ...s, status: "error", message: errorMessage }))
        );
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "网络错误";
      setError(message);
      setGenerationStatus((prev) =>
        prev.map((s) => ({ ...s, status: "error", message }))
      );
    } finally {
      setTimeout(() => {
        setGenerating(false);
        setGenerationStatus([]);
      }, 2000);
    }
  }

  async function handleRegeneratePlatform(platform: string) {
    setError(null);

    let entryId = entry?.id;
    if (!entryId) {
      entryId = await handleSave();
    }
    if (!entryId) return;

    setGenerating(true);
    setGenerationStatus(
      PLATFORMS.map((p) => ({
        platform: p,
        status: p === platform ? "generating" : "pending",
      }))
    );

    try {
      const res = await fetch(`/api/entries/${entryId}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platforms: [platform] }),
      });

      if (res.ok) {
        const data = await res.json();
        setEntry((prev) => {
          if (!prev) return prev;
          const newPlatform = data.platforms[0];
          const exists = prev.platforms.some((p) => p.platform === platform);
          const updatedPlatforms = exists
            ? prev.platforms.map((p) =>
                p.platform === platform ? newPlatform : p
              )
            : [...prev.platforms, newPlatform];
          return { ...prev, platforms: updatedPlatforms };
        });
        setGenerationStatus((prev) =>
          prev.map((s) =>
            s.platform === platform ? { ...s, status: "success" } : s
          )
        );
      } else {
        const errorData = await res.json().catch(() => ({}));
        const errorMessage = errorData.error || "重新生成失败";
        setError(errorMessage);
        setGenerationStatus((prev) =>
          prev.map((s) =>
            s.platform === platform
              ? { ...s, status: "error", message: errorMessage }
              : s
          )
        );
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "网络错误";
      setError(message);
      setGenerationStatus((prev) =>
        prev.map((s) =>
          s.platform === platform ? { ...s, status: "error", message } : s
        )
      );
    } finally {
      setTimeout(() => {
        setGenerating(false);
        setGenerationStatus([]);
      }, 2000);
    }
  }

  async function handleCopy(content: string, platform: string) {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(content);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = content;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopiedPlatform(platform);
      setTimeout(() => setCopiedPlatform(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
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
    <div className="max-w-5xl mx-auto px-4 lg:px-6 py-8">
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
            <Textarea
              placeholder="写下你对这条热点的评论或想法..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={6}
              disabled={generating}
            />
            <p className="text-xs text-muted-foreground">
              写得越多，AI 越侧重润色；写得越少，AI 越会展开创作
            </p>
            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={saving || generating} className="flex-1">
                <Save className="h-4 w-4 mr-2" />
                {saving ? "保存中..." : "保存草稿"}
              </Button>
              <Button
                onClick={handleGenerate}
                disabled={generating}
                className="flex-1"
              >
                {generating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    生成中...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    生成全部平台
                  </>
                )}
              </Button>
            </div>
            <div className="flex gap-2">
              {PLATFORMS.map((platform) => {
                const isGenerating =
                  generating &&
                  generationStatus.some(
                    (s) => s.platform === platform && s.status === "generating"
                  );
                return (
                  <Button
                    key={platform}
                    variant="outline"
                    size="sm"
                    onClick={() => handleRegeneratePlatform(platform)}
                    disabled={generating}
                    className="flex-1"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        {PLATFORM_LABELS[platform]}
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-3 w-3 mr-1" />
                        生成{PLATFORM_LABELS[platform]}
                      </>
                    )}
                  </Button>
                );
              })}
            </div>

            {generating && generationStatus.length > 0 && (
              <div className="mt-4 p-3 bg-muted rounded-md space-y-2">
                <p className="text-sm font-medium">生成进度</p>
                {generationStatus.filter((s) => s.status !== "pending").map((s) => (
                  <div key={s.platform} className="flex items-center gap-2 text-sm">
                    {s.status === "pending" && (
                      <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                    )}
                    {s.status === "generating" && (
                      <Loader2 className="h-3 w-3 animate-spin text-blue-500" />
                    )}
                    {s.status === "success" && (
                      <CheckCircle2 className="h-3 w-3 text-green-500" />
                    )}
                    {s.status === "error" && (
                      <AlertCircle className="h-3 w-3 text-red-500" />
                    )}
                    <span>
                      {PLATFORM_LABELS[s.platform]}
                      {s.status === "generating" && " - 生成中..."}
                      {s.status === "success" && " - 完成"}
                      {s.status === "error" && ` - 失败: ${s.message}`}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {error && !generating && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {entry && entry.platforms.length > 0 && (
        <Card className="mt-6">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">平台内容</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpandAll(!expandAll)}
            >
              <ChevronsUpDown className="h-4 w-4 mr-2" />
              {expandAll ? "收起" : "展开全部"}
            </Button>
          </CardHeader>
          <CardContent>
            {expandAll ? (
              <div className="space-y-6">
                {entry.platforms.map((p) => (
                  <div key={p.platform} className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">
                          {PLATFORM_LABELS[p.platform]}
                        </h4>
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
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCopy(p.formatted, p.platform)}
                          disabled={!p.formatted}
                        >
                          {copiedPlatform === p.platform ? (
                            <>
                              <Check className="h-4 w-4 mr-2 text-green-500" />
                              已复制
                            </>
                          ) : (
                            <>
                              <Copy className="h-4 w-4 mr-2" />
                              复制
                            </>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRegeneratePlatform(p.platform)}
                          disabled={generating}
                        >
                          {generating ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              生成中...
                            </>
                          ) : (
                            <>
                              <RefreshCw className="h-4 w-4 mr-2" />
                              重新生成
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                    <div className="bg-muted p-4 rounded-md whitespace-pre-wrap text-sm">
                      {p.formatted || "暂无内容，请先生成"}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                  {entry.platforms.map((p) => (
                    <TabsTrigger key={p.platform} value={p.platform}>
                      {PLATFORM_LABELS[p.platform]}
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
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCopy(p.formatted, p.platform)}
                            disabled={!p.formatted}
                          >
                            {copiedPlatform === p.platform ? (
                              <>
                                <Check className="h-4 w-4 mr-2 text-green-500" />
                                已复制
                              </>
                            ) : (
                              <>
                                <Copy className="h-4 w-4 mr-2" />
                                复制
                              </>
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRegeneratePlatform(p.platform)}
                            disabled={generating}
                          >
                            {generating ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                生成中...
                              </>
                            ) : (
                              <>
                                <RefreshCw className="h-4 w-4 mr-2" />
                                重新生成
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                      <div className="bg-muted p-4 rounded-md whitespace-pre-wrap text-sm">
                        {p.formatted || "暂无内容，请先生成"}
                      </div>
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}