// src/app/api/inquiry/route.ts
/**
 * [파일 역할]
 * - 1:1 문의 제출 API 엔드포인트
 * - 사용자 문의를 DB에 저장
 *
 * [사용되는 위치]
 * - 마이페이지의 1:1 문의 페이지에서 호출
 * - POST /api/inquiry
 *
 * [주의사항]
 * - 인증이 필요한 엔드포인트
 * - subject와 message는 필수 입력 항목
 * - 문의는 관리자가 확인 후 답변 가능
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { validateRequiredFields } from "@/lib/utils/validation";

/**
 * POST /api/inquiry
 *
 * 1:1 문의 제출
 *
 * 요청 필드:
 * - subject (required): 문의 제목
 * - message (required): 문의 내용
 *
 * 응답:
 * - 성공: { success: true, inquiryId: string }
 * - 실패: { error: "ERROR_CODE", message: "에러 메시지" }
 */
export async function POST(request: NextRequest) {
  try {
    // 1. 세션 검증
    const sessionOrError = await requireAuth();
    if (sessionOrError instanceof NextResponse) {
      return sessionOrError; // 401 응답 반환
    }
    const session = sessionOrError;

    // 2. 요청 본문 파싱
    const body = await request.json();

    // 3. 필수 필드 검증
    const validation = validateRequiredFields(body, ["subject", "message"]);
    if (!validation.valid) {
      return NextResponse.json(
        {
          error: "INVALID_INPUT",
          message: "문의 제목과 내용은 필수 입력 항목입니다.",
        },
        { status: 400 }
      );
    }

    const { subject, message } = body;

    // 4. 문의 생성
    const inquiry = await prisma.inquiry.create({
      data: {
        userId: session.user.id,
        subject: subject.trim(),
        message: message.trim(),
      },
    });

    // 5. 성공 응답
    return NextResponse.json({
      success: true,
      inquiryId: `inquiry-${inquiry.id}`,
    });
  } catch (error) {
    console.error("[POST /api/inquiry] 문의 제출 실패:", error);
    return NextResponse.json(
      {
        error: "INTERNAL_ERROR",
        message: "문의 제출 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}
