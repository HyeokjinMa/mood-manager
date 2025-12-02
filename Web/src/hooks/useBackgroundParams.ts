// src/hooks/useBackgroundParams.ts
/**
 * LLM 배경 파라미터 훅
 * 
 * 무드스트림이 재생성될 때만 LLM으로 배경 파라미터 생성
 * (새로고침 버튼 클릭 시에만 호출)
 */

import { useState, useEffect } from "react";
import type { MoodStream } from "./useMoodStream/types";
import { handleAuthError } from "@/lib/utils/errorHandler";

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

      // 이미 로딩 중이면 중복 호출 방지
      if (isLoading) {
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
            // 캐시 강제 우회
            forceFresh: true,
          }),
        });

        // 401 에러 처리
        if (handleAuthError(response)) {
          return;
        }

        if (!response.ok) {
          console.error(
            "[useBackgroundParams] /api/ai/background-params 응답 오류:",
            response.status,
            response.statusText
          );
          throw new Error("Failed to fetch background params");
        }

        const data: BackgroundParamsResponse = await response.json();
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
          // LLM source는 응답 최상위에만 있으므로, 각 세그먼트에 복사하여
          // UI에서 세그먼트 단위로도 LLM 사용 여부 표시 가능하도록
          const segmentsWithSource = data.segments.map((seg) => ({
            ...seg,
            source: data.source,
          }));

          setAllSegmentsParams(segmentsWithSource);
          // 현재 세그먼트 인덱스에 맞는 값 사용
          const segmentIndex = Math.max(0, Math.min(currentSegmentIndex, segmentsWithSource.length - 1));
          const currentSegmentParam = segmentsWithSource[segmentIndex] || segmentsWithSource[0];
          setBackgroundParams(currentSegmentParam);
        } else if (data.moodAlias || data.moodColor) {
          // 단일 세그먼트 응답 (하위 호환성)
          setBackgroundParams({
            ...(data as BackgroundParams),
            source: data.source,
          });
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
  // LLM 호출은 "스트림이 새로 생성되었고(또는 교체되었고), 사용자가 새로고침을 눌렀을 때" 1회만 수행
  // - streamId: 새로운 스트림 기준으로만 다시 호출
  // - shouldFetch: 새로고침 버튼이 눌렸을 때만 true
  // isLoading 변화만으로 재호출되지 않도록 의존성에서 제거
  }, [moodStream?.streamId, shouldFetch]);

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

