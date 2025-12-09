/**
 * GET /api/light/status
 * 
 * 전구 상태 조회 API
 * 
 * 라즈베리파이에서 현재 전구 상태를 가져옴
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";

// 라즈베리파이 API URL (환경 변수에서 가져오기)
const RASPBERRY_PI_URL = process.env.RASPBERRY_PI_URL || "http://localhost:8000";

/**
 * GET /api/light/status
 * 
 * 라즈베리파이에서 전구 상태 조회
 */
export async function GET() {
  try {
    // 인증 확인
    const sessionOrError = await requireAuth();
    if (sessionOrError instanceof NextResponse) {
      return sessionOrError;
    }

    // 라즈베리파이에서 전구 상태 조회
    // TODO: 라즈베리파이 API 엔드포인트 확인 필요
    // 현재는 /api/light_info가 GET으로 상태를 반환하는지 확인 필요
    const response = await fetch(`${RASPBERRY_PI_URL}/api/light_info`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch light status from Raspberry Pi" },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      status: data,
    });
  } catch (error) {
    console.error("[Light Status] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

