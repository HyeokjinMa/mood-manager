// src/app/(main)/home/components/MoodDashboard/utils/moodStreamConverter.ts
/**
 * 무드스트림 세그먼트를 Mood 타입으로 변환하는 유틸리티
 * 
 * MoodStreamSegment의 mood 구조를 Mood 타입으로 안전하게 변환
 */

import type { Mood, ScentType } from "@/types/mood";
import type { MoodStreamSegment } from "@/hooks/useMoodStream";

/**
 * MoodStreamSegment의 mood를 Mood 타입으로 변환
 * 
 * 백엔드 스트림의 mood 구조가 Mood 타입과 100% 일치하지 않으므로
 * 필요한 필드만 안전하게 매핑하여 변환
 */
export function convertSegmentMoodToMood(
  segmentMood: MoodStreamSegment["mood"],
  fallbackMood: Mood
): Mood {
  // ScentType 검증 및 변환
  const scentType = (segmentMood.scent?.type as ScentType) || fallbackMood.scent.type;
  
  return {
    id: segmentMood.id || fallbackMood.id,
    name: segmentMood.name || fallbackMood.name,
    color: segmentMood.color || fallbackMood.color,
    song: {
      title: segmentMood.music?.title || fallbackMood.song.title,
      duration: fallbackMood.song.duration, // duration은 세그먼트에 없으므로 fallback 사용
    },
    scent: {
      type: scentType,
      name: segmentMood.scent?.name || fallbackMood.scent.name,
      color: fallbackMood.scent.color, // color는 세그먼트에 없으므로 fallback 사용
    },
  };
}

