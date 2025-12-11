/**
 * LLM이 생성하는 완전한 세그먼트 출력 타입 정의
 * 모든 출력 디바이스 제어 정보를 포함
 * 
 * Phase 2 리팩토링: 타입 정의를 src/types/llm.ts로 이동
 * 하위 호환성을 위해 re-export 유지
 */

import type { ScentType } from "@/types/mood";
import type {
  CompleteSegmentOutput,
  CompleteStreamOutput,
  DeviceOutputMapping,
} from "@/types/llm";

// 하위 호환성을 위해 re-export
export type { ScentType } from "@/types/mood";
export type {
  CompleteSegmentOutput,
  CompleteStreamOutput,
  DeviceOutputMapping,
} from "@/types/llm";

