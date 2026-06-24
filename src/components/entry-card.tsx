"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { PlatformToggle } from "@/components/platform-toggle";
import type { Platform } from "@/lib/types";

const PLATFORM_LABELS = [
  { value: "x", label: "X" },
  { value: "weibo", label: "微博" },
  { value: "xiaohongshu", label: "小红书" },
  { value: "zhihu", label: "知乎" },
];

interface Entry {
  id: string;
  sequence: number;
  title: string | null;
  body: string;
  platforms: {
    id: string;
    platform: string;
    formatted: string;
    status: string;
  }[];
}

interface EntryCardProps {
  entry: Entry;
  onUpdate: (id: string, data: { title?: string; body?: string }) => void;
  onDelete: (id: string) => void;
  onGenerate: (id: string, platforms: Platform[]) => void;
}

export function EntryCard({
  entry,
  onUpdate,
  onDelete,
  onGenerate,
}: EntryCardProps) {
  const [title, setTitle] = useState(entry.title || "");
  const [body, setBody] = useState(entry.body);
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>(
    entry.platforms.map((p) => p.platform as Platform)
  );

  const debouncedSave = useCallback(
    (field: "title" | "body", value: string) => {
      const timer = setTimeout(() => {
        onUpdate(entry.id, { [field]: value });
      }, 2000);
      return () => clearTimeout(timer);
    },
    [entry.id, onUpdate]
  );

  useEffect(() => {
    const cleanup = debouncedSave("body", body);
    return cleanup;
  }, [body, debouncedSave]);

  useEffect(() => {
    const cleanup = debouncedSave("title", title);
    return cleanup;
  }, [title, debouncedSave]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            条目 {entry.sequence}
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-destructive"
            onClick={() => onDelete(entry.id)}
          >
            删除
          </Button>
        </div>
        <Input
          placeholder="标题（可选）"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="border-none p-0 text-lg font-medium focus-visible:ring-0"
        />
      </CardHeader>
      <CardContent className="space-y-4">
        <PlatformToggle
          selected={selectedPlatforms}
          onChange={setSelectedPlatforms}
        />
        <Textarea
          placeholder="在这里写内容...（支持 Markdown）"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className="min-h-[200px] resize-y"
        />
        <div className="flex gap-2">
          <Button
            size="sm"
            disabled={selectedPlatforms.length === 0 || !body.trim()}
            onClick={() => onGenerate(entry.id, selectedPlatforms)}
          >
            生成格式
          </Button>
        </div>
        {entry.platforms.length > 0 && (
          <div className="text-xs text-muted-foreground">
            已生成:{" "}
            {entry.platforms
              .map(
                (p) =>
                  `${PLATFORM_LABELS.find((pl) => pl.value === p.platform)?.label || p.platform} (${p.status})`
              )
              .join(", ")}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
