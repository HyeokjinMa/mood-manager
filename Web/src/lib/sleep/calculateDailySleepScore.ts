// src/lib/sleep/calculateDailySleepScore.ts
/**
 * [파일 역할]
 *
 * - 하나의 SleepSession(한 번의 수면 블록)을 입력으로 받아
 *   "하루 수면 점수(0~100)"를 계산하는 모듈입니다.
 *
 * [점수 구성]
 * - 총 수면 시간 점수 (50%)
 * - 수면 단계 구성 점수 (30%)
 * - 수면 품질 점수 (20%)  → 각성 비율 낮을수록 고득점
 */

import type { SleepSession } from "@/backend/jobs/sleepSessionDetector";

/**
 * 수면 점수 계산 결과 타입
 * - score: 최종 0~100 점수
 * - components: 세부 구성 요소 (디버깅용 / 분석용)
 */
export interface DailySleepScoreResult {
  score: number;
  components: {
    /** 총 수면 시간 점수 (0~1) */
    totalSleepScore: number;
    /** 단계 구성 점수 (0~1) */
    stageScore: number;
    /** 각성 비율 기반 품질 점수 (0~1) */
    qualityScore: number;
  };
}

/**
 * SleepSession → 하루 수면 점수(0~100)
 */
export function calculateDailySleepScore(session: SleepSession): DailySleepScoreResult {
  const { durationMinutes, stageStats } = session;

  // ---------------------------------------------------------------------------
  // 1) 총 수면 시간 점수 (50%)
  // ---------------------------------------------------------------------------
  const hours = durationMinutes / 60;
  // 8시간 수면을 이상적인 기준(=1.0)으로 잡고, 그 이하면 비례 점수
  const totalSleepScore = Math.min(hours / 8, 1);

  // ---------------------------------------------------------------------------
  // 2) 수면 단계 구성 점수 (30%)
  //    - Deep, REM 비율이 높을수록 고득점
  // ---------------------------------------------------------------------------
  const totalEpochs =
    stageStats.DEEP + stageStats.LIGHT + stageStats.REM + stageStats.AWAKE || 1; // 0 나누기 방지

  const deepRatio = stageStats.DEEP / totalEpochs;
  const remRatio = stageStats.REM / totalEpochs;

  // Deep 비중 60%, REM 비중 40% 반영 후 스케일 업(최대 1.0로 clamp)
  const stageScore = Math.min((deepRatio * 0.6 + remRatio * 0.4) * 2, 1);

  // ---------------------------------------------------------------------------
  // 3) 수면 품질 점수 (20%)
  //    - AWAKE 비율이 낮을수록 점수↑
  // ---------------------------------------------------------------------------
  const awakeRatio = stageStats.AWAKE / totalEpochs;
  // AWAKE가 0이면 1점, 0.5면 0점, 그 이상이면 0으로 바닥
  const qualityScore = Math.max(1 - awakeRatio * 2, 0);

  // ---------------------------------------------------------------------------
  // 4) 최종 가중합 (0~1) → 0~100 변환
  // ---------------------------------------------------------------------------
  const final0to1 =
    totalSleepScore * 0.5 +
    stageScore * 0.3 +
    qualityScore * 0.2;

  const finalScore = Math.round(final0to1 * 100);

  return {
    score: finalScore,
    components: {
      totalSleepScore,
      stageScore,
      qualityScore,
    },
  };
}
