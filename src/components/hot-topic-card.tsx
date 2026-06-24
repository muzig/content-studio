"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Trash2, PenLine, ExternalLink, Check, X } from "lucide-react";

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

interface HotTopicCardProps {
  hotTopic: HotTopic;
  onDelete: (id: string) => void;
  onCreateContent: (id: string) => void;
  onUpdate: (id: string, data: { title: string; content: string; url?: string; tags?: string[] }) => Promise<void>;
}

export function HotTopicCard({
  hotTopic,
  onDelete,
  onCreateContent,
  onUpdate,
}: HotTopicCardProps) {
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(hotTopic.title);
  const [editContent, setEditContent] = useState(hotTopic.content);
  const [editUrl, setEditUrl] = useState(hotTopic.url || "");
  const [editTags, setEditTags] = useState(
    hotTopic.tags ? JSON.parse(hotTopic.tags).join(", ") : ""
  );
  const [saving, setSaving] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const tags = hotTopic.tags ? JSON.parse(hotTopic.tags) : [];
  const date = new Date(hotTopic.created_at).toLocaleDateString("zh-CN", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  async function handleSave() {
    if (!editTitle.trim()) return;
    setSaving(true);
    const parsedTags = editTags
      .split(",")
      .map((t: string) => t.trim())
      .filter(Boolean);
    await onUpdate(hotTopic.id, {
      title: editTitle.trim(),
      content: editContent.trim(),
      url: editUrl.trim() || undefined,
      tags: parsedTags.length > 0 ? parsedTags : undefined,
    });
    setSaving(false);
    setEditing(false);
  }

  function handleCancel() {
    setEditTitle(hotTopic.title);
    setEditContent(hotTopic.content);
    setEditUrl(hotTopic.url || "");
    setEditTags(hotTopic.tags ? JSON.parse(hotTopic.tags).join(", ") : "");
    setEditing(false);
  }

  if (editing) {
    return (
      <div className="border rounded-lg p-4 bg-muted/30 space-y-3">
        <div>
          <label className="text-sm font-medium mb-1 block">标题</label>
          <Input
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            placeholder="热点标题"
          />
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">内容</label>
          <Textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            placeholder="热点内容..."
            rows={3}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium mb-1 block">链接</label>
            <Input
              value={editUrl}
              onChange={(e) => setEditUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">标签（逗号分隔）</label>
            <Input
              value={editTags}
              onChange={(e) => setEditTags(e.target.value)}
              placeholder="科技, AI, 趋势"
            />
          </div>
        </div>
        <div className="flex items-center gap-2 justify-end">
          <Button variant="ghost" size="sm" onClick={handleCancel}>
            <X className="h-4 w-4 mr-1" />
            取消
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving || !editTitle.trim()}>
            <Check className="h-4 w-4 mr-1" />
            {saving ? "保存中..." : "保存"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="border rounded-lg px-4 py-3 hover:bg-accent/50 transition-colors cursor-pointer group"
      onClick={() => setEditing(true)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm mb-1">{hotTopic.title}</h3>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-1">
              {tags.slice(0, 5).map((tag: string, i: number) => (
                <Badge key={i} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {tags.length > 5 && (
                <Badge variant="outline" className="text-xs">
                  +{tags.length - 5}
                </Badge>
              )}
            </div>
          )}
          {hotTopic.content && (
            <p className="text-xs text-muted-foreground line-clamp-1 mb-1">
              {hotTopic.content}
            </p>
          )}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{date}</span>
            <span>·</span>
            <span>{hotTopic.source === "manual" ? "手动输入" : hotTopic.source}</span>
            {hotTopic._count.entries > 0 && (
              <>
                <span>·</span>
                <span>{hotTopic._count.entries} 条内容</span>
              </>
            )}
          </div>
        </div>
        <div
          className="flex items-center gap-1 shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          {hotTopic.url && (
            <a
              href={hotTopic.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground p-1"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onCreateContent(hotTopic.id)}
            className="h-8 px-2"
          >
            <PenLine className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDeleteDialog(true)}
            className="h-8 px-2 text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>
              确定要删除热点「{hotTopic.title}」吗？此操作不可撤销。
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="ghost" onClick={() => setShowDeleteDialog(false)}>
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                onDelete(hotTopic.id);
                setShowDeleteDialog(false);
              }}
            >
              删除
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
