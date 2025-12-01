/**
 * 목업 응답 유틸리티
 * OpenAI API 실패 시 fallback으로 사용
 */

import type { BackgroundParamsResponse } from "@/lib/llm/validateResponse";

/**
 * [MOCK] 목업 응답 (OpenAI API 실패 시 fallback)
 * UI FLOW 확인을 위해 보존
 */
export function getMockResponse(): BackgroundParamsResponse {
  return {
    moodAlias: "겨울비의 평온",
    musicSelection: "Ambient Rain Meditation",
    moodColor: "#6B8E9F",
    lighting: {
      brightness: 50,
      temperature: 4000,
    },
    backgroundIcon: {
      name: "FaCloudRain",
      category: "weather",
    },
    backgroundWind: {
      direction: 180,
      speed: 3,
    },
    animationSpeed: 4,
    iconOpacity: 0.7,
    iconCount: 8,
    iconSize: 50,
    particleEffect: false,
    gradientColors: ["#6B8E9F", "#87CEEB"],
  };
}

