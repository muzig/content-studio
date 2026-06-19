import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  baseURL: process.env.ANTHROPIC_BASE_URL,
});

interface PlatformRule {
  platform: string;
  label: string;
  style: string;
  structure: string;
  constraints: string;
}

interface GenerateOptions {
  hotTopic: string;
  userComment: string;
  platformRule: PlatformRule;
}

function getAdaptiveMode(comment: string): string {
  if (!comment) return "创作";
  if (comment.length > 200) return "润色";
  if (comment.length > 50) return "展开";
  return "创作";
}

function buildPrompt(options: GenerateOptions): string {
  const { hotTopic, userComment, platformRule } = options;
  const constraints = JSON.parse(platformRule.constraints);
  const adaptiveMode = getAdaptiveMode(userComment);

  const systemPrompt = `你是一个专业的内容创作者。你需要根据热点话题和用户的评论，为指定平台生成优质内容。

当前平台：${platformRule.label}

平台规则：
- 风格：${platformRule.style}
- 结构：${platformRule.structure}
- 约束：
  - 最大字数：${constraints.maxLength || "无限制"}
  - Emoji 使用：${constraints.emojiUsage || "适量"}
  - 语气：${constraints.tone || "自然"}

适配模式：${adaptiveMode}
${
  adaptiveMode === "润色"
    ? "用户已经写了详细的评论，请润色优化并适配到该平台风格。"
    : adaptiveMode === "展开"
      ? "用户提供了核心观点，请展开论述并适配到该平台风格。"
      : "用户只提供了方向或没有评论，请基于热点创作内容，保留用户的核心观点（如果有）。"
}

请直接输出内容，不要添加任何解释或前缀。`;

  const userMessage = `热点话题：
${hotTopic}

${userComment ? `我的评论/想法：\n${userComment}` : "请基于热点创作内容。"}`;

  return JSON.stringify({ system: systemPrompt, user: userMessage });
}

export async function generateForPlatform(
  hotTopic: string,
  userComment: string,
  platformRule: PlatformRule
): Promise<string> {
  const { system, user } = JSON.parse(
    buildPrompt({ hotTopic, userComment, platformRule })
  );

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    system,
    messages: [{ role: "user", content: user }],
  });

  const textBlock = message.content.find((block) => block.type === "text");
  return textBlock ? textBlock.text : "";
}

export async function generateForAllPlatforms(
  hotTopic: string,
  userComment: string,
  platformRules: PlatformRule[]
): Promise<Record<string, string>> {
  const results = await Promise.all(
    platformRules.map(async (rule) => {
      try {
        const content = await generateForPlatform(hotTopic, userComment, rule);
        return { platform: rule.platform, content };
      } catch (error) {
        console.error(`Error generating for ${rule.platform}:`, error);
        return { platform: rule.platform, content: "" };
      }
    })
  );

  return results.reduce(
    (acc, { platform, content }) => {
      acc[platform] = content;
      return acc;
    },
    {} as Record<string, string>
  );
}
