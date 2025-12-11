// src/app/api/moods/current/generate/route.ts
/**
 * POST /api/moods/current/generate
 * 
 * 다음 무드스트림 생성 API
 * 
 * 실제 전처리 + 마르코프 + LLM 호출을 통해 10개 세그먼트 생성
 * 클라이언트에서 요청한 segmentCount만큼만 반환 (기본 7개)
 */

import { NextRequest, NextResponse } from "next/server";

// AWS EC2에서 긴 실행 시간을 허용하기 위해 maxDuration 설정 (최대 300초 = 5분)
export const maxDuration = 300;
import { requireAuth, checkMockMode } from "@/lib/auth/session";
import { getCommonData } from "@/app/api/ai/background-params/utils/getCommonData";
import { handleStreamMode } from "@/app/api/ai/background-params/handlers/streamHandler";
import { chainSegments } from "@/lib/utils/segmentUtils";
import type { MoodStreamSegment } from "@/hooks/useMoodStream/types";
import { getMockMoodStream } from "@/lib/mock/mockData";
import type { BackgroundParamsResponse } from "@/types/llm";
import type { BackgroundParams } from "@/hooks/useBackgroundParams";
import type { ScentType, Scent } from "@/types/mood";
import { SCENT_DEFINITIONS } from "@/types/mood";
import { withAuthAndMock, createErrorResponse } from "@/lib/api/routeHandler";
import { ERROR_CODES } from "@/lib/api/errorCodes";

/**
 * POST /api/moods/current/generate
 * 
 * 다음 무드스트림을 생성합니다. 전처리, 마르코프 체인 예측, LLM 호출을 통해 10개 세그먼트를 생성하고,
 * 요청한 segmentCount만큼만 반환합니다.
 * 
 * @route POST /api/moods/current/generate
 * @access 인증 필요
 * @maxDuration 300초 (5분) - AWS EC2에서 긴 실행 시간 허용
 * 
 * @param {NextRequest} request - 요청 객체
 * @param {number} [request.body.nextStartTime] - 다음 세그먼트 시작 시간 (밀리초, 기본값: 현재 시간)
 * @param {number} [request.body.segmentCount] - 생성할 세그먼트 수 (기본값: 7, 최대: 10)
 * 
 * @returns {Promise<NextResponse>} 응답 객체
 * @returns {object} currentMood - 현재 무드 정보
 * @returns {MoodStreamSegment[]} moodStream - 무드스트림 세그먼트 배열
 * @returns {string} streamId - 스트림 고유 ID
 * @returns {number} userDataCount - 사용자 데이터 개수
 * 
 * @throws {401} UNAUTHORIZED - 인증되지 않은 요청
 * @throws {500} INTERNAL_ERROR - 서버 오류 (LLM 호출 실패 시 목업 데이터 반환)
 * 
 * @example
 * ```typescript
 * const response = await fetch('/api/moods/current/generate', {
 *   method: 'POST',
 *   body: JSON.stringify({ segmentCount: 7 })
 * });
 * const { currentMood, moodStream } = await response.json();
 * ```
 */
export async function POST(request: NextRequest) {
  return withAuthAndMock(
    async (session) => {
      let body: { nextStartTime?: number; segmentCount?: number } = {};
      let nextStartTime = Date.now();
      let segmentCount = 7;

      try {
        // Request Body 파싱
        try {
          body = await request.json();
        } catch {
          body = {};
        }

        nextStartTime = body.nextStartTime || Date.now();
        segmentCount = Math.min(body.segmentCount || 7, 10); // 최대 10개

        // 목업 모드 체크
        const isAdminMode = await checkMockMode(session);
        if (isAdminMode) {
          console.log("[POST /api/moods/current/generate] 목업 모드: 관리자 계정 → 목업 데이터 즉시 반환");
          
          const mockStream = getMockMoodStream();
          const chainedSegments = chainSegments(nextStartTime, mockStream.segments);
          
          // MoodStreamSegment 형식으로 변환 (backgroundParams 포함)
          const mockSegments: MoodStreamSegment[] = chainedSegments.slice(0, segmentCount).map((seg, index) => ({
            timestamp: seg.timestamp,
            duration: seg.duration,
            mood: seg.mood,
            musicTracks: seg.musicTracks,
            backgroundParams: {
              moodAlias: seg.mood.name,
              musicSelection: seg.musicTracks[0]?.title || "",
              moodColor: seg.mood.color,
              lighting: {
                brightness: 50,
                temperature: 4000,
              },
              backgroundIcon: {
                name: "FaCircle",
                category: "abstract",
              },
              iconKeys: ["circle", "dot"],
              backgroundWind: {
                direction: 180,
                speed: 5,
              },
              animationSpeed: 5,
              iconOpacity: 0.7,
              source: "mock-admin",
            } as BackgroundParams,
          }));
          
          return NextResponse.json({
            currentMood: mockStream.currentMood,
            moodStream: mockSegments,
            streamId: mockStream.streamId,
            userDataCount: mockStream.userDataCount,
          });
        }

        // 일반 모드: LLM 호출
        // 1. 전처리 데이터 및 무드스트림 가져오기 (일반 사용자)
        console.log("[POST /api/moods/current/generate] 🔄 Step 1: 전처리 데이터 및 무드스트림 가져오기 시작");
        const startTime = Date.now();
        const { preprocessed, moodStream } = await getCommonData(request, isAdminMode);
        console.log(`[POST /api/moods/current/generate] ✅ Step 1 완료 (${Date.now() - startTime}ms)`);
        console.log(`[POST /api/moods/current/generate] 📊 전처리 데이터:`, {
          hasEmotionEvents: !!preprocessed?.emotionEvents,
          hasWeather: !!preprocessed?.weather,
          averageStressIndex: preprocessed?.average_stress_index,
          recentStressIndex: preprocessed?.recent_stress_index,
        });
        console.log(`[POST /api/moods/current/generate] 📊 무드스트림 데이터:`, {
          hasCurrentMood: !!moodStream?.currentMood,
          userDataCount: moodStream?.userDataCount || 0,
        });

        // 2. handleStreamMode 호출 준비
        // handleStreamMode는 내부에서 Python 서버 호출 및 LLM 호출을 수행
        // segments는 현재 무드스트림의 첫 번째 세그먼트를 사용 (handleStreamMode가 segments[0]을 참조)
        const currentSegments = moodStream.moodStream && moodStream.moodStream.length > 0
          ? moodStream.moodStream.slice(0, 1) // 첫 번째 세그먼트만 사용
          : [{
              timestamp: Date.now(),
              duration: 180 * 1000,
              mood: {
                id: moodStream.currentMood.id,
                name: moodStream.currentMood.name,
                color: moodStream.currentMood.lighting?.color || "#E6F3FF",
                music: moodStream.currentMood.music,
                scent: moodStream.currentMood.scent,
                lighting: moodStream.currentMood.lighting,
              },
              musicTracks: [],
            }];
        
        // 3. LLM 호출 (전처리 + 마르코프 + LLM)
        // handleStreamMode는 내부에서:
        // 1) Python 서버 호출 (마르코프 체인 예측)
        // 2) LLM 호출 (10개 세그먼트 생성)
        console.log("[POST /api/moods/current/generate] 🔄 Step 2: LLM 호출 시작 (마르코프 + LLM)");
        const llmStartTime = Date.now();
        const llmResponse = await handleStreamMode({
          segments: currentSegments,
          preprocessed,
          moodStream,
          userPreferences: {
            music: {},
            color: {},
            scent: {},
          },
          forceFresh: false,
          userId: session.user.id,
          session,
        });

        console.log(`[POST /api/moods/current/generate] ✅ Step 2 완료 (${Date.now() - llmStartTime}ms)`);
        
        if (!llmResponse.ok) {
          console.error("[POST /api/moods/current/generate] ❌ LLM 호출 실패, 목업 데이터로 폴백");
          // 실패 시 목업 데이터 반환
          const mockStream = getMockMoodStream();
          // @ts-expect-error - chainSegments 반환 타입 호환성
          mockStream.segments = chainSegments(nextStartTime, mockStream.segments);
          return NextResponse.json({
            currentMood: mockStream.currentMood,
            moodStream: mockStream.segments.slice(0, segmentCount),
            streamId: mockStream.streamId,
            userDataCount: mockStream.userDataCount,
          });
        }

        const llmData = await llmResponse.json();

        // 4. LLM 응답을 MoodStreamSegment[]로 변환
        // Phase 1: backgroundParams를 각 세그먼트에 통합
        let generatedSegments: MoodStreamSegment[] = [];
        
        // BackgroundParamsResponse를 BackgroundParams로 변환하는 헬퍼 함수
        const convertToBackgroundParams = (seg: BackgroundParamsResponse): BackgroundParams => {
          return {
            moodAlias: String(seg.moodAlias || ""),
            musicSelection: String(seg.musicSelection || ""),
            moodColor: String(seg.moodColor || "#E6F3FF"),
            lighting: seg.lighting || { brightness: 50 },
            backgroundIcon: seg.backgroundIcon || { name: "FaCircle", category: "abstract" },
            iconKeys: seg.iconKeys || [],
            backgroundWind: seg.backgroundWind || { direction: 180, speed: 5 },
            animationSpeed: typeof seg.animationSpeed === "number" ? seg.animationSpeed : 5,
            iconOpacity: typeof seg.iconOpacity === "number" ? seg.iconOpacity : 0.7,
            // 선택적 필드들은 BackgroundParamsResponse에 없을 수 있음
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            iconCount: (seg as any).iconCount,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            iconSize: (seg as any).iconSize,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            particleEffect: (seg as any).particleEffect,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            gradientColors: (seg as any).gradientColors,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            transitionDuration: (seg as any).transitionDuration,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            source: (seg as any).source,
          };
        };
        
        if (llmData.segments && Array.isArray(llmData.segments) && llmData.segments.length > 0) {
          // 10개 세그먼트 응답
          const segmentsArray = await Promise.all(
            llmData.segments.map(async (seg: BackgroundParamsResponse & { 
              musicTracks?: Array<{ 
                title?: string; 
                artist?: string; 
                duration?: number; 
                startOffset?: number; 
                fadeIn?: number; 
                fadeOut?: number; 
                fileUrl?: string; 
                albumImageUrl?: string; 
                genre?: string;
              }>; 
              scent?: { type?: string; name?: string } 
            }, index: number) => {
              const musicTracks = seg.musicTracks || [];
              const duration = musicTracks[0]?.duration || 180 * 1000;
              
              return {
                timestamp: nextStartTime + index * duration, // 임시 timestamp (나중에 조정)
                duration,
                mood: {
                  id: `generated-${index}`,
                  name: seg.moodAlias || `Segment ${index + 1}`,
                  color: seg.moodColor || "#E6F3FF",
                  music: {
                    genre: musicTracks[0]?.genre || "Pop",
                    title: musicTracks[0]?.title || "",
                  },
                  scent: {
                    type: (() => {
                      const rawType = seg.scent?.type || "Floral";
                      // completeOutput의 ScentType을 mood의 ScentType으로 변환
                      const validTypes: ScentType[] = ["Musk", "Aromatic", "Woody", "Citrus", "Honey", "Green", "Dry", "Leathery", "Marine", "Spicy", "Floral", "Powdery"];
                      const convertedType = validTypes.includes(rawType as ScentType) ? (rawType as ScentType) : "Floral";
                      return convertedType;
                    })(),
                    name: (() => {
                      if (seg.scent?.name) return seg.scent.name;
                      const rawType = seg.scent?.type || "Floral";
                      const validTypes: ScentType[] = ["Musk", "Aromatic", "Woody", "Citrus", "Honey", "Green", "Dry", "Leathery", "Marine", "Spicy", "Floral", "Powdery"];
                      const convertedType = validTypes.includes(rawType as ScentType) ? (rawType as ScentType) : "Floral";
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      const definitions = (SCENT_DEFINITIONS as Record<string, Scent[]>)[convertedType] as Scent[] | undefined;
                      return definitions && definitions.length > 0 ? definitions[0].name : "Default";
                    })(),
                  },
                  lighting: {
                    color: seg.moodColor || "#E6F3FF",
                    rgb: (seg.lighting as { rgb?: [number, number, number] })?.rgb || [230, 243, 255],
                  },
                },
                musicTracks: musicTracks.map(track => ({
                  title: track.title || "",
                  artist: track.artist,
                  duration: track.duration || 180 * 1000,
                  startOffset: track.startOffset || 0,
                  fadeIn: track.fadeIn || 750,
                  fadeOut: track.fadeOut || 750,
                  fileUrl: track.fileUrl || "",
                  albumImageUrl: track.albumImageUrl,
                })),
                // Phase 1: backgroundParams 통합
                backgroundParams: convertToBackgroundParams(seg),
                // 하위 호환성을 위해 기존 필드도 유지
                backgroundIcon: seg.backgroundIcon || { name: "FaCircle", category: "abstract" },
                backgroundIcons: seg.iconKeys || [],
                backgroundWind: seg.backgroundWind || { direction: 180, speed: 5 },
                animationSpeed: seg.animationSpeed || 5,
                iconOpacity: seg.iconOpacity || 0.7,
              } as MoodStreamSegment;
            })
          );
          generatedSegments = segmentsArray as MoodStreamSegment[];
        } else {
          // 단일 세그먼트 응답 (10개로 복제)
          const singleSegment = llmData as BackgroundParamsResponse & { 
            musicTracks?: Array<{ 
              title?: string; 
              artist?: string; 
              duration?: number; 
              startOffset?: number; 
              fadeIn?: number; 
              fadeOut?: number; 
              fileUrl?: string; 
              albumImageUrl?: string; 
              genre?: string;
            }>; 
            scent?: { type?: string; name?: string } 
          };
          const musicTracks = singleSegment.musicTracks || [];
          const duration = musicTracks[0]?.duration || 180 * 1000;
          
          generatedSegments = Array.from({ length: 10 }, (_, index) => ({
            timestamp: nextStartTime + index * duration,
            duration,
            mood: {
              id: `generated-${index}`,
              name: singleSegment.moodAlias || `Segment ${index + 1}`,
              color: singleSegment.moodColor || "#E6F3FF",
              music: {
                genre: musicTracks[0]?.genre || "Pop",
                title: musicTracks[0]?.title || "",
              },
              scent: {
                type: (() => {
                  const rawType = singleSegment.scent?.type || "Floral";
                  const validTypes: ScentType[] = ["Musk", "Aromatic", "Woody", "Citrus", "Honey", "Green", "Dry", "Leathery", "Marine", "Spicy", "Floral", "Powdery"];
                  const convertedType = validTypes.includes(rawType as ScentType) ? (rawType as ScentType) : "Floral";
                  return convertedType;
                })(),
                name: (() => {
                  if (singleSegment.scent?.name) return singleSegment.scent.name;
                  const rawType = singleSegment.scent?.type || "Floral";
                  const validTypes: ScentType[] = ["Musk", "Aromatic", "Woody", "Citrus", "Honey", "Green", "Dry", "Leathery", "Marine", "Spicy", "Floral", "Powdery"];
                  const convertedType = validTypes.includes(rawType as ScentType) ? (rawType as ScentType) : "Floral";
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  const definitions = (SCENT_DEFINITIONS as Record<string, Scent[]>)[convertedType] as Scent[] | undefined;
                  return definitions && definitions.length > 0 ? definitions[0].name : "Default";
                })(),
              },
              lighting: {
                color: singleSegment.moodColor || "#E6F3FF",
                rgb: (singleSegment.lighting as { rgb?: [number, number, number] })?.rgb || [230, 243, 255],
              },
            },
            musicTracks: musicTracks.map(track => ({
              title: track.title || "",
              artist: track.artist,
              duration: track.duration || 180 * 1000,
              startOffset: track.startOffset || 0,
              fadeIn: track.fadeIn || 750,
              fadeOut: track.fadeOut || 750,
              fileUrl: track.fileUrl || "",
              albumImageUrl: track.albumImageUrl,
            })),
            // Phase 1: backgroundParams 통합
            backgroundParams: convertToBackgroundParams(singleSegment),
            // 하위 호환성을 위해 기존 필드도 유지
            backgroundIcon: singleSegment.backgroundIcon || { name: "FaCircle", category: "abstract" },
            backgroundIcons: singleSegment.iconKeys || [],
            backgroundWind: singleSegment.backgroundWind || { direction: 180, speed: 5 },
            animationSpeed: singleSegment.animationSpeed || 5,
            iconOpacity: singleSegment.iconOpacity || 0.7,
          } as MoodStreamSegment));
        }

        // 5. timestamp를 연속적으로 조정
        const adjustedSegments = chainSegments(nextStartTime, generatedSegments);

        // 6. segmentCount만큼만 반환 (7개)
        const segmentsToReturn = adjustedSegments.slice(0, segmentCount);

        return NextResponse.json({
          currentMood: segmentsToReturn[0]?.mood || moodStream.currentMood,
          moodStream: segmentsToReturn,
          streamId: `stream-${Date.now()}`,
          userDataCount: moodStream.userDataCount || 0,
        });
      } catch (error) {
        console.error("[POST /api/moods/current/generate] Error:", error);
        
        // 에러 발생 시 목업 데이터 반환
        try {
          const mockStream = getMockMoodStream();
          // @ts-expect-error - chainSegments 반환 타입 호환성
          mockStream.segments = chainSegments(nextStartTime, mockStream.segments);
          return NextResponse.json({
            currentMood: mockStream.currentMood,
            moodStream: mockStream.segments.slice(0, segmentCount),
            streamId: mockStream.streamId,
            userDataCount: mockStream.userDataCount,
          });
        } catch {
          return createErrorResponse(
            ERROR_CODES.INTERNAL_ERROR,
            "Failed to generate mood stream"
          );
        }
      }
    },
    async (session) => {
      // 목업 모드: 관리자 계정 → 목업 데이터 즉시 반환
      let body: { nextStartTime?: number; segmentCount?: number } = {};
      let nextStartTime = Date.now();
      let segmentCount = 7;

      try {
        // Request Body 파싱
        try {
          body = await request.json();
        } catch {
          body = {};
        }

        nextStartTime = body.nextStartTime || Date.now();
        segmentCount = Math.min(body.segmentCount || 7, 10); // 최대 10개

        console.log("[POST /api/moods/current/generate] 목업 모드: 관리자 계정 → 목업 데이터 즉시 반환");
        
        const mockStream = getMockMoodStream();
        const chainedSegments = chainSegments(nextStartTime, mockStream.segments);
        
        // MoodStreamSegment 형식으로 변환 (backgroundParams 포함)
        const mockSegments: MoodStreamSegment[] = chainedSegments.slice(0, segmentCount).map((seg, index) => ({
          timestamp: seg.timestamp,
          duration: seg.duration,
          mood: seg.mood,
          musicTracks: seg.musicTracks,
          backgroundParams: {
            moodAlias: seg.mood.name,
            musicSelection: seg.musicTracks[0]?.title || "",
            moodColor: seg.mood.color,
            lighting: {
              brightness: 50,
              temperature: 4000,
            },
            backgroundIcon: {
              name: "FaCircle",
              category: "abstract",
            },
            iconKeys: ["circle", "dot"],
            backgroundWind: {
              direction: 180,
              speed: 5,
            },
            animationSpeed: 5,
            iconOpacity: 0.7,
            source: "mock-admin",
          } as BackgroundParams,
        }));
        
        return NextResponse.json({
          currentMood: mockStream.currentMood,
          moodStream: mockSegments,
          streamId: mockStream.streamId,
          userDataCount: mockStream.userDataCount,
        });
      } catch {
        return createErrorResponse(
          ERROR_CODES.INTERNAL_ERROR,
          "Failed to generate mood stream"
        );
      }
    }
  );
}
