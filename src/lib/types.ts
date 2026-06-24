export type Platform = "x" | "weibo" | "xiaohongshu" | "zhihu";

export type PublishStatus = "draft" | "ready" | "published";

export const PLATFORMS: { value: Platform; label: string }[] = [
  { value: "x", label: "X" },
  { value: "weibo", label: "微博" },
  { value: "xiaohongshu", label: "小红书" },
  { value: "zhihu", label: "知乎" },
];

export interface PlatformTemplate {
  platform: Platform;
  maxLength?: number;
  format(body: string): string;
}
