import { NextRequest, NextResponse } from "next/server";
import { requireAuth, checkMockMode } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { hexToRgb } from "@/lib/utils";
import { validateRequiredFields } from "@/lib/utils/validation";
import { parseFragranceComponents, parseSoundComponents } from "@/types/preset";
import { getMockMoodStream } from "@/lib/mock/mockData";
import { withAuth, withAuthAndMock, createErrorResponse } from "@/lib/api/routeHandler";
import { ERROR_CODES } from "@/lib/api/errorCodes";

/**
 * GET /api/moods/current
 * 
 * 현재 무드 및 무드스트림 조회 API
 * 
 * [무드 생성 로직]
 * 백엔드에서 10분마다 자동으로 검증을 수행합니다:
 * 1. 현재 생체 데이터(V1)와 예측 무드(V0 * P^10)의 클러스터를 비교
 * 2. 클러스터가 다르면 즉시 새 30분 무드스트림 생성
 * 3. 클러스터가 같으면 기존 스트림 유지, 10분 전에 다음 스트림 예약
 * 4. 전환 시 현재 노래가 끝난 후 새 무드로 전환 (자연스러운 UX)
 * 
 * [클러스터 정의]
 * - '-': 부정 클러스터 (우울, 분노, 슬픔 등)
 * - '0': 중립 클러스터 (안정, 평온 등)
 * - '+': 긍정 클러스터 (기쁨, 즐거움 등)
 * 
 * [예외 처리]
 * 데이터 부족 또는 모델 실패 시 '+' 클러스터 중 하나를 기본값으로 제안
 * 
 * TODO: 백엔드 서버로 요청을 프록시하거나 직접 호출하도록 구현
 * 
 * 구현 내용:
 * 1. NextAuth 세션 확인 (인증 필수)
 * 2. 백엔드 서버로 GET 요청 전달
 *    - URL: ${BACKEND_URL}/api/moods/current
 *    - Headers: 세션 정보 포함
 * 3. 백엔드 응답을 그대로 반환
 *    - 응답 형식:
 *      {
 *        currentMood: Mood, // 현재 적용 중인 무드
 *        moodStream: Array<{ timestamp: string, mood: Mood }>, // 30분 스트림 (약 10곡)
 *        cluster: '-' | '0' | '+', // 현재 무드의 클러스터
 *        streamStatus: 'maintained' | 'regenerated', // 스트림 상태
 *        nextCheck: string, // 다음 검증 시점 (ISO 8601)
 *        nextStreamReady?: string // 다음 스트림 준비 완료 시점 (유지 시에만)
 *      }
 * 
 * 참고:
 * - 인증이 필요한 엔드포인트
 * - 프론트엔드는 주기적으로(예: 1분마다) 이 API를 호출하여 최신 무드스트림 받음
 * - streamStatus가 'regenerated'이고 현재 노래가 끝나면 새 무드로 전환
 * - 자세한 로직은 MOOD_GENERATION_LOGIC.md 참고
 */
export async function GET() {
  return withAuthAndMock(
    async (session) => {
      try {
    // 3. 일반 유저: 실데이터 기반 스트림을 우선 시도
    try {
      const userId = session.user.id;

      // 사용자의 즐겨찾기(별표) Preset 조회
      const presets = await prisma.preset.findMany({
        where: {
          userId,
          isStarred: true,
        },
        include: {
          fragrance: true,
          light: true,
          sound: {
            include: {
              genre: true,
            },
          },
        },
      });

      if (presets.length > 0) {
        console.log(
          "[GET /api/moods/current] 실데이터 스트림 사용 (starred presets 기반):",
          { userId, presetCount: presets.length }
        );

        // 가장 첫 Preset을 현재 무드로 사용
        const basePreset = presets[0];

        // Preset → currentMood 포맷 변환
        const currentMood = {
          id: basePreset.id,
          name: basePreset.name,
          color: basePreset.light.color,
          music: {
            genre: basePreset.sound.genre?.name || "newage",
            title: basePreset.sound.name,
          },
          scent: {
            type: basePreset.fragrance.name, // 타입 대신 이름을 우선 사용
            name: basePreset.fragrance.name,
          },
          lighting: {
            color: basePreset.light.color,
            rgb: hexToRgb(basePreset.light.color),
          },
        };

        const now = Date.now();

        // 10개 세그먼트를 Preset 순환 구조로 간단 생성
        const moodStream = Array.from({ length: 10 }, (_, idx) => {
          const preset = presets[idx % presets.length];
          const segmentStartTime = now + idx * 10 * 60 * 1000; // 10분 간격 가정
          const duration = (preset.sound.duration || 180) * 1000;

          return {
            timestamp: segmentStartTime,
            duration,
            mood: {
              id: preset.id,
              name: preset.name,
              color: preset.light.color,
              music: {
                genre: preset.sound.genre?.name || "newage",
                title: preset.sound.name,
              },
              scent: {
                type: preset.fragrance.name,
                name: preset.fragrance.name,
              },
              lighting: {
                color: preset.light.color,
                rgb: hexToRgb(preset.light.color),
              },
            },
            musicTracks: [
              {
                title: preset.sound.name,
                artist: "Mood Manager",
                duration,
                startOffset: 0,
                fadeIn: 750,
                fadeOut: 750,
                fileUrl: preset.sound.fileUrl,
              },
            ],
          };
        });

        return NextResponse.json({
          currentMood,
          moodStream,
          userDataCount: presets.length,
          source: "db-presets",
        });
      }
    } catch (dbError) {
      console.error(
        "[GET /api/moods/current] 실데이터 스트림 생성 중 DB 에러, mock fallback 으로 전환:",
        dbError
      );
    }

    // 4. 실데이터 스트림을 만들 수 없으면 목업 스트림으로 fallback
    console.log("[GET /api/moods/current] 실데이터 스트림 없음 → mock 스트림 fallback");
    const mockData = getMockMoodStream();
    return NextResponse.json({
      currentMood: mockData.currentMood,
      moodStream: mockData.segments,
      userDataCount: mockData.userDataCount,
        source: "mock-fallback",
      });
    } catch (error) {
      console.error("[GET /api/moods/current] Error (global), mock fallback:", error);
      const mockData = getMockMoodStream();
      return NextResponse.json({
        currentMood: mockData.currentMood,
        moodStream: mockData.segments,
        userDataCount: mockData.userDataCount,
        source: "mock-error",
      });
    }
    },
    (session) => {
      // 목업 모드: 관리자 계정 → 계속 목업 스트림 유지
      console.log("[GET /api/moods/current] 목업 모드: 관리자 계정 → mock 스트림 사용");
      const mockData = getMockMoodStream();
      return NextResponse.json({
        currentMood: mockData.currentMood,
        moodStream: mockData.segments,
        userDataCount: mockData.userDataCount,
        source: "mock-admin",
      });
    }
  );
}

/**
 * PUT /api/moods/current
 * 
 * 무드 전체 변경 API
 * 
 * TODO: 백엔드 서버로 요청을 프록시하거나 직접 호출하도록 구현
 * 
 * 구현 내용:
 * 1. NextAuth 세션 확인 (인증 필수)
 * 2. 요청 본문에서 moodId 추출
 * 3. 유효성 검사 (moodId가 유효한지 확인)
 * 4. 백엔드 서버로 PUT 요청 전달
 *    - URL: ${BACKEND_URL}/api/moods/current
 *    - Body: { moodId: string }
 *    - Headers: 세션 정보 포함
 * 5. 백엔드 응답을 그대로 반환
 *    - 응답: { mood: Mood, updatedDevices: Device[] }
 * 
 * 참고:
 * - 인증이 필요한 엔드포인트
 * - 무드 변경 시 관련 디바이스(Manager, Light) 상태 자동 업데이트
 * - 색상, 음악, 향 모두 변경
 */
export async function PUT(request: NextRequest) {
  return withAuth(async (session) => {
    try {
      // 요청 본문 검증
      const body = await request.json();
      const validation = validateRequiredFields(body, ["moodId"]);
      if (!validation.valid) {
        return createErrorResponse(
          ERROR_CODES.INVALID_INPUT,
          "moodId is required"
        );
      }

      const { moodId } = body;

      // Preset 존재 여부 확인
      const preset = await prisma.preset.findUnique({
        where: { id: moodId },
        include: {
          fragrance: true,
          light: true,
          sound: true,
        },
      });

      if (!preset) {
        return createErrorResponse(
          ERROR_CODES.MOOD_NOT_FOUND,
          "Mood not found"
        );
      }

      // Preset 소유자 확인
      if (preset.userId !== session.user.id) {
        return createErrorResponse(
          ERROR_CODES.FORBIDDEN,
          "You do not own this mood"
        );
      }

    // 5. 사용자의 모든 디바이스에 Preset 적용
    const devices = await prisma.device.findMany({
      where: {
        userId: session.user.id,
        power: true, // 전원이 켜진 디바이스만
      },
    });

    const updatedDevices = await Promise.all(
      devices.map(async (device) => {
        const updateData: {
          currentPresetId: string;
          brightness?: number;
          color?: string;
          scentType?: string;
          scentLevel?: number;
          scentInterval?: number;
          volume?: number;
          nowPlaying?: string;
        } = {
          currentPresetId: preset.id,
        };

        // 디바이스 타입별 출력 설정
        if (device.type === "manager" || device.type === "light") {
          updateData.brightness = preset.light.brightness;
          updateData.color = preset.light.color;
        }

        if (device.type === "manager" || device.type === "scent") {
          updateData.scentType = preset.fragrance.name;
        }

        if (device.type === "manager" || device.type === "speaker") {
          updateData.nowPlaying = preset.sound.name;
        }

        return await prisma.device.update({
          where: { id: device.id },
          data: updateData,
        });
      })
    );

    // 6. Preset 업데이트 (updatedType = 'all')
    await prisma.preset.update({
      where: { id: preset.id },
      data: {
        updatedType: "all",
        updatedAt: new Date(),
      },
    });

    // 7. Fragrance componentsJson에서 type 추출 (PUT 응답용)
    const fragranceComponentsPut = parseFragranceComponents(preset.fragrance.componentsJson);
    const scentTypePut = fragranceComponentsPut.type;

    // 8. 응답 포맷팅
    return NextResponse.json({
      mood: {
        id: preset.id,
        name: preset.name,
        color: preset.light.color,
        song: {
          title: preset.sound.name,
          duration: preset.sound.duration || 180,
        },
        scent: {
          type: scentTypePut.toLowerCase(),  // 타입: "musk", "citrus" 등
          name: preset.fragrance.name,       // 이름: "Cloud", "Wave" 등
          color: preset.fragrance.color || preset.light.color,
        },
      },
      updatedDevices: updatedDevices.map((device) => ({
        id: device.id,
        type: device.type,
        name: device.name,
        battery: device.battery || 100,
        power: device.power || true,
        output: {
          ...(device.type === "manager" || device.type === "light"
            ? {
                brightness: device.brightness || preset.light.brightness,
                color: device.color || preset.light.color,
              }
            : {}),
          ...(device.type === "manager" || device.type === "scent"
            ? {
                scentType: preset.fragrance.name,
                scentLevel: device.scentLevel || 7,
                ...(device.scentInterval ? { scentInterval: device.scentInterval } : {}),
              }
            : {}),
          ...(device.type === "manager" || device.type === "speaker"
            ? {
                volume: device.volume || 65,
                nowPlaying: preset.sound.name,
              }
            : {}),
        },
      })),
    });
    } catch (error) {
      console.error("[PUT /api/moods/current] Error:", error);
      return createErrorResponse(
        "INTERNAL_ERROR",
        "Failed to update mood"
      );
    }
  });
}

