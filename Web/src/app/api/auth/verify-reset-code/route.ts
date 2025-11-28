// src/app/api/auth/verify-reset-code/route.ts
/**
 * [파일 역할]
 * - 인증코드 확인 API
 * - 6자리 인증코드를 확인하고 비밀번호 재설정 토큰 발급
 * - 인증코드는 한 번만 사용 가능
 *
 * [사용되는 위치]
 * - 비밀번호 찾기 인증코드 입력 페이지에서 호출
 * - POST /api/auth/verify-reset-code
 *
 * [주의사항]
 * - 인증 불필요 (공개 엔드포인트)
 * - 인증코드 유효기간: 10분
 * - 비밀번호 재설정 토큰 유효기간: 30분
 * - 인증코드는 한 번만 사용 가능
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isValidEmail } from "@/lib/utils/validation";
import crypto from "crypto";

/**
 * 비밀번호 재설정 토큰 생성 (랜덤 32바이트 hex 문자열)
 */
function generateResetToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * POST /api/auth/verify-reset-code
 *
 * 인증코드 확인 및 비밀번호 재설정 토큰 발급
 *
 * 요청 필드:
 * - email (required): 이메일 주소
 * - code (required): 6자리 인증코드
 *
 * 응답:
 * - 성공: { success: true, token: string, message: "Verification code confirmed" }
 * - 실패: { error: "ERROR_CODE", message: "에러 메시지" }
 *
 * 참고:
 * - 인증코드 유효기간: 10분
 * - 비밀번호 재설정 토큰 유효기간: 30분
 * - 인증코드는 한 번만 사용 가능 (사용 후 무효화)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, code } = body;

    // 1. 이메일 필드 검증
    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "INVALID_INPUT", message: "Email is required" },
        { status: 400 }
      );
    }

    // 2. 이메일 형식 검증
    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: "INVALID_INPUT", message: "Invalid email format" },
        { status: 400 }
      );
    }

    // 3. 인증코드 형식 검증
    if (!code || typeof code !== "string" || code.length !== 6) {
      return NextResponse.json(
        {
          error: "INVALID_INPUT",
          message: "Verification code must be 6 digits",
        },
        { status: 400 }
      );
    }

    // 4. DB에서 인증코드 조회
    const resetToken = await prisma.passwordResetToken.findFirst({
      where: {
        email,
        code,
        used: false,
      },
      orderBy: {
        createdAt: "desc", // 가장 최근 것 조회
      },
    });

    // 5. 인증코드가 없거나 만료된 경우
    if (!resetToken) {
      return NextResponse.json(
        { error: "INVALID_CODE", message: "Invalid verification code" },
        { status: 400 }
      );
    }

    // 6. 인증코드 만료 확인 (10분)
    const now = new Date();
    if (now > resetToken.expiresAt) {
      return NextResponse.json(
        { error: "EXPIRED_CODE", message: "Verification code has expired" },
        { status: 400 }
      );
    }

    // 7. 비밀번호 재설정 토큰 생성
    const token = generateResetToken();

    // 8. 토큰 만료 시간 설정 (30분 후)
    const tokenExpiresAt = new Date();
    tokenExpiresAt.setMinutes(tokenExpiresAt.getMinutes() + 30);

    // 9. DB 업데이트: 인증코드 사용 처리 및 재설정 토큰 저장
    await prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: {
        used: true,
        token,
        expiresAt: tokenExpiresAt,
      },
    });

    console.log(`[Verify Reset Code] Token generated for ${email}: ${token}`);

    // 10. 성공 응답 (토큰 반환)
    return NextResponse.json({
      success: true,
      token,
      message: "Verification code confirmed",
    });
  } catch (error) {
    console.error(
      "[POST /api/auth/verify-reset-code] 인증코드 확인 실패:",
      error
    );
    return NextResponse.json(
      {
        error: "INTERNAL_ERROR",
        message: "Failed to verify code.",
      },
      { status: 500 }
    );
  }
}
