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

import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";

// 전구 전원 상태 저장소 (메모리 기반)
type PowerState = "on" | "off";

// 기본 상태: off
let lightPowerState: PowerState = "off";

/**
 * GET /api/light_power
 * 
 * 현재 전구 전원 상태 조회
 */
export async function GET() {
  try {
    // 인증 확인
    const sessionOrError = await requireAuth();
    if (sessionOrError instanceof NextResponse) {
      return sessionOrError;
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
export async function POST(request: Request) {
  try {
    // 인증 확인
    const sessionOrError = await requireAuth();
    if (sessionOrError instanceof NextResponse) {
      return sessionOrError;
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

