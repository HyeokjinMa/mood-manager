/**
 * Color utility functions
 * 
 * Phase 3 리팩토링: colorUtils.ts를 color.ts로 이름 변경 및 통합
 * 공통으로 사용되는 색상 관련 유틸리티 함수들
 */

/**
 * HEX 색상을 RGB 배열로 변환
 * @param hex HEX 색상 문자열 (예: "#FF5733" 또는 "FF5733")
 * @returns RGB 배열 [r, g, b] (각 값은 0-255 범위)
 * 
 * 기본값: [230, 243, 255] (하늘색) - 유효하지 않은 입력 시
 */
export function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  if (clean.length !== 6) {
    return [230, 243, 255]; // 기본값 (하늘색)
  }
  const result = /^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(clean);
  return result
    ? [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16),
      ]
    : [230, 243, 255]; // 기본값
}

/**
 * 무드 컬러를 흰색에 가깝게 블렌딩하는 함수
 * @param color - HEX 색상 (예: "#FFD700")
 * @param whiteRatio - 흰색 비율 (0~1, 기본값 0.9 = 90% 흰색 + 10% 무드 컬러)
 * @returns RGB 색상 문자열 (예: "rgb(255, 255, 255)")
 */
export function blendWithWhite(color: string, whiteRatio: number = 0.9): string {
  // Hex 색상을 RGB로 변환
  const hex = color.replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  // 흰색과 블렌딩 (기본값: 90% 흰색 + 10% 무드 컬러)
  const blendedR = Math.round(255 * whiteRatio + r * (1 - whiteRatio));
  const blendedG = Math.round(255 * whiteRatio + g * (1 - whiteRatio));
  const blendedB = Math.round(255 * whiteRatio + b * (1 - whiteRatio));

  return `rgb(${blendedR}, ${blendedG}, ${blendedB})`;
}

/**
 * HEX 색상을 RGBA 문자열로 변환하는 함수
 * @param hex - HEX 색상 (예: "#FFD700")
 * @param alpha - 알파 값 (0~1)
 * @returns RGBA 색상 문자열 (예: "rgba(255, 215, 0, 0.5)")
 */
export function hexToRgba(hex: string, alpha: number): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * RGB 값을 HEX 문자열로 변환하는 함수
 * @param r - Red 값 (0-255)
 * @param g - Green 값 (0-255)
 * @param b - Blue 값 (0-255)
 * @returns HEX 색상 문자열 (예: "#FFD700")
 */
export function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => {
    const hex = Math.round(Math.max(0, Math.min(255, n))).toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * 흰색 비율이 80% 이상인 컬러를 자동으로 조정
 * 흰색 비율을 20% 정도 감소시켜 더 진한 색상으로 만듦
 * 
 * @param color - HEX 컬러 문자열 (#RRGGBB)
 * @param whiteThreshold - 흰색 비율 임계값 (기본값: 0.8)
 * @param reductionAmount - 흰색 감소량 (기본값: 0.2)
 * @returns 조정된 HEX 컬러 문자열
 */
export function reduceWhiteTint(
  color: string,
  whiteThreshold: number = 0.8,
  reductionAmount: number = 0.2
): string {
  const rgb = hexToRgb(color);
  if (!rgb) return color;
  
  const [r, g, b] = rgb;
  
  // RGB 값을 0-1 범위로 정규화
  const normalizedR = r / 255;
  const normalizedG = g / 255;
  const normalizedB = b / 255;
  
  // 흰색 비율 계산 (최대값 기반 - 가장 정확)
  const maxComponent = Math.max(normalizedR, normalizedG, normalizedB);
  const whiteRatio = maxComponent;
  
  // 흰색 비율이 임계값 이상이면 조정
  if (whiteRatio >= whiteThreshold) {
    // 흰색 비율을 reductionAmount만큼 감소
    const targetWhiteRatio = whiteRatio - reductionAmount;
    const scale = targetWhiteRatio / whiteRatio;
    
    // RGB 값을 비율에 맞게 조정
    const adjustedR = Math.round(normalizedR * scale * 255);
    const adjustedG = Math.round(normalizedG * scale * 255);
    const adjustedB = Math.round(normalizedB * scale * 255);
    
    return rgbToHex(adjustedR, adjustedG, adjustedB);
  }
  
  return color;
}

