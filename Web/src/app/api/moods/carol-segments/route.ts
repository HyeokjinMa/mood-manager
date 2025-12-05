/**
 * GET /api/moods/carol-segments
 * 
 * 초기 콜드스타트용 캐롤 세그먼트 3개 조회 API
 * 서버 사이드에서만 실행 (Prisma 사용)
 */

import { NextResponse } from "next/server";
import { getInitialColdStartSegments } from "@/lib/mock/getInitialColdStartSegments";

export async function GET() {
  try {
    const segments = await getInitialColdStartSegments();
    return NextResponse.json({ segments });
  } catch (error) {
    console.error("[GET /api/moods/carol-segments] 에러:", error);
    return NextResponse.json(
      { error: "Failed to fetch carol segments" },
      { status: 500 }
    );
  }
}

