import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const rules = await prisma.platformRule.findMany({
    orderBy: { platform: "asc" },
  });

  return NextResponse.json({ rules });
}
