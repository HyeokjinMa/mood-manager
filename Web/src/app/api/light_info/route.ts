/**
 * GET /api/light_info
 * 
 * 전구 정보 조회 API
 * 
 * Response:
 * {
 *   r?: number;        // 0-255
 *   g?: number;        // 0-255
 *   b?: number;        // 0-255
 *   brightness: number; // 0-255
 *   colortemp?: number; // 2000-7000
 * }
 * 
 * RGB와 colortemp는 모두 저장 가능 (라즈베리파이가 판단)
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

// 전구 정보 상태 저장소 (메모리 기반)
interface LightInfoState {
  r?: number;
  g?: number;
  b?: number;
  brightness: number;
  colortemp?: number;
}

// 기본 상태: brightness만 설정
let lightInfoState: LightInfoState = {
  brightness: 255,
};

/**
 * GET /api/light_info
 * 
 * 현재 전구 정보 조회
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

    // 모든 값을 반환 (라즈베리파이가 판단)
    return NextResponse.json({
      r: lightInfoState.r,
      g: lightInfoState.g,
      b: lightInfoState.b,
      brightness: lightInfoState.brightness,
      colortemp: lightInfoState.colortemp,
    }, {
      // 캐시 헤더 추가로 라즈베리파이 요청 최적화
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
      },
    });
  } catch (error) {
    console.error("[Light Info] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/light_info
 * 
 * 전구 정보 업데이트
 * 
 * Request Body:
 * {
 *   r?: number;        // 0-255
 *   g?: number;        // 0-255
 *   b?: number;        // 0-255
 *   brightness?: number; // 0-255
 *   colortemp?: number; // 2000-7000
 * }
 * 
 * RGB와 colortemp는 모두 저장 가능 (라즈베리파이가 판단)
 * brightness가 없으면 기존 값 유지
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

    let body: { r?: number; g?: number; b?: number; brightness?: number; colortemp?: number } = {};
    try {
      const bodyText = await request.text();
      if (bodyText) {
        body = JSON.parse(bodyText) as { r?: number; g?: number; b?: number; brightness?: number; colortemp?: number };
      }
    } catch {
      // 빈 body이거나 JSON 파싱 실패 시 기본값 사용
      console.log("[Light Info] Empty body or JSON parse error, using defaults");
    }

    const { r, g, b, brightness, colortemp } = body;

    // 상태 업데이트 (부분 업데이트 지원)
    const newState: LightInfoState = {
      // 기존 값 유지
      r: lightInfoState.r,
      g: lightInfoState.g,
      b: lightInfoState.b,
      brightness: lightInfoState.brightness,
      colortemp: lightInfoState.colortemp,
    };

    // RGB 값이 있으면 업데이트
    if (r !== undefined && g !== undefined && b !== undefined) {
      newState.r = Math.max(0, Math.min(255, Math.round(r)));
      newState.g = Math.max(0, Math.min(255, Math.round(g)));
      newState.b = Math.max(0, Math.min(255, Math.round(b)));
    }

    // Color Temperature 값이 있으면 업데이트
    if (colortemp !== undefined) {
      newState.colortemp = Math.max(2000, Math.min(7000, Math.round(colortemp)));
    }

    // Brightness 값이 있으면 업데이트
    if (brightness !== undefined && brightness !== null) {
      newState.brightness = Math.max(0, Math.min(255, Math.round(brightness)));
    }

    lightInfoState = newState;

    return NextResponse.json({
      success: true,
      ...newState,
    });
  } catch (error) {
    console.error("[Light Info] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
