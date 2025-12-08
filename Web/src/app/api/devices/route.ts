// src/app/api/devices/route.ts
/**
 * [파일 역할]
 * - 디바이스 목록 조회 및 생성 API
 * - GET: 현재 사용자의 모든 디바이스 목록 조회
 * - POST: 새 디바이스 생성
 *
 * [사용되는 위치]
 * - 홈 페이지에서 디바이스 목록 로드 시 사용
 * - 디바이스 추가 시 사용
 *
 * [주의사항]
 * - 인증이 필요한 엔드포인트
 * - 사용자별로 디바이스를 분리하여 관리
 * - 디바이스 타입: manager | light | scent | speaker
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth, checkMockMode } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { getMockDevices } from "@/lib/mock/mockData";
import { validateRequiredFields } from "@/lib/utils/validation";
import type { Device } from "@/types/device";
import { MOODS } from "@/types/mood";

/**
 * GET /api/devices
 *
 * 디바이스 목록 조회
 *
 * 응답:
 * - 성공: { devices: Device[] }
 * - 실패: { error: "ERROR_CODE", message: "에러 메시지" }
 */
export async function GET() {
  try {
    // 1. 세션 검증
    const sessionOrError = await requireAuth();
    if (sessionOrError instanceof NextResponse) {
      return sessionOrError; // 401 응답 반환
    }
    const session = sessionOrError;

    // 2. 목업 모드 확인 (관리자 계정)
    if (await checkMockMode(session)) {
      console.log("[GET /api/devices] 목업 모드: 관리자 계정");
      return NextResponse.json({ devices: getMockDevices() });
    }

    // 2. 사용자의 모든 디바이스 조회
    let devices: Awaited<ReturnType<typeof prisma.device.findMany>> = [];
    
    try {
      devices = await prisma.device.findMany({
        where: {
          userId: session.user.id,
          status: "active", // 활성화된 디바이스만 조회
        },
        orderBy: {
          registeredAt: "desc",
        },
      });
    } catch (dbError) {
      console.error("[GET /api/devices] DB 조회 실패, 목업 데이터 반환:", dbError);
      // [MOCK] DB 연결 실패 시 목업 데이터 반환
      const { getMockDevices } = await import("@/lib/mock/mockData");
      return NextResponse.json({ devices: getMockDevices() });
    }

    // 3. 디바이스가 없으면 그대로 빈 배열 반환 (자동 Manager 생성 제거)
    //    - 신규 사용자는 스스로 디바이스를 등록하는 플로우를 유지

    // 4. 디바이스 데이터 포맷팅
    const formattedDevices = devices.map((device) => ({
      id: device.id,
      type: device.type,
      name: device.name,
      battery: device.battery ?? 100,
      power: device.power ?? true,
      output: formatDeviceOutput(device),
    }));

    return NextResponse.json({ devices: formattedDevices });
  } catch (error) {
    console.error("[GET /api/devices] 디바이스 목록 조회 실패:", error);
    return NextResponse.json(
      {
        error: "INTERNAL_ERROR",
        message: "디바이스 목록 조회 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/devices
 *
 * 디바이스 생성
 *
 * 요청:
 * - type (required): 디바이스 타입 ("manager" | "light" | "scent" | "speaker")
 * - name (optional): 디바이스 이름 (미제공 시 자동 생성)
 *
 * 응답:
 * - 성공: { device: Device }
 * - 실패: { error: "ERROR_CODE", message: "에러 메시지" }
 */
export async function POST(request: NextRequest) {
  try {
    // 1. 세션 검증
    const sessionOrError = await requireAuth();
    if (sessionOrError instanceof NextResponse) {
      return sessionOrError; // 401 응답 반환
    }
    const session = sessionOrError;

    // 2. 요청 본문 파싱
    const body = await request.json();
    const { type, name, currentMood } = body;
    
    // 3. 목업 모드 확인 (관리자 계정)
    if (await checkMockMode(session)) {
      console.log("[POST /api/devices] 목업 모드: 관리자 계정");
      
      // 디바이스 타입 검증
      const validTypes = ["manager", "light", "scent", "speaker"];
      if (!validTypes.includes(type)) {
        return NextResponse.json(
          {
            error: "INVALID_INPUT",
            message: "유효하지 않은 디바이스 타입입니다.",
          },
          { status: 400 }
        );
      }
      
      // 목업 디바이스 생성 (임시 ID 생성)
      const mockDevice = createMockDevice(type, name, currentMood);
      return NextResponse.json({ device: mockDevice });
    }
    // 4. 필수 필드 검증
    const validation = validateRequiredFields(body, ["type"]);
    if (!validation.valid) {
      return NextResponse.json(
        {
          error: "INVALID_INPUT",
          message: "디바이스 타입은 필수 입력 항목입니다.",
        },
        { status: 400 }
      );
    }

    // 5. 디바이스 타입 검증
    const validTypes = ["manager", "light", "scent", "speaker"];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        {
          error: "INVALID_INPUT",
          message: "유효하지 않은 디바이스 타입입니다.",
        },
        { status: 400 }
      );
    }

    // 6. 디바이스 이름 자동 생성 (미제공 시)
    let deviceName = name;
    if (!deviceName) {
      const existingDevices = await prisma.device.count({
        where: {
          userId: session.user.id,
          type,
          status: "active",
        },
      });
      const typeNames: Record<string, string> = {
        manager: "Mood Manager",
        light: "Smart Light",
        scent: "Scent Diffuser",
        speaker: "Smart Speaker",
      };
      deviceName = `${typeNames[type]} ${existingDevices + 1}`;
    }

    // 7. 디바이스 기본 설정값 (현재 무드 정보가 있으면 반영)
    const defaultSettings = getDefaultDeviceSettings(type, currentMood);

    // 8. 디바이스 생성
    const device = await prisma.device.create({
      data: {
        userId: session.user.id,
        name: deviceName,
        type,
        status: "active",
        battery: defaultSettings.battery,
        power: defaultSettings.power,
        brightness: defaultSettings.brightness,
        color: defaultSettings.color,
        temperature: defaultSettings.temperature, // 색온도 추가
        scentType: defaultSettings.scentType,
        scentLevel: defaultSettings.scentLevel,
        scentInterval: defaultSettings.scentInterval,
        volume: defaultSettings.volume,
        nowPlaying: defaultSettings.nowPlaying,
      },
    });

    // 9. 응답 데이터 포맷팅
    const formattedDevice = {
      id: device.id,
      type: device.type,
      name: device.name,
      battery: device.battery ?? 100,
      power: device.power ?? true,
      output: formatDeviceOutput(device),
    };

    return NextResponse.json({ device: formattedDevice });
  } catch (error) {
    console.error("[POST /api/devices] 디바이스 생성 실패:", error);
    return NextResponse.json(
      {
        error: "INTERNAL_ERROR",
        message: "디바이스 생성 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}

/**
 * 디바이스 타입별 기본 설정값 반환
 * @param currentMood - 현재 무드 정보 (선택적, 있으면 반영)
 */
function getDefaultDeviceSettings(
  type: string,
  currentMood?: {
    color?: string;
    scentType?: string;
    scentName?: string;
    songTitle?: string;
  } | null
) {
  const baseSettings = {
    battery: 100,
    power: true,
    brightness: null,
    color: null,
    temperature: null, // 색온도 추가
    scentType: null,
    scentLevel: null,
    scentInterval: null,
    volume: null,
    nowPlaying: null,
  };

  switch (type) {
    case "manager":
      return {
        ...baseSettings,
        brightness: 85,
        color: currentMood?.color || "#FFD966",
        temperature: 4000, // 색온도 추가
        scentType: currentMood?.scentName || currentMood?.scentType || "Lavender",
        scentLevel: 7,
        scentInterval: 30,
        volume: 65,
        nowPlaying: currentMood?.songTitle || "Unknown Song",
      };
    case "light":
      return {
        ...baseSettings,
        brightness: 75,
        color: currentMood?.color || "#FFD966",
        temperature: 4000, // 색온도 추가
      };
    case "scent":
      return {
        ...baseSettings,
        scentType: currentMood?.scentName || currentMood?.scentType || "Lavender",
        scentLevel: 7,
        scentInterval: 30,
      };
    case "speaker":
      return {
        ...baseSettings,
        volume: 65,
        nowPlaying: currentMood?.songTitle || "Unknown Song",
      };
    default:
      return baseSettings;
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

/**
 * 목업 디바이스 생성 (관리자 모드용)
 */
function createMockDevice(
  type: Device["type"],
  name?: string,
  currentMood?: {
    color?: string;
    scentType?: string;
    scentName?: string;
    songTitle?: string;
  } | null
): Device {
  const defaultMood = MOODS[0];
  const timestamp = Date.now();
  
  // 디바이스 타입별 기본 설정
  const baseDevice: Partial<Device> = {
    id: `mock-${type}-${timestamp}`,
    type,
    name: name || `Smart ${type.charAt(0).toUpperCase() + type.slice(1)} ${Math.floor(Math.random() * 1000)}`,
    battery: Math.floor(Math.random() * 30) + 70, // 70-100%
    power: true,
  };
  
  switch (type) {
    case "manager":
      return {
        ...baseDevice,
        type: "manager",
        name: name || "Mood Manager",
        output: {
          brightness: 80,
          color: currentMood?.color || defaultMood.color,
          temperature: 4000,
          scentType: currentMood?.scentName || currentMood?.scentType || defaultMood.scent.name,
          scentLevel: 7,
          scentInterval: 30,
          volume: 65,
          nowPlaying: currentMood?.songTitle || defaultMood.song.title,
        },
      } as Device;
    case "light":
      return {
        ...baseDevice,
        type: "light",
        name: name || `Smart Light ${Math.floor(Math.random() * 1000)}`,
        output: {
          brightness: 70,
          color: currentMood?.color || defaultMood.color,
          temperature: 4000,
        },
      } as Device;
    case "scent":
      return {
        ...baseDevice,
        type: "scent",
        name: name || `Smart Diffuser ${Math.floor(Math.random() * 1000)}`,
        output: {
          scentType: currentMood?.scentName || currentMood?.scentType || defaultMood.scent.name,
          scentLevel: 5,
          scentInterval: 30,
        },
      } as Device;
    case "speaker":
      return {
        ...baseDevice,
        type: "speaker",
        name: name || `Smart Speaker ${Math.floor(Math.random() * 1000)}`,
        output: {
          volume: 60,
          nowPlaying: currentMood?.songTitle || defaultMood.song.title,
        },
      } as Device;
    default:
      throw new Error(`Invalid device type: ${type}`);
  }
}
