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
  currentMood: Mood; // null이 아니어야 함 (기본값 제공)
  setCurrentSegmentIndex: (index: number) => void;
  onMoodChange: (mood: Mood) => void;
  allSegmentsParams?: BackgroundParams[] | null;
  setBackgroundParams?: (params: BackgroundParams | null) => void;
  onTransitionTrigger?: (fromColor: string, toColor: string) => void;
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
  onTransitionTrigger,
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
    
    const target = moodStream.segments[clampedIndex];
    console.log(`Target segment:`, target);
    
    // 전환 애니메이션 트리거 (색상이 다른 경우만)
    if (target?.mood && onTransitionTrigger) {
      const currentColor = currentMood.color;
      const targetColor = target.mood.color || currentColor;
      if (currentColor !== targetColor) {
        onTransitionTrigger(currentColor, targetColor);
      }
    }
    
    // 즉시 세그먼트 인덱스 업데이트 (setTimeout 제거로 안정성 향상)
    setCurrentSegmentIndex(clampedIndex);
    console.log(`✅ Current segment index updated to: ${clampedIndex}`);
    
    // 해당 세그먼트의 backgroundParams 즉시 적용
    // 초기 세그먼트(0-2)는 LLM 생성이 아니므로 backgroundParams를 설정하지 않음
    if (clampedIndex >= 3 && allSegmentsParams && allSegmentsParams.length > clampedIndex && setBackgroundParams) {
      const segmentParams = allSegmentsParams[clampedIndex];
      console.log(`🎨 Applying backgroundParams for segment ${clampedIndex}:`, segmentParams);
      setBackgroundParams(segmentParams);
    } else if (clampedIndex < 3 && setBackgroundParams) {
      // 초기 세그먼트는 backgroundParams를 null로 설정하여 mood.name 사용
      console.log(`🎨 Clearing backgroundParams for initial segment ${clampedIndex}`);
      setBackgroundParams(null);
    } else {
      console.warn(`⚠️  BackgroundParams not available for segment ${clampedIndex}`);
    }
    
    if (target?.mood) {
      // 타입 안전한 변환 함수 사용 (segment 전체를 전달하여 musicTracks에서 duration 가져오기)
      const convertedMood = convertSegmentMoodToMood(target.mood, currentMood, target);
      
      // musicTracks에서 실제 노래 제목 가져오기 (우선순위: musicTracks > backgroundParams.musicSelection)
      if (target.musicTracks && target.musicTracks.length > 0 && target.musicTracks[0].title) {
        convertedMood.song.title = target.musicTracks[0].title;
        console.log(`🎵 Updated music title from musicTracks: "${target.musicTracks[0].title}"`);
      } else if (allSegmentsParams && allSegmentsParams.length > clampedIndex) {
        const segmentParams = allSegmentsParams[clampedIndex];
        // musicSelection이 숫자(musicID)가 아닌 문자열(제목)인 경우에만 사용
        if (segmentParams?.musicSelection && typeof segmentParams.musicSelection === 'string' && isNaN(Number(segmentParams.musicSelection))) {
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
  }, [moodStream, currentMood, setCurrentSegmentIndex, onMoodChange, allSegmentsParams, setBackgroundParams, onTransitionTrigger]);

  return {
    handleSegmentSelect,
  };
}

