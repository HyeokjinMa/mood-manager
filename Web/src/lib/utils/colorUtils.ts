/**
 * Color utility functions
 * 
 * 공통으로 사용되는 색상 관련 유틸리티 함수들
 */

/**
 * HEX 색상을 RGB 배열로 변환
 * @param hex HEX 색상 문자열 (예: "#FF5733" 또는 "FF5733")
 * @returns RGB 배열 [r, g, b] (각 값은 0-255 범위)
 */
export function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) {
    return [0, 0, 0]; // 기본값: 검은색
  }
  return [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16),
  ];
}
