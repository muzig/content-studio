import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const DEFAULT_RULES: Record<string, { style: string; structure: string; constraints: string }> = {
  x: {
    style: "简洁有力，观点鲜明，直击要点。语言精炼，避免冗余。",
    structure:
      "单条推文280字以内；长内容可用thread拆分，每条独立可读；开头吸引注意力，结尾引发互动。",
    constraints: JSON.stringify({
      maxLength: 280,
      threadSupport: true,
      emojiUsage: "minimal",
      hashtagLimit: 3,
      tone: "concise",
    }),
  },
  weibo: {
    style: "轻松活泼，贴近生活，善用网络热词和表情。观点表达直接，互动感强。",
    structure:
      "开头引人注目 → 正文表达观点（可分段）→ 适当使用表情点缀 → 话题标签2-3个（#话题#格式）→ 结尾可引导转发评论。",
    constraints: JSON.stringify({
      maxLength: 2000,
      emojiUsage: "moderate",
      hashtagRange: [2, 3],
      hashtagFormat: "#topic#",
      paragraphLength: "short",
      tone: "casual",
    }),
  },
  xiaohongshu: {
    style: "轻松亲切，有代入感，像朋友聊天。善用感叹词和语气词，营造真实感。",
    structure:
      "标题吸睛（可用emoji开头）→ 正文分段（每段2-3句）→ 关键信息加粗 → 结尾互动引导（提问/投票）→ 标签5-10个。",
    constraints: JSON.stringify({
      maxLength: 1000,
      emojiUsage: "rich",
      hashtagRange: [5, 10],
      paragraphLength: "short",
      tone: "casual",
    }),
  },
  zhihu: {
    style: "专业深度，逻辑清晰，有理有据。语言严谨但不枯燥，适当引用数据或案例。",
    structure:
      "开篇点题（直接回答/表明立场）→ 分论点展开（2-3个）→ 每个论点配论据/案例 → 总结升华 → 可选：延伸思考/行动建议。",
    constraints: JSON.stringify({
      maxLength: 5000,
      emojiUsage: "none",
      hashtagLimit: 0,
      paragraphLength: "medium",
      tone: "professional",
      requireLogic: true,
    }),
  },
};

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ platform: string }> }
) {
  const { platform } = await params;

  const rule = await prisma.platformRule.findUnique({
    where: { platform },
  });

  if (!rule) {
    return NextResponse.json(
      { error: "Platform rule not found" },
      { status: 404 }
    );
  }

  const defaultRule = DEFAULT_RULES[platform];

  if (!defaultRule) {
    return NextResponse.json(
      { error: "No default rule for this platform" },
      { status: 400 }
    );
  }

  const updated = await prisma.platformRule.update({
    where: { platform },
    data: {
      ...defaultRule,
      is_preset: true,
    },
  });

  return NextResponse.json({ rule: updated });
}
