/**
 * 자동 스트림 생성 로직
 * 8, 9, 10번째 세그먼트일 때 자동으로 다음 스트림 생성
 * 
 * 중복 호출 방지: 같은 스트림 ID + 같은 세그먼트 인덱스 조합에서는 재호출하지 않음
 */

import { useCallback, useRef } from "react";
import { getMockMoodStream } from "@/lib/mock/mockData";
import { chainSegments, getLastSegmentEndTime } from "@/lib/utils/segmentUtils";
import type { MoodStream, MoodStreamSegment } from "../types";

interface UseAutoGenerationParams {
  moodStream: MoodStream | null;
  currentSegmentIndex: number;
  setMoodStream: React.Dispatch<React.SetStateAction<MoodStream | null>>;
  setNextColdStartSegment: React.Dispatch<React.SetStateAction<MoodStreamSegment | null>>;
  isGeneratingRef: React.MutableRefObject<boolean>;
  setIsGeneratingNextStream: React.Dispatch<React.SetStateAction<boolean>>;
}

/**
 * 다음 스트림 생성 (8, 9, 10번째 세그먼트일 때 자동 호출)
 */
export function useAutoGeneration({
  moodStream,
  currentSegmentIndex,
  setMoodStream,
  setNextColdStartSegment,
  isGeneratingRef,
  setIsGeneratingNextStream,
}: UseAutoGenerationParams) {
  // 중복 호출 방지: 이미 생성한 (streamId, segmentIndex) 조합 추적
  const generatedKeysRef = useRef<Set<string>>(new Set());

  const generateNextStream = useCallback(async () => {
    if (!moodStream || isGeneratingRef.current) {
      return;
    }
    
    const clampedTotal = 10; // 항상 10개 세그먼트로 표시
    const clampedIndex = currentSegmentIndex >= clampedTotal ? clampedTotal - 1 : currentSegmentIndex;
    const remainingFromClamped = clampedTotal - clampedIndex - 1;
    
    // 첫 번째 스트림 생성: 캐롤 3개 + 새로 생성된 7개 = 총 10개
    // 단, 이미 생성이 완료되었는지 확인 (segments.length가 10개 이상이면 이미 생성됨)
    // 사용자가 1, 2, 3번 세그먼트로 다시 돌아가도 재생성하지 않도록 함
    if (moodStream.segments.length === 3 && clampedIndex === 0) {
      console.log("[useAutoGeneration] 초기 3개 세그먼트 이후 4-10번째 세그먼트 생성 시작");
    } 
    // 8, 9, 10번째 세그먼트일 때 다음 스트림(10개) 생성
    else if (moodStream.segments.length >= 10 && remainingFromClamped > 0 && remainingFromClamped <= 3) {
      console.log(`[useAutoGeneration] 8, 9, 10번째 세그먼트 도달. 다음 스트림(10개) 생성 시작...`);
    } else {
      // 조건에 맞지 않으면 생성하지 않음
      return;
    }
    
    // 중복 호출 방지: 같은 스트림 ID + 같은 세그먼트 인덱스 조합 체크
    // 초기 3개 세그먼트의 경우, 한 번만 생성되도록 streamId와 "initial" 키 사용
    const generationKey = moodStream.segments.length === 3 && clampedIndex === 0
      ? `${moodStream.streamId}_initial`
      : `${moodStream.streamId}_${clampedIndex}`;
    
    // 이미 생성된 경우 스킵 (초기 3개 세그먼트의 경우 한 번만 생성)
    if (generatedKeysRef.current.has(generationKey)) {
      console.log(`[useAutoGeneration] ⏭️ 이미 생성 완료: streamId=${moodStream.streamId}, key=${generationKey}`);
      return;
    }
    
    // 현재 생성 중이면 스킵
    if (isGeneratingRef.current) {
      console.log(`[useAutoGeneration] ⏭️ 이미 생성 중: streamId=${moodStream.streamId}, segmentIndex=${clampedIndex}`);
      return;
    }
    
    console.log(`[useAutoGeneration] Segment ${clampedIndex + 1}/10 (${remainingFromClamped} remaining). Generating next stream...`);
    isGeneratingRef.current = true;
    setIsGeneratingNextStream(true);
    
    // 생성 시작 전에 키 등록 (중복 방지)
    generatedKeysRef.current.add(generationKey);
    
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
            segmentCount: moodStream.segments.length === 3 ? 7 : 10, // 첫 번째 스트림: 7개, 이후: 10개
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
      
      // 첫 번째 스트림 생성: 7개 세그먼트 추가 (3개 캐롤 + 7개 = 10개)
      if (moodStream.segments.length === 3) {
        const segmentsToUse = fullStream.segments.slice(0, 7); // 7개만 사용
        
        setMoodStream((prev) => {
          if (!prev) return null;
          
          const lastSegmentEndTime = getLastSegmentEndTime(prev.segments);
          const adjustedSegments = chainSegments(lastSegmentEndTime, segmentsToUse);
          
          return {
            ...prev,
            segments: [...prev.segments, ...adjustedSegments],
          };
        });
        console.log("[useAutoGeneration] 첫 번째 스트림 생성 완료: 7개 세그먼트 추가 (총 10개)");
      } 
      // 다음 스트림 생성: 10개 세그먼트로 교체
      else if (moodStream.segments.length >= 10) {
        const segmentsToUse = fullStream.segments.slice(0, 10); // 10개 사용
        
        setMoodStream((prev) => {
          if (!prev) return null;
          
          const lastSegmentEndTime = getLastSegmentEndTime(prev.segments);
          const adjustedSegments = chainSegments(lastSegmentEndTime, segmentsToUse);
          
          // 기존 세그먼트를 모두 교체 (새 스트림 시작)
          return {
            ...prev,
            streamId: `stream-${Date.now()}`, // 새 스트림 ID
            segments: adjustedSegments,
          };
        });
        console.log("[useAutoGeneration] 다음 스트림 생성 완료: 10개 세그먼트로 교체");
      }
    } catch (error) {
      console.error("[useAutoGeneration] Error generating next stream:", error);
      // 에러 발생 시 생성 키 제거 (재시도 가능하도록)
      generatedKeysRef.current.delete(generationKey);
    } finally {
      isGeneratingRef.current = false;
      setIsGeneratingNextStream(false);
      // 생성 완료 후 키 관리
      // 초기 3개 세그먼트의 경우 키 유지 (재생성 방지)
      // 다음 스트림(10개) 생성의 경우 키 제거 (재생성 가능)
      if (moodStream.segments.length >= 10 && remainingFromClamped > 0 && remainingFromClamped <= 3) {
        // 다음 스트림 생성의 경우 키 제거 (재생성 가능)
        if (generatedKeysRef.current.has(generationKey)) {
          console.log(`[useAutoGeneration] 생성 완료, 키 제거: ${generationKey}`);
          generatedKeysRef.current.delete(generationKey);
        }
      } else {
        // 초기 3개 세그먼트의 경우 키 유지 (재생성 방지)
        console.log(`[useAutoGeneration] 생성 완료, 키 유지: ${generationKey}`);
      }
    }
  }, [moodStream, currentSegmentIndex, setMoodStream, setNextColdStartSegment, isGeneratingRef, setIsGeneratingNextStream]);

  return {
    generateNextStream,
  };
}

