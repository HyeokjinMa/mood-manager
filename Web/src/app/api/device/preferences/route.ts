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
import { withAuth, createErrorResponse } from "@/lib/api/routeHandler";
import { ERROR_CODES } from "@/lib/api/errorCodes";

/**
 * POST /api/device/preferences
 * 
 * 사용자의 디바이스 설정을 저장합니다. 별표 버튼 클릭 시 마지막 설정이 저장됩니다.
 * 
 * @route POST /api/device/preferences
 * @access 인증 필요
 *
 * @param {NextRequest} request - 요청 객체
 * @param {number} [request.body.volume] - 볼륨 (0-100)
 * @param {number} [request.body.brightness] - 밝기 (0-100)
 * @param {string} [request.body.color] - 색상 (HEX 형식)
 * @param {string} [request.body.scentType] - 향 타입
 * @param {number} [request.body.scentLevel] - 향 강도 (1-10)
 *
 * @returns {Promise<NextResponse>} 응답 객체
 * @returns {boolean} success - 저장 성공 여부
 * @returns {string} [message] - 응답 메시지
 *
 * @throws {401} UNAUTHORIZED - 인증되지 않은 요청
 * @throws {500} INTERNAL_ERROR - 서버 오류
 *
 * @example
 * ```typescript
 * const response = await fetch('/api/device/preferences', {
 *   method: 'POST',
 *   body: JSON.stringify({ volume: 70, brightness: 80, color: '#FF5733' })
 * });
 * const { success } = await response.json();
 * ```
 */
export async function POST(request: NextRequest) {
  return withAuth(async (session) => {
    try {
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
      return createErrorResponse(
        ERROR_CODES.INTERNAL_ERROR,
        "Internal server error"
      );
    }
  });
}

/**
 * GET /api/device/preferences
 * 
 * 저장된 디바이스 설정을 불러옵니다. 앱 시작 시 저장된 설정을 불러올 때 사용됩니다.
 * 
 * @route GET /api/device/preferences
 * @access 인증 필요
 *
 * @returns {Promise<NextResponse>} 응답 객체
 * @returns {boolean} success - 조회 성공 여부
 * @returns {object|null} preferences - 저장된 디바이스 설정
 * @returns {number} [preferences.volume] - 볼륨 (0-100)
 * @returns {number} [preferences.brightness] - 밝기 (0-100)
 * @returns {string} [preferences.color] - 색상 (HEX 형식)
 * @returns {string} [preferences.scentType] - 향 타입
 * @returns {number} [preferences.scentLevel] - 향 강도 (1-10)
 * @returns {string} [preferences.savedAt] - 저장 시간
 *
 * @throws {401} UNAUTHORIZED - 인증되지 않은 요청
 * @throws {500} INTERNAL_ERROR - 서버 오류
 *
 * @example
 * ```typescript
 * const response = await fetch('/api/device/preferences');
 * const { success, preferences } = await response.json();
 * ```
 */
export async function GET() {
  return withAuth(async (session) => {
    try {
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
      return createErrorResponse(
        ERROR_CODES.INTERNAL_ERROR,
        "Internal server error"
      );
    }
  });
}

