import type { PlatformTemplate } from "@/lib/types";

export const zhihuTemplate: PlatformTemplate = {
  platform: "zhihu",
  format(body: string): string {
    const lines = body.split("\n").filter((l) => l.trim());
    const title = lines[0]?.replace(/^#+\s*/, "").trim() || "分享";
    const rest = lines.slice(1).join("\n").trim();

    const hasStructure =
      rest.includes("##") || rest.includes("**") || rest.length > 200;

    if (hasStructure) {
      return `关于「${title}」，说说我的看法。\n\n${body}`;
    }

    return `关于「${title}」，说说我的看法。\n\n${rest}\n\n以上是我的观点，欢迎讨论。`;
  },
};
