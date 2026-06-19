import type { PlatformTemplate } from "@/lib/types";

const EMOJIS = ["💡", "🔥", "✨", "📌", "🎯", "💪", "🌟", "⚡", "🚀", "❤️"];

function pickEmoji(index: number): string {
  return EMOJIS[index % EMOJIS.length];
}

function extractKeywords(body: string): string[] {
  const words = body
    .replace(/[^一-鿿a-zA-Z0-9]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 2);
  const freq = new Map<string, number>();
  for (const w of words) {
    freq.set(w, (freq.get(w) || 0) + 1);
  }
  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([w]) => w);
}

export const xiaohongshuTemplate: PlatformTemplate = {
  platform: "xiaohongshu",
  format(body: string): string {
    const lines = body.split("\n").filter((l) => l.trim());
    const title = lines[0]?.replace(/^#+\s*/, "").trim() || "分享";

    const bodyLines = lines.slice(1);
    const formatted = bodyLines
      .map((line, i) => {
        const clean = line.replace(/^[-*+]\s*/, "").trim();
        if (!clean) return "";
        return `${pickEmoji(i + 1)} ${clean}`;
      })
      .filter(Boolean)
      .join("\n\n");

    const keywords = extractKeywords(body);
    const tags = keywords.map((k) => `#${k}`).join(" ");

    return `🔥 ${title}\n\n${formatted}\n\n${tags}`;
  },
};
