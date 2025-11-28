// src/app/api/auth/forgot-password/route.ts
/**
 * [파일 역할]
 * - 비밀번호 찾기 API (인증코드 전송)
 * - 이메일로 6자리 인증코드를 전송
 * - 보안: 이메일 존재 여부와 관계없이 동일한 응답 반환 (이메일 열거 공격 방지)
 *
 * [사용되는 위치]
 * - 비밀번호 찾기 페이지에서 호출
 * - POST /api/auth/forgot-password
 *
 * [주의사항]
 * - 인증 불필요 (공개 엔드포인트)
 * - 인증코드 유효기간: 10분
 * - 이메일 전송은 추후 구현 (현재는 DB에만 저장)
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isValidEmail } from "@/lib/utils/validation";

/**
 * 6자리 랜덤 인증코드 생성
 */
function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * POST /api/auth/forgot-password
 *
 * 비밀번호 재설정 인증코드 전송
 *
 * 요청 필드:
 * - email (required): 이메일 주소
 *
 * 응답:
 * - 성공: { success: true, message: "Verification code has been sent to your email." }
 * - 실패: { error: "ERROR_CODE", message: "에러 메시지" }
 *
 * 참고:
 * - 보안상 이메일 존재 여부와 관계없이 동일한 응답 반환
 * - 인증코드 유효기간: 10분
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

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

    // 3. 사용자 존재 여부 확인 (내부적으로만 확인, 응답에는 영향 없음)
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    // 사용자가 존재하는 경우에만 인증코드 생성
    if (user) {
      // 4. 6자리 인증코드 생성
      const code = generateVerificationCode();

      // 5. 만료 시간 설정 (10분 후)
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 10);

      // 6. 기존 미사용 코드 삭제 (중복 방지)
      await prisma.passwordResetToken.deleteMany({
        where: {
          email,
          used: false,
        },
      });

      // 7. 새 인증코드 저장
      await prisma.passwordResetToken.create({
        data: {
          email,
          code,
          expiresAt,
          used: false,
        },
      });

      // 8. 이메일 전송 (TODO: 실제 이메일 전송 서비스 연동)
      // await sendEmail({
      //   to: email,
      //   subject: "Password Reset Verification Code",
      //   text: `Your verification code is: ${code}`,
      // });

      console.log(`[Forgot Password] Verification code for ${email}: ${code}`);
    }

    // 9. 보안상 이메일 존재 여부와 관계없이 동일한 응답 반환
    return NextResponse.json({
      success: true,
      message: "Verification code has been sent to your email.",
    });
  } catch (error) {
    console.error("[POST /api/auth/forgot-password] 인증코드 전송 실패:", error);
    return NextResponse.json(
      {
        error: "INTERNAL_ERROR",
        message: "Failed to send verification code.",
      },
      { status: 500 }
    );
  }
}
