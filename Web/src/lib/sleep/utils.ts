// src/lib/sleep/utils.ts
/**
 * [파일 역할]
 * - 수면 점수 계산(calculateSleepScore.ts) 및 수면 단계 추정(detectSleepStage.ts)에서
 *   공통적으로 사용되는 보조 유틸 함수들을 모아둔 파일입니다.
 *
 * [이 파일이 중요한 이유]
 * - 수면 점수 계산 공식은 다양한 정규화(0~1 스케일링)를 반드시 필요로 함
 * - 정규화/보정 로직을 utils로 분리해두면, 수면 모델이 변경되어도 재사용성 높음
 *
 *
 * [제공 함수]
 * 1) clamp(value, min, max)
 *    → 값이 min과 max 사이를 넘지 않도록 강제
 *    → 정규화 값이 0~1 범위를 벗어나지 않도록 하기 위해 필수
 *
 * 2) normalize(value, min, max)
 *    → value를 min~max 범위 기준으로 0~1로 변환
 *    → sleep score 공식에서 SDNN, HR, Movement 정규화에 활용 가능
 *
 *
 * [주의사항]
 * - 이 파일은 "수면 전용 유틸"이며, stress/utils.ts와 분리되어야 유지보수가 용이함
 * - stress는 HR/HRV/Resp 사용 방식이 다르므로 별도 utils 필요
 */

/**
 * 주어진 값(value)이 최소(min)~최대(max) 범위를 벗어나지 않도록 보정합니다.
 *
 * 예시:
 *   clamp(1.3, 0, 1) → 1
 *   clamp(-0.2, 0, 1) → 0
 *   clamp(0.45, 0, 1) → 0.45
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * 값을 특정 구간(min~max)을 기준으로 0~1 스케일로 정규화합니다.
 *
 * 예시:
 *  normalize(75, 50, 100)
 *    = (75 - 50) / (100 - 50)
 *    = 0.5
 *
 *  normalize(20, 20, 100) → 0
 *  normalize(100, 20, 100) → 1
 *
 * 사용처:
 * - calculateSleepScore.ts: SDNN, HR, Movement, Resp 계산 시 활용
 */
export function normalize(value: number, min: number, max: number): number {
  if (min === max) return 0; // 방어 코드
  return clamp((value - min) / (max - min), 0, 1);
}