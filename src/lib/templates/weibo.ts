import type { PlatformTemplate } from "@/lib/types";

const EMOJIS = ["😊", "🔥", "💡", "✨", "📌", "🎯", "💪", "🌟", "⚡", "❤️"];

function pickEmoji(index: number): string {
  return EMOJIS[index % EMOJIS.length];
}

function extractTopics(body: string): string[] {
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
    .slice(0, 3)
    .map(([w]) => w);
}

export const weiboTemplate: PlatformTemplate = {
  platform: "weibo",
  maxLength: 2000,
  format(body: string): string {
    const lines = body.split("\n").filter((l) => l.trim());
    const plain = body
      .replace(/#{1,6}\s/g, "")
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .replace(/\*(.*?)\*/g, "$1")
      .replace(/`(.*?)`/g, "$1")
      .replace(/\[(.*?)\]\(.*?\)/g, "$1")
      .trim();

    // 微博风格：保留段落，适当加表情
    const formatted = lines
      .map((line, i) => {
        const clean = line
          .replace(/^[-*+]\s*/, "")
          .replace(/^#+\s*/, "")
          .trim();
        if (!clean) return "";
        // 每隔几行加个表情点缀
        if (i > 0 && i % 3 === 0) {
          return `${pickEmoji(i)} ${clean}`;
        }
        return clean;
      })
      .filter(Boolean)
      .join("\n");

    // 提取话题标签，微博格式为 #话题#
    const topics = extractTopics(body);
    const hashtags = topics.map((t) => `#${t}#`).join(" ");

    // 截断到限制长度
    const result = `${formatted}\n\n${hashtags}`;
    if (result.length <= 2000) return result;
    return result.slice(0, 1997) + "...";
  },
};
