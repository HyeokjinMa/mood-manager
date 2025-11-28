// src/app/api/preferences/route.ts
/**
 * [파일 역할]
 * - 사용자 선호도 저장 및 조회 API
 * - 설문 완료 시 선호도를 DB에 저장
 * - LLM Input 형식(Record<string, '+' | '-'>)으로 저장
 *
 * [사용되는 위치]
 * - POST /api/preferences: 설문 완료 시 선호도 저장
 * - GET /api/preferences: 사용자 선호도 조회
 *
 * [주의사항]
 * - 인증이 필요한 엔드포인트
 * - 선호도는 JSON 형식으로 저장 (scentPreferences, colorPreferences, musicPreferences)
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth, checkMockMode } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/preferences
 *
 * 사용자 선호도 조회
 *
 * 응답:
 * - 성공: { success: true, preferences: {...} }
 * - 실패: { error: "ERROR_CODE", message: "에러 메시지" }
 */
export async function GET() {
  try {
    // 1. 세션 검증
    const sessionOrError = await requireAuth();
    if (sessionOrError instanceof NextResponse) {
      return sessionOrError;
    }
    const session = sessionOrError;

    // 2. 목업 모드 확인 (관리자 계정)
    if (checkMockMode(session)) {
      console.log("[GET /api/preferences] 목업 모드: 관리자 계정");
      // 목업 선호도 반환
      return NextResponse.json({
        success: true,
        preferences: {
          scentLiked: "Citrus,Floral,Woody",
          scentDisliked: null,
          colorLiked: "warmWhite,skyBlue",
          colorDisliked: null,
          musicLiked: "newage,classical",
          musicDisliked: null,
        },
        mock: true,
      });
    }

    // 3. 선호도 조회
    let preferences;
    try {
      preferences = await prisma.userPreferences.findUnique({
        where: { userId: session.user.id },
      });
    } catch (dbError) {
      console.error("[GET /api/preferences] DB 조회 실패, 목업 데이터 반환:", dbError);
      // 목업 선호도 반환
      return NextResponse.json({
        success: true,
        preferences: {
          scentLiked: "Citrus,Floral,Woody",
          scentDisliked: null,
          colorLiked: "warmWhite,skyBlue",
          colorDisliked: null,
          musicLiked: "newage,classical",
          musicDisliked: null,
        },
        mock: true,
      });
    }

    return NextResponse.json({
      success: true,
      preferences: preferences || null,
    });
  } catch (error) {
    console.error("[GET /api/preferences] 선호도 조회 실패:", error);
    return NextResponse.json(
      {
        error: "INTERNAL_ERROR",
        message: "선호도 조회 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/preferences
 *
 * 사용자 선호도 저장 (설문 완료 시)
 *
 * 요청:
 * {
 *   "scentLiked": ["Citrus", "Floral", "Woody"],
 *   "scentDisliked": ["Musk", "Leathery"],
 *   "colorLiked": ["warmWhite", "skyBlue"],
 *   "colorDisliked": ["red"],
 *   "musicLiked": ["newage", "classical"],
 *   "musicDisliked": ["jazz"]
 * }
 *
 * 응답:
 * - 성공: { success: true }
 * - 실패: { error: "ERROR_CODE", message: "에러 메시지" }
 */
export async function POST(request: NextRequest) {
  try {
    // 1. 세션 검증
    const sessionOrError = await requireAuth();
    if (sessionOrError instanceof NextResponse) {
      return sessionOrError;
    }
    const session = sessionOrError;

    // 2. 목업 모드 확인 (관리자 계정)
    if (checkMockMode(session)) {
      console.log("[POST /api/preferences] 목업 모드: 관리자 계정");
      // 목업 모드에서는 저장하지 않고 성공 응답만 반환
      return NextResponse.json({ success: true, mock: true });
    }

    // 3. 요청 본문 파싱
    const body = await request.json();
    const {
      scentLiked,
      scentDisliked,
      colorLiked,
      colorDisliked,
      musicLiked,
      musicDisliked,
    } = body;

    // 4. 배열을 쉼표로 구분된 문자열로 변환
    const scentLikedStr = Array.isArray(scentLiked) ? scentLiked.join(',') : (typeof scentLiked === 'string' ? scentLiked : null);
    const scentDislikedStr = Array.isArray(scentDisliked) ? scentDisliked.join(',') : (typeof scentDisliked === 'string' ? scentDisliked : null);
    const colorLikedStr = Array.isArray(colorLiked) ? colorLiked.join(',') : (typeof colorLiked === 'string' ? colorLiked : null);
    const colorDislikedStr = Array.isArray(colorDisliked) ? colorDisliked.join(',') : (typeof colorDisliked === 'string' ? colorDisliked : null);
    const musicLikedStr = Array.isArray(musicLiked) ? musicLiked.join(',') : (typeof musicLiked === 'string' ? musicLiked : null);
    const musicDislikedStr = Array.isArray(musicDisliked) ? musicDisliked.join(',') : (typeof musicDisliked === 'string' ? musicDisliked : null);

    // 5. 선호도 저장 (upsert)
    try {
      await prisma.userPreferences.upsert({
        where: { userId: session.user.id },
        create: {
          userId: session.user.id,
          scentLiked: scentLikedStr,
          scentDisliked: scentDislikedStr,
          colorLiked: colorLikedStr,
          colorDisliked: colorDislikedStr,
          musicLiked: musicLikedStr,
          musicDisliked: musicDislikedStr,
        },
        update: {
          scentLiked: scentLikedStr,
          scentDisliked: scentDislikedStr,
          colorLiked: colorLikedStr,
          colorDisliked: colorDislikedStr,
          musicLiked: musicLikedStr,
          musicDisliked: musicDislikedStr,
        },
      });

      // 6. User.hasSurvey 업데이트
      await prisma.user.update({
        where: { id: session.user.id },
        data: { hasSurvey: true },
      });
    } catch (dbError) {
      console.error("[POST /api/preferences] DB 저장 실패, 목업 모드로 처리:", dbError);
      // DB 저장 실패 시 목업 모드로 처리
      return NextResponse.json({ success: true, mock: true });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[POST /api/preferences] 선호도 저장 실패:", error);
    return NextResponse.json(
      {
        error: "INTERNAL_ERROR",
        message: "선호도 저장 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}
