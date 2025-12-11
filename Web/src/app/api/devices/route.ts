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
import { withAuthAndMock, createErrorResponse } from "@/lib/api/routeHandler";
import { ERROR_CODES } from "@/lib/api/errorCodes";
import type { Device } from "@/types/device";
import { MOODS } from "@/types/mood";

/**
 * GET /api/devices
 *
 * 현재 사용자의 활성화된 디바이스 목록을 조회합니다.
 *
 * @route GET /api/devices
 * @access 인증 필요
 *
 * @returns {Promise<NextResponse>} 응답 객체
 * @returns {Device[]} devices - 디바이스 배열
 *
 * @throws {401} UNAUTHORIZED - 인증되지 않은 요청
 * @throws {500} INTERNAL_ERROR - 서버 오류
 *
 * @example
 * ```typescript
 * const response = await fetch('/api/devices');
 * const { devices } = await response.json();
 * ```
 */
export async function GET() {
  const startTime = Date.now();
  console.log("[GET /api/devices] 🔄 디바이스 목록 조회 시작");
  
  return withAuthAndMock(
    async (session) => {
      try {
        // 사용자의 모든 디바이스 조회
        let devices: Awaited<ReturnType<typeof prisma.device.findMany>> = [];
        
        try {
          const dbStartTime = Date.now();
          devices = await prisma.device.findMany({
            where: {
              userId: session.user.id,
              status: "active", // 활성화된 디바이스만 조회
            },
            orderBy: {
              registeredAt: "desc",
            },
          });
          const dbTime = Date.now() - dbStartTime;
          console.log(`[GET /api/devices] ✅ DB 쿼리 완료 (${dbTime}ms):`, {
            devicesCount: devices.length,
            userId: session.user.id,
          });
        } catch (dbError) {
          const dbErrorTime = Date.now() - startTime;
          console.error(`[GET /api/devices] ❌ DB 조회 실패 (${dbErrorTime}ms), 목업 데이터 반환:`, dbError);
          // [MOCK] DB 연결 실패 시 목업 데이터 반환
          const { getMockDevices } = await import("@/lib/mock/mockData");
          return NextResponse.json({ devices: getMockDevices() });
        }

        // 디바이스가 없으면 그대로 빈 배열 반환 (자동 Manager 생성 제거)
        //    - 신규 사용자는 스스로 디바이스를 등록하는 플로우를 유지

        // 디바이스 데이터 포맷팅
        const formatStartTime = Date.now();
        const formattedDevices = devices.map((device) => ({
          id: device.id,
          type: device.type,
          name: device.name,
          battery: device.battery ?? 100,
          power: device.power ?? true,
          output: formatDeviceOutput(device),
        }));
        const formatTime = Date.now() - formatStartTime;
        
        const totalTime = Date.now() - startTime;
        console.log(`[GET /api/devices] ✅ 디바이스 목록 조회 완료 (총 ${totalTime}ms):`, {
          dbTime: `${totalTime - formatTime}ms`,
          formatTime: `${formatTime}ms`,
          devicesCount: formattedDevices.length,
        });

        return NextResponse.json({ devices: formattedDevices });
      } catch (error) {
        console.error("[GET /api/devices] 디바이스 목록 조회 실패:", error);
        return createErrorResponse(
          ERROR_CODES.INTERNAL_ERROR,
          "디바이스 목록 조회 중 오류가 발생했습니다."
        );
      }
    },
    (session) => {
      // 목업 모드: 관리자 계정
      console.log("[GET /api/devices] 목업 모드: 관리자 계정");
      return NextResponse.json({ devices: getMockDevices() });
    }
  );
}

/**
 * POST /api/devices
 *
 * 새로운 디바이스를 생성합니다.
 *
 * @route POST /api/devices
 * @access 인증 필요
 *
 * @param {NextRequest} request - 요청 객체
 * @param {string} request.body.type - 디바이스 타입 (required): "manager" | "light" | "scent" | "speaker"
 * @param {string} [request.body.name] - 디바이스 이름 (optional, 미제공 시 자동 생성)
 * @param {object} [request.body.currentMood] - 현재 무드 설정 (optional)
 *
 * @returns {Promise<NextResponse>} 응답 객체
 * @returns {Device} device - 생성된 디바이스 정보
 *
 * @throws {400} INVALID_INPUT - 필수 필드 누락 또는 유효하지 않은 타입
 * @throws {401} UNAUTHORIZED - 인증되지 않은 요청
 * @throws {500} INTERNAL_ERROR - 서버 오류
 *
 * @example
 * ```typescript
 * const response = await fetch('/api/devices', {
 *   method: 'POST',
 *   body: JSON.stringify({ type: 'light', name: '거실 조명' })
 * });
 * const { device } = await response.json();
 * ```
 */
export async function POST(request: NextRequest) {
  return withAuthAndMock(
    async (session) => {
      try {
        // 요청 본문 파싱
        const body = await request.json();
        const { type, name, currentMood } = body;
        // 필수 필드 검증
        const validation = validateRequiredFields(body, ["type"]);
        if (!validation.valid) {
          return createErrorResponse(
            ERROR_CODES.INVALID_INPUT,
            "디바이스 타입은 필수 입력 항목입니다."
          );
        }

        // 디바이스 타입 검증
        const validTypes = ["manager", "light", "scent", "speaker"];
        if (!validTypes.includes(type)) {
          return createErrorResponse(
            ERROR_CODES.INVALID_INPUT,
            "유효하지 않은 디바이스 타입입니다."
          );
        }

        // 디바이스 이름 자동 생성 (미제공 시)
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

        // 디바이스 기본 설정값 (현재 무드 정보가 있으면 반영)
        const defaultSettings = getDefaultDeviceSettings(type, currentMood);

        // 디바이스 생성
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

        // 응답 데이터 포맷팅
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
        return createErrorResponse(
          ERROR_CODES.INTERNAL_ERROR,
          "디바이스 생성 중 오류가 발생했습니다."
        );
      }
    },
    (session) => {
      // 목업 모드: 관리자 계정
      console.log("[POST /api/devices] 목업 모드: 관리자 계정");
      
      // 요청 본문 파싱 (목업 모드에서도 검증 필요)
      return request.json().then((body) => {
        const { type, name, currentMood } = body;
        
        // 디바이스 타입 검증
        const validTypes = ["manager", "light", "scent", "speaker"];
        if (!validTypes.includes(type)) {
          return createErrorResponse(
            ERROR_CODES.INVALID_INPUT,
            "유효하지 않은 디바이스 타입입니다."
          );
        }
        
        // 목업 디바이스 생성 (임시 ID 생성)
        const mockDevice = createMockDevice(type, name, currentMood);
        return NextResponse.json({ device: mockDevice });
      }).catch((error) => {
        console.error("[POST /api/devices] 목업 모드 요청 파싱 실패:", error);
        return createErrorResponse(
          ERROR_CODES.INVALID_INPUT,
          "요청 본문을 파싱할 수 없습니다."
        );
      });
    }
  );
}

/**
 * 초기 세그먼트 컬러 (폴백 값)
 * 스트림 생성 후에도 같은 값이므로 사용자 경험이 부드러움
 */
const INITIAL_SEGMENT_COLORS = ["#DC143C", "#228B22", "#FFD700"]; // 크리스마스 레드, 그린, 골드
const INITIAL_SEGMENT_SCENTS = ["Wood", "Cinnamon Stick", "Lavender"]; // 초기 세그먼트 향
const INITIAL_SEGMENT_SONGS = [
  "All I want for christmas",
  "Last Christmas", 
  "Jingle bell rock"
]; // 초기 세그먼트 노래

/**
 * 디바이스 타입별 기본 설정값 반환
 * @param currentMood - 현재 무드 정보 (선택적, 있으면 반영)
 * 초기 세그먼트 값들을 폴백으로 사용하여 스트림 생성 전에도 일관된 경험 제공
 */
function getDefaultDeviceSettings(
  type: string,
  currentMood?: {
    color?: string;
    scentType?: string;
    scentName?: string;
    songTitle?: string;
    brightness?: number; // 현재 세그먼트의 밝기 값
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

  // 초기 세그먼트 값들을 폴백으로 사용 (첫 번째 세그먼트 값)
  const fallbackColor = currentMood?.color || INITIAL_SEGMENT_COLORS[0];
  const fallbackScent = currentMood?.scentName || currentMood?.scentType || INITIAL_SEGMENT_SCENTS[0];
  const fallbackSong = currentMood?.songTitle || INITIAL_SEGMENT_SONGS[0];

  switch (type) {
    case "manager":
      return {
        ...baseSettings,
        // 현재 세그먼트의 brightness 사용, 없으면 50 (기존 디바이스와 통일)
        brightness: currentMood?.brightness ?? 50,
        color: fallbackColor,
        temperature: 4000, // 색온도 추가
        scentType: fallbackScent,
        scentLevel: 7,
        scentInterval: 30,
        volume: 65,
        nowPlaying: fallbackSong,
      };
    case "light":
      return {
        ...baseSettings,
        // 현재 세그먼트의 brightness 사용, 없으면 50 (기존 디바이스와 통일)
        brightness: currentMood?.brightness ?? 50,
        color: fallbackColor,
        temperature: 4000, // 색온도 추가
      };
    case "scent":
      return {
        ...baseSettings,
        scentType: fallbackScent,
        scentLevel: 7,
        scentInterval: 30,
      };
    case "speaker":
      return {
        ...baseSettings,
        volume: 65,
        nowPlaying: fallbackSong,
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
