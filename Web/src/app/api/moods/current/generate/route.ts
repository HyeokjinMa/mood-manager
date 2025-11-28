// src/app/api/moods/current/generate/route.ts
/**
 * POST /api/moods/current/generate
 * 
 * 무드스트림 재생성 API
 * 
 * 예약된 세그먼트가 3개 이하일 때 호출
 * - 동일한 정보를 바탕으로 10개 세그먼트 생성
 * - 생성된 세그먼트는 뒤로 붙음
 */

import { NextRequest, NextResponse } from "next/server";
// import { getServerSession } from "next-auth";
import { MOODS } from "@/types/mood";
import { hexToRgb } from "@/lib/utils";

/**
 * [MOCK] 목업 모드
 * TODO: 시계열 + 마르코프 체인으로 실제 예측 구현
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nextStartTime } = body; // 다음 세그먼트 시작 시간
    
    // TODO: 세션 확인
    // const session = await getServerSession();
    // if (!session) {
    //   return NextResponse.json(
    //     { error: "UNAUTHORIZED", message: "Authentication required" },
    //     { status: 401 }
    //   );
    // }

    // TODO: 시계열 + 마르코프 체인으로 1분 단위 예측값 생성
    // const userId = session.user.id;
    // const oneMinutePredictions = await generateOneMinutePredictions(userId, 30); // 30개 (30분치)

    // [MOCK] 1분 단위 예측값 시뮬레이션 (30개)
    const oneMinutePredictions: Array<{ timestamp: number; prediction: string }> = [];
    const oneMinuteDuration = 60 * 1000; // 1분
    const startTime = nextStartTime || Date.now();
    
    for (let i = 0; i < 30; i++) {
      const predictions = ["VP", "VPP", "VPPP"];
      const prediction = predictions[Math.floor(Math.random() * predictions.length)];
      
      oneMinutePredictions.push({
        timestamp: startTime + i * oneMinuteDuration,
        prediction,
      });
    }
    
    // 3분 단위로 분절 (10개 세그먼트)
    // 핵심: 하나의 무드스트림 내에서는 동일한 무드를 기반으로 함
    const segments = [];
    const segmentDuration = 3 * 60 * 1000; // 3분
    
    // 첫 번째 세그먼트의 무드 결정 (전체 스트림의 대표 무드)
    const firstThreeMinutePredictions = oneMinutePredictions.slice(0, 3);
    const firstPredictionCounts = firstThreeMinutePredictions.reduce((acc, p) => {
      acc[p.prediction] = (acc[p.prediction] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const firstDominantPrediction = Object.entries(firstPredictionCounts)
      .sort((a, b) => b[1] - a[1])[0][0];
    
    // 전체 스트림의 대표 무드 결정 (10개 세그먼트 모두 동일한 무드 사용)
    const streamMoodName = mapPredictionToMood(firstDominantPrediction);
    const baseMood = MOODS.find(m => m.name === streamMoodName) || MOODS[0];
    
    // 10개 세그먼트 생성 (모두 동일한 무드 사용)
    for (let i = 0; i < oneMinutePredictions.length; i += 3) {
      const threeMinutePredictions = oneMinutePredictions.slice(i, i + 3);
      
      // 3분 동안의 예측값 중 가장 많이 나온 것 선택 (음악 장르/향 결정용)
      const predictionCounts = threeMinutePredictions.reduce((acc, p) => {
        acc[p.prediction] = (acc[p.prediction] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      const dominantPrediction = Object.entries(predictionCounts)
        .sort((a, b) => b[1] - a[1])[0][0];
      
      // 음악 장르와 향은 세그먼트별로 다양할 수 있음 (무드는 동일)
      const musicGenre = mapPredictionToGenre(dominantPrediction);
      const scentType = mapPredictionToScent(dominantPrediction);
      
      segments.push({
        id: `segment-${Date.now()}-${i}`,
        timestamp: threeMinutePredictions[0].timestamp,
        moodName: streamMoodName, // 동일한 무드 사용
        musicGenre,
        scentType,
        // 기본 정보 (LLM이 나머지 정보 추가)
        mood: baseMood,
        music: {
          genre: musicGenre,
          title: baseMood.song.title,
        },
        scent: {
          type: scentType,
          name: baseMood.scent.name,
        },
        lighting: {
          color: baseMood.color,
          rgb: hexToRgb(baseMood.color),
        },
        duration: segmentDuration,
      });
    }

    return NextResponse.json({
      segments, // 10개 세그먼트
      streamId: `stream-${Date.now()}`,
    });
  } catch (error) {
    console.error("Error generating mood stream:", error);
    return NextResponse.json(
      { error: "Failed to generate mood stream" },
      { status: 500 }
    );
  }
}

/**
 * 예측값을 무드로 매핑
 */
function mapPredictionToMood(prediction: string): string {
  const moodMap: Record<string, string> = {
    "VP": "Deep Relax",
    "VPP": "Focus Mode",
    "VPPP": "Bright Morning",
  };
  return moodMap[prediction] || "Deep Relax";
}

/**
 * 예측값을 음악 장르로 매핑
 */
function mapPredictionToGenre(prediction: string): string {
  const genreMap: Record<string, string> = {
    "VP": "newage",
    "VPP": "classical",
    "VPPP": "pop",
  };
  return genreMap[prediction] || "newage";
}

/**
 * 예측값을 향으로 매핑
 */
function mapPredictionToScent(prediction: string): string {
  const scentMap: Record<string, string> = {
    "VP": "citrus",
    "VPP": "woody",
    "VPPP": "floral",
  };
  return scentMap[prediction] || "citrus";
}


