// src/app/api/auth/survey-status/route.ts
/**
 * [파일 역할]
 * - 설문 조사 완료 여부 확인 API
 * - 현재 로그인한 사용자의 설문 완료 상태를 조회
 *
 * [사용되는 위치]
 * - 로그인 후 리다이렉트 경로 결정 시 사용
 * - GET /api/auth/survey-status
 *
 * [주의사항]
 * - 인증이 필요한 엔드포인트
 * - hasSurvey가 false면 설문 페이지로, true면 홈으로 이동
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth, checkMockMode } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/auth/survey-status
 *
 * 설문 조사 완료 여부 확인
 *
 * 응답:
 * - 성공: { hasSurvey: boolean }
 * - 실패: { error: "ERROR_CODE", message: "에러 메시지" }
 */
export async function GET() {
  try {
    // 1. 세션 검증
    const sessionOrError = await requireAuth();
    if (sessionOrError instanceof NextResponse) {
      return sessionOrError; // 401 응답 반환
    }
    const session = sessionOrError;

    // 2. 목업 모드 확인 (관리자 계정)
    if (checkMockMode(session)) {
      console.log("[GET /api/auth/survey-status] 목업 모드: 관리자 계정");
      // 목업 모드에서는 항상 설문 미완료로 반환 (설문 페이지로 이동)
      return NextResponse.json({ hasSurvey: false, mock: true });
    }

    // 3. 사용자 조회
    let user;
    try {
      user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { hasSurvey: true },
      });
    } catch (dbError) {
      console.error("[GET /api/auth/survey-status] DB 조회 실패, 목업 모드로 처리:", dbError);
      // DB 조회 실패 시 목업 모드로 처리
      return NextResponse.json({ hasSurvey: false, mock: true });
    }

    if (!user) {
      return NextResponse.json(
        { error: "USER_NOT_FOUND", message: "사용자를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 4. 설문 상태 반환
    return NextResponse.json({ hasSurvey: user.hasSurvey });
  } catch (error) {
    console.error(
      "[GET /api/auth/survey-status] 설문 상태 조회 실패:",
      error
    );
    return NextResponse.json(
      {
        error: "INTERNAL_ERROR",
        message: "설문 상태 조회 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}
