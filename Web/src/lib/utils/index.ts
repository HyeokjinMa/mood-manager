/**
 * 유틸리티 함수 모음
 * 
 * Phase 3 리팩토링: utils.ts를 utils/index.ts로 변경하고 barrel export 사용
 */

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Tailwind CSS 클래스 병합 유틸리티
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// 색상 관련 유틸리티 re-export
export * from "./color";

// 검증 함수 re-export
export * from "./validation";

// 에러 핸들링 re-export
export * from "./errorHandler";

// 시간 관련 유틸리티 re-export
export * from "./time";

// 세그먼트 관련 유틸리티 re-export
export * from "./segmentUtils";

