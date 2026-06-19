import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ date: string }> }
) {
  const { date } = await params;

  const dailyNote = await prisma.dailyNote.findUnique({
    where: { date },
    include: {
      entries: {
        orderBy: { sequence: "asc" },
        include: { platforms: true },
      },
    },
  });

  if (!dailyNote) {
    return NextResponse.json({ date, entries: [] });
  }

  return NextResponse.json(dailyNote);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ date: string }> }
) {
  const { date } = await params;
  const body = await request.json();
  const { title, body: entryBody } = body;

  let dailyNote = await prisma.dailyNote.findUnique({ where: { date } });
  if (!dailyNote) {
    dailyNote = await prisma.dailyNote.create({ data: { date } });
  }

  const maxSeq = await prisma.contentEntry.aggregate({
    where: { daily_note_id: dailyNote.id },
    _max: { sequence: true },
  });
  const nextSeq = (maxSeq._max.sequence || 0) + 1;

  const entry = await prisma.contentEntry.create({
    data: {
      daily_note_id: dailyNote.id,
      sequence: nextSeq,
      title: title || null,
      body: entryBody || "",
    },
    include: { platforms: true },
  });

  return NextResponse.json(entry, { status: 201 });
}
