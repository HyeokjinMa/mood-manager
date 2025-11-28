// src/lib/preprocessing/prepareOpenAIInput.ts
/**
 * [파일 역할]
 * - 최종 전처리 결과(metrics)를 OpenAI 모델 입력 형식으로 변환합니다.
 *
 * [디자인 결정]
 * - stress, sleep, weather, preferences, emotion을 포함한 payload 생성
 * - sleep_score는 preprocessPeriodicSample에서 계산하지 않으며
 *   calcTodaySleepScore() 결과를 route.ts에서 metrics.sleep.score로 전달받음
 *
 * [최종 payload 구조]
 * {
 *   stress: number,
 *   sleep: { score: number, details: object },
 *   weather: { temperature, humidity, rainType, sky },
 *   preferences: { ... },
 *   emotion: { laugh_count, sigh_count },
 *   timestamp: number
 * }
 */

import type { ProcessedMetrics } from "@/lib/preprocessing/preprocess";

export interface OpenAIInputPayload {
  stress: number;
  sleep: {
    score: number;
    details: Record<string, unknown>;
  };
  weather?: {
    temperature: number;
    humidity: number;
    rainType: number;
    sky: number;
  };
  preferences?: {
    fragranceTop1?: string | null;
    fragranceTop2?: string | null;
    fragranceTop3?: string | null;
    preferredLightR?: number | null;
    preferredLightG?: number | null;
    preferredLightB?: number | null;
    preferredBrightness?: number | null;
    soundGenreTop1?: string | null;
    soundGenreTop2?: string | null;
    soundGenreTop3?: string | null;
  };
  emotion?: {
    laugh_count: number;
    sigh_count: number;
  };
  timestamp: number;
}

export function prepareOpenAIInput(
  metrics: ProcessedMetrics
): OpenAIInputPayload {
  const {
    stress_score,
    sleep_score,          // ← route.ts에서 { score, details } 형태로 전달됨
    weather,
    preferences,
    laugh_count,
    sigh_count,
  } = metrics;

  return {
    stress: stress_score,

    sleep: {
      score: sleep_score ?? 0,
      details: {},
    },

    ...(weather && { weather }),
    ...(preferences && { preferences }),

    emotion: {
      laugh_count: laugh_count ?? 0,
      sigh_count: sigh_count ?? 0,
    },

    timestamp: Date.now(),
  };
}
