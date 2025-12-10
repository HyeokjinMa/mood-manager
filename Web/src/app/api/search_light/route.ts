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
 */
function validateApiKey(request: NextRequest): boolean {
  const apiKey = request.headers.get("x-api-key");
  const serverKey = process.env.LIGHT_API_KEY;
  
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
    // API 키 인증 확인
    if (!validateApiKey(request)) {
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
    // API 키 인증 확인
    if (!validateApiKey(request)) {
      return NextResponse.json(
        { message: "Unauthorized: Invalid API Key" },
        { status: 401 }
      );
    }

    let body: { status?: "search" | "wait"; light_off?: boolean } = {};
    try {
      const bodyText = await request.text();
      if (bodyText) {
        body = JSON.parse(bodyText) as { status?: "search" | "wait"; light_off?: boolean };
      }
    } catch {
      // 빈 body이거나 JSON 파싱 실패 시 기본값 사용
      console.log("[Search Light] Empty body or JSON parse error, using defaults");
    }

    // 상태 업데이트
    if (body.status !== undefined) {
      if (body.status === "search" || body.status === "wait") {
        searchLightState.status = body.status;
      }
    }

    if (body.light_off !== undefined) {
      searchLightState.light_off = Boolean(body.light_off);
    }

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
