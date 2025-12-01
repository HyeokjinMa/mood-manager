/**
 * 캐시 키 생성 유틸리티
 */

import type { LLMInput } from "@/lib/llm/prepareLLMInput";

interface CacheKeyParams {
  llmInput: LLMInput;
  preprocessed: {
    recent_stress_index: number;
  };
  segmentIndex?: number;
}

/**
 * 캐시 키 생성
 */
export function getCacheKey({
  llmInput,
  preprocessed,
  segmentIndex,
}: CacheKeyParams) {
  return {
    moodName: llmInput.moodName,
    musicGenre: llmInput.musicGenre,
    scentType: llmInput.scentType,
    timeOfDay: llmInput.timeOfDay || new Date().getHours(),
    season: llmInput.season || "Winter",
    stressIndex: preprocessed.recent_stress_index,
    segmentIndex,
  };
}

