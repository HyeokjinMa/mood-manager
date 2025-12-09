/**
 * 무드스트림 관련 타입 정의
 * 
 * Phase 9: 모든 무드스트림 관련 타입을 한 곳에 모음
 */

import type { MoodStreamSegment } from "@/hooks/useMoodStream/types";
import type { Mood } from "@/types/mood";
import type { BackgroundParams } from "@/hooks/useBackgroundParams";

/**
 * 무드스트림 데이터 상태 (home/page.tsx에서 관리)
 */
export interface MoodStreamData {
  streamId: string;
  segments: MoodStreamSegment[];
  currentIndex: number;
  isLoading: boolean;
  isGeneratingNextStream: boolean;
}

/**
 * 현재 세그먼트 통합 데이터
 */
export interface CurrentSegmentData {
  segment: MoodStreamSegment;
  mood: Mood;
  backgroundParams?: BackgroundParams;
  index: number;
}

