// src/app/(main)/home/components/MoodDashboard/hooks/useSegmentSelector.ts
/**
 * 세그먼트 선택 훅
 * 
 * 무드스트림의 세그먼트를 선택하고 해당 무드로 전환
 */

import { useCallback } from "react";
import type { Mood } from "@/types/mood";
import type { MoodStream } from "@/hooks/useMoodStream/types";
import type { BackgroundParams } from "@/hooks/useBackgroundParams";
import { convertSegmentMoodToMood } from "../utils/moodStreamConverter";

interface UseSegmentSelectorProps {
  moodStream: MoodStream | null;
  currentMood: Mood;
  setCurrentSegmentIndex: (index: number) => void;
  onMoodChange: (mood: Mood) => void;
  allSegmentsParams?: BackgroundParams[] | null;
  setBackgroundParams?: (params: BackgroundParams | null) => void;
}

/**
 * 세그먼트 선택 핸들러 훅
 */
export function useSegmentSelector({
  moodStream,
  currentMood,
  setCurrentSegmentIndex,
  onMoodChange,
  allSegmentsParams,
  setBackgroundParams,
}: UseSegmentSelectorProps) {
  const handleSegmentSelect = useCallback((index: number) => {
    console.log("\n" + "=".repeat(60));
    console.log("🎯 [useSegmentSelector] Segment selection triggered");
    console.log("=".repeat(60));
    console.log(`Requested index: ${index}`);
    
    if (!moodStream || !moodStream.segments || moodStream.segments.length === 0) {
      console.warn("❌ Mood stream not available for segment selection");
      return;
    }

    const clampedIndex = Math.max(0, Math.min(index, moodStream.segments.length - 1));
    console.log(`Clamped index: ${clampedIndex}`);
    console.log(`Total segments: ${moodStream.segments.length}`);
    
    setCurrentSegmentIndex(clampedIndex);
    console.log(`✅ Current segment index updated to: ${clampedIndex}`);
    
    const target = moodStream.segments[clampedIndex];
    console.log(`Target segment:`, target);
    
    // 해당 세그먼트의 backgroundParams 즉시 적용
    if (allSegmentsParams && allSegmentsParams.length > clampedIndex && setBackgroundParams) {
      const segmentParams = allSegmentsParams[clampedIndex];
      console.log(`🎨 Applying backgroundParams for segment ${clampedIndex}:`, segmentParams);
      setBackgroundParams(segmentParams);
    } else {
      console.warn(`⚠️  BackgroundParams not available for segment ${clampedIndex}`);
    }
    
    if (target?.mood) {
      // 타입 안전한 변환 함수 사용
      const convertedMood = convertSegmentMoodToMood(target.mood, currentMood);
      
      // backgroundParams의 musicSelection이 있으면 무드의 song.title에 반영
      if (allSegmentsParams && allSegmentsParams.length > clampedIndex) {
        const segmentParams = allSegmentsParams[clampedIndex];
        if (segmentParams?.musicSelection) {
          convertedMood.song.title = segmentParams.musicSelection;
          console.log(`🎵 Updated music title from backgroundParams: "${segmentParams.musicSelection}"`);
        }
      }
      
      console.log(`Converted mood:`, convertedMood);
      onMoodChange(convertedMood);
      console.log(`✅ Mood changed successfully`);
    } else {
      console.warn("❌ Target segment mood not found", { clampedIndex, target });
    }
    console.log("=".repeat(60) + "\n");
  }, [moodStream, currentMood, setCurrentSegmentIndex, onMoodChange, allSegmentsParams, setBackgroundParams]);

  return {
    handleSegmentSelect,
  };
}

