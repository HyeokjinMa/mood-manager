// src/app/api/inquiry/route.ts
/**
 * 1:1 문의 API
 * 
 * 사용자가 1:1 문의를 제출하고 저장
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, checkMockMode } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  try {
    // 1. 인증 확인
    const session = await requireAuth();
    if (session instanceof NextResponse) {
      return session; // 401 응답
    }

    const { subject, message } = await request.json();

    // 2. 필수 필드 검증
    if (!subject || !message) {
      return NextResponse.json(
        { error: "INVALID_INPUT", message: "Subject and message are required." },
        { status: 400 }
      );
    }

    // 3. 길이 검증
    if (subject.length > 200) {
      return NextResponse.json(
        { error: "INVALID_INPUT", message: "Subject must be 200 characters or less." },
        { status: 400 }
      );
    }

    if (message.length > 5000) {
      return NextResponse.json(
        { error: "INVALID_INPUT", message: "Message must be 5000 characters or less." },
        { status: 400 }
      );
    }

    // 4. Mock 모드 확인
    const isMockMode = await checkMockMode(session);
    if (isMockMode) {
      // Mock 모드: 문의는 저장하지 않고 성공 응답만 반환
      return NextResponse.json({
        success: true,
        inquiryId: "mock-inquiry-id",
        message: "Inquiry submitted successfully (mock mode).",
      });
    }

    // 5. DB에 문의 저장 (V2에서 구현)
    // TODO: V2에서 inquiry 테이블 생성 후 활성화
    // const inquiry = await prisma.inquiry.create({
    //   data: {
    //     userId: session.user.id,
    //     subject,
    //     message,
    //     status: "pending",
    //   },
    // });

    // 현재는 Mock 응답 반환
    return NextResponse.json({
      success: true,
      inquiryId: "inquiry-id-placeholder",
      message: "Inquiry submitted successfully. We'll get back to you soon.",
    });
  } catch (error) {
    console.error("[Inquiry] Error:", error);
    return NextResponse.json(
      { error: "INTERNAL_ERROR", message: "Failed to submit inquiry. Please try again." },
      { status: 500 }
    );
  }
}
