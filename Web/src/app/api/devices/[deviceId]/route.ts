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

/**
 * DELETE /api/devices/:deviceId
 *
 * 디바이스 삭제
 *
 * 응답:
 * - 성공: { success: true }
 * - 실패: { error: "ERROR_CODE", message: "에러 메시지" }
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ deviceId: string }> }
) {
  try {
    // 1. 세션 검증
    const sessionOrError = await requireAuth();
    if (sessionOrError instanceof NextResponse) {
      return sessionOrError; // 401 응답 반환
    }
    const session = sessionOrError;

    // 2. 목업 모드 확인 (관리자 계정)
    if (checkMockMode(session)) {
      console.log("[DELETE /api/devices/:deviceId] 목업 모드: 관리자 계정");
      // 관리자 모드에서는 항상 성공 응답 (실제 삭제는 클라이언트에서 처리)
      return NextResponse.json({ success: true });
    }

    // 3. URL 파라미터 추출
    const { deviceId } = await params;

    // 4. 디바이스 존재 여부 및 소유자 확인
    const device = await prisma.device.findUnique({
      where: { id: deviceId },
    });

    if (!device) {
      return NextResponse.json(
        { error: "DEVICE_NOT_FOUND", message: "디바이스를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    if (device.userId !== session.user.id) {
      return NextResponse.json(
        {
          error: "FORBIDDEN",
          message: "디바이스를 삭제할 권한이 없습니다.",
        },
        { status: 403 }
      );
    }

    // 5. 디바이스 삭제 (Hard Delete)
    await prisma.device.delete({
      where: { id: deviceId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/devices/:deviceId] 디바이스 삭제 실패:", error);
    return NextResponse.json(
      {
        error: "INTERNAL_ERROR",
        message: "디바이스 삭제 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}
