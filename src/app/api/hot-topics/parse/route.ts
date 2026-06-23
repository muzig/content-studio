import { NextRequest, NextResponse } from "next/server";
import { parseHotTopics } from "@/lib/ai";

export async function POST(request: NextRequest) {
  const { text } = await request.json();

  if (!text || !text.trim()) {
    return NextResponse.json({ error: "请提供文本内容" }, { status: 400 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "AI 服务未配置（缺少 ANTHROPIC_API_KEY）" },
      { status: 500 }
    );
  }

  try {
    const topics = await parseHotTopics(text);
    return NextResponse.json({ topics });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Parse hot topics error:", message);
    return NextResponse.json(
      { error: `AI 解析失败: ${message}` },
      { status: 500 }
    );
  }
}
