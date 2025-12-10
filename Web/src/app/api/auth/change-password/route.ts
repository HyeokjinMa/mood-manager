// src/app/api/auth/change-password/route.ts
/**
 * 비밀번호 변경 API
 * 
 * 현재 비밀번호 확인 후 새 비밀번호로 변경
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { verifyPassword, hashPassword, validatePasswordStrength } from "@/lib/auth/password";
import { isAdminAccount } from "@/lib/auth/mockMode";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "UNAUTHORIZED", message: "Authentication required" },
        { status: 401 }
      );
    }

    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "INVALID_INPUT", message: "Current password and new password are required" },
        { status: 400 }
      );
    }

    const userId = (session.user as { id?: string }).id;
    if (!userId) {
      return NextResponse.json(
        { error: "UNAUTHORIZED", message: "User ID not found" },
        { status: 401 }
      );
    }

    // Admin account: Check password directly
    // isAdminAccount는 비밀번호 없이 호출하면 false를 반환하므로, userId만 확인
    if (userId === "admin-mock-user-id" || (session.user.email === "admin@moodmanager.com" && userId === "admin-mock-user-id")) {
      if (currentPassword !== "admin1234") {
        return NextResponse.json(
          { error: "INVALID_PASSWORD", message: "Current password is incorrect" },
          { status: 400 }
        );
      }
      // Admin account password change is not persisted (mock mode)
      return NextResponse.json({
        success: true,
        message: "Password changed successfully (mock mode)",
      });
    }

    // Regular user: Check from database
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { password: true },
    });

    if (!user || !user.password) {
      return NextResponse.json(
        { error: "USER_NOT_FOUND", message: "User not found or password not set" },
        { status: 404 }
      );
    }

    // Verify current password
    const isCurrentPasswordValid = await verifyPassword(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return NextResponse.json(
        { error: "INVALID_PASSWORD", message: "Current password is incorrect" },
        { status: 400 }
      );
    }

    // Validate new password strength
    const passwordValidation = validatePasswordStrength(newPassword);
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { error: "WEAK_PASSWORD", message: passwordValidation.message },
        { status: 400 }
      );
    }

    // Check if new password is same as current password
    const isSamePassword = await verifyPassword(newPassword, user.password);
    if (isSamePassword) {
      return NextResponse.json(
        { error: "SAME_PASSWORD", message: "New password must be different from current password" },
        { status: 400 }
      );
    }

    // Hash and update password
    const hashedNewPassword = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword },
    });

    return NextResponse.json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("[Change Password] Error:", error);
    return NextResponse.json(
      { error: "INTERNAL_ERROR", message: "Failed to change password" },
      { status: 500 }
    );
  }
}

