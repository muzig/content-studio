export type Platform = "tweets" | "xiaohongshu" | "zhihu";

export type PublishStatus = "draft" | "ready" | "published";

export const PLATFORMS: { value: Platform; label: string }[] = [
  { value: "tweets", label: "推文" },
  { value: "xiaohongshu", label: "小红书" },
  { value: "zhihu", label: "知乎" },
];

export interface PlatformTemplate {
  platform: Platform;
  maxLength?: number;
  format(body: string): string;
}
