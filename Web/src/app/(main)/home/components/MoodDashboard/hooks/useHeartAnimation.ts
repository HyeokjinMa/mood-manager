// src/app/(main)/home/components/MoodDashboard/hooks/useHeartAnimation.ts
/**
 * 하트 애니메이션 훅
 * 
 * 대시보드 더블클릭 시 하트 애니메이션 표시 및 가중치 업데이트
 */

import { useState, useCallback } from "react";
import type { MoodStreamSegment } from "@/hooks/useMoodStream/types";

interface HeartAnimationState {
  x: number;
  y: number;
}

interface UseHeartAnimationReturn {
  heartAnimation: HeartAnimationState | null;
  handleDashboardDoubleClick: (e: React.MouseEvent<HTMLDivElement>, currentSegment?: MoodStreamSegment | null) => void;
  clearHeartAnimation: () => void;
}

/**
 * 하트 애니메이션 상태 및 핸들러 관리 훅
 */
export function useHeartAnimation(): UseHeartAnimationReturn {
  const [heartAnimation, setHeartAnimation] = useState<HeartAnimationState | null>(null);
  const [lastClickTime, setLastClickTime] = useState(0);

  const handleDashboardDoubleClick = useCallback(
    async (e: React.MouseEvent<HTMLDivElement>, currentSegment?: MoodStreamSegment | null) => {
      const now = Date.now();
      const timeSinceLastClick = now - lastClickTime;

      if (timeSinceLastClick < 300) {
        // 더블클릭 감지
        const x = e.clientX;
        const y = e.clientY;
        setHeartAnimation({ x, y });
        setLastClickTime(0);

        // 현재 세그먼트에서 향과 장르 정보 추출하여 API 호출
        if (currentSegment) {
          const fragranceName = currentSegment.mood.scent.type;
          const genreName = currentSegment.mood.music.genre;

          try {
            const response = await fetch("/api/preferences/heart", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              credentials: "include",
              body: JSON.stringify({
                fragranceName,
                genreName,
              }),
            });

            if (response.ok) {
              console.log("[useHeartAnimation] 가중치 업데이트 성공");
            } else {
              console.error("[useHeartAnimation] 가중치 업데이트 실패:", await response.text());
            }
          } catch (error) {
            console.error("[useHeartAnimation] 가중치 업데이트 API 호출 실패:", error);
          }
        }
      } else {
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
    handleDashboardDoubleClick,
    clearHeartAnimation,
  };
}

