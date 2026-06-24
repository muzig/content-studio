import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL || "file:./dev.db",
});
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding platform rules...");

  const rules = [
    {
      platform: "x",
      label: "X",
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
    {
      platform: "weibo",
      label: "微博",
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
    {
      platform: "xiaohongshu",
      label: "小红书",
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
    {
      platform: "zhihu",
      label: "知乎",
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
    {
      platform: "gongzhonghao",
      label: "公众号",
      style: "深度思考，观点独到，有信息增量。语言流畅易读，适合碎片化阅读场景。",
      structure:
        "引人入胜的开头（故事/问题/数据）→ 核心观点阐述 → 分层论证（2-3个要点）→ 每个要点配案例或数据 → 总结金句收尾 → 可选：延伸思考。",
      constraints: JSON.stringify({
        maxLength: 5000,
        emojiUsage: "minimal",
        hashtagLimit: 0,
        paragraphLength: "medium",
        tone: "thoughtful",
        requireStructure: true,
      }),
    },
  ];

  for (const rule of rules) {
    await prisma.platformRule.upsert({
      where: { platform: rule.platform },
      update: rule,
      create: rule,
    });
    console.log(`  ✓ ${rule.label} (${rule.platform})`);
  }

  // Clean up legacy tweets platform
  try {
    // Remove old tweets rule if it exists (we now use 'x')
    const deletedRule = await prisma.platformRule.deleteMany({
      where: { platform: "tweets" },
    });
    if (deletedRule.count > 0) {
      console.log(`  ✓ Removed ${deletedRule.count} legacy tweets rule`);
    }

    // Migrate any tweets platform content to x
    const migrated = await prisma.platformContent.updateMany({
      where: { platform: "tweets" },
      data: { platform: "x" },
    });
    if (migrated.count > 0) {
      console.log(`  ✓ Migrated ${migrated.count} tweets records to x`);
    }
  } catch {
    // Tables might not have data yet
  }

  console.log("Seeding complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
