// src/lib/utils/time.ts
/**
 * [파일 역할]
 * - 시간 관련 공용 유틸리티 함수들을 모아둔 파일입니다.
 * - 수면 점수 계산, 수면 세션 분석, 최근 10분 데이터 필터링 등
 *   시간 기반 전처리 로직에서 반복적으로 사용되는 기능만 별도로 구성하여
 *   프로젝트 전반에서 재사용 가능하게 합니다.
 *
 * [포함된 기능]
 * 1) now() — 현재 시각 (Unix ms)
 * 2) minutesAgo(n) — n분 전 시각 반환
 * 3) isWithinMinutes(timestamp, n) — 해당 timestamp가 최근 n분 안인지 검사
 * 4) formatTime(ms) — YYYY-MM-DD HH:mm 형식으로 시간 반환
 *
 * [주의사항]
 * - 이 파일은 "순수 유틸"이므로 Firebase나 외부 라이브러리에 의존하지 않아야 함.
 * - 서버/클라이언트 모두에서 동일하게 동작해야 하므로
 *   Date 객체 기반으로만 작성되어 있음.
 */

/** 현재 시각(Unix timestamp: milliseconds) 반환 */
export function now(): number {
  return Date.now();
}

/** n분 전 시각(Unix ms) 반환 */
export function minutesAgo(n: number): number {
  return Date.now() - n * 60 * 1000;
}

/**
 * 특정 timestamp가 최근 n분 안에 발생한 데이터인지 검사
 *
 * 예:
 *   isWithinMinutes(1748411123000, 10)
 *   → true / false
 */
export function isWithinMinutes(timestamp: number, minutes: number): boolean {
  const diff = now() - timestamp;
  return diff <= minutes * 60 * 1000;
}

/**
 * ms 타임스탬프를 YYYY-MM-DD HH:mm 문자열로 변환
 * (로그 출력, 디버깅 화면, 서버 내부 기록 등에 유용함)
 */
export function formatTime(timestamp: number): string {
  const d = new Date(timestamp);

  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");

  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");

  return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
}
