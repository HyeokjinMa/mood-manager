/**
 * 콜드스타트 및 백그라운드 세그먼트 생성 로직
 */

import { useCallback } from "react";
import { getMockMoodStream, getInitialColdStartSegment } from "@/lib/mock/mockData";
import { chainSegments, getLastSegmentEndTime } from "@/lib/utils/segmentUtils";
import type { MoodStream, MoodStreamSegment } from "../types";

interface UseColdStartParams {
  setMoodStream: React.Dispatch<React.SetStateAction<MoodStream | null>>;
  setCurrentSegmentIndex: React.Dispatch<React.SetStateAction<number>>;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setNextColdStartSegment: React.Dispatch<React.SetStateAction<MoodStreamSegment | null>>;
  nextColdStartSegment: MoodStreamSegment | null;
  isGeneratingRef: React.MutableRefObject<boolean>;
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
        
        if (response.ok) {
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
      
      // 3개 세그먼트 중 2개만 사용, 마지막 1개는 보관
      if (fullStream.segments.length >= 3) {
        const segmentsToUse = fullStream.segments.slice(0, 2);
        const lastSegment = fullStream.segments[2];
        
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
   * 무드스트림 가져오기 (초기 콜드스타트 개선)
   * 
   * 1. 초기: 1개 세그먼트(3곡) 즉시 표시
   * 2. 백그라운드: 3개 세그먼트 생성 시작
   * 3. 생성 완료 시 2개만 사용, 마지막 1개는 보관
   */
  const fetchMoodStream = useCallback(async () => {
    setIsLoading(true);
    
    // 보관된 세그먼트가 있으면 먼저 사용
    if (nextColdStartSegment) {
      console.log("[useColdStart] Using stored cold start segment");
      const initialSegment = nextColdStartSegment;
      setNextColdStartSegment(null);
      
      setMoodStream({
        streamId: `stream-${Date.now()}`,
        currentMood: initialSegment.mood,
        segments: [initialSegment],
        createdAt: Date.now(),
        userDataCount: 0,
      });
      setCurrentSegmentIndex(0);
      setIsLoading(false);
      
      // 백그라운드에서 나머지 세그먼트 생성
      generateBackgroundSegments();
      return;
    }
    
    try {
      // API 호출 시도
      const response = await fetch("/api/moods/current", {
        credentials: "include",
      });
      
      // 401 에러 시 로그인 페이지로 리다이렉트
      if (response.status === 401) {
        window.location.href = "/login";
        return;
      }
      
      let initialSegment: MoodStreamSegment;

      if (response.ok) {
        const data = await response.json();
        
        // API 응답이 유효하면 첫 번째 세그먼트 사용
        if (data.currentMood && data.moodStream && Array.isArray(data.moodStream) && data.moodStream.length > 0) {
          initialSegment = data.moodStream[0];
        } else {
          // API 응답이 유효하지 않으면 목업 초기 세그먼트 사용
          initialSegment = getInitialColdStartSegment();
        }
      } else {
        // API 호출 실패 시 목업 초기 세그먼트 사용
        initialSegment = getInitialColdStartSegment();
      }
      
      // 1개 세그먼트 즉시 표시
      setMoodStream({
        streamId: `stream-${Date.now()}`,
        currentMood: initialSegment.mood,
        segments: [initialSegment],
        createdAt: Date.now(),
        userDataCount: 0,
      });
      setCurrentSegmentIndex(0);
      
      console.log("[useColdStart] Initial cold start segment displayed. Starting background generation...");
      
    } catch (error) {
      console.error("[useColdStart] Error in initial fetch, using cold start segment:", error);
      // 에러 발생 시 목업 초기 세그먼트 사용
      const initialSegment = getInitialColdStartSegment();
      setMoodStream({
        streamId: `stream-${Date.now()}`,
        currentMood: initialSegment.mood,
        segments: [initialSegment],
        createdAt: Date.now(),
        userDataCount: 0,
      });
      setCurrentSegmentIndex(0);
    } finally {
      setIsLoading(false);
      
      // 백그라운드에서 나머지 세그먼트 생성 시작
      generateBackgroundSegments();
    }
  }, [
    nextColdStartSegment,
    generateBackgroundSegments,
    setMoodStream,
    setCurrentSegmentIndex,
    setIsLoading,
    setNextColdStartSegment,
  ]);

  return {
    fetchMoodStream,
    generateBackgroundSegments,
  };
}

