// src/app/api/devices/[deviceId]/update/route.ts
/**
 * [파일 역할]
 * - 디바이스 설정 업데이트 API
 * - PUT: 디바이스의 output 설정 업데이트
 *
 * [사용되는 위치]
 * - 디바이스 카드에서 설정 변경 후 저장 시 사용
 *
 * [주의사항]
 * - 인증이 필요한 엔드포인트
 * - 디바이스 소유자만 업데이트 가능
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth, checkMockMode } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { withAuthAndMock, createErrorResponse } from "@/lib/api/routeHandler";
import { ERROR_CODES } from "@/lib/api/errorCodes";

/**
 * PUT /api/devices/:deviceId/update
 *
 * 디바이스의 output 설정을 업데이트합니다.
 *
 * @route PUT /api/devices/:deviceId/update
 * @access 인증 필요
 *
 * @param {NextRequest} request - 요청 객체
 * @param {string} [request.body.color] - 색상 (HEX)
 * @param {number} [request.body.brightness] - 밝기 (0-100)
 * @param {number} [request.body.temperature] - 색온도 (2000-6500K)
 * @param {string} [request.body.scentType] - 향 타입
 * @param {number} [request.body.scentLevel] - 향 강도 (1-10)
 * @param {number} [request.body.scentInterval] - 향 분사 주기 (5, 10, 15, 20, 25, 30분)
 * @param {number} [request.body.volume] - 볼륨 (0-100)
 * @param {string} [request.body.nowPlaying] - 현재 재생 중인 음악 제목
 * @param {object} context - 컨텍스트 객체
 * @param {Promise<{deviceId: string}>} context.params - URL 파라미터
 *
 * @returns {Promise<NextResponse>} 응답 객체
 * @returns {boolean} success - 업데이트 성공 여부
 * @returns {Device} device - 업데이트된 디바이스 정보
 *
 * @throws {401} UNAUTHORIZED - 인증되지 않은 요청
 * @throws {403} FORBIDDEN - 디바이스 소유자가 아님
 * @throws {404} DEVICE_NOT_FOUND - 디바이스를 찾을 수 없음
 * @throws {500} INTERNAL_ERROR - 서버 오류
 *
 * @example
 * ```typescript
 * const response = await fetch('/api/devices/device-id/update', {
 *   method: 'PUT',
 *   body: JSON.stringify({ brightness: 80, color: '#FF5733' })
 * });
 * const { success, device } = await response.json();
 * ```
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ deviceId: string }> }
) {
  return withAuthAndMock(
    async (session) => {
      try {
        // URL 파라미터 추출
        const { deviceId } = await params;

        // 요청 본문 파싱
        const body = await request.json();
        const {
          color,
          brightness,
          temperature,
          scentType,
          scentLevel,
          scentInterval,
          volume,
          nowPlaying,
        } = body;

        // 디바이스 존재 여부 및 소유자 확인
        const device = await prisma.device.findUnique({
          where: { id: deviceId },
        });

        if (!device) {
          return createErrorResponse(
            "DEVICE_NOT_FOUND",
            "디바이스를 찾을 수 없습니다.",
            404
          );
        }

        if (device.userId !== session.user.id) {
          return createErrorResponse(
            "FORBIDDEN",
            "디바이스를 수정할 권한이 없습니다.",
            403
          );
        }

        // 업데이트할 데이터 구성
        const updateData: {
          color?: string | null;
          brightness?: number | null;
          temperature?: number | null;
          scentType?: string | null;
          scentLevel?: number | null;
          scentInterval?: number | null;
          volume?: number | null;
          nowPlaying?: string | null;
        } = {};

        if (color !== undefined) updateData.color = color || null;
        if (brightness !== undefined) updateData.brightness = brightness ?? null;
        if (temperature !== undefined) updateData.temperature = temperature ?? null;
        if (scentType !== undefined) updateData.scentType = scentType || null;
        if (scentLevel !== undefined) updateData.scentLevel = scentLevel ?? null;
        if (scentInterval !== undefined) updateData.scentInterval = scentInterval ?? null;
        if (volume !== undefined) updateData.volume = volume ?? null;
        if (nowPlaying !== undefined) updateData.nowPlaying = nowPlaying || null;

        // 디바이스 업데이트
        const updatedDevice = await prisma.device.update({
          where: { id: deviceId },
          data: updateData,
        });

        // 응답 데이터 포맷팅
        const formattedDevice = {
          id: updatedDevice.id,
          type: updatedDevice.type,
          name: updatedDevice.name,
          battery: updatedDevice.battery ?? 100,
          power: updatedDevice.power ?? true,
          output: formatDeviceOutput(updatedDevice),
        };

        return NextResponse.json({ success: true, device: formattedDevice });
      } catch (error) {
        console.error("[PUT /api/devices/:deviceId/update] 디바이스 업데이트 실패:", error);
        return createErrorResponse(
          ERROR_CODES.INTERNAL_ERROR,
          "디바이스 업데이트 중 오류가 발생했습니다."
        );
      }
    },
    (session) => {
      // 목업 모드: 관리자 계정
      console.log("[PUT /api/devices/:deviceId/update] 목업 모드: 관리자 계정");
      return NextResponse.json({ success: true });
    }
  );
}

/**
 * 디바이스 출력 데이터 포맷팅
 */
function formatDeviceOutput(device: {
  type: string;
  brightness: number | null;
  color: string | null;
  temperature: number | null;
  scentType: string | null;
  scentLevel: number | null;
  scentInterval: number | null;
  volume: number | null;
  nowPlaying: string | null;
}) {
  const output: Record<string, unknown> = {};

  // 조명 관련 (light, manager)
  if (device.type === "light" || device.type === "manager") {
    if (device.brightness !== null) output.brightness = device.brightness;
    if (device.color !== null) output.color = device.color;
    if (device.temperature !== null) output.temperature = device.temperature;
  }

  // 향 관련 (scent, manager)
  if (device.type === "scent" || device.type === "manager") {
    if (device.scentType !== null) output.scentType = device.scentType;
    if (device.scentLevel !== null) output.scentLevel = device.scentLevel;
    if (device.scentInterval !== null) output.scentInterval = device.scentInterval;
  }

  // 스피커 관련 (speaker, manager)
  if (device.type === "speaker" || device.type === "manager") {
    if (device.volume !== null) output.volume = device.volume;
    if (device.nowPlaying !== null) output.nowPlaying = device.nowPlaying;
  }

  return output;
}

