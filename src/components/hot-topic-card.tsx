"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, PenLine, ExternalLink } from "lucide-react";

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
}

export function HotTopicCard({
  hotTopic,
  onDelete,
  onCreateContent,
}: HotTopicCardProps) {
  const tags = hotTopic.tags ? JSON.parse(hotTopic.tags) : [];
  const date = new Date(hotTopic.created_at).toLocaleDateString("zh-CN", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-base mb-1">{hotTopic.title}</CardTitle>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
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
          <div className="flex items-center gap-2">
            {hotTopic.url && (
              <a
                href={hotTopic.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(hotTopic.id)}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {hotTopic.content && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-3">
            {hotTopic.content}
          </p>
        )}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {tags.map((tag: string, index: number) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onCreateContent(hotTopic.id)}
          className="w-full"
        >
          <PenLine className="h-4 w-4 mr-2" />
          创建内容
        </Button>
      </CardContent>
    </Card>
  );
}
