import type { PlatformTemplate } from "@/lib/types";

function stripMarkdown(text: string): string {
  return text
    .replace(/#{1,6}\s/g, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/`(.*?)`/g, "$1")
    .replace(/\[(.*?)\]\(.*?\)/g, "$1")
    .replace(/^[-*+]\s/gm, "")
    .trim();
}

export const gongzhonghaoTemplate: PlatformTemplate = {
  platform: "gongzhonghao",
  maxLength: 5000,
  format(body: string): string {
    const clean = stripMarkdown(body);
    const lines = clean.split("\n").filter((l) => l.trim());

    // 公众号风格：段落分明，适合深度阅读
    // 每段之间空一行，保留原始结构
    const formatted = lines
      .map((line) => {
        const trimmed = line.trim();
        // 保留标题行的强调感
        if (/^[一二三四五六七八九十]+[、.．]/.test(trimmed)) {
          return `\n【${trimmed}】`;
        }
        // 数字序号标题
        if (/^\d+[、.．)\s]/.test(trimmed)) {
          return `\n${trimmed}`;
        }
        return trimmed;
      })
      .join("\n");

    // 截断到限制长度
    if (formatted.length <= 5000) return formatted;
    return formatted.slice(0, 4997) + "...";
  },
};
