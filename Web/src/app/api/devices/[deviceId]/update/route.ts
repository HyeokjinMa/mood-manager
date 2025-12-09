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

/**
 * PUT /api/devices/:deviceId/update
 *
 * 디바이스 설정 업데이트
 *
 * 요청:
 * - color?: string
 * - brightness?: number
 * - temperature?: number
 * - scentType?: string
 * - scentLevel?: number
 * - scentInterval?: number
 * - volume?: number
 * - nowPlaying?: string
 *
 * 응답:
 * - 성공: { success: true, device: Device }
 * - 실패: { error: "ERROR_CODE", message: "에러 메시지" }
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ deviceId: string }> }
) {
  try {
    // 1. 세션 검증
    const sessionOrError = await requireAuth();
    if (sessionOrError instanceof NextResponse) {
      return sessionOrError; // 401 응답 반환
    }
    const session = sessionOrError;

    // 2. URL 파라미터 추출
    const { deviceId } = await params;

    // 3. 요청 본문 파싱
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

    // 4. 목업 모드 확인 (관리자 계정)
    if (await checkMockMode(session)) {
      console.log("[PUT /api/devices/:deviceId/update] 목업 모드: 관리자 계정");
      return NextResponse.json({ success: true });
    }

    // 5. 디바이스 존재 여부 및 소유자 확인
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
          message: "디바이스를 수정할 권한이 없습니다.",
        },
        { status: 403 }
      );
    }

    // 6. 업데이트할 데이터 구성
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

    // 7. 디바이스 업데이트
    const updatedDevice = await prisma.device.update({
      where: { id: deviceId },
      data: updateData,
    });

    // 8. 응답 데이터 포맷팅
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
    return NextResponse.json(
      {
        error: "INTERNAL_ERROR",
        message: "디바이스 업데이트 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
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

