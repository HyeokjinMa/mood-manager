/**
 * 무드스트림 새로고침 로직
 * 새로고침 버튼 클릭 시 무드스트림 재생성
 */

import { useCallback } from "react";
import { getMockMoodStream } from "@/lib/mock/mockData";
import { handleAuthError } from "@/lib/utils/errorHandler";
import type { MoodStream } from "../types";

interface UseRefreshParams {
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setMoodStream: React.Dispatch<React.SetStateAction<MoodStream | null>>;
  setCurrentSegmentIndex: React.Dispatch<React.SetStateAction<number>>;
}

/**
 * 무드스트림 재생성 (새로고침 버튼 클릭 시)
 * 
 * PUT /api/moods/current/refresh 호출
 */
export function useRefresh({
  setIsLoading,
  setMoodStream,
  setCurrentSegmentIndex,
}: UseRefreshParams) {
  const refreshMoodStream = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/moods/current/refresh", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      
      // 401 에러 처리
      if (handleAuthError(response)) {
        return;
      }
      
      if (!response.ok) {
        throw new Error("Failed to refresh mood stream");
      }

      const data = await response.json();
      
      // API 응답 검증
      if (!data.currentMood || !data.moodStream || !Array.isArray(data.moodStream)) {
        console.warn("[useRefresh] Invalid refresh response, using mock data");
        const mockData = getMockMoodStream();
        setMoodStream(mockData);
        setCurrentSegmentIndex(0);
        return;
      }
      
      // 새로운 스트림 ID로 업데이트
      setMoodStream({
        streamId: data.streamId || `stream-${Date.now()}`,
        currentMood: data.currentMood,
        segments: data.moodStream,
        createdAt: Date.now(),
        userDataCount: data.userDataCount || 0,
      });
      
      // 현재 세그먼트 인덱스 리셋
      setCurrentSegmentIndex(0);
    } catch (error) {
      console.error("Error refreshing mood stream:", error);
      // 에러 발생 시 목업 데이터로 대체
      try {
        const mockData = getMockMoodStream();
        setMoodStream(mockData);
        setCurrentSegmentIndex(0);
      } catch (mockError) {
        console.error("Error loading mock data:", mockError);
      }
    } finally {
      setIsLoading(false);
    }
  }, [setIsLoading, setMoodStream, setCurrentSegmentIndex]);

  return {
    refreshMoodStream,
  };
}

