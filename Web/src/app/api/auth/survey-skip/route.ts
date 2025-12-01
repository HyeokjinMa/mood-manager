// src/app/api/auth/survey-skip/route.ts
/**
 * 설문 조사 건너뛰기 API
 * 
 * 설문을 건너뛰고 hasSurvey를 true로 설정
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth, checkMockMode } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    // 1. 세션 검증
    const sessionOrError = await requireAuth();
    if (sessionOrError instanceof NextResponse) {
      return sessionOrError;
    }
    const session = sessionOrError;

    // 2. 목업 모드 확인 (관리자 계정)
    if (await checkMockMode(session)) {
      console.log("[POST /api/auth/survey-skip] 목업 모드: 관리자 계정");
      return NextResponse.json({ success: true, mock: true });
    }

    // 3. hasSurvey를 true로 설정
    try {
      await prisma.user.update({
        where: { id: session.user.id },
        data: { hasSurvey: true },
      });
    } catch (dbError) {
      console.error("[POST /api/auth/survey-skip] DB 업데이트 실패:", dbError);
      // 목업 모드로 처리
      return NextResponse.json({ success: true, mock: true });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[POST /api/auth/survey-skip] 설문 건너뛰기 실패:", error);
    return NextResponse.json(
      {
        error: "INTERNAL_ERROR",
        message: "설문 건너뛰기 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}

