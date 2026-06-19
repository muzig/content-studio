"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { EntryCard } from "@/components/entry-card";
import type { Platform } from "@/lib/types";

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

export default function DailyPage() {
  const params = useParams();
  const router = useRouter();
  const date = params.date as string;

  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEntries = useCallback(async () => {
    const res = await fetch(`/api/daily/${date}`);
    const data = await res.json();
    setEntries(data.entries || []);
    setLoading(false);
  }, [date]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  function prevDay() {
    const d = new Date(date);
    d.setDate(d.getDate() - 1);
    router.push(`/daily/${fmt(d)}`);
  }

  function nextDay() {
    const d = new Date(date);
    d.setDate(d.getDate() + 1);
    router.push(`/daily/${fmt(d)}`);
  }

  async function addEntry() {
    const res = await fetch(`/api/daily/${date}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "", body: "" }),
    });
    if (res.ok) {
      fetchEntries();
    }
  }

  async function updateEntry(id: string, data: { title?: string; body?: string }) {
    await fetch(`/api/entries/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  }

  async function deleteEntry(id: string) {
    await fetch(`/api/entries/${id}`, { method: "DELETE" });
    fetchEntries();
  }

  async function generateFormats(id: string, platforms: Platform[]) {
    const res = await fetch(`/api/entries/${id}/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ platforms }),
    });
    if (res.ok) {
      fetchEntries();
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">加载中...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <Button variant="ghost" onClick={prevDay}>
          ◀
        </Button>
        <h2 className="text-xl font-semibold">{date}</h2>
        <Button variant="ghost" onClick={nextDay}>
          ▶
        </Button>
      </div>

      {entries.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg mb-2">还没有条目</p>
          <p className="text-sm">点击下方按钮开始创作</p>
        </div>
      )}

      <div className="space-y-6">
        {entries.map((entry) => (
          <EntryCard
            key={entry.id}
            entry={entry}
            onUpdate={updateEntry}
            onDelete={deleteEntry}
            onGenerate={generateFormats}
          />
        ))}
      </div>

      <div className="mt-6">
        <Button variant="outline" onClick={addEntry}>
          + 新建条目
        </Button>
      </div>
    </div>
  );
}

function fmt(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
