// src/app/api/devices/[deviceId]/power/route.ts
/**
 * [파일 역할]
 * - 디바이스 전원 상태 변경 API
 * - PUT: 디바이스 전원 ON/OFF 토글
 *
 * [사용되는 위치]
 * - 디바이스 카드에서 전원 버튼 클릭 시 사용
 *
 * [주의사항]
 * - 인증이 필요한 엔드포인트
 * - 디바이스 소유자만 전원 변경 가능
 * - 전원 상태는 DB에 저장됨
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { validateRequiredFields } from "@/lib/utils/validation";
import { withAuth, createErrorResponse } from "@/lib/api/routeHandler";
import { ERROR_CODES } from "@/lib/api/errorCodes";

/**
 * PUT /api/devices/:deviceId/power
 *
 * 디바이스의 전원 상태를 변경합니다 (ON/OFF 토글).
 *
 * @route PUT /api/devices/:deviceId/power
 * @access 인증 필요
 *
 * @param {NextRequest} request - 요청 객체
 * @param {boolean} request.body.power - 전원 상태 (required): true (ON) 또는 false (OFF)
 * @param {object} context - 컨텍스트 객체
 * @param {Promise<{deviceId: string}>} context.params - URL 파라미터
 *
 * @returns {Promise<NextResponse>} 응답 객체
 * @returns {Device} device - 업데이트된 디바이스 정보
 *
 * @throws {400} INVALID_INPUT - 필수 필드 누락
 * @throws {401} UNAUTHORIZED - 인증되지 않은 요청
 * @throws {403} FORBIDDEN - 디바이스 소유자가 아님
 * @throws {404} DEVICE_NOT_FOUND - 디바이스를 찾을 수 없음
 * @throws {500} INTERNAL_ERROR - 서버 오류
 *
 * @example
 * ```typescript
 * const response = await fetch('/api/devices/device-id/power', {
 *   method: 'PUT',
 *   body: JSON.stringify({ power: true })
 * });
 * const { device } = await response.json();
 * ```
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ deviceId: string }> }
) {
  return withAuth(async (session) => {
    try {
      // URL 파라미터 추출
      const { deviceId } = await params;

      // 요청 본문 파싱
      const body = await request.json();
      const validation = validateRequiredFields(body, ["power"]);
      if (!validation.valid) {
        return createErrorResponse(
          ERROR_CODES.INVALID_INPUT,
          "전원 상태는 필수 입력 항목입니다."
        );
      }

      const { power } = body;

      if (typeof power !== "boolean") {
        return createErrorResponse(
          ERROR_CODES.INVALID_INPUT,
          "전원 상태는 true 또는 false여야 합니다."
        );
      }

      // 디바이스 존재 여부 및 소유자 확인
      const device = await prisma.device.findUnique({
        where: { id: deviceId },
      });

      if (!device) {
        return createErrorResponse(
          ERROR_CODES.DEVICE_NOT_FOUND,
          "디바이스를 찾을 수 없습니다."
        );
      }

      if (device.userId !== session.user.id) {
        return createErrorResponse(
          ERROR_CODES.FORBIDDEN,
          "디바이스를 제어할 권한이 없습니다."
        );
      }

      // 전원 상태 업데이트
      const updatedDevice = await prisma.device.update({
        where: { id: deviceId },
        data: { power },
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

      return NextResponse.json({ device: formattedDevice });
    } catch (error) {
      console.error(
        "[PUT /api/devices/:deviceId/power] 전원 상태 변경 실패:",
        error
      );
        return createErrorResponse(
          ERROR_CODES.INTERNAL_ERROR,
          "전원 상태 변경 중 오류가 발생했습니다."
        );
    }
  });
}

/**
 * 디바이스 출력 데이터 포맷팅
 */
function formatDeviceOutput(device: {
  type: string;
  brightness: number | null;
  color: string | null;
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
  }

  // 향 관련 (scent, manager)
  if (device.type === "scent" || device.type === "manager") {
    if (device.scentType !== null) output.scentType = device.scentType;
    if (device.scentLevel !== null) output.scentLevel = device.scentLevel;
    if (device.scentInterval !== null)
      output.scentInterval = device.scentInterval;
  }

  // 스피커 관련 (speaker, manager)
  if (device.type === "speaker" || device.type === "manager") {
    if (device.volume !== null) output.volume = device.volume;
    if (device.nowPlaying !== null) output.nowPlaying = device.nowPlaying;
  }

  return output;
}
