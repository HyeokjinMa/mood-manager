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
  mood: Mood | null | undefined; // null/undefined 허용 (초기 로딩 시)
  backgroundParams?: BackgroundParams | null;
}

interface MoodColors {
  baseColor: string; // original mood color (LLM or default mood)
  accentColor: string; // pastel tone point color for UI
  displayAlias: string; // mood alias to display
}

/**
 * 무드 색상 및 별명 계산 훅
 */
export function useMoodColors({
  mood,
  backgroundParams,
}: UseMoodColorsProps): MoodColors {
  return useMemo(() => {
    // mood가 없으면 기본값 사용
    if (!mood) {
      return {
        baseColor: backgroundParams?.moodColor || "#E6F3FF",
        accentColor: blendWithWhite(backgroundParams?.moodColor || "#E6F3FF", 0.9),
        displayAlias: backgroundParams?.moodAlias || "Loading...",
      };
    }
    
    // baseColor: 원본 무드 컬러 계산 (사용자가 변경한 mood.color 우선, 그 다음 LLM, 마지막 기본 무드)
    // 사용자가 변경한 값이 있으면 우선 사용
    const baseColor = mood.color || backgroundParams?.moodColor || "#E6F3FF";
    
    // accentColor: UI에서 사용할 파스텔톤 포인트 컬러 계산 (아이콘/바/버튼 등에만 사용)
    // 90% 흰색 + 10% 무드 컬러로 파스텔 톤 생성
    const accentColor = blendWithWhite(baseColor, 0.9);
    
    // displayAlias: 초기 세그먼트는 mood.name 우선, LLM 생성 세그먼트는 moodAlias 우선
    // backgroundParams가 있으면 LLM 생성 세그먼트이므로 moodAlias 사용, 없으면 초기 세그먼트이므로 mood.name 사용
    const displayAlias = backgroundParams?.moodAlias ? backgroundParams.moodAlias : mood.name;

    return {
      baseColor,
      accentColor,
      displayAlias,
    };
  }, [mood?.color, mood?.name, backgroundParams?.moodColor, backgroundParams?.moodAlias]);
}

