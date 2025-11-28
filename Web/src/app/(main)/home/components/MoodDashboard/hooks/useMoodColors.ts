// src/app/(main)/home/components/MoodDashboard/hooks/useMoodColors.ts
/**
 * 무드 색상 계산 훅
 * 
 * LLM 배경 파라미터와 기본 무드를 기반으로 UI에 사용할 색상 계산
 */

import { useMemo } from "react";
import type { Mood } from "@/types/mood";
import type { BackgroundParams } from "@/hooks/useBackgroundParams";
import { blendWithWhite } from "@/lib/utils";

interface UseMoodColorsProps {
  mood: Mood;
  backgroundParams?: BackgroundParams | null;
}

interface MoodColors {
  baseColor: string; // 원본 무드 컬러 (LLM 또는 기본 무드)
  accentColor: string; // UI에서 사용할 파스텔톤 포인트 컬러
  displayAlias: string; // 표시할 무드 별명
  llmSource?: string; // LLM 소스 정보
}

/**
 * 무드 색상 및 별명 계산 훅
 */
export function useMoodColors({
  mood,
  backgroundParams,
}: UseMoodColorsProps): MoodColors {
  return useMemo(() => {
    // baseColor: 원본 무드 컬러 (LLM 또는 기본 무드)
    const baseColor = backgroundParams?.moodColor || mood.color;
    
    // accentColor: UI에서 사용할 파스텔톤 포인트 컬러 (아이콘/바/버튼 등에만 사용)
    // 90% 흰색 + 10% 무드 컬러 (파스텔)
    const accentColor = blendWithWhite(baseColor, 0.9);
    
    // displayAlias: LLM 추천 별명 또는 기본 무드 이름
    const displayAlias = backgroundParams?.moodAlias || mood.name;
    
    // llmSource: LLM 소스 정보
    const llmSource = backgroundParams?.source;

    return {
      baseColor,
      accentColor,
      displayAlias,
      llmSource,
    };
  }, [mood.color, mood.name, backgroundParams?.moodColor, backgroundParams?.moodAlias, backgroundParams?.source]);
}

