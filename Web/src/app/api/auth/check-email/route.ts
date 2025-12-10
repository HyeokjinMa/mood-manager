// src/app/api/auth/check-email/route.ts
/**
 * 이메일 중복 체크 API
 * 
 * 회원가입 시 실시간으로 이메일 중복 여부를 확인
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAccount } from "@/lib/auth/mockMode";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // 관리자 계정은 항상 사용 가능 (Mock 모드)
    // 이메일만으로는 관리자 확인 불가하므로, 이메일이 관리자 이메일인지만 확인
    if (email === "admin@moodmanager.com") {
      return NextResponse.json({ available: true });
    }

    // DB에서 이메일 중복 확인
    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    return NextResponse.json({
      available: !existingUser,
      message: existingUser ? "This email is already registered" : "Email is available",
    });
  } catch (error) {
    console.error("[Check Email] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

