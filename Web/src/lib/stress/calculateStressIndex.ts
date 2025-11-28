// src/lib/stress/calculateStressIndex.ts
/**
 * [파일 역할]
 * - raw_periodic 데이터의 개별 생체신호를 입력받아
 *   "스트레스 점수(stress_score: 0~100)"를 계산하는 공식 모듈입니다.
 *
 * [스트레스 점수 알고리즘(Specification 100% 반영)]
 *
 * Inputs:
 *   heart_rate_avg (HR)
 *   heart_rate_max (HR_max)
 *   heart_rate_min (HR_min)
 *   hrv_sdnn       (SDNN)
 *   movement_count (MOV)
 *   respiratory_rate_avg (RESP)
 *   is_fallback    (폴백 데이터 여부)
 *
 * --------------------------------------------
 * 1) 각 지표 → 0~1 스트레스 점수로 정규화
 * --------------------------------------------
 *
 * 1) HR_stress (HR 증가 = 스트레스 증가)
 *    best_hr = 50
 *    worst_hr = 110
 *    HR_stress = clamp((HR - best_hr) / (worst_hr - best_hr))
 *
 * 2) SDNN_stress (SDNN 낮을수록 스트레스 증가)
 *    min_sdnn = 20
 *    max_sdnn = 100
 *    SDNN_stress = clamp((max_sdnn - SDNN) / (max_sdnn - min_sdnn))
 *
 * 3) Movement_stress (움직임 증가 = 스트레스·각성 증가)
 *    best_mov = 0
 *    worst_mov = 60
 *    Movement_stress = clamp(MOV / worst_mov)
 *
 * 4) Resp_stress (호흡 증가/불안정 = 스트레스 증가)
 *    normal_resp = 16
 *    Resp_stress = clamp(abs(RESP - normal_resp) / 10)
 *
 *
 * --------------------------------------------
 * 2) 가중합 계산 (문헌 기반)
 * --------------------------------------------
 *   HR: 40%
 *   HRV: 40%
 *   Movement: 15%
 *   Respiration: 5%
 *
 *   StressScore_0to1 =
 *      HR_stress    * 0.40 +
 *      SDNN_stress  * 0.40 +
 *      Movement_stress * 0.15 +
 *      Resp_stress  * 0.05
 *
 *
 * --------------------------------------------
 * 3) 최종 점수 변환 (0~100)
 * --------------------------------------------
 *   StressScore = round(StressScore_0to1 * 100)
 *
 *
 * [주의사항]
 * - timestamp는 스트레스 계산에는 사용되지 않음
 * - score는 실시간 상태 기반이며,
 *   "장기 스트레스 지표(Baseline Stress)"는 별도로 구성 가능
 */

import { PeriodicRaw } from "@/lib/types/periodic";
import { clamp } from "./utils";

export function calculateStressIndex(data: PeriodicRaw): number {
  // [EDIT] 새로운 필드 추가: heart_rate_max, heart_rate_min, is_fallback 활용
  const HR = data.heart_rate_avg ?? 0;
  const HR_max = data.heart_rate_max ?? 0;
  // const HR_min = data.heart_rate_min ?? 0; // 사용되지 않음
  const SDNN = data.hrv_sdnn ?? 0;
  const MOV = data.movement_count ?? 0;
  const RESP = data.respiratory_rate_avg ?? 0;
  const isFallback = data.is_fallback ?? false;

  // -----------------------------
  // 1) HR 기반 스트레스 (HR 높으면 ↑)
  // -----------------------------
  const best_hr = 50;
  const worst_hr = 110;

  let HR_stress = clamp(
    (HR - best_hr) / (worst_hr - best_hr),
    0,
    1
  );

  // [EDIT] heart_rate_max를 활용한 급성 스트레스 반영 로직 추가
  // 평균과 최고값의 가중 평균을 사용하여 급성 스트레스 반영
  if (HR_max !== undefined) {
    const max_hr_stress = clamp(
      (HR_max - best_hr) / (worst_hr - best_hr),
      0,
      1
    );
    HR_stress = (HR_stress * 0.7 + max_hr_stress * 0.3);
  }

  // -----------------------------
  // 2) SDNN 기반 스트레스 (SDNN 낮으면 ↑)
  // -----------------------------
  const min_sdnn = 20;
  const max_sdnn = 100;

  const SDNN_stress = clamp(
    (max_sdnn - SDNN) / (max_sdnn - min_sdnn),
    0,
    1
  );

  // -----------------------------
  // 3) Movement 기반 스트레스 (움직임 ↑)
  // -----------------------------
  // const best_mov = 0; // 사용되지 않음 (worst_mov만 사용)
  const worst_mov = 60;

  const Movement_stress = clamp(
    MOV / worst_mov,
    0,
    1
  );

  // -----------------------------
  // 4) Respiration 기반 스트레스 (호흡 ↑)
  // -----------------------------
  const normal_resp = 16;

  const Resp_stress = clamp(
    Math.abs(RESP - normal_resp) / 10,
    0,
    1
  );

  // -----------------------------
  // 5) 가중합 계산
  // -----------------------------
  const w_hr = 0.40;
  const w_sdnn = 0.40;
  const w_mov = 0.15;
  const w_resp = 0.05;

  let StressScore_0to1 =
    HR_stress * w_hr +
    SDNN_stress * w_sdnn +
    Movement_stress * w_mov +
    Resp_stress * w_resp;

  // [EDIT] 폴백 데이터 보정 로직 추가
  // 폴백 데이터는 신뢰도가 낮으므로 점수를 약간 낮춤
  if (isFallback) {
    StressScore_0to1 = StressScore_0to1 * 0.9;
  }

  // -----------------------------
  // 7) 최종 스코어 변환 (0~100)
  // -----------------------------
  const StressScore = Math.round(StressScore_0to1 * 100);

  return StressScore;
}
