// src/app/api/preprocessing/route.ts
/**
 * [파일 역할]
 * - 오늘 날짜의 생체 데이터(raw_periodic)를 기반으로
 *   스트레스/수면/날씨/선호도/감정 데이터를 종합하여 반환하는 API
 *
 * [구성 요소]
 * 1) 평균 스트레스 지수
 * 2) 최근 스트레스 지수
 * 3) 가장 최근 수면 점수 (수면 세션 기반)
 * 4) 가장 최근 수면 시간
 * 5) 날씨 정보
 * 6) 사용자 선호도 (향/조명/음악 Top3)
 * 7) 한숨/웃음 등 감정 신호
 */

import { NextResponse } from "next/server";
import { startPeriodicListener } from "@/backend/listener/periodicListener";
import { fetchTodayPeriodicRaw } from "@/backend/jobs/fetchTodayPeriodicRaw";
import { calcTodaySleepScore } from "@/backend/jobs/calcTodaySleepScore";
import { fetchWeather } from "@/lib/weather/fetchWeather";
import { requireAuth, checkMockMode } from "@/lib/auth/session";

// Emotion
import { fetchDailySignals } from "@/lib/moodSignals/fetchDailySignals";

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
  if (checkMockMode(session)) {
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
      // 수면 데이터 없을 때 기본값 (LLM Input 스펙 기준)
      latestSleepScore = 70;   // 중간 점수
      latestSleepDuration = 480; // 8시간
    }

    // ------------------------------------------------------------
    // 5) 감정 이벤트 (ML 서버에서 실시간으로 받은 카운트 기반)
    // ------------------------------------------------------------
    const signals = await fetchDailySignals(USER_ID);

    // ML 서버에서 분류한 Laughter, Sigh, Negative 카운트 기반
    // 타임스탬프는 현재 시간으로 채움 (TODO: 실제 이벤트 발생 시간 저장 필요)
    const emotionEvents = {
      laughter: Array(signals.laugh_count || 0).fill(Date.now()),
      sigh: Array(signals.sigh_count || 0).fill(Date.now()),
      negative: Array(signals.negative_count || 0).fill(Date.now()),
      neutral: signals.laugh_count === 0 && signals.sigh_count === 0 && signals.negative_count === 0 ? [Date.now()] : [],
    };

    // ------------------------------------------------------------
    // 6) 최종 JSON 응답 (LLM Input 스펙에 맞춤)
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

        emotionEvents: emotionEvents,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("[preprocessing] 에러 발생:", err);
    return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
