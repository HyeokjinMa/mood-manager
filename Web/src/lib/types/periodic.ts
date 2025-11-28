// src/lib/types/periodic.ts
/**
 * Wear OS(워치)에서 Firestore에 저장되는 raw_periodic 문서의 TypeScript 타입 정의 파일입니다.
 *
 * [디자인 원칙]
 * - PeriodicRaw는 "원본(raw)" 데이터 구조를 정의합니다.
 * - Firestore 문서 ID(doc.id)는 데이터 필드가 아니므로 optional로 정의합니다.
 * - 전처리 파이프라인 전체(Listener → Session Detector → Score Engine)에서 사용됩니다.
 */

export interface PeriodicRaw {
  /**
   * Firestore 문서 ID
   * - Firestore에서 데이터를 가져올 때만 존재하며
   * - WearOS가 업로드하는 실제 raw 데이터에는 존재하지 않으므로 optional 처리합니다.
   */
  id?: string;

  /**
   * 수집 시각 (Unix epoch ms)
   * - Sleep Session Detection / 시계열 정렬 등에 사용
   */
  timestamp: number;

  /**
   * 평균 심박수 (bpm)
   * - 수면 단계(DEEP/LIGHT/REM) 구분
   * - 수면 점수 / 스트레스 점수 핵심 지표
   */
  heart_rate_avg: number;

  /**
   * 심박 변이도 SDNN (ms)
   * - 수면 깊이, 자율신경계 안정성
   * - 수면/스트레스 양쪽에 중요한 지표
   */
  hrv_sdnn: number;

  /**
   * 평균 호흡수 (breaths/min)
   * - 수면 중 안정성
   */
  respiratory_rate_avg: number;

  /**
   * 움직임 감지 횟수
   * - 0~1: Deep Sleep
   * - 2~4: Light Sleep
   * - 5~15: Awake 또는 뒤척임
   */
  movement_count: number;

  // [EDIT] 새로운 필드 추가: heart_rate_max, heart_rate_min, is_fallback
  // 기존에는 heart_rate_avg, hrv_sdnn, movement_count, respiratory_rate_avg, timestamp만 사용했으나
  // 이제 heart_rate_max, heart_rate_min, is_fallback도 활용하여 더 정확한 계산 수행
  /**
   * 최고 심박수
   * - 급성 스트레스 판단
   */
  heart_rate_max: number;

  /**
   * 최저 심박수
   * - Deep Sleep 감지 핵심 지표
   */
  heart_rate_min: number;

  /**
   * 폴백 데이터 여부
   * - 센서 데이터가 부족할 때 추정값 사용 여부
   */
  is_fallback: boolean;
}