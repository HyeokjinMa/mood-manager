// src/app/api/auth/reset-password/route.ts
/**
 * [파일 역할]
 * - 비밀번호 재설정 API
 * - 재설정 토큰을 확인하고 새 비밀번호로 변경
 * - 토큰은 한 번만 사용 가능
 *
 * [사용되는 위치]
 * - 비밀번호 재설정 페이지에서 호출
 * - POST /api/auth/reset-password
 *
 * [주의사항]
 * - 인증 불필요 (토큰 기반 인증)
 * - 토큰 유효기간: 30분
 * - 토큰은 한 번만 사용 가능
 * - 비밀번호는 해시 처리하여 저장
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, validatePasswordStrength } from "@/lib/auth/password";
import { isValidEmail } from "@/lib/utils/validation";

/**
 * POST /api/auth/reset-password
 *
 * 비밀번호 재설정
 *
 * 요청 필드:
 * - email (required): 이메일 주소
 * - token (required): 비밀번호 재설정 토큰
 * - newPassword (required): 새 비밀번호 (최소 6자)
 *
 * 응답:
 * - 성공: { success: true, message: "Password has been reset successfully" }
 * - 실패: { error: "ERROR_CODE", message: "에러 메시지" }
 *
 * 참고:
 * - 토큰 유효기간: 30분
 * - 토큰은 한 번만 사용 가능 (사용 후 무효화)
 * - 비밀번호는 해시 처리하여 저장
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, token, newPassword } = body;

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

    // 3. 토큰 필드 검증
    if (!token || typeof token !== "string") {
      return NextResponse.json(
        { error: "INVALID_INPUT", message: "Token is required" },
        { status: 400 }
      );
    }

    // 4. 새 비밀번호 검증
    if (!newPassword || typeof newPassword !== "string") {
      return NextResponse.json(
        { error: "INVALID_INPUT", message: "New password is required" },
        { status: 400 }
      );
    }

    // 5. 비밀번호 강도 검증
    const passwordValidation = validatePasswordStrength(newPassword);
    if (!passwordValidation.valid) {
      return NextResponse.json(
        {
          error: "WEAK_PASSWORD",
          message: passwordValidation.message,
        },
        { status: 400 }
      );
    }

    // 6. DB에서 재설정 토큰 조회
    const resetToken = await prisma.passwordResetToken.findFirst({
      where: {
        email,
        token,
        used: true, // verify-reset-code에서 used: true로 설정됨
      },
      orderBy: {
        createdAt: "desc", // 가장 최근 것 조회
      },
    });

    // 7. 토큰이 없는 경우
    if (!resetToken) {
      return NextResponse.json(
        { error: "INVALID_TOKEN", message: "Invalid or expired token" },
        { status: 400 }
      );
    }

    // 8. 토큰 만료 확인 (30분)
    const now = new Date();
    if (now > resetToken.expiresAt) {
      return NextResponse.json(
        { error: "EXPIRED_TOKEN", message: "Token has expired" },
        { status: 400 }
      );
    }

    // 9. 사용자 조회
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "USER_NOT_FOUND", message: "User not found" },
        { status: 404 }
      );
    }

    // 10. 새 비밀번호 해싱
    const hashedPassword = await hashPassword(newPassword);

    // 11. 비밀번호 업데이트 및 토큰 삭제 (트랜잭션)
    await prisma.$transaction([
      // 비밀번호 업데이트
      prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword },
      }),
      // 사용된 토큰 삭제 (보안)
      prisma.passwordResetToken.delete({
        where: { id: resetToken.id },
      }),
    ]);

    console.log(`[Reset Password] Password reset successful for ${email}`);

    // 12. 성공 응답
    return NextResponse.json({
      success: true,
      message: "Password has been reset successfully",
    });
  } catch (error) {
    console.error("[POST /api/auth/reset-password] 비밀번호 재설정 실패:", error);
    return NextResponse.json(
      {
        error: "INTERNAL_ERROR",
        message: "Failed to reset password.",
      },
      { status: 500 }
    );
  }
}
