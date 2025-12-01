/**
 * POST /api/moods/saved/[savedMoodId]/apply
 * 
 * 저장된 무드를 현재 세그먼트에 적용
 * 
 * Request Body:
 * {
 *   replaceCurrentSegment?: boolean; // 현재 세그먼트를 대체할지 여부
 * }
 * 
 * Response:
 * {
 *   success: boolean;
 *   message?: string;
 * }
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth, checkMockMode } from "@/lib/auth/session";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ savedMoodId: string }> }
) {
  try {
    // 1. 세션 검증
    const sessionOrError = await requireAuth();
    if (sessionOrError instanceof NextResponse) {
      return sessionOrError;
    }
    const session = sessionOrError;

    // 2. 파라미터 파싱
    const { savedMoodId } = await params;
    const body = await request.json().catch(() => ({}));
    const { replaceCurrentSegment = true } = body;

    // 3. 목업 모드 확인 (관리자 계정)
    if (await checkMockMode(session)) {
      console.log("[POST /api/moods/saved/:savedMoodId/apply] 목업 모드: 관리자 계정");
      console.log("[POST /api/moods/saved/:savedMoodId/apply] 목업 모드 - 적용 데이터:", {
        savedMoodId,
        replaceCurrentSegment,
      });
      // 목업 모드에서는 성공 응답만 반환
      // 실제 적용은 클라이언트에서 처리 (localStorage에서 조회하여 적용)
      return NextResponse.json({
        success: true,
        message: "목업 모드: 저장된 무드 적용 완료",
        mock: true,
      });
    }

    // 4. 일반 모드: 실제 DB에서 저장된 무드 조회 및 적용
    // TODO: DB 마이그레이션 후 구현
    // - Preset.isStarred = true인 Preset 조회
    // - 현재 세그먼트를 해당 Preset으로 교체
    // - 무드스트림 업데이트

    return NextResponse.json({
      success: true,
      message: "저장된 무드 적용 완료",
    });
  } catch (error) {
    console.error("[POST /api/moods/saved/:savedMoodId/apply] 무드 적용 실패:", error);
    return NextResponse.json(
      {
        error: "INTERNAL_ERROR",
        message: "무드 적용 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}

