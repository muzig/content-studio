import type { PlatformTemplate } from "@/lib/types";

export const xTemplate: PlatformTemplate = {
  platform: "x",
  maxLength: 280,
  format(body: string): string {
    const plain = body
      .replace(/#{1,6}\s/g, "")
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .replace(/\*(.*?)\*/g, "$1")
      .replace(/`(.*?)`/g, "$1")
      .replace(/\[(.*?)\]\(.*?\)/g, "$1")
      .replace(/^\s*[-*+]\s/gm, "")
      .replace(/^\s*\d+\.\s/gm, "")
      .replace(/\n+/g, " ")
      .trim();

    const sentences = plain.split(/[。！？.!?]/).filter((s) => s.trim());
    const firstSentence = sentences[0]?.trim() || plain;

    if (firstSentence.length <= 280) return firstSentence;
    return firstSentence.slice(0, 277) + "...";
  },
};
