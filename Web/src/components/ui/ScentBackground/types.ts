/**
 * ScentBackground 타입 정의
 */

import type { ScentType } from "@/types/mood";

import type { IconKey } from "@/lib/events/iconMapping";

export interface ScentParticle {
  id: number;
  x: number;
  y: number;
  size: number;
  speed: number;
  opacity: number;
  rotation: number;
  rotationSpeed: number;
  // 불규칙성을 위한 추가 속성
  windX: number; // 바람 효과 (좌우 이동)
  windY: number; // 바람 효과 (상하 이동)
  turbulence: number; // 난류 효과
  life: number; // 파티클 생명주기 (0-1)
  lifeSpeed: number; // 생명주기 감소 속도
  iconKey?: IconKey; // 이벤트 아이콘 키 (여러 아이콘 혼합용)
}

import type { EventInfo } from "@/lib/events/detectEvents";

export interface ScentBackgroundProps {
  scentType: ScentType;
  scentColor: string;
  intensity: number; // 1-10, 향 레벨에 따라 파티클 수 조절
  className?: string;
  backgroundIcon?: {
    name: string;
    category: string;
  };
  backgroundWind?: {
    direction: number;
    speed: number;
  };
  animationSpeed?: number;
  iconOpacity?: number;
  backgroundColor?: string; // LLM 추천 배경 색상 (사용하더라도 아주 약하게만)
  event?: EventInfo | null; // 이벤트 정보 (크리스마스, 신년 등)
}

