/**
 * GET /api/moods/carol-segments
 * 
 * 초기 콜드스타트용 캐롤 세그먼트 3개 조회 API
 * 서버 사이드에서만 실행 (Prisma 사용)
 */

import { NextResponse } from "next/server";
import { getInitialColdStartSegments } from "@/lib/mock/getInitialColdStartSegments";

export async function GET() {
  console.log("[GET /api/moods/carol-segments] 🔄 API 호출 시작");
  try {
    // 동기 함수로 변경되어 await 불필요하지만, 호환성을 위해 유지
    const segments = getInitialColdStartSegments();
    console.log("[GET /api/moods/carol-segments] ✅ 하드코딩된 초기 3세그먼트 반환:", {
      segmentsCount: segments.length,
      firstSegmentMood: segments[0]?.mood?.name,
      firstSegmentColor: segments[0]?.mood?.color,
    });
    return NextResponse.json({ segments });
  } catch (error) {
    console.error("[GET /api/moods/carol-segments] ❌ 에러:", error);
    return NextResponse.json(
      { error: "Failed to fetch carol segments" },
      { status: 500 }
    );
  }
}

