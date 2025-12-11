// src/lib/preprocessing/preprocess.ts
/**
 * [파일 역할]
 * - raw_periodic 한 건(단일 샘플)을 입력받아
 *   수면 점수(sleep_score)와 스트레스 점수(stress_score)를 계산하는
 *   “전처리 핵심 엔진” 파일입니다.
 *
 * [전체 파이프라인 연결 흐름]
 * 1) WearOS → Firestore(users/{userId}/raw_periodic)에 raw 데이터 저장
 * 2) backend/listener/periodicListener.ts 에서 raw_periodic 컬렉션을 onSnapshot으로 구독
 * 3) 새 문서가 감지되면 backend/jobs/preprocessPeriodic.ts 호출
 * 4) preprocessPeriodic.ts → 이 파일의 preprocessPeriodicSample() 호출
 * 5) 여기서 sleep_score / stress_score를 계산
 * 6) backend/cache/periodicCache.ts 에 결과를 저장
 * 7) /api/preprocessing route 에서 최신 score를 응답
 * 8) OpenAI 호출 시 { sleep_score, stress_score, weather }를 그대로 전달
 *
 * [입력]
 * - PeriodicRaw (src/lib/types/periodic.ts 참고)
 * - WeatherData (optional) - 날씨 데이터
 *
 * [출력]
 * - { sleep_score: number, stress_score: number, weather?: WeatherData }
 *
 * [주의사항]
 * - 이 함수는 "단일 샘플용" 전처리입니다.
 *   → 수면 세션(여러 샘플)의 평균 점수 등은 별도 함수로 확장 예정.
 * - [EDIT] weather 데이터 추가: 전처리 파이프라인에 날씨 정보 포함
 */
import { PeriodicRaw } from "@/lib/types/periodic";
import { calculateStressIndex } from "@/lib/stress";
import type { WeatherData } from "@/types/weather";
// TODO: calculateDailySleepScore는 route.ts에서 사용 예정
// import { calculateDailySleepScore } from "../sleep/calculateDailySleepScore";

export interface ProcessedMetrics {
  stress_score: number;
  sleep_score?: number;
  weather?: WeatherData;
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
  laugh_count?: number;
  sigh_count?: number;
}

export function preprocessPeriodicSample(
  raw: PeriodicRaw
): ProcessedMetrics {

  // ✔ 스트레스 지수만 계산 (raw 단위)
  const stress_score = calculateStressIndex(raw);

  return {
    stress_score,
  };
}
