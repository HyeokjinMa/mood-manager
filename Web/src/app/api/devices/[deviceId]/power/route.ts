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

/**
 * PUT /api/devices/:deviceId/power
 *
 * 디바이스 전원 상태 변경
 *
 * 요청:
 * - power (required): 전원 상태 (true/false)
 *
 * 응답:
 * - 성공: { device: Device }
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
    const validation = validateRequiredFields(body, ["power"]);
    if (!validation.valid) {
      return NextResponse.json(
        {
          error: "INVALID_INPUT",
          message: "전원 상태는 필수 입력 항목입니다.",
        },
        { status: 400 }
      );
    }

    const { power } = body;

    if (typeof power !== "boolean") {
      return NextResponse.json(
        {
          error: "INVALID_INPUT",
          message: "전원 상태는 true 또는 false여야 합니다.",
        },
        { status: 400 }
      );
    }

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
          message: "디바이스를 제어할 권한이 없습니다.",
        },
        { status: 403 }
      );
    }

    // 5. 전원 상태 업데이트
    const updatedDevice = await prisma.device.update({
      where: { id: deviceId },
      data: { power },
    });

    // 6. 응답 데이터 포맷팅
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
    return NextResponse.json(
      {
        error: "INTERNAL_ERROR",
        message: "전원 상태 변경 중 오류가 발생했습니다.",
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
