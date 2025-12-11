/**
 * GET /api/search_light
 * 
 * 전구 검색 상태 조회 API
 * 
 * Response:
 * {
 *   status: "search" | "wait"
 *   light_off: true | false
 * }
 * 
 * - 평소에는 wait 상태
 * - UI에서 전구 연결 더하기 누르면 search 상태로 변경
 * - 전구 조작 중에는 계속 search 상태
 * - 디바이스 해제하면 다시 wait 상태로 변경
 * - light_off: 사용자가 디바이스 연결을 종료할 때 전구 전원을 끌지 유지할지 결정
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

// 전구 검색 상태 저장소 (메모리 기반)
interface SearchLightState {
  status: "search" | "wait";
  light_off: boolean;
}

// 기본 상태: wait, light_off는 false (전원 유지)
const searchLightState: SearchLightState = {
  status: "wait",
  light_off: false,
};

/**
 * GET /api/search_light
 * 
 * 현재 전구 검색 상태 조회
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
      status: searchLightState.status,
      light_off: searchLightState.light_off,
    });
  } catch (error) {
    console.error("[Search Light] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/search_light
 * 
 * 전구 검색 상태 변경
 * 
 * Request Body:
 * {
 *   status?: "search" | "wait"
 *   light_off?: boolean
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

    let body: { status?: "search" | "wait"; light_off?: boolean } = {};
    try {
      const bodyText = await request.text();
      console.log("[Search Light] POST 요청 body (raw):", bodyText);
      if (bodyText) {
        body = JSON.parse(bodyText) as { status?: "search" | "wait"; light_off?: boolean };
        console.log("[Search Light] POST 요청 body (parsed):", body);
      }
    } catch (error) {
      // 빈 body이거나 JSON 파싱 실패 시 기본값 사용
      console.error("[Search Light] JSON parse error:", error);
    }

    console.log("[Search Light] 현재 상태 (업데이트 전):", { status: searchLightState.status, light_off: searchLightState.light_off });

    // 상태 업데이트
    if (body.status !== undefined) {
      if (body.status === "search" || body.status === "wait") {
        const oldStatus = searchLightState.status;
        searchLightState.status = body.status;
        console.log(`[Search Light] ✅ 상태 업데이트: ${oldStatus} → ${searchLightState.status}`);
      }
    }

    if (body.light_off !== undefined) {
      const oldLightOff = searchLightState.light_off;
      searchLightState.light_off = Boolean(body.light_off);
      console.log(`[Search Light] ✅ light_off 업데이트: ${oldLightOff} → ${searchLightState.light_off}`);
    }

    console.log("[Search Light] 현재 상태 (업데이트 후):", { status: searchLightState.status, light_off: searchLightState.light_off });

    return NextResponse.json({
      success: true,
      status: searchLightState.status,
      light_off: searchLightState.light_off,
    });
  } catch (error) {
    console.error("[Search Light] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
