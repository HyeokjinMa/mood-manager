// src/hooks/useBackgroundParams.ts
/**
 * LLM 배경 파라미터 훅
 * 
 * 무드스트림이 재생성될 때만 LLM으로 배경 파라미터 생성
 * (새로고침 버튼 클릭 시에만 호출)
 */

import { useState, useEffect } from "react";
import type { MoodStream } from "./useMoodStream";

export interface BackgroundParams {
  moodAlias: string;
  musicSelection: string;
  moodColor: string;
  lighting: {
    brightness: number;
    temperature?: number;
  };
  backgroundIcon: {
    name: string;
    category: string;
  };
  backgroundWind: {
    direction: number;
    speed: number;
  };
  animationSpeed: number;
  iconOpacity: number;
  iconCount?: number;
  iconSize?: number;
  particleEffect?: boolean;
  gradientColors?: string[];
  transitionDuration?: number;
  source?: string; // "openai" | "mock-no-key" | "cache" 등
}

export interface BackgroundParamsResponse {
  segments?: BackgroundParams[]; // 10개 세그먼트 배열
  // 단일 세그먼트 (하위 호환성)
  moodAlias?: string;
  musicSelection?: string;
  moodColor?: string;
  lighting?: {
    brightness: number;
    temperature?: number;
  };
  backgroundIcon?: {
    name: string;
    category: string;
  };
  backgroundWind?: {
    direction: number;
    speed: number;
  };
  animationSpeed?: number;
  iconOpacity?: number;
  iconCount?: number;
  iconSize?: number;
  particleEffect?: boolean;
  gradientColors?: string[];
  transitionDuration?: number;
  source?: string;
}

/**
 * 무드스트림 기반 배경 파라미터 훅
 * 
 * @param moodStream - 무드스트림 (null이면 호출 안 함)
 * @param shouldFetch - OpenAI 호출 여부 (새로고침 버튼 클릭 시에만 true)
 * @param currentSegmentIndex - 현재 세그먼트 인덱스 (0-9)
 */
export function useBackgroundParams(
  moodStream: MoodStream | null,
  shouldFetch: boolean = false,
  currentSegmentIndex: number = 0
) {
  const [backgroundParams, setBackgroundParams] = useState<BackgroundParams | null>(null);
  const [allSegmentsParams, setAllSegmentsParams] = useState<BackgroundParams[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function fetchBackgroundParams() {
      // 무드스트림이 없거나 호출하지 않으면 스킵
      if (!moodStream || !shouldFetch) {
        return;
      }

      // segments가 없거나 비어있으면 스킵
      if (!moodStream.segments || !Array.isArray(moodStream.segments) || moodStream.segments.length === 0) {
        console.warn("[useBackgroundParams] No segments available in mood stream");
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch("/api/ai/background-params", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            mode: "stream",
            segments: moodStream.segments, // 10개 세그먼트 전체 전달
            // 대시보드 새로고침 시에는 항상 새로운 LLM 응답을 받기 위해
            // 캐시를 강제로 우회한다.
            forceFresh: true,
          }),
        });

        // 401 에러 시 로그인 페이지로 리다이렉트
        if (response.status === 401) {
          window.location.href = "/login";
          return;
        }

        if (!response.ok) {
          throw new Error("Failed to fetch background params");
        }

        const data: any = await response.json();
        console.log("\n" + "=".repeat(80));
        console.log("📥 [useBackgroundParams] Received response from API:");
        console.log("=".repeat(80));
        console.log(`Source: ${data.source || 'unknown'}`);
        console.log(`Has segments: ${data.segments ? 'yes' : 'no'}`);
        if (data.segments && Array.isArray(data.segments)) {
          console.log(`Segment count: ${data.segments.length}`);
          console.log("\nFull response:");
          console.log(JSON.stringify(data, null, 2));
        } else {
          console.log("\nSingle segment response:");
          console.log(JSON.stringify(data, null, 2));
        }
        console.log("=".repeat(80) + "\n");
        
        // 10개 세그먼트 배열 응답 처리
        if (data.segments && Array.isArray(data.segments) && data.segments.length > 0) {
          setAllSegmentsParams(data.segments);
          // 현재 세그먼트 인덱스에 맞는 값 사용
          const segmentIndex = Math.max(0, Math.min(currentSegmentIndex, data.segments.length - 1));
          const currentSegmentParam = data.segments[segmentIndex] || data.segments[0];
          setBackgroundParams(currentSegmentParam);
        } else if (data.moodAlias || data.moodColor) {
          // 단일 세그먼트 응답 (하위 호환성)
          setBackgroundParams(data as BackgroundParams);
        } else {
          // 응답 형식이 예상과 다를 경우 기본값 사용
          console.warn("[BackgroundParams] Unexpected response format:", data);
          throw new Error("Invalid response format");
        }
      } catch (error) {
        console.error("Error fetching background params:", error);
        // 에러 발생 시 기본값 사용
        if (moodStream.currentMood) {
          setBackgroundParams({
            moodAlias: moodStream.currentMood.name || "Calm Breeze",
            musicSelection: moodStream.currentMood.music?.title || "Unknown",
            moodColor: moodStream.currentMood.lighting?.color || "#E6F3FF",
            lighting: {
              brightness: 50,
              temperature: 4000,
            },
            backgroundIcon: {
              name: "FaLeaf",
              category: "nature",
            },
            backgroundWind: {
              direction: 180,
              speed: 3,
            },
            animationSpeed: 4,
            iconOpacity: 0.7,
            source: "fallback",
          });
        }
      } finally {
        setIsLoading(false);
      }
    }

    fetchBackgroundParams();
  }, [moodStream?.streamId, shouldFetch, moodStream, currentSegmentIndex]); // streamId가 변경될 때만 재요청

  // 세그먼트 인덱스가 변경될 때 올바른 세그먼트 파라미터 사용
  useEffect(() => {
    if (allSegmentsParams && allSegmentsParams.length > 0) {
      const currentSegmentParam = allSegmentsParams[currentSegmentIndex] || allSegmentsParams[0];
      setBackgroundParams(currentSegmentParam);
    }
  }, [currentSegmentIndex, allSegmentsParams]);

  return { 
    backgroundParams, 
    isLoading,
    allSegmentsParams, // 세그먼트별 파라미터 배열 노출
    setBackgroundParams, // 외부에서 직접 설정 가능하도록
  };
}

