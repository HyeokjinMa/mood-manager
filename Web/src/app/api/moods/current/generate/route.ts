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
import { requireAuth, checkMockMode } from "@/lib/auth/session";
import { getCommonData } from "@/app/api/ai/background-params/utils/getCommonData";
import { handleStreamMode } from "@/app/api/ai/background-params/handlers/streamHandler";
import { chainSegments } from "@/lib/utils/segmentUtils";
import type { MoodStreamSegment } from "@/hooks/useMoodStream/types";
import { getMockMoodStream } from "@/lib/mock/mockData";
import type { BackgroundParamsResponse } from "@/lib/llm/validateResponse";
import type { ScentType } from "@/types/mood";

/**
 * POST /api/moods/current/generate
 * 
 * 다음 무드스트림 생성
 * 
 * Request Body:
 * - nextStartTime?: number - 다음 세그먼트 시작 시간 (밀리초)
 * - segmentCount?: number - 생성할 세그먼트 수 (기본값: 7, 최대 10)
 */
export async function POST(request: NextRequest) {
  let body: { nextStartTime?: number; segmentCount?: number } = {};
  let nextStartTime = Date.now();
  let segmentCount = 7;

  try {
    // 세션 확인
    const sessionOrError = await requireAuth();
    if (sessionOrError instanceof NextResponse) {
      return sessionOrError;
    }
    const session = sessionOrError;

    // 관리자 모드 확인
    const isAdminMode = await checkMockMode(session);
    if (isAdminMode) {
      console.log("[POST /api/moods/current/generate] 목업 모드: 관리자 계정");
    }

    // Request Body 파싱
    try {
      body = await request.json();
    } catch {
      body = {};
    }

    nextStartTime = body.nextStartTime || Date.now();
    segmentCount = Math.min(body.segmentCount || 7, 10); // 최대 10개

    // 1. 전처리 데이터 및 무드스트림 가져오기
    const { preprocessed, moodStream } = await getCommonData(request, isAdminMode);

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

    if (!llmResponse.ok) {
      console.error("[POST /api/moods/current/generate] LLM 호출 실패");
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
    let generatedSegments: MoodStreamSegment[] = [];
    
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
                type: (seg.scent?.type || "Floral") as ScentType,
                name: seg.scent?.name || "Rose",
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
            type: (singleSegment.scent?.type || "Floral") as ScentType,
            name: singleSegment.scent?.name || "Rose",
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
      return NextResponse.json(
        { error: "Failed to generate mood stream" },
        { status: 500 }
      );
    }
  }
}
