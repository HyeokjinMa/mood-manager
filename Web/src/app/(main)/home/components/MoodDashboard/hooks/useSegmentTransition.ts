// ======================================================
// File: src/app/(main)/home/components/MoodDashboard/hooks/useSegmentTransition.ts
// ======================================================

/**
 * 세그먼트 전환 애니메이션 관리 훅
 * 
 * 세그먼트 변경 시 대각선 애니메이션 효과를 관리
 */

import { useState, useCallback } from "react";

interface UseSegmentTransitionReturn {
  isTransitioning: boolean;
  fromColor: string | null;
  toColor: string | null;
  triggerTransition: (fromColor: string, toColor: string) => void;
  onTransitionComplete: () => void;
}

export function useSegmentTransition(): UseSegmentTransitionReturn {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [fromColor, setFromColor] = useState<string | null>(null);
  const [toColor, setToColor] = useState<string | null>(null);

  const triggerTransition = useCallback((from: string, to: string) => {
    setFromColor(from);
    setToColor(to);
    setIsTransitioning(true);
  }, []);

  const onTransitionComplete = useCallback(() => {
    setIsTransitioning(false);
    setFromColor(null);
    setToColor(null);
  }, []);

  return {
    isTransitioning,
    fromColor,
    toColor,
    triggerTransition,
    onTransitionComplete,
  };
}

