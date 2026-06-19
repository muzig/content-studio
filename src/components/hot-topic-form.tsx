"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface HotTopicFormProps {
  onSubmit: (data: {
    title: string;
    content: string;
    url?: string;
    tags?: string[];
  }) => void;
}

export function HotTopicForm({ onSubmit }: HotTopicFormProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [url, setUrl] = useState("");
  const [tagsInput, setTagsInput] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!title.trim()) return;

    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    onSubmit({
      title: title.trim(),
      content: content.trim(),
      url: url.trim() || undefined,
      tags: tags.length > 0 ? tags : undefined,
    });

    setTitle("");
    setContent("");
    setUrl("");
    setTagsInput("");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">添加热点</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">
              标题 <span className="text-destructive">*</span>
            </label>
            <Input
              placeholder="热点标题"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">内容</label>
            <Textarea
              placeholder="热点内容、摘要或你的初步想法..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">链接</label>
            <Input
              placeholder="https://..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              type="url"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">
              标签（逗号分隔）
            </label>
            <Input
              placeholder="科技, AI, 趋势"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full">
            添加热点
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
