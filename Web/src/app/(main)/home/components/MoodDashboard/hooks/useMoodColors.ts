// src/app/(main)/home/components/MoodDashboard/hooks/useMoodColors.ts
/**
 * 무드 색상 계산 훅이다
 * 
 * LLM 배경 파라미터와 기본 무드를 기반으로 UI에 사용할 색상을 계산한다
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
  baseColor: string; // original mood color (LLM or default mood)
  accentColor: string; // pastel tone point color for UI
  displayAlias: string; // mood alias to display
  llmSource?: string; // LLM source information
}

/**
 * 무드 색상 및 별명을 계산하는 훅이다
 */
export function useMoodColors({
  mood,
  backgroundParams,
}: UseMoodColorsProps): MoodColors {
  return useMemo(() => {
    // baseColor: 원본 무드 컬러를 계산한다 (LLM 또는 기본 무드)
    const baseColor = backgroundParams?.moodColor || mood.color;
    
    // accentColor: UI에서 사용할 파스텔톤 포인트 컬러를 계산한다 (아이콘/바/버튼 등에만 사용)
    // 90% 흰색 + 10% 무드 컬러로 파스텔 톤을 만든다
    const accentColor = blendWithWhite(baseColor, 0.9);
    
    // displayAlias: LLM 추천 별명 또는 기본 무드 이름을 사용한다
    const displayAlias = backgroundParams?.moodAlias || mood.name;
    
    // llmSource: LLM 소스 정보를 가져온다
    const llmSource = backgroundParams?.source;

    return {
      baseColor,
      accentColor,
      displayAlias,
      llmSource,
    };
  }, [mood.color, mood.name, backgroundParams?.moodColor, backgroundParams?.moodAlias, backgroundParams?.source]);
}

