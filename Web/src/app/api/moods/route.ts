import { NextRequest, NextResponse } from "next/server";

/**
 * 이 파일은 사용되지 않습니다.
 * 
 * 무드 관련 API는 다음 경로에 있습니다:
 * - GET/PUT /api/moods/current
 * - PUT /api/moods/current/scent
 * - PUT /api/moods/current/song
 * - PUT /api/moods/current/color
 * 
 * 참고: Next.js App Router에서는 각 경로별로 route.ts 파일을 생성합니다.
 */

// 빈 export로 모듈로 인식되도록 함 (실제로는 사용되지 않음)
export async function GET() {
  return NextResponse.json(
    { message: "This endpoint is not used. See /api/moods/current" },
    { status: 404 }
  );
}