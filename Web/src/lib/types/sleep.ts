// src/lib/types/sleep.ts
/**
 * [파일 역할]
 * - 수면 관련 도메인 타입들을 모아두는 파일입니다.
 * - 수면 단계(SleepStage), 수면 세션(SleepSession) 등
 *   여러 곳에서 공통으로 사용하는 타입을 정의합니다.
 *
 * [어디서 사용하는지]
 * - lib/sleep/detectSleepStage.ts  : SleepStage 사용
 * - backend/jobs/sleepSessionDetector.ts : SleepEpoch, SleepSession 사용
 * - lib/sleep/calculateDailySleepScore.ts : SleepSession, SleepStageStats 사용
 */

import type { PeriodicRaw } from "@/lib/types/periodic";

/** 수면 단계 구분 */
export type SleepStage = "AWAKE" | "DEEP" | "LIGHT" | "REM";

/**
 * 개별 측정 샘플(윈도우)에 대한 수면 정보
 * - raw: 원본 생체신호 데이터 (10분 단위 등)
 * - stage: 해당 윈도우의 수면 단계
 */
export interface SleepEpoch {
  raw: PeriodicRaw;
  stage: SleepStage;
}

/**
 * 수면 단계별 소요 시간(분 단위)
 * - 하나의 수면 세션(하룻밤)에 대한 통계
 */
export interface SleepStageStats {
  AWAKE: number; // 수면 중 각성 시간(중간에 깬 시간)
  DEEP: number;
  LIGHT: number;
  REM: number;
}

/**
 * 하나의 수면 세션(보통 하룻밤)을 표현하는 구조
 */
export interface SleepSession {
  /** 수면 시작 시각 (timestamp ms) */
  start: number;
  /** 수면 종료 시각 (timestamp ms) */
  end: number;
  /** 전체 수면 시간(분) */
  durationMinutes: number;
  /** 세션 내 각 수면 단계별 소요 시간(분) */
  stageStats: SleepStageStats;
  /** 세션을 구성하는 개별 에폭 목록 */
  epochs: SleepEpoch[];
}
