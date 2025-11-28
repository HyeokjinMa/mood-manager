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

/**
 * 무드스트림 기반 배경 파라미터 훅
 * 
 * @param moodStream - 무드스트림 (null이면 호출 안 함)
 * @param shouldFetch - OpenAI 호출 여부 (새로고침 버튼 클릭 시에만 true)
 */
export function useBackgroundParams(
  moodStream: MoodStream | null,
  shouldFetch: boolean = false
) {
  const [backgroundParams, setBackgroundParams] = useState<BackgroundParams | null>(null);
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

        const data = await response.json();
        console.log("[BackgroundParams] LLM response source:", data.source);
        setBackgroundParams(data);
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
  }, [moodStream?.streamId, shouldFetch, moodStream]); // streamId가 변경될 때만 재요청

  return { backgroundParams, isLoading };
}

