/**
 * 무드스트림 관리 훅
 * 
 * 30분 무드스트림 관리, 새로고침 버튼 클릭 시에만 재생성
 */

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useColdStart } from "./hooks/useColdStart";
import { useAutoGeneration } from "./hooks/useAutoGeneration";
import { useStreamTransition } from "./hooks/useStreamTransition";
import { useRefresh } from "./hooks/useRefresh";
import type { MoodStream, MoodStreamSegment } from "./types";

/**
 * 무드스트림 관리 훅
 */
export function useMoodStream() {
  const { status } = useSession();
  const pathname = usePathname();
  const [moodStream, setMoodStream] = useState<MoodStream | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);
  const [nextColdStartSegment, setNextColdStartSegment] = useState<MoodStreamSegment | null>(null);
  const isGeneratingRef = useRef(false); // 백그라운드 생성 중복 방지
  const [isGeneratingNextStream, setIsGeneratingNextStream] = useState(false); // 다음 스트림 생성 중 UI 표시용
  
  // 로그인 페이지나 인증되지 않은 경우 API 호출하지 않음
  const isAuthPage = pathname?.startsWith("/login") || 
                     pathname?.startsWith("/register") || 
                     pathname?.startsWith("/forgot-password") ||
                     pathname === "/";
  // authenticated 상태일 때만 API 호출 (loading 상태에서는 대기)
  const shouldFetch = !isAuthPage && status === "authenticated";

  // 콜드스타트 및 백그라운드 생성 관리
  const { fetchMoodStream, generateBackgroundSegments } = useColdStart({
    setMoodStream,
    setCurrentSegmentIndex,
    setIsLoading,
    setNextColdStartSegment,
    nextColdStartSegment,
    isGeneratingRef,
    sessionStatus: status, // 세션 상태 전달
  });

  // 자동 스트림 생성 관리
  const { generateNextStream } = useAutoGeneration({
    moodStream,
    currentSegmentIndex,
    setMoodStream,
    setNextColdStartSegment,
    isGeneratingRef,
    setIsGeneratingNextStream,
  });

  // 스트림 전환 관리
  const { switchToNextStream } = useStreamTransition({
    nextColdStartSegment,
    moodStream,
    setMoodStream,
    setCurrentSegmentIndex,
    setNextColdStartSegment,
    generateBackgroundSegments,
  });

  // 새로고침 관리
  const { refreshMoodStream } = useRefresh({
    setIsLoading,
    setMoodStream,
    setCurrentSegmentIndex,
  });

  // 초기 로드
  // V1: 마운트 시 딱 한 번만 콜드스타트 호출
  // fetchMoodStream은 useCallback으로 감싸져 있어서
  // 의존성에 넣으면 상태 변경 때마다 재호출되는 문제가 있으므로,
  // 의도적으로 빈 배열 의존성 사용
  // 단, 로그인 페이지나 인증되지 않은 경우 호출하지 않음
  useEffect(() => {
    if (shouldFetch) {
      fetchMoodStream();
    } else {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldFetch]);

    // 초기 3개 세그먼트 이후 또는 8, 9, 10번째 세그먼트일 때 자동 스트림 생성
    // 인증 페이지나 인증되지 않은 경우 호출하지 않음
    useEffect(() => {
      if (!moodStream || isAuthPage || status !== "authenticated") return;
      
      const clampedTotal = 10; // 항상 10개 세그먼트로 표시
      const clampedIndex = currentSegmentIndex >= clampedTotal ? clampedTotal - 1 : currentSegmentIndex;
      const remainingFromClamped = clampedTotal - clampedIndex - 1;
      
      // 초기 3개 세그먼트 이후 바로 생성 (segments.length가 3개이고 첫 번째 세그먼트 재생 중)
      // 또는 segments.length가 3개이고 아직 생성되지 않았을 때
      if (moodStream.segments.length === 3 && clampedIndex === 0) {
        console.log("[useMoodStream] 초기 3개 세그먼트 이후 4-10번째 세그먼트 생성 시작");
        generateNextStream();
        return;
      }
      
      // 8, 9, 10번째 세그먼트일 때 (remaining이 3, 2, 1일 때) 자동 생성
      // 10번 세그먼트가 끝나면 자동으로 다음 스트림으로 전환
      if (remainingFromClamped > 0 && remainingFromClamped <= 3 && moodStream.segments.length >= 10) {
        generateNextStream();
      }
      
      // 10번 세그먼트가 끝나면 자동으로 다음 스트림으로 전환 (인덱스 리셋)
      if (clampedIndex === 9 && moodStream.segments.length >= 10) {
        // 다음 세그먼트로 이동 시 인덱스를 0으로 리셋하여 새 스트림 시작
        // generateNextStream이 완료되면 자동으로 새 스트림이 시작됨
      }
    }, [currentSegmentIndex, moodStream, generateNextStream, isAuthPage, status]);

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
    isGeneratingNextStream,
  };
}

// 타입 재내보내기
export type { MoodStream, MoodStreamSegment, MusicTrack } from "./types";

