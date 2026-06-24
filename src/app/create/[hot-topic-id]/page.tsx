"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
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
  ChevronDown,
  ChevronUp,
  Flame,
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

const PLATFORMS = ["x", "weibo", "xiaohongshu", "zhihu", "gongzhonghao"];
const PLATFORM_LABELS: Record<string, string> = {
  x: "X",
  weibo: "微博",
  xiaohongshu: "小红书",
  zhihu: "知乎",
  gongzhonghao: "公众号",
};
const PLATFORM_COLORS: Record<string, string> = {
  x: "bg-blue-500 hover:bg-blue-600 text-white",
  weibo: "bg-orange-500 hover:bg-orange-600 text-white",
  xiaohongshu: "bg-red-500 hover:bg-red-600 text-white",
  zhihu: "bg-purple-500 hover:bg-purple-600 text-white",
  gongzhonghao: "bg-green-500 hover:bg-green-600 text-white",
};

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
  const [topicExpanded, setTopicExpanded] = useState(true);

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
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
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
  const hasPlatforms = entry && entry.platforms.length > 0;

  return (
    <div className="max-w-4xl mx-auto px-4 lg:px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/hot-topics")}
          className="shrink-0"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-lg font-semibold">内容创作</h1>
      </div>

      {/* Step 1: Hot Topic */}
      <section>
        <button
          type="button"
          className="w-full flex items-center justify-between px-4 py-3 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors text-left"
          onClick={() => setTopicExpanded(!topicExpanded)}
        >
          <div className="flex items-center gap-2 min-w-0">
            <Flame className="h-4 w-4 text-orange-500 shrink-0" />
            <span className="text-sm font-medium truncate">
              {hotTopic.title}
            </span>
            {tags.length > 0 && (
              <div className="hidden sm:flex gap-1 ml-2">
                {tags.slice(0, 3).map((tag: string, i: number) => (
                  <Badge
                    key={i}
                    variant="secondary"
                    className="text-[10px] px-1.5 py-0"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
          {topicExpanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
          )}
        </button>

        {topicExpanded && hotTopic.content && (
          <Card className="mt-2">
            <CardContent className="pt-4">
              <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                {hotTopic.content}
              </p>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t">
                  {tags.map((tag: string, i: number) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </section>

      {/* Step 2: Comment */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-muted-foreground">
            我的观点
          </h2>
          <span className="text-xs text-muted-foreground">
            写得越多，AI 越侧重润色
          </span>
        </div>
        <Textarea
          placeholder="写下你对这条热点的看法..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={5}
          disabled={generating}
          className="resize-none text-sm leading-relaxed"
        />
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSave}
            disabled={saving || generating}
          >
            <Save className="h-3.5 w-3.5 mr-1.5" />
            {saving ? "保存中" : "保存"}
          </Button>
        </div>
      </section>

      {/* Step 3: Generate */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-muted-foreground">
            生成内容
          </h2>
          {generating && generationStatus.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              生成中...
            </div>
          )}
        </div>

        {/* Generate All - Primary Action */}
        <Button
          onClick={handleGenerate}
          disabled={generating}
          className="w-full h-11 text-sm font-medium"
        >
          {generating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              正在生成全部平台...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              生成全部平台
            </>
          )}
        </Button>

        {/* Individual Platform Buttons */}
        <div className="grid grid-cols-5 gap-2">
          {PLATFORMS.map((platform) => {
            const isGenerating =
              generating &&
              generationStatus.some(
                (s) => s.platform === platform && s.status === "generating"
              );
            const isSuccess =
              generating &&
              generationStatus.some(
                (s) => s.platform === platform && s.status === "success"
              );
            return (
              <Button
                key={platform}
                variant="outline"
                size="sm"
                onClick={() => handleRegeneratePlatform(platform)}
                disabled={generating}
                className="h-9 text-xs"
              >
                {isGenerating ? (
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                ) : isSuccess ? (
                  <CheckCircle2 className="h-3 w-3 mr-1 text-green-500" />
                ) : (
                  <Sparkles className="h-3 w-3 mr-1" />
                )}
                {PLATFORM_LABELS[platform]}
              </Button>
            );
          })}
        </div>

        {/* Generation Progress */}
        {generating && generationStatus.length > 0 && (
          <div className="flex flex-wrap gap-x-4 gap-y-1 px-1">
            {generationStatus.map((s) => (
              <div
                key={s.platform}
                className="flex items-center gap-1.5 text-xs"
              >
                {s.status === "pending" && (
                  <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/30" />
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
                <span
                  className={
                    s.status === "error"
                      ? "text-red-500"
                      : s.status === "success"
                        ? "text-green-600"
                        : "text-muted-foreground"
                  }
                >
                  {PLATFORM_LABELS[s.platform]}
                  {s.status === "generating" && " 生成中"}
                  {s.status === "success" && " ✓"}
                  {s.status === "error" && ` 失败`}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {error && !generating && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm">
            <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
            <p className="text-red-700">{error}</p>
          </div>
        )}
      </section>

      {/* Step 4: Platform Content */}
      {hasPlatforms && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-muted-foreground">
              平台内容
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpandAll(!expandAll)}
              className="h-7 text-xs"
            >
              <ChevronsUpDown className="h-3.5 w-3.5 mr-1" />
              {expandAll ? "收起" : "展开全部"}
            </Button>
          </div>

          {expandAll ? (
            <div className="space-y-4">
              {entry.platforms.map((p) => (
                <PlatformBlock
                  key={p.platform}
                  platform={p}
                  generating={generating}
                  copiedPlatform={copiedPlatform}
                  onCopy={handleCopy}
                  onRegenerate={handleRegeneratePlatform}
                />
              ))}
            </div>
          ) : (
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="w-full justify-start h-auto gap-1 bg-transparent p-0 flex-wrap">
                {entry.platforms.map((p) => (
                  <TabsTrigger
                    key={p.platform}
                    value={p.platform}
                    className="text-xs px-3 py-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md"
                  >
                    {PLATFORM_LABELS[p.platform]}
                  </TabsTrigger>
                ))}
              </TabsList>
              {entry.platforms.map((p) => (
                <TabsContent key={p.platform} value={p.platform} className="mt-3">
                  <PlatformBlock
                    platform={p}
                    generating={generating}
                    copiedPlatform={copiedPlatform}
                    onCopy={handleCopy}
                    onRegenerate={handleRegeneratePlatform}
                  />
                </TabsContent>
              ))}
            </Tabs>
          )}
        </section>
      )}
    </div>
  );
}

function PlatformBlock({
  platform,
  generating,
  copiedPlatform,
  onCopy,
  onRegenerate,
}: {
  platform: PlatformContent;
  generating: boolean;
  copiedPlatform: string | null;
  onCopy: (content: string, platform: string) => void;
  onRegenerate: (platform: string) => void;
}) {
  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b bg-muted/30">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">
            {PLATFORM_LABELS[platform.platform]}
          </span>
          <Badge
            variant={
              platform.status === "draft"
                ? "secondary"
                : platform.status === "ready"
                  ? "default"
                  : "outline"
            }
            className="text-[10px] px-1.5 py-0"
          >
            {platform.status === "draft"
              ? "草稿"
              : platform.status === "ready"
                ? "就绪"
                : "已发布"}
          </Badge>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() => onCopy(platform.formatted, platform.platform)}
            disabled={!platform.formatted}
          >
            {copiedPlatform === platform.platform ? (
              <>
                <Check className="h-3.5 w-3.5 mr-1 text-green-500" />
                已复制
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5 mr-1" />
                复制
              </>
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() => onRegenerate(platform.platform)}
            disabled={generating}
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1" />
            重新生成
          </Button>
        </div>
      </div>
      <div className="p-4">
        <div className="text-sm whitespace-pre-wrap leading-relaxed text-foreground/90">
          {platform.formatted || (
            <span className="text-muted-foreground italic">
              暂无内容，请先生成
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
