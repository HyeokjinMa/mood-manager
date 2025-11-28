// src/app/api/moods/current/refresh/route.ts
/**
 * PUT /api/moods/current/refresh
 * 
 * 무드스트림 재생성 API
 * 
 * 새로고침 버튼 클릭 시 호출
 * - 시계열 + 마르코프 체인으로 새로운 30분 무드스트림 생성
 * - OpenAI 호출 필요 (30분 스트림 전체에 대한 배경 파라미터)
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth, checkMockMode } from "@/lib/auth/session";
import { MOODS } from "@/types/mood";
import { hexToRgb } from "@/lib/utils";
import { getMockMoodStream } from "@/lib/mock/mockData";

/**
 * PUT /api/moods/current/refresh
 * 
 * 무드스트림 재생성
 */
export async function PUT() {
  try {
    // 1. 세션 검증
    const sessionOrError = await requireAuth();
    if (sessionOrError instanceof NextResponse) {
      return sessionOrError;
    }
    const session = sessionOrError;

  // 2. 목업 모드 확인 (관리자 계정)
  if (checkMockMode(session)) {
    console.log("[PUT /api/moods/current/refresh] 목업 모드: 관리자 계정");
    try {
      const mockData = getMockMoodStream();
      return NextResponse.json({
        currentMood: mockData.currentMood,
        moodStream: mockData.segments,
        userDataCount: mockData.userDataCount,
        streamId: `stream-${Date.now()}`, // 새로운 스트림 ID
      });
    } catch (error) {
      console.error("[PUT /api/moods/current/refresh] 목업 데이터 생성 실패:", error);
      return NextResponse.json(
        { error: "INTERNAL_ERROR", message: "무드스트림 재생성 실패" },
        { status: 500 }
      );
    }
  }

  // TODO: 시계열 + 마르코프 체인으로 새로운 무드스트림 생성
  // const userId = session.user.id;
  // const newMoodStream = await generateNewMoodStream(userId);

  // [MOCK] 목업 데이터 - 새로운 무드스트림 생성
  const currentMood = MOODS[Math.floor(Math.random() * MOODS.length)];
  
  // 30분 스트림 생성 (음악 분절 주기: 3분)
  const moodStream = [];
  const musicSegmentDuration = 3 * 60 * 1000; // 3분
  const now = Date.now();
  
  for (let i = 0; i < 10; i++) {
    // 마르코프 체인 시뮬레이션: 같은 클러스터 내에서 무드 선택
    const clusterMoods = MOODS.filter(m => {
      // 간단한 클러스터 분류 (실제로는 시계열 분석 결과 사용)
      if (m.name.includes("Calm") || m.name.includes("Focus")) return true;
      return false;
    });
    
    const selectedMood = clusterMoods[Math.floor(Math.random() * clusterMoods.length)] || MOODS[0];
    
    moodStream.push({
      timestamp: now + i * musicSegmentDuration,
      duration: musicSegmentDuration,
      mood: {
        id: selectedMood.id,
        name: selectedMood.name,
        color: selectedMood.color,
        music: {
          genre: "newage",
          title: selectedMood.song.title,
        },
        scent: {
          type: selectedMood.scent.type,
          name: selectedMood.scent.name,
        },
        lighting: {
          color: selectedMood.color,
          rgb: hexToRgb(selectedMood.color),
        },
      },
    });
  }

  return NextResponse.json({
    currentMood: {
      id: currentMood.id,
      name: currentMood.name,
      color: currentMood.color,
      music: {
        genre: "newage",
        title: currentMood.song.title,
      },
      scent: {
        type: currentMood.scent.type,
        name: currentMood.scent.name,
      },
      lighting: {
        color: currentMood.color,
        rgb: hexToRgb(currentMood.color),
      },
    },
    moodStream,
    userDataCount: 45, // TODO: 실제 사용자 데이터 개수
    streamId: `stream-${Date.now()}`, // 새로운 스트림 ID
  });
  } catch (error) {
    console.error("[PUT /api/moods/current/refresh] 무드스트림 재생성 실패:", error);
    // 에러 발생 시 목업 데이터로 대체
    try {
      const mockData = getMockMoodStream();
      return NextResponse.json({
        currentMood: mockData.currentMood,
        moodStream: mockData.segments,
        userDataCount: mockData.userDataCount,
        streamId: `stream-${Date.now()}`,
      });
    } catch (mockError) {
      console.error("[PUT /api/moods/current/refresh] 목업 데이터 생성도 실패:", mockError);
      return NextResponse.json(
        { error: "INTERNAL_ERROR", message: "무드스트림 재생성 실패" },
        { status: 500 }
      );
    }
  }
}

