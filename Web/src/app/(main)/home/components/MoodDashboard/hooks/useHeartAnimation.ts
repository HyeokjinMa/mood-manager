// src/app/(main)/home/components/MoodDashboard/hooks/useHeartAnimation.ts
/**
 * 하트 애니메이션 훅
 * 
 * 대시보드 더블클릭 시 하트 애니메이션 표시 및 가중치 업데이트
 */

import { useState, useCallback } from "react";
import type React from "react";
import type { MoodStreamSegment } from "@/hooks/useMoodStream/types";

interface HeartAnimationState {
  x: number;
  y: number;
}

interface UseHeartAnimationReturn {
  heartAnimation: HeartAnimationState | null;
  handleDashboardClick: (e: React.MouseEvent<HTMLDivElement>, currentSegment?: MoodStreamSegment | null) => void;
  clearHeartAnimation: () => void;
}

/**
 * 하트 애니메이션 상태 및 핸들러 관리 훅
 */
export function useHeartAnimation(): UseHeartAnimationReturn {
  const [heartAnimation, setHeartAnimation] = useState<HeartAnimationState | null>(null);
  const [lastClickTime, setLastClickTime] = useState(0);

  const handleDashboardClick = useCallback(
    async (e: React.MouseEvent<HTMLDivElement>, currentSegment?: MoodStreamSegment | null) => {
      const now = Date.now();
      const timeSinceLastClick = now - lastClickTime;

      if (timeSinceLastClick < 300) {
        // 300ms 이내 더블클릭 감지
        console.log("[useHeartAnimation] detected double-click via onClick handler");
        const x = e.clientX;
        const y = e.clientY;
        setHeartAnimation({ x, y });
        setLastClickTime(0);

        // 현재 세그먼트 기반으로 선호도(하트) 가중치 반영
        if (currentSegment && currentSegment.mood) {
          const moodId = currentSegment.mood.id;
          const moodName = currentSegment.mood.name;
          const musicGenre = currentSegment.mood.music?.genre || "newage";
          const scentType = currentSegment.mood.scent?.type || "Musk";
          const moodColor =
            typeof currentSegment.mood.lighting?.color === "string"
              ? currentSegment.mood.lighting.color
              : "#E6F3FF";

          try {
            const response = await fetch("/api/moods/preference", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              credentials: "include",
              body: JSON.stringify({
                moodId,
                moodName,
                musicGenre,
                scentType,
                moodColor,
              }),
            });

            if (response.ok) {
              const data = await response.json();
              console.log(
                "[useHeartAnimation] ❤️ 대시보드 더블클릭 선호도 업데이트 성공:",
                {
                  currentCount: data.currentCount,
                  maxReached: data.maxReached,
                }
              );
            } else {
              console.error(
                "[useHeartAnimation] ❌ 대시보드 더블클릭 선호도 업데이트 실패:",
                await response.text()
              );
            }
          } catch (error) {
            console.error(
              "[useHeartAnimation] ❌ 대시보드 더블클릭 선호도 API 호출 실패:",
              error
            );
          }
        } else {
          console.log(
            "[useHeartAnimation] ℹ️ currentSegment 정보가 없어 하트 애니메이션만 표시하고 선호도는 업데이트하지 않습니다."
          );
        }
      } else {
        console.log("[useHeartAnimation] first click, waiting for second click within 300ms");
        setLastClickTime(now);
      }
    },
    [lastClickTime]
  );

  const clearHeartAnimation = useCallback(() => {
    setHeartAnimation(null);
  }, []);

  return {
    heartAnimation,
    handleDashboardClick,
    clearHeartAnimation,
  };
}

