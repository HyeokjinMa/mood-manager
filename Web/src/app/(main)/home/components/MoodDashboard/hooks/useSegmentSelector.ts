// src/app/(main)/home/components/MoodDashboard/hooks/useSegmentSelector.ts
/**
 * 세그먼트 선택 훅
 * 
 * 무드스트림의 세그먼트를 선택하고 해당 무드로 전환
 */

import { useCallback } from "react";
import type { Mood } from "@/types/mood";
import type { MoodStream } from "@/hooks/useMoodStream";
import { convertSegmentMoodToMood } from "../utils/moodStreamConverter";

interface UseSegmentSelectorProps {
  moodStream: MoodStream | null;
  currentMood: Mood;
  setCurrentSegmentIndex: (index: number) => void;
  onMoodChange: (mood: Mood) => void;
}

/**
 * 세그먼트 선택 핸들러 훅
 */
export function useSegmentSelector({
  moodStream,
  currentMood,
  setCurrentSegmentIndex,
  onMoodChange,
}: UseSegmentSelectorProps) {
  const handleSegmentSelect = useCallback((index: number) => {
    if (!moodStream || !moodStream.segments || moodStream.segments.length === 0) {
      console.warn("Mood stream not available for segment selection");
      return;
    }

    const clampedIndex = Math.max(0, Math.min(index, moodStream.segments.length - 1));
    setCurrentSegmentIndex(clampedIndex);
    
    const target = moodStream.segments[clampedIndex];
    if (target?.mood) {
      // 타입 안전한 변환 함수 사용
      const convertedMood = convertSegmentMoodToMood(target.mood, currentMood);
      onMoodChange(convertedMood);
    } else {
      console.warn("Target segment mood not found", { clampedIndex, target });
    }
  }, [moodStream, currentMood, setCurrentSegmentIndex, onMoodChange]);

  return {
    handleSegmentSelect,
  };
}

