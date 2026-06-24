import type { Platform, PlatformTemplate } from "@/lib/types";
import { xTemplate } from "./x";
import { weiboTemplate } from "./weibo";
import { xiaohongshuTemplate } from "./xiaohongshu";
import { zhihuTemplate } from "./zhihu";
import { gongzhonghaoTemplate } from "./gongzhonghao";

const templates: Record<Platform, PlatformTemplate> = {
  x: xTemplate,
  weibo: weiboTemplate,
  xiaohongshu: xiaohongshuTemplate,
  zhihu: zhihuTemplate,
  gongzhonghao: gongzhonghaoTemplate,
};

export function getTemplate(platform: Platform): PlatformTemplate {
  return templates[platform];
}

export function formatForPlatform(platform: Platform, body: string): string {
  return getTemplate(platform).format(body);
}
