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
  baseColor: string; // original mood color (LLM or default mood)
  accentColor: string; // pastel tone point color for UI
  displayAlias: string; // mood alias to display
  llmSource?: string; // LLM source information
}

/**
 * 무드 색상 및 별명 계산 훅
 */
export function useMoodColors({
  mood,
  backgroundParams,
}: UseMoodColorsProps): MoodColors {
  return useMemo(() => {
    // baseColor: 원본 무드 컬러 계산 (LLM 또는 기본 무드)
    const baseColor = backgroundParams?.moodColor || mood.color;
    
    // accentColor: UI에서 사용할 파스텔톤 포인트 컬러 계산 (아이콘/바/버튼 등에만 사용)
    // 90% 흰색 + 10% 무드 컬러로 파스텔 톤 생성
    const accentColor = blendWithWhite(baseColor, 0.9);
    
    // displayAlias: LLM 추천 별명 또는 기본 무드 이름 사용
    const displayAlias = backgroundParams?.moodAlias || mood.name;
    
    // llmSource: LLM 소스 정보 가져오기
    const llmSource = backgroundParams?.source;

    return {
      baseColor,
      accentColor,
      displayAlias,
      llmSource,
    };
  }, [mood.color, mood.name, backgroundParams?.moodColor, backgroundParams?.moodAlias, backgroundParams?.source]);
}

