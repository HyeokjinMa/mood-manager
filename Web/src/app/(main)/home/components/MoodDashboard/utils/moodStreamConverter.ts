// src/app/(main)/home/components/MoodDashboard/utils/moodStreamConverter.ts
/**
 * 무드스트림 세그먼트를 Mood 타입으로 변환하는 유틸리티
 * 
 * MoodStreamSegment의 mood 구조를 Mood 타입으로 안전하게 변환
 */

import type { Mood, ScentType } from "@/types/mood";
import type { MoodStreamSegment } from "@/hooks/useMoodStream/types";

/**
 * MoodStreamSegment의 mood를 Mood 타입으로 변환
 * 
 * 백엔드 스트림의 mood 구조가 Mood 타입과 100% 일치하지 않으므로
 * 필요한 필드만 안전하게 매핑하여 변환
 * 
 * DB에서 가져온 정보:
 * - mood.color ✅
 * - mood.music.title ✅
 * - mood.scent.type ✅
 * - mood.scent.name ✅
 * - musicTracks[0].duration ✅ (실제 MP3 길이, 밀리초)
 * 
 * 부족한 정보 (기본값 사용):
 * - song.duration: musicTracks[0].duration에서 가져오거나 기본값 180초
 * - scent.color: 기본값 "#9CAF88"
 */
export function convertSegmentMoodToMood(
  segmentMood: MoodStreamSegment["mood"],
  fallbackMood: Mood | null,
  segment?: MoodStreamSegment | null
): Mood {
  // 기본값 정의
  const defaultMood: Mood = {
    id: "default",
    name: "Unknown Mood",
    color: "#E6F3FF",
    song: { title: "Unknown Song", duration: 180 },
    scent: {
      type: "Musk",
      name: "Default",
      color: "#9CAF88",
    },
  };
  
  const safeFallback = fallbackMood || defaultMood;
  
  // ScentType 검증 및 변환
  const scentType = (segmentMood.scent?.type as ScentType) || safeFallback.scent.type;
  
  // song.duration: musicTracks[0].duration에서 가져오거나 기본값 사용
  // musicTracks[0].duration은 밀리초 단위이므로 초로 변환
  let songDuration = safeFallback.song.duration;
  if (segment?.musicTracks && segment.musicTracks.length > 0) {
    const trackDuration = segment.musicTracks[0].duration;
    if (trackDuration && trackDuration > 0) {
      songDuration = Math.floor(trackDuration / 1000); // 밀리초 → 초
    }
  }
  
  return {
    id: segmentMood.id || safeFallback.id,
    name: segmentMood.name || safeFallback.name,
    color: segmentMood.color || safeFallback.color,
    song: {
      title: segmentMood.music?.title || safeFallback.song.title,
      duration: songDuration, // musicTracks에서 가져온 실제 MP3 길이 사용
    },
    scent: {
      type: scentType,
      name: segmentMood.scent?.name || safeFallback.scent.name,
      color: safeFallback.scent.color, // color는 세그먼트에 없으므로 fallback 사용
    },
  };
}

