// src/hooks/useMoodStream.ts
/**
 * 무드스트림 관리 훅
 * 
 * 30분 무드스트림을 관리하고, 새로고침 버튼 클릭 시에만 재생성
 */

import { useState, useEffect, useCallback } from "react";
import { getMockMoodStream } from "@/lib/mock/mockData";

export interface MoodStreamSegment {
  timestamp: number;
  mood: {
    id: string;
    name: string;
    color: string;
    music: {
      genre: string;
      title: string;
    };
    scent: {
      type: string;
      name: string;
    };
    lighting: {
      color: string;
      rgb: [number, number, number];
    };
  };
  duration: number;
}

export interface MoodStream {
  streamId: string; // 스트림 고유 ID (재생성 시 변경)
  currentMood: MoodStreamSegment["mood"];
  segments: MoodStreamSegment[];
  createdAt: number;
  userDataCount: number;
}

/**
 * 무드스트림 관리 훅
 */
export function useMoodStream() {
  const [moodStream, setMoodStream] = useState<MoodStream | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);

  /**
   * 무드스트림 가져오기
   */
  const fetchMoodStream = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/moods/current", {
        credentials: "include",
      });
      
      // 401 에러 시 로그인 페이지로 리다이렉트
      if (response.status === 401) {
        window.location.href = "/login";
        return;
      }
      
      if (!response.ok) {
        throw new Error("Failed to fetch mood stream");
      }

      const data = await response.json();
      
      // API 응답에 moodStream이 없거나 currentMood가 null인 경우 처리
      if (!data.currentMood || !data.moodStream || !Array.isArray(data.moodStream)) {
        console.warn("[useMoodStream] Invalid response format or no mood stream available");
        // 목업 데이터로 대체
        try {
          const mockData = getMockMoodStream();
          setMoodStream(mockData);
          setCurrentSegmentIndex(0);
        } catch (mockError) {
          console.error("[useMoodStream] Error loading mock data:", mockError);
          setMoodStream(null);
          setCurrentSegmentIndex(0);
        }
        return;
      }
      
      // 스트림 ID 생성 (재생성 시 변경됨)
      const streamId = `stream-${Date.now()}`;
      
      setMoodStream({
        streamId,
        currentMood: data.currentMood,
        segments: data.moodStream,
        createdAt: Date.now(),
        userDataCount: data.userDataCount || 0,
      });
      
      // 현재 세그먼트 인덱스 계산 (현재 시간 기준)
      const now = Date.now();
      const segmentIndex = data.moodStream.findIndex(
        (seg: MoodStreamSegment) => seg.timestamp <= now && now < seg.timestamp + seg.duration
      );
      setCurrentSegmentIndex(segmentIndex >= 0 ? segmentIndex : 0);
    } catch (error) {
      console.error("Error fetching mood stream:", error);
      // 에러 발생 시 목업 데이터로 대체
      try {
        const mockData = getMockMoodStream();
        setMoodStream(mockData);
        setCurrentSegmentIndex(0);
      } catch (mockError) {
        console.error("Error loading mock data:", mockError);
        setMoodStream(null);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * 무드스트림 재생성 (새로고침 버튼 클릭 시)
   * 
   * PUT /api/moods/current/refresh 호출
   */
  const refreshMoodStream = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/moods/current/refresh", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      
      // 401 에러 시 로그인 페이지로 리다이렉트
      if (response.status === 401) {
        window.location.href = "/login";
        return;
      }
      
      if (!response.ok) {
        throw new Error("Failed to refresh mood stream");
      }

      const data = await response.json();
      
      // API 응답 검증
      if (!data.currentMood || !data.moodStream || !Array.isArray(data.moodStream)) {
        console.warn("[useMoodStream] Invalid refresh response, using mock data");
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
  }, []);

  // 초기 로드
  useEffect(() => {
    fetchMoodStream();
  }, [fetchMoodStream]);

  // 현재 세그먼트 가져오기
  const currentSegment = moodStream?.segments[currentSegmentIndex] || null;

  return {
    moodStream,
    currentSegment,
    currentSegmentIndex,
    isLoading,
    refreshMoodStream,
    setCurrentSegmentIndex,
  };
}

