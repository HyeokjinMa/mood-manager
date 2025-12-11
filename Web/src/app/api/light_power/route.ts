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
 * - GET 요청: 라즈베리파이에서 호출하므로 API 키 필수
 * - POST 요청: 클라이언트(브라우저)에서 호출하므로 API 키 없이 허용
 */
function validateApiKey(request: NextRequest, method: string): boolean {
  const apiKey = request.headers.get("x-api-key");
  const serverKey = process.env.LIGHT_API_KEY;
  
  // POST 요청은 클라이언트에서 호출하므로 API 키 없이 허용
  if (method === "POST") {
    // API 키가 제공되면 검증 (잘못된 키는 거부)
    if (apiKey && serverKey && apiKey !== serverKey) {
      return false;
    }
    return true;
  }
  
  // GET 요청은 라즈베리파이에서 호출하므로 API 키 필수
  if (!apiKey || !serverKey || apiKey !== serverKey) {
    return false;
  }
  
  return true;
}

// 전구 전원 상태 저장소 (메모리 기반)
type PowerState = "on" | "off";

// 기본 상태: on (조명 등록 시 자동으로 켜짐)
let lightPowerState: PowerState = "on";

/**
 * GET /api/light_power
 * 
 * 현재 전구 전원 상태 조회
 */
export async function GET(request: NextRequest) {
  try {
    // API 키 인증 확인 (GET은 라즈베리파이 호출, API 키 필수)
    if (!validateApiKey(request, "GET")) {
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
    // API 키 인증 확인 (POST는 클라이언트 호출, API 키 없이 허용)
    if (!validateApiKey(request, "POST")) {
      return NextResponse.json(
        { message: "Unauthorized: Invalid API Key" },
        { status: 401 }
      );
    }

    let body: { power?: "on" | "off" } = {};
    try {
      const bodyText = await request.text();
      console.log("[Light Power] POST 요청 body (raw):", bodyText);
      if (bodyText) {
        body = JSON.parse(bodyText) as { power?: "on" | "off" };
        console.log("[Light Power] POST 요청 body (parsed):", body);
      }
    } catch (error) {
      // 빈 body이거나 JSON 파싱 실패 시 기본값 사용
      console.error("[Light Power] JSON parse error:", error);
    }

    console.log("[Light Power] 현재 상태 (업데이트 전):", { power: lightPowerState });

    // 전원 상태 업데이트
    if (body.power !== undefined) {
      if (body.power === "on" || body.power === "off") {
        const oldPower = lightPowerState;
        lightPowerState = body.power;
        console.log(`[Light Power] ✅ 전원 상태 업데이트: ${oldPower} → ${lightPowerState}`);
      } else {
        console.warn("[Light Power] ⚠️ 유효하지 않은 power 값:", body.power);
      }
    }

    console.log("[Light Power] 현재 상태 (업데이트 후):", { power: lightPowerState });

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

