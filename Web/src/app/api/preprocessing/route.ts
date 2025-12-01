// src/app/api/preprocessing/route.ts
/**
 * [파일 역할]
 * - 오늘 날짜의 생체 데이터(raw_periodic)를 기반으로
 *   스트레스/수면/날씨/감정 카운트 데이터를 종합하여 반환하는 API
 *
 * [구성 요소]
 * 1) 평균 스트레스 지수
 * 2) 최근 스트레스 지수
 * 3) 가장 최근 수면 점수 (수면 세션 기반)
 * 4) 가장 최근 수면 시간
 * 5) 날씨 정보
 * 6) 감정 카운트(웃음/한숨/울음) + 누적 시간
 */

import { NextResponse } from "next/server";
import { startPeriodicListener } from "@/backend/listener/periodicListener";
import { fetchTodayPeriodicRaw } from "@/backend/jobs/fetchTodayPeriodicRaw";
import { calcTodaySleepScore } from "@/backend/jobs/calcTodaySleepScore";
import { fetchWeather } from "@/lib/weather/fetchWeather";
import { requireAuth, checkMockMode } from "@/lib/auth/session";
import { getEmotionCounts, getAccumulationDuration } from "@/lib/emotionCounts/EmotionCountStore";

// Stress
import { calculateStressIndex } from "@/lib/stress/calculateStressIndex";

if (typeof window === "undefined") {
  startPeriodicListener();
}

// ------------------------------------------------------------
// GET /api/preprocessing
// ------------------------------------------------------------
export async function GET() {
  startPeriodicListener();

  // 세션 확인 및 관리자 모드 체크
  const sessionOrError = await requireAuth();
  if (sessionOrError instanceof NextResponse) {
    // 인증 실패 시 목업 데이터 반환
    const { getMockPreprocessingData } = await import("@/lib/mock/mockData");
    return NextResponse.json(getMockPreprocessingData());
  }
  const session = sessionOrError;

  // 관리자 모드 확인
  if (await checkMockMode(session)) {
    console.log("[GET /api/preprocessing] 목업 모드: 관리자 계정");
    const { getMockPreprocessingData } = await import("@/lib/mock/mockData");
    return NextResponse.json(getMockPreprocessingData());
  }

  // 일반 모드: 실제 데이터 조회
  const USER_ID = session.user.id;

  try {
    // ------------------------------------------------------------
    // 1) 오늘 날짜 raw_periodic 데이터 조회
    // ------------------------------------------------------------
    let todayRawData;
    
    try {
      todayRawData = await fetchTodayPeriodicRaw(USER_ID);
    } catch (error) {
      console.warn("[preprocessing] Firestore 조회 실패, 목업 데이터 반환:", error);
      // [MOCK] Firestore 조회 실패 시 목업 데이터 반환
      const { getMockPreprocessingData } = await import("@/lib/mock/mockData");
      return NextResponse.json(getMockPreprocessingData());
    }

    if (todayRawData.length === 0) {
      // [MOCK] 데이터가 없을 경우 목업 데이터 반환 (UI FLOW 확인용)
      console.log("[preprocessing] 데이터 없음, 목업 데이터 반환");
      const { getMockPreprocessingData } = await import("@/lib/mock/mockData");
      return NextResponse.json(getMockPreprocessingData());
    }

    // ------------------------------------------------------------
    // 2) 스트레스 계산
    // ------------------------------------------------------------
    const stressScores = todayRawData.map((raw) => calculateStressIndex(raw));

    const averageStressIndex = Math.round(
      stressScores.reduce((a, b) => a + b, 0) / stressScores.length
    );

    const latestRaw = todayRawData[0];
    const recentStressIndex = calculateStressIndex(latestRaw);

    // ------------------------------------------------------------
    // 3) 날씨 정보
    // ------------------------------------------------------------
    let weather = undefined;
    try {
      weather = await fetchWeather();
    } catch (err) {
      console.warn("[preprocessing] 날씨 조회 실패:", err);
    }

    // ------------------------------------------------------------
    // 4) 수면 점수 (수면 세션 기반)
    // ------------------------------------------------------------
    const sleepResult = await calcTodaySleepScore(USER_ID);

    let latestSleepScore: number;
    let latestSleepDuration: number;

    if (sleepResult.score !== null) {
      latestSleepScore = sleepResult.score;
      latestSleepDuration = sleepResult.totalMinutes;
    } else {
      // 수면 데이터 없을 때 기본값
      latestSleepScore = 70;   // 중간 점수
      latestSleepDuration = 480; // 8시간
    }

    // ------------------------------------------------------------
    // 5) 감정 카운트 (누적 카운터 방식)
    // ------------------------------------------------------------
    const emotionCounts = getEmotionCounts(USER_ID);
    const accumulationDurationSeconds = getAccumulationDuration(USER_ID);

    // ------------------------------------------------------------
    // 6) 최종 JSON 응답 (Python + LLM 입력 스펙에 맞춤)
    // ------------------------------------------------------------
    return NextResponse.json(
      {
        average_stress_index: averageStressIndex,
        recent_stress_index: recentStressIndex,

        latest_sleep_score: latestSleepScore,
        latest_sleep_duration: latestSleepDuration,

        weather: weather || {
          temperature: 20,
          humidity: 50,
          rainType: 0,
          sky: 1,
        },

        // 새로운 형식: 카운트 기반
        emotionCounts: {
          laughter: emotionCounts.laughter,
          sigh: emotionCounts.sigh,
          crying: emotionCounts.crying,
        },
        accumulationDurationSeconds,
        lastResetTime: emotionCounts.lastResetTime,

        // 하위 호환성: 타임스탬프 배열 (기존 코드 지원용, 현재는 비워둠)
        emotionEvents: {
          laughter: [],
          sigh: [],
          anger: [],
          sadness: [],
          neutral: [],
        },
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("[preprocessing] 에러 발생:", err);
    return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
