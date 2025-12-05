/**
 * 콜드스타트 및 백그라운드 세그먼트 생성 로직
 */

import { useCallback } from "react";
import { getMockMoodStream } from "@/lib/mock/mockData";
import { chainSegments, getLastSegmentEndTime } from "@/lib/utils/segmentUtils";
import type { MoodStream, MoodStreamSegment } from "../types";

interface UseColdStartParams {
  setMoodStream: React.Dispatch<React.SetStateAction<MoodStream | null>>;
  setCurrentSegmentIndex: React.Dispatch<React.SetStateAction<number>>;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setNextColdStartSegment: React.Dispatch<React.SetStateAction<MoodStreamSegment | null>>;
  nextColdStartSegment: MoodStreamSegment | null;
  isGeneratingRef: React.MutableRefObject<boolean>;
  sessionStatus: "authenticated" | "unauthenticated" | "loading"; // 세션 상태를 파라미터로 받음
}

/**
 * 백그라운드에서 3개 세그먼트 생성
 * 생성 완료 시 2개만 사용, 마지막 1개는 보관
 */
export function useColdStart({
  setMoodStream,
  setCurrentSegmentIndex,
  setIsLoading,
  setNextColdStartSegment,
  nextColdStartSegment,
  isGeneratingRef,
  sessionStatus,
}: UseColdStartParams) {
  /**
   * 백그라운드에서 3개 세그먼트 생성
   * 생성 완료 시 2개만 사용, 마지막 1개는 보관
   */
  const generateBackgroundSegments = useCallback(async () => {
    if (isGeneratingRef.current) {
      console.log("[useColdStart] Background generation already in progress");
      return;
    }
    
    isGeneratingRef.current = true;
    console.log("[useColdStart] Starting background segment generation...");
    
    try {
      // API 호출 시도 (실패 시 목업 데이터 사용)
      let fullStream: MoodStream;
      
      try {
        const response = await fetch("/api/moods/current", {
          credentials: "include",
        });
        
        // 401 에러 시 목업 데이터 사용 (리다이렉트하지 않음)
        if (response.status === 401) {
          console.warn("[useColdStart] 401 Unauthorized in background generation - using mock data");
          fullStream = getMockMoodStream();
        } else if (response.ok) {
          const data = await response.json();
          if (data.currentMood && data.moodStream && Array.isArray(data.moodStream)) {
            fullStream = {
              streamId: data.streamId || `stream-${Date.now()}`,
              currentMood: data.currentMood,
              segments: data.moodStream,
              createdAt: Date.now(),
              userDataCount: data.userDataCount || 0,
            };
          } else {
            throw new Error("Invalid API response");
          }
        } else {
          throw new Error("API request failed");
        }
      } catch (apiError) {
        console.warn("[useColdStart] API call failed, using mock data:", apiError);
        fullStream = getMockMoodStream();
      }
      
      // 10개 세그먼트 중 9개만 사용, 마지막 1개는 보관 (최소 10개 필요)
      if (fullStream.segments.length >= 10) {
        const segmentsToUse = fullStream.segments.slice(0, 9);
        const lastSegment = fullStream.segments[9];
        
        setNextColdStartSegment(lastSegment);
        console.log("[useColdStart] Background generation complete. Stored 1 segment for next cold start.");
        
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
      console.error("[useColdStart] Error generating background segments:", error);
    } finally {
      isGeneratingRef.current = false;
    }
  }, [setMoodStream, setNextColdStartSegment, isGeneratingRef]);

  /**
   * 무드스트림 가져오기 (초기 콜드스타트 - 단순화)
   * 
   * 항상 초기 3개 캐롤 세그먼트만 사용
   * API를 통해 서버 사이드에서 Prisma 호출
   */
  const fetchMoodStream = useCallback(async () => {
    if (sessionStatus === "unauthenticated") {
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    
    try {
      // API를 통해 서버 사이드에서 캐롤 세그먼트 3개 가져오기
      const response = await fetch("/api/moods/carol-segments", {
        credentials: "include",
      });
      
      if (response.ok) {
        const data = await response.json();
        const carolSegments: MoodStreamSegment[] = data.segments || [];
        
        if (carolSegments.length > 0) {
          setMoodStream({
            streamId: `stream-${Date.now()}`,
            currentMood: carolSegments[0].mood,
            segments: carolSegments, // 3개 캐롤 세그먼트
            createdAt: Date.now(),
            userDataCount: 0,
          });
          setCurrentSegmentIndex(0);
        } else {
          console.error("[useColdStart] 캐롤 세그먼트를 가져올 수 없습니다");
        }
      } else {
        console.error("[useColdStart] API 호출 실패:", response.status);
      }
    } catch (error) {
      console.error("[useColdStart] 캐롤 세그먼트 로드 실패:", error);
    } finally {
      setIsLoading(false);
    }
  }, [
    setMoodStream,
    setCurrentSegmentIndex,
    setIsLoading,
    sessionStatus,
  ]);

  return {
    fetchMoodStream,
    generateBackgroundSegments,
  };
}

