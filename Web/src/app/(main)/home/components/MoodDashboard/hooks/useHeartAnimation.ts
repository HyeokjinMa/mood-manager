// src/app/(main)/home/components/MoodDashboard/hooks/useHeartAnimation.ts
/**
 * 하트 애니메이션 훅
 * 
 * 대시보드 더블클릭 시 하트 애니메이션 표시
 */

import { useState, useCallback } from "react";

interface HeartAnimationState {
  x: number;
  y: number;
}

interface UseHeartAnimationReturn {
  heartAnimation: HeartAnimationState | null;
  handleDashboardDoubleClick: (e: React.MouseEvent<HTMLDivElement>) => void;
  clearHeartAnimation: () => void;
}

/**
 * 하트 애니메이션 상태 및 핸들러 관리 훅
 */
export function useHeartAnimation(): UseHeartAnimationReturn {
  const [heartAnimation, setHeartAnimation] = useState<HeartAnimationState | null>(null);
  const [lastClickTime, setLastClickTime] = useState(0);

  const handleDashboardDoubleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const now = Date.now();
    const timeSinceLastClick = now - lastClickTime;

    if (timeSinceLastClick < 300) {
      // 더블클릭 감지
      const x = e.clientX;
      const y = e.clientY;
      setHeartAnimation({ x, y });
      setLastClickTime(0);
    } else {
      setLastClickTime(now);
    }
  }, [lastClickTime]);

  const clearHeartAnimation = useCallback(() => {
    setHeartAnimation(null);
  }, []);

  return {
    heartAnimation,
    handleDashboardDoubleClick,
    clearHeartAnimation,
  };
}

