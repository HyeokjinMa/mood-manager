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

import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";

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
export async function GET() {
  try {
    // 인증 확인
    const sessionOrError = await requireAuth();
    if (sessionOrError instanceof NextResponse) {
      return sessionOrError;
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
export async function POST(request: Request) {
  try {
    // 인증 확인
    const sessionOrError = await requireAuth();
    if (sessionOrError instanceof NextResponse) {
      return sessionOrError;
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
