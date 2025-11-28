// src/backend/jobs/calcTodaySleepScore.ts
/**
 * [파일 역할]
 *
 * - "오늘 수면 점수"를 계산하는 상위 오케스트레이터 모듈입니다.
 *
 * [파이프라인]
 * 1) fetchTodaySleepRaw(userId)
 *    → 어제 22시 ~ 오늘 10시에 해당하는 raw_periodic 가져오기
 * 2) buildSleepEpochs(raws)
 *    → 수면 단계가 태깅된 SleepEpoch[] 생성
 * 3) detectSleepSessions(epochs)
 *    → SleepSession[] 검출
 * 4) 가장 긴 세션 선택 (주 수면 세션)
 * 5) calculateDailySleepScore(longest)
 *    → 0~100 점수 산출
 */

import { fetchTodaySleepRaw } from "./fetchTodaySleepRaw";
import {
  buildSleepEpochs,
  detectSleepSessions,
  type SleepSession,
} from "./sleepSessionDetector";
import { calculateDailySleepScore } from "@/lib/sleep/calculateDailySleepScore";

// [EDIT] 반환 타입 명시적 정의 추가 (타입 에러 해결을 위해)
export type CalcTodaySleepScoreResult =
  | {
      score: null;
      reason: "NO_DATA" | "NO_SESSION";
    }
  | {
      score: number;
      totalMinutes: number;
      stageStats: SleepSession["stageStats"];
      components: ReturnType<typeof calculateDailySleepScore>["components"];
    };

export async function calcTodaySleepScore(
  userId: string
): Promise<CalcTodaySleepScoreResult> {
  // 1) Firestore에서 오늘 분석 대상 raw 데이터 가져오기
  const raw = await fetchTodaySleepRaw(userId);

  // 분석할 데이터가 하나도 없는 경우
  if (raw.length === 0) {
    return { score: null, reason: "NO_DATA" as const };
  }

  // 2) SleepEpoch 생성 (수면 단계 라벨링)
  const epochs = buildSleepEpochs(raw);

  // 3) 수면 세션 검출
  const sessions = detectSleepSessions(epochs);
  if (sessions.length === 0) {
    return { score: null, reason: "NO_SESSION" as const };
  }

  // 4) 가장 긴 수면 세션을 "주 수면"으로 선택
  const longest = sessions.reduce((a, b) =>
    a.durationMinutes > b.durationMinutes ? a : b
  );

  // 5) 선택된 세션을 기반으로 하루 수면 점수 계산
  const result = calculateDailySleepScore(longest);

  return {
    score: result.score,              // 최종 수면 점수 (0~100)
    totalMinutes: longest.durationMinutes,
    stageStats: longest.stageStats,
    components: result.components,    // 디버깅/분석용 세부 점수
  };
}
