import { NextRequest, NextResponse } from "next/server";
import { requireAuth, checkMockMode } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { hexToRgb } from "@/lib/utils";
import { validateRequiredFields } from "@/lib/utils/validation";
import { parseFragranceComponents, parseSoundComponents } from "@/types/preset";
import { getMockMoodStream } from "@/lib/mock/mockData";

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
  // 1. 세션 검증
  const sessionOrError = await requireAuth();
  if (sessionOrError instanceof NextResponse) {
    return sessionOrError;
  }
  const session = sessionOrError;

  // 2. 목업 모드 확인 (관리자 계정)
  if (await checkMockMode(session)) {
    console.log("[GET /api/moods/current] 목업 모드: 관리자 계정");
    const mockData = getMockMoodStream();
    return NextResponse.json({
      currentMood: mockData.currentMood,
      moodStream: mockData.segments,
      userDataCount: mockData.userDataCount,
    });
  }

  try {
    // 2. 기존 Manager 디바이스/프리셋 기반 로직 제거
    //    - 신규 사용자는 디바이스/프리셋 없이도 목업/LLM 기반 스트림으로만 동작
    //    - Manager 디바이스를 강제로 생성하지 않음
    try {
      // DB 접근만 테스트하고, 실패 시에는 목업으로 대체
      await prisma.device.count({
        where: {
          userId: session.user.id,
        },
      });
    } catch (dbError) {
      console.error("[GET /api/moods/current] DB 조회 실패, 목업 데이터 반환:", dbError);
      const { getMockMoodStream } = await import("@/lib/mock/mockData");
      const mockData = getMockMoodStream();
      return NextResponse.json({
        currentMood: mockData.currentMood,
        moodStream: mockData.segments,
        userDataCount: mockData.userDataCount,
      });
    }

    // 3. 현재는 Manager/프리셋 의존성을 제거하고, 목업 스트림을 기본값으로 사용
    //    (실제 DB 기반 무드스트림은 V2 이후 별도 설계에서 재도입)
    const { getMockMoodStream } = await import("@/lib/mock/mockData");
    const mockData = getMockMoodStream();
    return NextResponse.json({
      currentMood: mockData.currentMood,
      moodStream: mockData.segments,
      userDataCount: mockData.userDataCount,
    });
  } catch (error) {
    console.error("[GET /api/moods/current] Error:", error);
    // 에러 발생 시 목업 데이터로 대체
    const { getMockMoodStream } = await import("@/lib/mock/mockData");
    const mockData = getMockMoodStream();
    return NextResponse.json({
      currentMood: mockData.currentMood,
      moodStream: mockData.segments,
      userDataCount: mockData.userDataCount,
    });
  }
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
  // 1. 세션 검증
  const sessionOrError = await requireAuth();
  if (sessionOrError instanceof NextResponse) {
    return sessionOrError;
  }
  const session = sessionOrError;

  try {
    // 2. 요청 본문 검증
    const body = await request.json();
    const validation = validateRequiredFields(body, ["moodId"]);
    if (!validation.valid) {
      return NextResponse.json(
        { error: "INVALID_INPUT", message: "moodId is required" },
        { status: 400 }
      );
    }

    const { moodId } = body;

    // 3. Preset 존재 여부 확인
    const preset = await prisma.preset.findUnique({
      where: { id: moodId },
      include: {
        fragrance: true,
        light: true,
        sound: true,
      },
    });

    if (!preset) {
      return NextResponse.json(
        { error: "MOOD_NOT_FOUND", message: "Mood not found" },
        { status: 404 }
      );
    }

    // 4. Preset 소유자 확인
    if (preset.userId !== session.user.id) {
      return NextResponse.json(
        { error: "UNAUTHORIZED", message: "You do not own this mood" },
        { status: 403 }
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
    return NextResponse.json(
      { error: "INTERNAL_ERROR", message: "Failed to update mood" },
      { status: 500 }
    );
  }
}

