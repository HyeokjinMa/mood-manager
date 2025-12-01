/**
 * ScentBackground 상수 정의
 */

import type { ScentType } from "@/types/mood";

// 향 타입별 애니메이션 스타일 (모두 바닥으로 떨어짐)
export const SCENT_ANIMATION_STYLES: Record<ScentType, {
  speed: { min: number; max: number };
  size: { min: number; max: number };
  density: number; // 파티클 밀도 배수
  swayAmount: number; // 좌우 흔들림 정도 (0-1)
  rotationSpeed: number; // 회전 속도 배수
  backgroundColor: string; // 파스텔 배경 색상 (더 연하게, 대비 확보)
}> = {
  Marine: {
    speed: { min: 0.8, max: 1.5 },
    size: { min: 10, max: 18 },
    density: 1.0,
    swayAmount: 0.2, // 물방울은 약간 흔들림
    rotationSpeed: 0.3,
    backgroundColor: "rgba(200, 230, 250, 0.08)", // 더 연한 하늘색 파스텔
  },
  Floral: {
    speed: { min: 0.4, max: 0.9 },
    size: { min: 14, max: 24 },
    density: 0.8,
    swayAmount: 0.6, // 꽃잎은 많이 흔들림
    rotationSpeed: 0.8,
    backgroundColor: "rgba(255, 220, 230, 0.08)", // 더 연한 분홍 파스텔
  },
  Citrus: {
    speed: { min: 1.0, max: 1.8 },
    size: { min: 8, max: 14 },
    density: 1.2,
    swayAmount: 0.3,
    rotationSpeed: 1.2,
    backgroundColor: "rgba(255, 240, 200, 0.08)", // 더 연한 노란색 파스텔
  },
  Woody: {
    speed: { min: 0.6, max: 1.2 },
    size: { min: 12, max: 20 },
    density: 0.7,
    swayAmount: 0.4,
    rotationSpeed: 0.5,
    backgroundColor: "rgba(220, 200, 180, 0.06)", // 더 연한 갈색 파스텔
  },
  Musk: {
    speed: { min: 0.3, max: 0.7 },
    size: { min: 16, max: 26 },
    density: 0.6,
    swayAmount: 0.3,
    rotationSpeed: 0.2,
    backgroundColor: "rgba(250, 248, 240, 0.08)", // 더 연한 아이보리 파스텔
  },
  Aromatic: {
    speed: { min: 0.5, max: 1.0 },
    size: { min: 10, max: 18 },
    density: 1.0,
    swayAmount: 0.5,
    rotationSpeed: 0.6,
    backgroundColor: "rgba(220, 235, 210, 0.08)", // 더 연한 세이지 그린 파스텔
  },
  Green: {
    speed: { min: 0.6, max: 1.1 },
    size: { min: 12, max: 20 },
    density: 0.9,
    swayAmount: 0.5,
    rotationSpeed: 0.7,
    backgroundColor: "rgba(220, 250, 230, 0.08)", // 더 연한 에메랄드 그린 파스텔
  },
  Spicy: {
    speed: { min: 1.2, max: 2.0 },
    size: { min: 6, max: 12 },
    density: 1.3,
    swayAmount: 0.4,
    rotationSpeed: 1.5,
    backgroundColor: "rgba(255, 230, 220, 0.06)", // 더 연한 오렌지 레드 파스텔
  },
  Honey: {
    speed: { min: 0.5, max: 0.9 },
    size: { min: 14, max: 22 },
    density: 0.8,
    swayAmount: 0.3,
    rotationSpeed: 0.4,
    backgroundColor: "rgba(255, 240, 200, 0.08)", // 더 연한 골드 파스텔
  },
  Dry: {
    speed: { min: 0.5, max: 1.0 },
    size: { min: 8, max: 16 },
    density: 0.7,
    swayAmount: 0.3,
    rotationSpeed: 0.5,
    backgroundColor: "rgba(240, 230, 220, 0.06)", // 더 연한 황토색 파스텔
  },
  Leathery: {
    speed: { min: 0.6, max: 1.2 },
    size: { min: 10, max: 18 },
    density: 0.8,
    swayAmount: 0.3,
    rotationSpeed: 0.4,
    backgroundColor: "rgba(230, 220, 210, 0.06)", // 더 연한 다크 브라운 파스텔
  },
  Powdery: {
    speed: { min: 0.3, max: 0.6 },
    size: { min: 18, max: 28 },
    density: 0.6,
    swayAmount: 0.2,
    rotationSpeed: 0.2,
    backgroundColor: "rgba(255, 240, 245, 0.08)", // 더 연한 파우더 핑크 파스텔
  },
};

