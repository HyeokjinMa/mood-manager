// src/lib/stress/utils.ts
/**
 * [파일 역할]
 * - 스트레스 점수 계산(calculateStressIndex.ts)에 필요한
 *   정규화 및 값 제한(clamp) 함수들을 제공하는 유틸 파일입니다.
 *
 * [왜 분리했는가?]
 * - sleep/utils.ts와 stress/utils.ts를 구분하면
 *   생리학적 모델 변경 시 각 도메인만 독립적으로 관리 가능.
 *
 * [함수 목록]
 * 1) clamp(value, min, max)
 *    → 범위를 벗어나지 않도록 값 제한
 *
 * 2) normalize(value, min, max)
 *    → 특정 구간을 기준으로 0~1 사이 값으로 변환
 */

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function normalize(value: number, min: number, max: number): number {
  if (min === max) return 0; // 방어 코드
  return clamp((value - min) / (max - min), 0, 1);
}
