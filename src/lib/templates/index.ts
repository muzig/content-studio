import type { Platform, PlatformTemplate } from "@/lib/types";
import { tweetsTemplate } from "./tweets";
import { xiaohongshuTemplate } from "./xiaohongshu";
import { zhihuTemplate } from "./zhihu";

const templates: Record<Platform, PlatformTemplate> = {
  tweets: tweetsTemplate,
  xiaohongshu: xiaohongshuTemplate,
  zhihu: zhihuTemplate,
};

export function getTemplate(platform: Platform): PlatformTemplate {
  return templates[platform];
}

export function formatForPlatform(platform: Platform, body: string): string {
  return getTemplate(platform).format(body);
}
