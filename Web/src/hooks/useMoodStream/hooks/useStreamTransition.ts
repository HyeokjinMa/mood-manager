/**
 * 스트림 전환 로직
 * 다음 스트림으로 전환하는 기능
 */

import { useCallback } from "react";
import type { MoodStream, MoodStreamSegment } from "../types";

interface UseStreamTransitionParams {
  nextColdStartSegment: MoodStreamSegment | null;
  moodStream: MoodStream | null;
  setMoodStream: React.Dispatch<React.SetStateAction<MoodStream | null>>;
  setCurrentSegmentIndex: React.Dispatch<React.SetStateAction<number>>;
  setNextColdStartSegment: React.Dispatch<React.SetStateAction<MoodStreamSegment | null>>;
  generateBackgroundSegments: () => Promise<void>;
}

/**
 * 다음 스트림으로 전환
 * 보관된 nextColdStartSegment를 사용하여 다음 스트림 시작
 */
export function useStreamTransition({
  nextColdStartSegment,
  moodStream,
  setMoodStream,
  setCurrentSegmentIndex,
  setNextColdStartSegment,
  generateBackgroundSegments,
}: UseStreamTransitionParams) {
  const switchToNextStream = useCallback(() => {
    if (!nextColdStartSegment) {
      console.warn("[useStreamTransition] No cold start segment available");
      return;
    }
    
    console.log("[useStreamTransition] Switching to next stream using stored cold start segment");
    
    // 보관된 세그먼트로 새 스트림 시작
    const newStreamId = `stream-${Date.now()}`;
    setMoodStream({
      streamId: newStreamId,
      currentMood: nextColdStartSegment.mood,
      segments: [nextColdStartSegment],
      createdAt: Date.now(),
      userDataCount: moodStream?.userDataCount || 0,
      nextStreamAvailable: false, // 초기화
    });
    setCurrentSegmentIndex(0);
    setNextColdStartSegment(null);
    
    // 백그라운드에서 나머지 세그먼트 생성 시작
    generateBackgroundSegments();
  }, [
    nextColdStartSegment,
    moodStream?.userDataCount,
    generateBackgroundSegments,
    setMoodStream,
    setCurrentSegmentIndex,
    setNextColdStartSegment,
  ]);

  return {
    switchToNextStream,
  };
}

