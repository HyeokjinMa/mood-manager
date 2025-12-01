// src/app/api/moods/current/generate/route.ts
/**
 * POST /api/moods/current/generate
 * 
 * 다음 무드스트림 생성 API (3세그 구조)
 * 
 * 3개 세그먼트 생성 (각 세그먼트는 3곡 포함)
 * - 각 세그먼트는 자연스러운 흐름의 3곡으로 구성
 * - timestamp는 nextStartTime부터 시작
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth, checkMockMode } from "@/lib/auth/session";
import { getMockMoodStream } from "@/lib/mock/mockData";
import { chainSegments } from "@/lib/utils/segmentUtils";
import type { MoodStream, MoodStreamSegment } from "@/hooks/useMoodStream/types";

/**
 * POST /api/moods/current/generate
 * 
 * 다음 무드스트림 생성 (3세그 구조)
 * 
 * Request Body:
 * - nextStartTime?: number - 다음 세그먼트 시작 시간 (밀리초)
 * - segmentCount?: number - 생성할 세그먼트 수 (기본값: 3)
 */
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const nextStartTime = body.nextStartTime || Date.now();
    const segmentCount = body.segmentCount || 3;

    // TODO: 실제 시계열 + 마르코프 체인으로 예측 구현
    // 현재는 목업 데이터 사용
    let moodStream: MoodStream;

    if (isAdminMode) {
      // 목업 모드: 목업 데이터 사용
      moodStream = getMockMoodStream();
      
      // timestamp를 nextStartTime 기준으로 조정
      moodStream.segments = chainSegments(nextStartTime, moodStream.segments);
    } else {
      // TODO: 실제 데이터베이스에서 사용자 데이터 조회 및 예측
      // 현재는 목업 데이터 사용
      moodStream = getMockMoodStream();
      
      // timestamp를 nextStartTime 기준으로 조정
      moodStream.segments = chainSegments(nextStartTime, moodStream.segments);
    }

    // segmentCount만큼만 반환
    const segmentsToReturn = moodStream.segments.slice(0, segmentCount);

    return NextResponse.json({
      currentMood: moodStream.currentMood,
      moodStream: segmentsToReturn,
      streamId: moodStream.streamId,
      userDataCount: moodStream.userDataCount,
    });
  } catch (error) {
    console.error("[POST /api/moods/current/generate] Error:", error);
    return NextResponse.json(
      { error: "Failed to generate mood stream" },
      { status: 500 }
    );
  }
}
