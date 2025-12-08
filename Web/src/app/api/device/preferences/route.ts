/**
 * API Route: /api/device/preferences
 * 
 * 디바이스 설정 저장/불러오기 API
 * - 별표 버튼 클릭 시 마지막 설정 저장
 * - 앱 시작 시 저장된 설정 불러오기
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/device/preferences
 * 
 * 디바이스 설정 저장
 * 
 * Request Body:
 * {
 *   volume?: number; // 0-100
 *   brightness?: number; // 0-100
 *   color?: string; // HEX color
 *   scentType?: string;
 *   scentLevel?: number; // 1-10
 * }
 * 
 * Response:
 * {
 *   success: boolean;
 *   message?: string;
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const sessionOrError = await requireAuth();
    if (sessionOrError instanceof NextResponse) {
      return sessionOrError;
    }
    const session = sessionOrError;
    const userId = session.user.id;

    const body = await request.json();
    const { volume, brightness, color, scentType, scentLevel } = body;

    console.log("[POST /api/device/preferences] 요청 수신:", {
      userId,
      volume,
      brightness,
      color,
      scentType,
      scentLevel,
    });

    // UserPreferences에 deviceSettings JSON 필드로 저장
    // Prisma 스키마에 deviceSettings 필드가 없으면 에러가 발생하므로,
    // 일단 UserPreferences를 업데이트하되, deviceSettings는 나중에 추가
    // 현재는 UserPreferences의 기존 필드를 활용하거나, 별도 처리가 필요
    
    // UserPreferences에 deviceSettings JSON 필드로 저장
    await prisma.userPreferences.upsert({
      where: { userId },
      update: {
        updatedAt: new Date(),
        deviceSettings: {
          volume,
          brightness,
          color,
          scentType,
          scentLevel,
          savedAt: new Date().toISOString(),
        },
      },
      create: {
        userId,
        deviceSettings: {
          volume,
          brightness,
          color,
          scentType,
          scentLevel,
          savedAt: new Date().toISOString(),
        },
      },
    });

    console.log("[POST /api/device/preferences] 설정 저장 완료 (DB 저장)");

    return NextResponse.json({
      success: true,
      message: "Device preferences saved successfully",
    });
  } catch (error) {
    console.error("[POST /api/device/preferences] 처리 중 예외 발생:", error);
    return NextResponse.json(
      { error: "Internal server error", success: false },
      { status: 500 }
    );
  }
}

/**
 * GET /api/device/preferences
 * 
 * 저장된 디바이스 설정 불러오기
 * 
 * Response:
 * {
 *   success: boolean;
 *   preferences?: {
 *     volume?: number;
 *     brightness?: number;
 *     color?: string;
 *     scentType?: string;
 *     scentLevel?: number;
 *     savedAt?: string;
 *   };
 * }
 */
export async function GET() {
  try {
    const sessionOrError = await requireAuth();
    if (sessionOrError instanceof NextResponse) {
      return sessionOrError;
    }
    const session = sessionOrError;
    const userId = session.user.id;

    // UserPreferences 조회
    const userPrefs = await prisma.userPreferences.findUnique({
      where: { userId },
    });

    const deviceSettings = userPrefs?.deviceSettings as {
      volume?: number;
      brightness?: number;
      color?: string;
      scentType?: string;
      scentLevel?: number;
      savedAt?: string;
    } | undefined;

    return NextResponse.json({
      success: true,
      preferences: deviceSettings || null,
    });
  } catch (error) {
    console.error("[GET /api/device/preferences] 처리 중 예외 발생:", error);
    return NextResponse.json(
      { error: "Internal server error", success: false },
      { status: 500 }
    );
  }
}

