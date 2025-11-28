// src/lib/sleep/detectSleepStage.ts
/**
 * [파일 역할]
 * - 단일 raw_periodic 샘플(10분 구간 등)을 입력받아
 *   해당 구간의 수면 단계를 AWAKE / DEEP / LIGHT / REM 중 하나로 분류합니다.
 *
 * [사용 데이터]
 * - heart_rate_avg      : 평균 심박수
 * - heart_rate_min      : 최저 심박수 (깊은 수면 감지에 핵심)
 * - hrv_sdnn            : 심박변이도 (자율신경계, 수면 깊이와 연관)
 * - movement_count      : 움직임 (가속도계 기반, 수면/각성 구분에 중요)
 * - respiratory_rate_avg: 평균 호흡수
 *
 * [규칙 기반 휴리스틱 개요]
 * 1) 먼저 "분명히 깨어있다" 패턴을 AWAKE로 분류
 *    - 움직임이 많거나(movement_count ≥ 6)
 *    - 심박수 높거나(heart_rate_avg ≥ 75)
 *
 * 2) 나머지 중 "깊은 수면(DEEP)" 패턴
 *    - heart_rate_min < 50
 *    - movement_count ≤ 1
 *    - hrv_sdnn ≥ 30
 *
 * 3) REM 패턴
 *    - heart_rate_avg가 비교적 높고
 *    - heart_rate_avg - heart_rate_min ≥ 10 (변동성↑)
 *    - movement_count는 낮거나 0~2
 *    - respiratory_rate_avg ≥ 17
 *
 * 4) 그 외 "자고는 있지만 깊지도/REM도 아닌" 상태 → LIGHT
 *
 * [주의사항]
 * - 이 로직은 논문/상용 웨어러블 알고리즘을 단순화한 휴리스틱이며,
 *   실제 센서 세분도, 개인 베이스라인에 따라 튜닝할 여지가 많습니다.
 */

import type { PeriodicRaw } from "@/lib/types/periodic";
import type { SleepStage } from "@/lib/types/sleep";

export function detectSleepStage(raw: PeriodicRaw): SleepStage {
  const hrAvg = raw.heart_rate_avg;
  const hrMin = raw.heart_rate_min;
  const sdnn = raw.hrv_sdnn;
  const mov = raw.movement_count;
  const resp = raw.respiratory_rate_avg;

  const hrRange = hrAvg - (hrMin ?? 0);

  // --------------------------
  // 1) 명백한 각성(AWAKE) 패턴
  // --------------------------
  // - 움직임이 많음
  // - 심박수가 높음
  if (mov >= 6 || hrAvg >= 75) {
    return "AWAKE";
  }

  // --------------------------
  // 2) 깊은 수면(DEEP)
  // --------------------------
  // - 매우 낮은 심박수 (최저 HR < 50)
  // - 거의 움직이지 않음 (movement ≤ 1)
  // - HRV(SDNN)가 충분히 높음 (자율신경 안정)
  if (hrMin !== undefined && hrMin < 50 && mov <= 1 && sdnn >= 30) {
    return "DEEP";
  }

  // --------------------------
  // 3) REM 수면
  // --------------------------
  // - 평균 HR이 중간 이상(예: 60 이상)
  // - HR 변동폭이 큼 (avg - min ≥ 10)
  // - 움직임은 많지 않음 (0~2)
  // - 호흡수가 다소 빠름 (17 이상)
  if (hrAvg >= 60 && hrRange >= 10 && mov <= 2 && resp >= 17) {
    return "REM";
  }

  // --------------------------
  // 4) 나머지는 LIGHT 수면으로 분류
  // --------------------------
  // - 자고는 있지만, 깊지도/REM도 아닌 상태
  return "LIGHT";
}
