/**
 * POST /api/light/control
 * 
 * 전구 제어 API
 * 
 * 현재 세그먼트의 조명 정보를 받아서 저장
 * 라즈베리파이가 GET /api/light/control로 주기적으로 값을 가져감
 * RGB 우선 전략: RGB가 있으면 RGB 사용, 없으면 Color Temperature 사용
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";

// 전구 제어 상태 저장소 (메모리 기반)
// 라즈베리파이가 RGB/colortemp 판단을 하므로 모든 값을 함께 저장
interface LightControlState {
  r?: number;
  g?: number;
  b?: number;
  colortemp?: number;
  brightness: number;
  lastUpdated: number;
}

// 전구 제어 상태 저장소 (라즈베리파이가 GET으로 가져감)
let lightControlState: LightControlState | null = null;

// 라즈베리파이 API URL (환경 변수에서 가져오기)
// 로컬 개발: 같은 핫스팟 내 IP 주소 사용
// 포트 번호는 라즈베리파이 서버 설정에 맞게 .env.local에서 설정 필요
// 예: "http://10.58.32.146:포트번호" (라즈베리파이 서버 포트 확인 필요)
// 환경 변수가 없으면 에러 발생 (명시적 설정 강제)
const RASPBERRY_PI_URL = process.env.RASPBERRY_PI_URL;

/**
 * POST /api/light/control
 * 
 * Request Body:
 * {
 *   r?: number;           // 0-255
 *   g?: number;           // 0-255
 *   b?: number;           // 0-255
 *   colortemp?: number;   // 2000-7000
 *   brightness: number;   // 0-255 (필수)
 * }
 * 
 * 라즈베리파이가 RGB/colortemp 판단을 하므로 모든 값을 함께 저장
 */
export async function POST(request: NextRequest) {
  try {
    // 인증 확인
    const sessionOrError = await requireAuth();
    if (sessionOrError instanceof NextResponse) {
      return sessionOrError;
    }

    const body = await request.json();
    const { r, g, b, colortemp, brightness } = body;

    // Brightness는 필수
    if (brightness === undefined || brightness === null) {
      return NextResponse.json(
        { error: "brightness is required" },
        { status: 400 }
      );
    }

    // 모든 값을 함께 저장 (라즈베리파이가 판단)
    const newState: LightControlState = {
      r: r !== undefined && r !== null ? Math.max(0, Math.min(255, Math.round(r))) : undefined,
      g: g !== undefined && g !== null ? Math.max(0, Math.min(255, Math.round(g))) : undefined,
      b: b !== undefined && b !== null ? Math.max(0, Math.min(255, Math.round(b))) : undefined,
      colortemp: colortemp !== undefined && colortemp !== null ? Math.max(2000, Math.min(7000, Math.round(colortemp))) : undefined,
      brightness: Math.max(0, Math.min(255, Math.round(brightness))),
      lastUpdated: Date.now(),
    };

    // 상태 저장 (라즈베리파이가 GET으로 가져감)
    lightControlState = newState;

    return NextResponse.json({
      success: true,
      state: newState,
      message: "Light control state updated. Raspberry Pi can fetch via GET /api/light/control",
    });
  } catch (error) {
    console.error("[Light Control] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/light/control
 * 
 * 현재 전구 제어 상태 조회
 * 라즈베리파이가 주기적으로 이 엔드포인트를 호출하여 값을 가져감
 * 
 * Response:
 * {
 *   r?: number;
 *   g?: number;
 *   b?: number;
 *   colortemp?: number;
 *   brightness: number;
 * }
 * 
 * 라즈베리파이가 RGB/colortemp 판단을 하므로 모든 값을 함께 반환
 */
export async function GET() {
  try {
    // 라즈베리파이에서 주기적으로 호출하므로 빠른 응답이 중요
    // 개발 환경에서는 인증 체크를 건너뛰어 타임아웃 방지
    // 프로덕션에서는 IP 화이트리스트 또는 API 키 방식 권장
    if (process.env.NODE_ENV === "production") {
      const sessionOrError = await requireAuth();
      if (sessionOrError instanceof NextResponse) {
        // 프로덕션에서는 인증 실패 시 에러 반환
        return sessionOrError;
      }
    }
    // 개발 환경에서는 인증 체크 건너뛰기 (빠른 응답 보장)

    if (!lightControlState) {
      return NextResponse.json({
        state: null,
        message: "No light control state set",
      });
    }

    // 모든 값을 함께 반환 (라즈베리파이가 판단)
    // 빠른 응답을 위해 추가 처리 없이 바로 반환
    return NextResponse.json({
      r: lightControlState.r,
      g: lightControlState.g,
      b: lightControlState.b,
      colortemp: lightControlState.colortemp,
      brightness: lightControlState.brightness,
    }, {
      // 캐시 헤더 추가로 라즈베리파이 요청 최적화
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
      },
    });
  } catch (error) {
    console.error("[Light Control] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

