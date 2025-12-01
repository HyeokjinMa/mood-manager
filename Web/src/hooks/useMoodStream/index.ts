/**
 * 무드스트림 관리 훅
 * 
 * 30분 무드스트림을 관리하고, 새로고침 버튼 클릭 시에만 재생성
 */

import { useState, useEffect, useRef } from "react";
import { useColdStart } from "./hooks/useColdStart";
import { useAutoGeneration } from "./hooks/useAutoGeneration";
import { useStreamTransition } from "./hooks/useStreamTransition";
import { useRefresh } from "./hooks/useRefresh";
import type { MoodStream, MoodStreamSegment } from "./types";

/**
 * 무드스트림 관리 훅
 */
export function useMoodStream() {
  const [moodStream, setMoodStream] = useState<MoodStream | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);
  const [nextColdStartSegment, setNextColdStartSegment] = useState<MoodStreamSegment | null>(null);
  const isGeneratingRef = useRef(false); // 백그라운드 생성 중복 방지

  // 콜드스타트 및 백그라운드 생성
  const { fetchMoodStream, generateBackgroundSegments } = useColdStart({
    setMoodStream,
    setCurrentSegmentIndex,
    setIsLoading,
    setNextColdStartSegment,
    nextColdStartSegment,
    isGeneratingRef,
  });

  // 자동 스트림 생성
  const { generateNextStream } = useAutoGeneration({
    moodStream,
    currentSegmentIndex,
    setMoodStream,
    setNextColdStartSegment,
    isGeneratingRef,
  });

  // 스트림 전환
  const { switchToNextStream } = useStreamTransition({
    nextColdStartSegment,
    moodStream,
    setMoodStream,
    setCurrentSegmentIndex,
    setNextColdStartSegment,
    generateBackgroundSegments,
  });

  // 새로고침
  const { refreshMoodStream } = useRefresh({
    setIsLoading,
    setMoodStream,
    setCurrentSegmentIndex,
  });

  // 초기 로드
  // V1: 마운트 시 딱 한 번만 콜드스타트 호출
  // fetchMoodStream은 useCallback으로 감싸져 있어서
  // 의존성에 넣으면 상태 변경 때마다 재호출되는 문제가 있으므로,
  // 의도적으로 빈 배열 의존성을 사용한다.
  useEffect(() => {
    fetchMoodStream();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 1세그 남았을 때 자동 스트림 생성
  useEffect(() => {
    if (!moodStream) return;
    
    const remaining = moodStream.segments.length - currentSegmentIndex - 1;
    if (remaining === 1) {
      generateNextStream();
    }
  }, [currentSegmentIndex, moodStream, generateNextStream]);

  // 다음 스트림 사용 가능 여부 계산
  const nextStreamAvailable = nextColdStartSegment !== null;

  // 현재 세그먼트 가져오기
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
  };
}

// 타입 재내보내기
export type { MoodStream, MoodStreamSegment, MusicTrack } from "./types";

