// src/lib/preferences/preferenceUtils.ts
/**
 * [파일 역할]
 * - 선호도 업데이트에 필요한 보조 함수들을 모아둔 유틸 파일입니다.
 * - RGB 거리 계산, 클램핑, reward 계산(웃음/한숨/사용시간 기반) 등이 포함됩니다.
 *
 * [포함된 기능]
 * - clamp(): 값을 지정된 범위 내로 제한
 * - rgbDistanceScore(): RGB 색상 유사도 계산
 * - calculateReward(): 사용시간, 웃음/한숨 기반 보상 계산
 *
 * [주의사항]
 * - updatePreferences.ts 내부에서 호출됩니다.
 */

export function clamp(value: number, min = 0, max = 1): number {
    return Math.min(Math.max(value, min), max);
  }
  
  /**
   * RGB 색상 유사도 계산 (0~1)
   * distance = Euclidean distance
   * score = 1 - (distance / maxDistance)
   */
  export function rgbDistanceScore(
    r1: number,
    g1: number,
    b1: number,
    r2: number,
    g2: number,
    b2: number
  ): number {
    const dist = Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2);
    const maxDist = Math.sqrt(255 ** 2 * 3);
    const score = 1 - dist / maxDist;
    return clamp(score, 0, 1);
  }
  
  /**
   * [보상 계산 로직]
   * - 기본 보상: 0.4
   * - 사용 시간 보상: durationMinutes / 180 (3시간 = 1.0)
   * - 웃음 보상: laughCount × 0.05
   * - 한숨 패널티: sighCount × 0.05
   */
  export function calculateReward(
    durationMinutes: number,
    laughCount: number,
    sighCount: number
  ): number {
    const base = 0.4;
    const timeScore = clamp(durationMinutes / 180, 0, 1);
    const laughBonus = laughCount * 0.05;
    const sighPenalty = sighCount * 0.05;
  
    const reward = base + timeScore + laughBonus - sighPenalty;
    return clamp(reward, 0, 1);
  }
  