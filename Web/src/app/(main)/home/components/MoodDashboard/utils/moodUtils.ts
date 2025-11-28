// ======================================================
// File: src/app/(main)/home/components/MoodDashboard/utils/moodUtils.ts
// ======================================================

import type { ScentType } from "@/types/mood";

/**
 * 배경색의 밝기 계산 함수
 * @param color HEX 색상 코드
 * @returns 밝기 값 (0-255)
 */
export function getBrightness(color: string): number {
  const hex = color.replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000;
}

/**
 * 스프레이 아이콘 색상 결정 함수
 * 배경이 밝으면 어두운 색, 어두우면 밝은 색 사용
 * @param scentType 향 타입
 * @param backgroundColor 배경 색상 (HEX)
 * @returns 아이콘 색상 (HEX)
 */
export function getScentIconColor(scentType: ScentType, backgroundColor: string): string {
  const brightness = getBrightness(backgroundColor);
  
  // 센트 타입별 기본 색상 매핑
  const typeColors: Record<ScentType, { light: string; dark: string }> = {
    Musk: { light: "#8B7355", dark: "#F5F5DC" }, // 베이지/크림 계열
    Aromatic: { light: "#5A7A4A", dark: "#E8D5FF" }, // 그린/퍼플 계열
    Woody: { light: "#4A2C1A", dark: "#D4A574" }, // 브라운 계열
    Citrus: { light: "#CC8800", dark: "#FFF8DC" }, // 옐로우/오렌지 계열
    Honey: { light: "#B8860B", dark: "#FFFACD" }, // 골드 계열
    Green: { light: "#2D5016", dark: "#FFFFFF" }, // 그린 계열 - 밝은 배경에서는 진한 녹색, 어두운 배경에서는 흰색
    Dry: { light: "#8B6F47", dark: "#F5DEB3" }, // 어스톤 계열
    Leathery: { light: "#3D2817", dark: "#D2B48C" }, // 다크 브라운 계열
    Marine: { light: "#4682B4", dark: "#E0F6FF" }, // 블루 계열
    Spicy: { light: "#8B4513", dark: "#FFE4B5" }, // 레드/오렌지 계열
    Floral: { light: "#C71585", dark: "#FFE4E1" }, // 핑크/퍼플 계열
    Powdery: { light: "#BC8F8F", dark: "#FFF0F5" }, // 파스텔 계열
  };
  
  // 밝기가 180 이상이면 밝은 배경으로 간주, 어두운 색 사용
  // 밝기가 180 미만이면 어두운 배경으로 간주, 밝은 색 사용
  return brightness >= 180 ? typeColors[scentType].light : typeColors[scentType].dark;
}

/**
 * 시간 포맷팅 함수 (초 → MM:SS)
 * @param seconds 초 단위 시간
 * @returns 포맷된 시간 문자열 (MM:SS)
 */
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

