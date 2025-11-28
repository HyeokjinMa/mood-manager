// src/backend/jobs/sleepSessionDetector.ts
/**
 * [파일 역할]
 *
 * - Firestore raw_periodic 데이터를 "수면 에포크(SleepEpoch)"로 변환하고
 * - 에포크들을 묶어서 "수면 세션(SleepSession)"을 검출하는 모듈입니다.
 *
 * [전체 흐름]
 * 1) PeriodicRaw[] (raw_periodic 문서들)
 * 2) buildSleepEpochs(raws) → SleepEpoch[]
 * 3) detectSleepSessions(epochs) → SleepSession[]
 *
 * [주의사항]
 * - 이 파일은 "수면 여부/단계 판정"과 "수면 세션 분할"만 담당합니다.
 * - 최종 점수(0~100) 계산은 lib/sleep/calculateDailySleepScore.ts에서 담당합니다.
 */

import type { PeriodicRaw } from "@/lib/types/periodic";

/** 수면 단계 타입 정의 */
export type SleepStage = "DEEP" | "LIGHT" | "REM" | "AWAKE";

/**
 * SleepEpoch
 *
 * - raw_periodic 1개를 "수면 단계가 라벨링 된 샘플"로 확장한 구조입니다.
 * - duration(길이)은 raw_periodic 수집 주기(예: 10분)를 가정합니다.
 */
export interface SleepEpoch {
  /** Firestore 문서 id (옵션) */
  id?: string;

  /** 샘플 수집 시각 (epoch ms) */
  timestamp: number;

  /** 분류된 수면 단계 */
  stage: SleepStage;

  /** 아래는 raw 측정값 그대로 복사 */
  heart_rate_avg: number;
  heart_rate_min?: number;
  movement_count: number;
  respiratory_rate_avg: number;
  hrv_sdnn: number;
}

/**
 * [내부 함수] 단일 PeriodicRaw → SleepStage 분류
 *
 * 매우 단순한 휴리스틱 규칙:
 * - Deep: HR(또는 HR_min) < 50 && movement <= 1
 * - REM : movement <= 1 && 호흡수 높음(>=17)
 * - Light: movement <= 4 (깊은 수면 / 각성 중간 단계)
 * - Awake: 그 외 (움직임이 많거나 HR 높은 경우)
 */
function classifyStage(raw: PeriodicRaw): SleepStage {
  const { heart_rate_avg, heart_rate_min, movement_count, respiratory_rate_avg } = raw;

  // 깊은 수면 (심박 낮고 거의 안 움직임)
  if ((heart_rate_min ?? heart_rate_avg) < 50 && movement_count <= 1) {
    return "DEEP";
  }

  // REM 수면 (움직임 거의 없지만 호흡수/심박 변동이 있음)
  if (movement_count <= 1 && respiratory_rate_avg >= 17) {
    return "REM";
  }

  // 가벼운 수면 (조금 움직이지만 완전 깬 상태는 아님)
  if (movement_count <= 4) {
    return "LIGHT";
  }

  // 그 외는 각성 상태로 판단
  return "AWAKE";
}

/**
 * PeriodicRaw[] → SleepEpoch[]
 *
 * [역할]
 * - timestamp 기준으로 정렬
 * - 각 원소에 대해 classifyStage() 호출해서 stage 할당
 * - 이후 수면 세션 검출 알고리즘에서 이 배열을 사용
 */
export function buildSleepEpochs(raws: PeriodicRaw[]): SleepEpoch[] {
  return raws
    .slice() // 원본 배열 변형 방지용 얕은 복사
    .sort((a, b) => a.timestamp - b.timestamp)
    .map((r) => ({
      id: r.id,
      timestamp: r.timestamp,
      stage: classifyStage(r),
      heart_rate_avg: r.heart_rate_avg,
      heart_rate_min: r.heart_rate_min,
      movement_count: r.movement_count,
      respiratory_rate_avg: r.respiratory_rate_avg,
      hrv_sdnn: r.hrv_sdnn,
    }));
}

/**
 * SleepSession
 *
 * - 연속된 SleepEpoch 묶음 (한 번의 수면 블록)
 * - start~end, 총 수면 시간, 단계별 카운트 등을 포함
 */
export interface SleepSession {
  /** 세션 시작 시각 (ms) */
  start: number;
  /** 세션 종료 시각 (ms) */
  end: number;
  /** 세션 길이 (분 단위) */
  durationMinutes: number;

  /** 세션을 구성하는 모든 Epoch */
  epochs: SleepEpoch[];

  /** 단계별 Epoch 수 (최종 점수 계산에 사용) */
  stageStats: {
    DEEP: number;
    LIGHT: number;
    REM: number;
    AWAKE: number;
  };
}

/**
 * SleepEpoch[] → SleepSession[]
 *
 * [알고리즘 개요]
 * - AWAKE가 아닌 epoch들을 연속 구간으로 묶어서 candidate 세션을 만들고
 * - 최소 길이 조건(예: 3 epoch 이상, 약 30분 이상)을 만족하는 구간만 세션으로 인정.
 */
export function detectSleepSessions(epochs: SleepEpoch[]): SleepSession[] {
  if (epochs.length === 0) return [];

  const sessions: SleepSession[] = [];
  let current: SleepEpoch[] = [];

  // 수면으로 취급하는 조건 (AWAKE가 아니면 모두 수면으로 간주)
  const isSleep = (stage: SleepStage) => stage !== "AWAKE";

  for (const e of epochs) {
    if (isSleep(e.stage)) {
      // 수면 상태: 현재 세션에 계속 추가
      current.push(e);
    } else {
      // 각성 상태로 전환된 시점:
      // 지금까지 누적된 current가 충분히 길면 하나의 세션으로 저장
      if (current.length >= 3) {
        sessions.push(makeSession(current));
      }
      // current 초기화
      current = [];
    }
  }

  // 루프 끝나고도 남아 있는 수면 덩어리 처리
  if (current.length >= 3) {
    sessions.push(makeSession(current));
  }

  return sessions;
}

/**
 * [내부 함수]
 * - 연속된 SleepEpoch 배열 → SleepSession 1개로 변환
 */
function makeSession(epochs: SleepEpoch[]): SleepSession {
  const start = epochs[0].timestamp;
  const end = epochs[epochs.length - 1].timestamp;

  // ms → 분 단위
  const durationMinutes = (end - start) / 1000 / 60;

  // 단계별 개수 집계
  const stats = { DEEP: 0, LIGHT: 0, REM: 0, AWAKE: 0 };
  epochs.forEach((e) => {
    stats[e.stage] += 1;
  });

  return {
    start,
    end,
    durationMinutes,
    epochs,
    stageStats: stats,
  };
}
