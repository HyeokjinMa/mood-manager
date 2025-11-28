// src/backend/jobs/sleepWakeClassifier.ts
/**
 * [파일 역할]
 * - raw_periodic 단일 샘플을 기반으로
 *   “깨어 있음(WAKE)” 또는 “수면 중(SLEEP)”을 분류하는 모듈입니다.
 *
 * [이 모듈이 필요한 이유]
 * - 수면 점수는 0~100의 “질”을 의미하고
 * - 수면 여부(SLEEP/WAKE)는 상태(state)를 의미한다.
 * - Mood 추천 시 “지금 사용자가 자는 상태인지”는 매우 중요한 조건이다.
 *
 * [분류 규칙]
 * ✔ Sleep (조건 3개 이상 충족)
 *   - movement_count ≤ 2
 *   - heart_rate_avg ≤ 62
 *   - respiratory_rate_avg ∈ 12~20
 *   - hrv_sdnn ≥ 25
 *
 * ✔ Wake (조건 2개 이상 충족)
 *   - movement_count ≥ 4
 *   - heart_rate_avg ≥ 75
 *   - respiratory_rate_avg ≥ 20
 *   - hrv_sdnn ≤ 25
 *
 * ✔ 그 외:
 *   - Light Sleep / N1 수준으로 가정 → SLEEP으로 분류
 *
 * [출력]
 *   "SLEEP" 또는 "WAKE"
 */

import { PeriodicRaw } from "@/lib/types/periodic";

export type SleepWakeState = "SLEEP" | "WAKE";

export function classifySleepWake(data: PeriodicRaw): SleepWakeState {
  const HR = data.heart_rate_avg;
  const SDNN = data.hrv_sdnn;
  const MOV = data.movement_count;
  const RESP = data.respiratory_rate_avg;

  // --------------------------
  // 1) Sleep 조건 체크
  // --------------------------
  let sleepPoints = 0;
  if (MOV <= 2) sleepPoints++;
  if (HR <= 62) sleepPoints++;
  if (RESP >= 12 && RESP <= 20) sleepPoints++;
  if (SDNN >= 25) sleepPoints++;

  if (sleepPoints >= 3) {
    return "SLEEP";
  }

  // --------------------------
  // 2) Wake 조건 체크
  // --------------------------
  let wakePoints = 0;
  if (MOV >= 4) wakePoints++;
  if (HR >= 75) wakePoints++;
  if (RESP >= 20) wakePoints++;
  if (SDNN <= 25) wakePoints++;

  if (wakePoints >= 2) {
    return "WAKE";
  }

  // --------------------------
  // 3) 애매한 경우 → 수면(light sleep)으로 처리
  // --------------------------
  return "SLEEP";
}
