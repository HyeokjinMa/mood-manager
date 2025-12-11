// src/app/api/devices/[deviceId]/route.ts
/**
 * [파일 역할]
 * - 디바이스 삭제 API
 * - DELETE: 디바이스 삭제
 *
 * [사용되는 위치]
 * - 디바이스 관리 페이지에서 디바이스 삭제 시 사용
 *
 * [주의사항]
 * - 인증이 필요한 엔드포인트
 * - 디바이스 소유자만 삭제 가능
 * - Hard Delete 방식 사용 (DB에서 완전 삭제)
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth, checkMockMode } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { withAuthAndMock, createErrorResponse } from "@/lib/api/routeHandler";
import { ERROR_CODES } from "@/lib/api/errorCodes";

/**
 * DELETE /api/devices/:deviceId
 *
 * 디바이스를 삭제합니다. Hard Delete 방식으로 DB에서 완전히 제거됩니다.
 *
 * @route DELETE /api/devices/:deviceId
 * @access 인증 필요
 *
 * @param {NextRequest} _request - 요청 객체 (사용하지 않음)
 * @param {object} context - 컨텍스트 객체
 * @param {Promise<{deviceId: string}>} context.params - URL 파라미터
 *
 * @returns {Promise<NextResponse>} 응답 객체
 * @returns {boolean} success - 삭제 성공 여부
 *
 * @throws {401} UNAUTHORIZED - 인증되지 않은 요청
 * @throws {403} FORBIDDEN - 디바이스 소유자가 아님
 * @throws {404} DEVICE_NOT_FOUND - 디바이스를 찾을 수 없음
 * @throws {500} INTERNAL_ERROR - 서버 오류
 *
 * @example
 * ```typescript
 * const response = await fetch('/api/devices/device-id', {
 *   method: 'DELETE'
 * });
 * const { success } = await response.json();
 * ```
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ deviceId: string }> }
) {
  return withAuthAndMock(
    async (session) => {
      try {
        // URL 파라미터 추출
        const { deviceId } = await params;

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
            "디바이스를 삭제할 권한이 없습니다."
          );
        }

        // 디바이스 삭제 (Hard Delete)
        await prisma.device.delete({
          where: { id: deviceId },
        });

        return NextResponse.json({ success: true });
      } catch (error) {
        console.error("[DELETE /api/devices/:deviceId] 디바이스 삭제 실패:", error);
        return createErrorResponse(
          ERROR_CODES.INTERNAL_ERROR,
          "디바이스 삭제 중 오류가 발생했습니다."
        );
      }
    },
    (session) => {
      // 목업 모드: 관리자 계정
      console.log("[DELETE /api/devices/:deviceId] 목업 모드: 관리자 계정");
      // 관리자 모드에서는 항상 성공 응답 (실제 삭제는 클라이언트에서 처리)
      return NextResponse.json({ success: true });
    }
  );
}
