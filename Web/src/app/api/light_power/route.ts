/**
 * GET /api/light_power
 * 
 * 전구 전원 상태 조회 API
 * 
 * Response:
 * {
 *   power: "on" | "off"
 * }
 */

import { NextRequest, NextResponse } from "next/server";

/**
 * API 키 인증 헬퍼 함수
 * 클라이언트에서 호출하는 경우 (브라우저) API 키 검증을 완화
 * 서버에서 호출하는 경우 (Next.js 서버) API 키 검증
 */
function validateApiKey(request: NextRequest): boolean {
  const apiKey = request.headers.get("x-api-key");
  const serverKey = process.env.LIGHT_API_KEY;
  
  // 개발 환경에서는 API 키 검증 완화 (클라이언트에서 호출 가능)
  if (process.env.NODE_ENV === "development") {
    // API 키가 제공되면 검증, 없으면 허용 (개발 편의성)
    if (apiKey && serverKey && apiKey !== serverKey) {
      return false;
    }
    return true;
  }
  
  // 프로덕션 환경에서는 API 키 필수
  if (!apiKey || !serverKey || apiKey !== serverKey) {
    return false;
  }
  
  return true;
}

// 전구 전원 상태 저장소 (메모리 기반)
type PowerState = "on" | "off";

// 기본 상태: off
let lightPowerState: PowerState = "off";

/**
 * GET /api/light_power
 * 
 * 현재 전구 전원 상태 조회
 */
export async function GET(request: NextRequest) {
  try {
    // API 키 인증 확인
    if (!validateApiKey(request)) {
      return NextResponse.json(
        { message: "Unauthorized: Invalid API Key" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      power: lightPowerState,
    });
  } catch (error) {
    console.error("[Light Power] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/light_power
 * 
 * 전구 전원 상태 변경
 * 
 * Request Body:
 * {
 *   power: "on" | "off"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // API 키 인증 확인
    if (!validateApiKey(request)) {
      return NextResponse.json(
        { message: "Unauthorized: Invalid API Key" },
        { status: 401 }
      );
    }

    let body: { power?: "on" | "off" } = {};
    try {
      const bodyText = await request.text();
      if (bodyText) {
        body = JSON.parse(bodyText) as { power?: "on" | "off" };
      }
    } catch {
      // 빈 body이거나 JSON 파싱 실패 시 기본값 사용
      console.log("[Light Power] Empty body or JSON parse error, using defaults");
    }

    // 전원 상태 업데이트
    if (body.power !== undefined) {
      if (body.power === "on" || body.power === "off") {
        lightPowerState = body.power;
      }
    }

    return NextResponse.json({
      success: true,
      power: lightPowerState,
    });
  } catch (error) {
    console.error("[Light Power] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

