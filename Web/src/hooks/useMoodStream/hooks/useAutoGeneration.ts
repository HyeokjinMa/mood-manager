/**
 * 자동 스트림 생성 로직
 * 1세그 남았을 때 자동으로 다음 스트림 생성
 */

import { useCallback } from "react";
import { getMockMoodStream } from "@/lib/mock/mockData";
import { chainSegments, getLastSegmentEndTime } from "@/lib/utils/segmentUtils";
import type { MoodStream, MoodStreamSegment } from "../types";

interface UseAutoGenerationParams {
  moodStream: MoodStream | null;
  currentSegmentIndex: number;
  setMoodStream: React.Dispatch<React.SetStateAction<MoodStream | null>>;
  setNextColdStartSegment: React.Dispatch<React.SetStateAction<MoodStreamSegment | null>>;
  isGeneratingRef: React.MutableRefObject<boolean>;
}

/**
 * 다음 스트림 생성 (1세그 남았을 때 자동 호출)
 */
export function useAutoGeneration({
  moodStream,
  currentSegmentIndex,
  setMoodStream,
  setNextColdStartSegment,
  isGeneratingRef,
}: UseAutoGenerationParams) {
  const generateNextStream = useCallback(async () => {
    if (!moodStream || isGeneratingRef.current) {
      return;
    }
    
    const remaining = moodStream.segments.length - currentSegmentIndex - 1;
    if (remaining !== 1) {
      return; // 1세그 남았을 때만 실행
    }
    
    console.log("[useAutoGeneration] 1 segment remaining. Generating next stream...");
    isGeneratingRef.current = true;
    
    try {
      // 현재 스트림의 마지막 세그먼트의 종료 시점 계산
      const lastSegment = moodStream.segments[moodStream.segments.length - 1];
      const nextStartTime = lastSegment.timestamp + lastSegment.duration;
      
      // API 호출 시도 (실패 시 목업 데이터 사용)
      let fullStream: MoodStream;
      
      try {
        const response = await fetch("/api/moods/current/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            nextStartTime,
            segmentCount: 3,
          }),
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.currentMood && data.moodStream && Array.isArray(data.moodStream)) {
            fullStream = {
              streamId: moodStream.streamId, // 같은 스트림 ID 유지
              currentMood: data.currentMood,
              segments: data.moodStream,
              createdAt: moodStream.createdAt,
              userDataCount: data.userDataCount || moodStream.userDataCount,
            };
          } else {
            throw new Error("Invalid API response");
          }
        } else {
          throw new Error("API request failed");
        }
      } catch (apiError) {
        console.warn("[useAutoGeneration] API call failed, using mock data:", apiError);
        fullStream = getMockMoodStream();
        // 스트림 ID는 기존 것 유지
        fullStream.streamId = moodStream.streamId;
      }
      
      // 3개 세그먼트 중 2개만 사용, 마지막 1개는 보관
      if (fullStream.segments.length >= 3) {
        const segmentsToUse = fullStream.segments.slice(0, 2);
        const lastSegment = fullStream.segments[2];
        
        setNextColdStartSegment(lastSegment);
        console.log("[useAutoGeneration] Next stream generated. Stored 1 segment for next cold start.");
        
        // 기존 스트림에 2개 세그먼트 추가
        setMoodStream((prev) => {
          if (!prev) return null;
          
          // 마지막 세그먼트의 종료 시점 계산
          const lastSegmentEndTime = getLastSegmentEndTime(prev.segments);
          
          // 새 세그먼트들을 연속된 timestamp로 연결
          const adjustedSegments = chainSegments(lastSegmentEndTime, segmentsToUse);
          
          return {
            ...prev,
            segments: [...prev.segments, ...adjustedSegments],
          };
        });
      } else {
        // 세그먼트가 3개 미만이면 모두 사용
        setMoodStream((prev) => {
          if (!prev) return null;
          
          const lastSegmentEndTime = getLastSegmentEndTime(prev.segments);
          const adjustedSegments = chainSegments(lastSegmentEndTime, fullStream.segments);
          
          return {
            ...prev,
            segments: [...prev.segments, ...adjustedSegments],
          };
        });
      }
    } catch (error) {
      console.error("[useAutoGeneration] Error generating next stream:", error);
    } finally {
      isGeneratingRef.current = false;
    }
  }, [moodStream, currentSegmentIndex, setMoodStream, setNextColdStartSegment, isGeneratingRef]);

  return {
    generateNextStream,
  };
}

