"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PublishDialog } from "@/components/publish-dialog";

interface PublishItem {
  id: string;
  platform: string;
  formatted: string;
  status: string;
  content_entry: {
    title: string | null;
    body: string;
    daily_note: { date: string };
  };
}

const PLATFORM_LABELS: Record<string, string> = {
  tweets: "推文",
  xiaohongshu: "小红书",
  zhihu: "知乎",
};

const STATUS_NEXT: Record<string, string> = {
  draft: "ready",
  ready: "published",
};

export function PublishCard({ item }: { item: PublishItem }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentFormatted, setCurrentFormatted] = useState(item.formatted);
  const [currentStatus, setCurrentStatus] = useState(item.status);

  async function updateStatus() {
    const next = STATUS_NEXT[currentStatus];
    if (!next) return;

    const res = await fetch(`/api/publish/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    if (res.ok) {
      setCurrentStatus(next);
    }
  }

  async function saveFormatted(text: string) {
    const res = await fetch(`/api/publish/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ formatted: text }),
    });
    if (res.ok) {
      setCurrentFormatted(text);
    }
  }

  function copyToClipboard() {
    navigator.clipboard.writeText(currentFormatted);
  }

  const title =
    item.content_entry.title ||
    item.content_entry.body.slice(0, 20) + (item.content_entry.body.length > 20 ? "..." : "");

  return (
    <>
      <Card
        className="cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => setDialogOpen(true)}
      >
        <CardContent className="p-3 space-y-2">
          <div className="flex items-center justify-between">
            <Badge variant="secondary" className="text-xs">
              {PLATFORM_LABELS[item.platform] || item.platform}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {item.content_entry.daily_note.date}
            </span>
          </div>
          <p className="text-sm font-medium truncate">{title}</p>
          <div className="flex gap-1">
            {currentStatus !== "published" && (
              <Button
                size="sm"
                variant="outline"
                className="text-xs h-6"
                onClick={(e) => {
                  e.stopPropagation();
                  updateStatus();
                }}
              >
                {STATUS_NEXT[currentStatus] === "ready" ? "标记就绪" : "标记已发布"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <PublishDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        platform={PLATFORM_LABELS[item.platform] || item.platform}
        formatted={currentFormatted}
        onSave={saveFormatted}
        onCopy={copyToClipboard}
      />
    </>
  );
}
