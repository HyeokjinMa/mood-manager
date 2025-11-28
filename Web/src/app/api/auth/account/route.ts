// src/app/api/auth/account/route.ts
/**
 * [파일 역할]
 * - 회원탈퇴 API 엔드포인트
 * - 사용자 계정 삭제 및 관련 데이터 제거
 *
 * [사용되는 위치]
 * - 마이페이지의 회원탈퇴 기능에서 호출
 * - DELETE /api/auth/account
 *
 * [주의사항]
 * - 인증이 필요한 엔드포인트
 * - confirmText가 "I understand"와 정확히 일치해야 함
 * - Cascade 삭제로 관련 데이터도 함께 삭제됨 (Device, Preset, Inquiry 등)
 * - UUID 사용으로 ID 고갈 걱정 없음
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

/**
 * DELETE /api/auth/account
 *
 * 회원탈퇴 처리
 *
 * 요청 필드:
 * - confirmText (required): 확인 텍스트 (반드시 "I understand"여야 함)
 *
 * 응답:
 * - 성공: { success: true, message: "Account deleted successfully" }
 * - 실패: { error: "ERROR_CODE", message: "에러 메시지" }
 */
export async function DELETE(request: NextRequest) {
  try {
    // 1. 세션 검증
    const sessionOrError = await requireAuth();
    if (sessionOrError instanceof NextResponse) {
      return sessionOrError; // 401 응답 반환
    }
    const session = sessionOrError as { user: { id: string; email: string } };

    // 2. 요청 본문 파싱
    const body = await request.json();
    const { confirmText } = body;

    // 3. confirmText 검증
    if (confirmText !== "I understand") {
      return NextResponse.json(
        {
          error: "INVALID_INPUT",
          message: "확인 텍스트가 일치하지 않습니다.",
        },
        { status: 400 }
      );
    }

    // 4. 사용자 삭제 (Cascade로 관련 데이터도 함께 삭제)
    if (!session.user?.id) {
      return NextResponse.json(
        { error: "UNAUTHORIZED", message: "인증이 필요합니다." },
        { status: 401 }
      );
    }
    await prisma.user.delete({
      where: { id: session.user.id },
    });

    // 5. 성공 응답
    return NextResponse.json({
      success: true,
      message: "Account deleted successfully",
    });
  } catch (error) {
    console.error("[DELETE /api/auth/account] 회원탈퇴 실패:", error);
    return NextResponse.json(
      {
        error: "INTERNAL_ERROR",
        message: "회원탈퇴 처리 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}
