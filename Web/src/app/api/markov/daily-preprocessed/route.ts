import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureDailySlotsForUser } from "@/backend/jobs/dailyPreprocessedSlots";

/**
 * GET /api/markov/daily-preprocessed
 *  - query: userId, date=YYYY-MM-DD
 *  - 하루(0~143) DailyPreprocessedSlot 을 그대로 반환 (마르코프 서버/디버그용)
 *
 * POST /api/markov/daily-preprocessed
 *  - body: { userId: string, date: string(YYYY-MM-DD) }
 *  - 해당 날짜에 144개 목업 슬롯이 없으면 기본값으로 채워 넣는다.
 */

function parseDate(dateStr: string): Date {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) {
    throw new Error("Invalid date");
  }
  // 자정으로 정규화 (DB 스키마와 맞춤)
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const dateStr = searchParams.get("date");

    if (!userId || !dateStr) {
      return NextResponse.json(
        { error: "userId and date are required" },
        { status: 400 }
      );
    }

    const date = parseDate(dateStr);

    const slots = await prisma.dailyPreprocessedSlot.findMany({
      where: { userId, date },
      orderBy: { slotIndex: "asc" },
    });

    return NextResponse.json({
      userId,
      date: dateStr,
      count: slots.length,
      // 마르코프 빌드 스크립트에서는 rows 배열을 기대한다.
      rows: slots,
    });
  } catch (error) {
    console.error("[GET /api/markov/daily-preprocessed] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch daily preprocessed slots" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      userId?: string;
      date?: string;
    };

    const userId = body.userId;
    const dateStr = body.date;

    if (!userId || !dateStr) {
      return NextResponse.json(
        { error: "userId and date are required" },
        { status: 400 }
      );
    }

    const date = parseDate(dateStr);

    await ensureDailySlotsForUser(userId, date);

    const count = await prisma.dailyPreprocessedSlot.count({
      where: { userId, date },
    });

    return NextResponse.json({
      userId,
      date: dateStr,
      count,
    });
  } catch (error) {
    console.error("[POST /api/markov/daily-preprocessed] Error:", error);
    return NextResponse.json(
      { error: "Failed to ensure daily preprocessed slots" },
      { status: 500 }
    );
  }
}


