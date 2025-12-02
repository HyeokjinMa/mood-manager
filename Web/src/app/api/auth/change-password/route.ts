// src/app/api/auth/change-password/route.ts
/**
 * 비밀번호 변경 API
 * 
 * 현재 비밀번호 확인 후 새 비밀번호로 변경
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, checkMockMode } from "@/lib/auth/session";
import { verifyPassword, hashPassword, validatePasswordStrength } from "@/lib/auth/password";

export async function POST(request: NextRequest) {
  try {
    // 1. 인증 확인
    const session = await requireAuth();
    if (session instanceof NextResponse) {
      return session; // 401 응답
    }

    const { currentPassword, newPassword } = await request.json();

    // 2. 필수 필드 검증
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "INVALID_INPUT", message: "Current password and new password are required." },
        { status: 400 }
      );
    }

    // 3. Mock 모드 확인
    const isMockMode = await checkMockMode(session);
    if (isMockMode) {
      // Mock 모드: 비밀번호 변경은 허용하지 않음 (관리자 계정은 변경 불가)
      return NextResponse.json(
        { error: "MOCK_MODE", message: "Password change is not available in admin mode." },
        { status: 403 }
      );
    }

    // 4. 사용자 조회
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, email: true, password: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "USER_NOT_FOUND", message: "User not found." },
        { status: 404 }
      );
    }

    // 5. 소셜 로그인 사용자는 비밀번호가 없음
    if (!user.password) {
      return NextResponse.json(
        { error: "NO_PASSWORD", message: "This account does not have a password. Please use social login." },
        { status: 400 }
      );
    }

    // 6. 현재 비밀번호 확인
    const isCurrentPasswordValid = await verifyPassword(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return NextResponse.json(
        { error: "INVALID_PASSWORD", message: "Current password is incorrect." },
        { status: 401 }
      );
    }

    // 7. 새 비밀번호와 현재 비밀번호가 같은지 확인
    const isSamePassword = await verifyPassword(newPassword, user.password);
    if (isSamePassword) {
      return NextResponse.json(
        { error: "SAME_PASSWORD", message: "New password must be different from current password." },
        { status: 400 }
      );
    }

    // 8. 새 비밀번호 강도 검증
    const passwordValidation = validatePasswordStrength(newPassword);
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { error: "WEAK_PASSWORD", message: passwordValidation.message || "Password is too weak." },
        { status: 400 }
      );
    }

    // 9. 비밀번호 해싱 및 업데이트
    const hashedNewPassword = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedNewPassword },
    });

    return NextResponse.json({
      success: true,
      message: "Password changed successfully.",
    });
  } catch (error) {
    console.error("[Change Password] Error:", error);
    return NextResponse.json(
      { error: "INTERNAL_ERROR", message: "Failed to change password. Please try again." },
      { status: 500 }
    );
  }
}

