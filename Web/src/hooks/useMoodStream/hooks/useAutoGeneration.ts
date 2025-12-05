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
    
    // 첫 번째 스트림만 생성 (캐롤 3개 + 새로 생성된 7개 = 총 10개)
    // 이미 10개 이상이면 생성하지 않음 (이후 스트림 생성 보류)
    if (moodStream.segments.length >= 10) {
      console.log("[useAutoGeneration] 이미 첫 번째 스트림이 생성됨. 이후 스트림 생성은 보류.");
      return;
    }
    
    // 10개 세그먼트 기준으로 8, 9, 10번째 세그먼트일 때 자동 생성
    // currentSegmentIndex가 7, 8, 9일 때 (remaining이 3, 2, 1일 때)
    const remaining = moodStream.segments.length - currentSegmentIndex - 1;
    const clampedTotal = 10; // 항상 10개 세그먼트로 표시
    const clampedIndex = currentSegmentIndex >= clampedTotal ? clampedTotal - 1 : currentSegmentIndex;
    const remainingFromClamped = clampedTotal - clampedIndex - 1;
    
    // 8, 9, 10번째 세그먼트일 때 (remaining이 3 이하일 때) 자동 생성
    if (remainingFromClamped > 3 || remainingFromClamped <= 0) {
      return;
    }
    
    // 중복 호출 방지: 같은 스트림 ID + 같은 세그먼트 인덱스 조합 체크
    // 하지만 생성이 완료되면 키를 제거하여 다음 세그먼트에서 다시 생성 가능하도록 함
    const generationKey = `${moodStream.streamId}_${clampedIndex}`;
    
    // 현재 생성 중이면 스킵
    if (generatedKeysRef.current.has(generationKey) && isGeneratingRef.current) {
      console.log(`[useAutoGeneration] ⏭️ 이미 생성 중: streamId=${moodStream.streamId}, segmentIndex=${clampedIndex}`);
      return;
    }
    
    // 이전에 생성 완료된 경우 키 제거 (다음 세그먼트에서 다시 생성 가능)
    if (generatedKeysRef.current.has(generationKey) && !isGeneratingRef.current) {
      console.log(`[useAutoGeneration] 이전 생성 완료, 키 제거하여 재생성 가능: ${generationKey}`);
      generatedKeysRef.current.delete(generationKey);
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
          segmentCount: 7, // 첫 번째 스트림만 7개 세그먼트 생성 (0~6번)
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
      
      // 첫 번째 스트림 생성: 7개 세그먼트 추가 (0~6번, 총 10개가 됨)
      // 현재 세그먼트가 3개(캐롤)이므로 7개를 추가하면 총 10개
      if (fullStream.segments.length >= 7) {
        const segmentsToUse = fullStream.segments.slice(0, 7); // 7개만 사용
        
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
        console.log("[useAutoGeneration] 첫 번째 스트림 생성 완료: 7개 세그먼트 추가 (총 10개)");
      } else {
        // 세그먼트가 7개 미만이면 모두 사용
        setMoodStream((prev) => {
          if (!prev) return null;
          
          const lastSegmentEndTime = getLastSegmentEndTime(prev.segments);
          const adjustedSegments = chainSegments(lastSegmentEndTime, fullStream.segments);
          
          return {
            ...prev,
            segments: [...prev.segments, ...adjustedSegments],
          };
        });
        console.log("[useAutoGeneration] 세그먼트 추가 완료 (7개 미만)");
      }
    } catch (error) {
      console.error("[useAutoGeneration] Error generating next stream:", error);
      // 에러 발생 시 생성 키 제거 (재시도 가능하도록)
      generatedKeysRef.current.delete(generationKey);
    } finally {
      isGeneratingRef.current = false;
      setIsGeneratingNextStream(false);
      // 생성 완료 후 키 제거 (다음 세그먼트에서 다시 생성 가능하도록)
      // 단, 성공적으로 완료된 경우에만 제거 (에러 시에는 위에서 이미 제거됨)
      if (generatedKeysRef.current.has(generationKey)) {
        console.log(`[useAutoGeneration] 생성 완료, 키 제거: ${generationKey}`);
        generatedKeysRef.current.delete(generationKey);
      }
    }
  }, [moodStream, currentSegmentIndex, setMoodStream, setNextColdStartSegment, isGeneratingRef, setIsGeneratingNextStream]);

  return {
    generateNextStream,
  };
}

