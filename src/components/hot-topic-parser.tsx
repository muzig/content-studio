"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, Trash2, Plus } from "lucide-react";

interface ParsedTopic {
  title: string;
  content: string;
  tags: string[];
  _editing?: boolean;
}

const STORAGE_KEY = "hot-topic-parser-state";

interface StoredState {
  text: string;
  topics: ParsedTopic[];
  parsedText: string;
  parsing?: boolean;
}

function loadStoredState(): StoredState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveStoredState(state: StoredState) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore quota errors
  }
}

function clearStoredState() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

interface HotTopicParserProps {
  onComplete: () => void;
  onCancel: () => void;
}

export function HotTopicParser({ onComplete, onCancel }: HotTopicParserProps) {
  const stored = loadStoredState();
  const [text, setText] = useState(stored?.text ?? "");
  const [parsing, setParsing] = useState(stored?.parsing ?? false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [topics, setTopics] = useState<ParsedTopic[]>(stored?.topics ?? []);
  // Tracks which text was successfully parsed — determines whether to show results or input view
  const [parsedText, setParsedText] = useState(stored?.parsedText ?? "");

  // Persist to localStorage on change
  useEffect(() => {
    saveStoredState({ text, topics, parsedText, parsing });
  }, [text, topics, parsedText, parsing]);

  // Re-trigger parse if page was refreshed during analysis
  useEffect(() => {
    if (stored?.parsing && text.trim()) {
      handleParse();
    }
  }, []); // only on mount

  // Clear parsedText when text is edited (so stale parse results don't show)
  useEffect(() => {
    if (parsedText && text !== parsedText) {
      setParsedText("");
    }
  }, [text]); // intentionally excludes parsedText to avoid loop

  async function handleParse() {
    if (!text.trim()) return;
    setParsing(true);
    setError("");
    setTopics([]);
    setParsedText("");

    try {
      const res = await fetch("/api/hot-topics/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "解析失败");
        return;
      }

      setTopics(data.topics || []);
      setParsedText(text);
      if (data.topics?.length === 0) {
        setError("未能从文本中解析出热点，请检查文本格式");
      }
    } catch {
      setError("请求失败，请重试");
    } finally {
      setParsing(false);
    }
  }

  function updateTopic(index: number, field: keyof ParsedTopic, value: unknown) {
    setTopics((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  }

  function removeTopic(index: number) {
    setTopics((prev) => prev.filter((_, i) => i !== index));
  }

  function addTopic() {
    setTopics((prev) => [
      ...prev,
      { title: "", content: "", tags: [], _editing: true },
    ]);
  }

  async function handleSaveAll() {
    const validTopics = topics.filter((t) => t.title.trim());
    if (validTopics.length === 0) return;

    setSaving(true);
    try {
      const results = await Promise.all(
        validTopics.map((topic) =>
          fetch("/api/hot-topics", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: topic.title.trim(),
              content: topic.content.trim(),
              tags: topic.tags.length > 0 ? topic.tags : undefined,
              source: "ai-parsed",
            }),
          })
        )
      );

      const allOk = results.every((r) => r.ok);
      if (allOk) {
        clearStoredState();
        onComplete();
      } else {
        setError("部分热点保存失败，请重试");
      }
    } catch {
      setError("保存失败，请重试");
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    clearStoredState();
    onCancel();
  }

  // Show results view if we have parsed topics for the current text
  if ((text === parsedText && topics.length > 0) || parsing) {
    return (
      <div className="space-y-4">
        {error && (
          <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
            {error}
          </div>
        )}

        {parsing ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            AI 正在解析...
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                解析出 {topics.length} 条热点，点击标题可编辑
              </p>
              <Button variant="ghost" size="sm" onClick={addTopic}>
                <Plus className="h-4 w-4 mr-1" />
                手动添加
              </Button>
            </div>

            <div className="space-y-2 max-h-[50vh] overflow-y-auto">
              {topics.map((topic, index) => (
                <TopicRow
                  key={index}
                  topic={topic}
                  onChange={(field, value) => updateTopic(index, field, value)}
                  onRemove={() => removeTopic(index)}
                />
              ))}
            </div>

            <div className="flex items-center gap-2 justify-end pt-2 border-t">
              <Button variant="ghost" onClick={handleCancel}>
                取消
              </Button>
              <Button
                onClick={handleSaveAll}
                disabled={saving || topics.filter((t) => t.title.trim()).length === 0}
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                批量保存 ({topics.filter((t) => t.title.trim()).length})
              </Button>
            </div>
          </>
        )}
      </div>
    );
  }

  // Show input view
  return (
    <div className="space-y-4">
      {error && (
        <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
          {error}
        </div>
      )}

      <Textarea
        placeholder="粘贴热点新闻汇总文本..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={10}
        className="font-mono text-sm"
      />

      <div className="flex items-center gap-2 justify-end">
        <Button variant="ghost" onClick={handleCancel}>
          取消
        </Button>
        <Button onClick={handleParse} disabled={!text.trim() || parsing}>
          {parsing ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Sparkles className="h-4 w-4 mr-2" />
          )}
          AI 解析
        </Button>
      </div>
    </div>
  );
}

function TopicRow({
  topic,
  onChange,
  onRemove,
}: {
  topic: ParsedTopic;
  onChange: (field: keyof ParsedTopic, value: unknown) => void;
  onRemove: () => void;
}) {
  const [editing, setEditing] = useState(topic._editing || false);
  const [tagInput, setTagInput] = useState(topic.tags.join(", "));

  function handleTagInputBlur() {
    const tags = tagInput
      .split(",")
      .map((t: string) => t.trim())
      .filter(Boolean);
    onChange("tags", tags);
  }

  if (editing) {
    return (
      <div className="border rounded-lg p-3 space-y-2 bg-muted/30">
        <Input
          value={topic.title}
          onChange={(e) => onChange("title", e.target.value)}
          placeholder="标题"
          className="font-medium"
        />
        <Textarea
          value={topic.content}
          onChange={(e) => onChange("content", e.target.value)}
          placeholder="内容摘要..."
          rows={2}
          className="text-sm"
        />
        <Input
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onBlur={handleTagInputBlur}
          placeholder="标签（逗号分隔）"
          className="text-sm"
        />
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>
            完成
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="border rounded-lg px-3 py-2 hover:bg-accent/50 transition-colors cursor-pointer group flex items-start justify-between gap-2"
      onClick={() => setEditing(true)}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="font-medium text-sm truncate">{topic.title}</span>
          {topic.tags.slice(0, 3).map((tag, i) => (
            <Badge key={i} variant="secondary" className="text-xs shrink-0">
              {tag}
            </Badge>
          ))}
        </div>
        {topic.content && (
          <p className="text-xs text-muted-foreground line-clamp-1">
            {topic.content}
          </p>
        )}
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
      >
        <Trash2 className="h-3.5 w-3.5 text-destructive" />
      </Button>
    </div>
  );
}
