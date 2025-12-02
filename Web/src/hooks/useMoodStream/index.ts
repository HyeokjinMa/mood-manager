/**
 * 무드스트림 관리 훅
 * 
 * 30분 무드스트림을 관리하고, 새로고침 버튼 클릭 시에만 재생성한다
 */

import { useState, useEffect, useRef } from "react";
import { useColdStart } from "./hooks/useColdStart";
import { useAutoGeneration } from "./hooks/useAutoGeneration";
import { useStreamTransition } from "./hooks/useStreamTransition";
import { useRefresh } from "./hooks/useRefresh";
import type { MoodStream, MoodStreamSegment } from "./types";

/**
 * 무드스트림을 관리하는 훅이다
 */
export function useMoodStream() {
  const [moodStream, setMoodStream] = useState<MoodStream | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);
  const [nextColdStartSegment, setNextColdStartSegment] = useState<MoodStreamSegment | null>(null);
  const isGeneratingRef = useRef(false); // 백그라운드 생성 중복을 방지한다
  const [isGeneratingNextStream, setIsGeneratingNextStream] = useState(false); // 다음 스트림 생성 중 UI 표시용

  // 콜드스타트 및 백그라운드 생성을 관리한다
  const { fetchMoodStream, generateBackgroundSegments } = useColdStart({
    setMoodStream,
    setCurrentSegmentIndex,
    setIsLoading,
    setNextColdStartSegment,
    nextColdStartSegment,
    isGeneratingRef,
  });

  // 자동 스트림 생성을 관리한다
  const { generateNextStream } = useAutoGeneration({
    moodStream,
    currentSegmentIndex,
    setMoodStream,
    setNextColdStartSegment,
    isGeneratingRef,
    setIsGeneratingNextStream,
  });

  // 스트림 전환을 관리한다
  const { switchToNextStream } = useStreamTransition({
    nextColdStartSegment,
    moodStream,
    setMoodStream,
    setCurrentSegmentIndex,
    setNextColdStartSegment,
    generateBackgroundSegments,
  });

  // 새로고침을 관리한다
  const { refreshMoodStream } = useRefresh({
    setIsLoading,
    setMoodStream,
    setCurrentSegmentIndex,
  });

  // 초기 로드를 수행한다
  // V1: 마운트 시 딱 한 번만 콜드스타트를 호출한다
  // fetchMoodStream은 useCallback으로 감싸져 있어서
  // 의존성에 넣으면 상태 변경 때마다 재호출되는 문제가 있으므로,
  // 의도적으로 빈 배열 의존성을 사용한다
  useEffect(() => {
    fetchMoodStream();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 8, 9, 10번째 세그먼트일 때 자동 스트림 생성을 수행한다
  useEffect(() => {
    if (!moodStream) return;
    
    const clampedTotal = 10; // 항상 10개 세그먼트로 표시한다
    const clampedIndex = currentSegmentIndex >= clampedTotal ? clampedTotal - 1 : currentSegmentIndex;
    const remainingFromClamped = clampedTotal - clampedIndex - 1;
    
    // 8, 9, 10번째 세그먼트일 때 (remaining이 3, 2, 1일 때) 자동 생성한다
    if (remainingFromClamped > 0 && remainingFromClamped <= 3) {
      generateNextStream();
    }
  }, [currentSegmentIndex, moodStream, generateNextStream]);

  // 다음 스트림 사용 가능 여부를 계산한다
  const nextStreamAvailable = nextColdStartSegment !== null;

  // 현재 세그먼트를 가져온다
  const currentSegment = moodStream?.segments[currentSegmentIndex] || null;

  return {
    moodStream,
    currentSegment,
    currentSegmentIndex,
    isLoading,
    refreshMoodStream,
    setCurrentSegmentIndex,
    switchToNextStream,
    nextStreamAvailable,
    isGeneratingNextStream,
  };
}

// 타입 재내보내기
export type { MoodStream, MoodStreamSegment, MusicTrack } from "./types";

