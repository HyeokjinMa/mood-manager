// ======================================================
// File: src/app/(main)/home/components/MoodDashboard/components/SegmentTransition.tsx
// ======================================================

/**
 * 세그먼트 전환 대각선 애니메이션 컴포넌트
 * 
 * 우측상단에서 좌측하단으로 대각선으로 그라데이션이 이동하며
 * 이전 색상에서 새 색상으로 자연스럽게 전환되는 효과
 */

"use client";

import { useEffect, useState } from "react";
import { hexToRgba } from "@/lib/utils";

interface SegmentTransitionProps {
  fromColor: string;
  toColor: string;
  isVisible: boolean;
  onComplete: () => void;
}

export default function SegmentTransition({
  fromColor,
  toColor,
  isVisible,
  onComplete,
}: SegmentTransitionProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true);
      // 애니메이션 완료 후 콜백 호출
      const timer = setTimeout(() => {
        setIsAnimating(false);
        onComplete();
      }, 800); // 0.8초 애니메이션

      return () => clearTimeout(timer);
    }
  }, [isVisible, onComplete]);

  if (!isVisible || !isAnimating) {
    return null;
  }

  // 색상을 반투명하게 조정
  const fromColorRgba = hexToRgba(fromColor, 0.7);
  const toColorRgba = hexToRgba(toColor, 0.7);

  return (
    <div
      className="fixed inset-0 pointer-events-none z-50 animate-diagonal-sweep"
      style={{
        // 우측상단에서 좌측하단으로 대각선 그라데이션
        // 전체 프레임이 전환되는 효과
        background: `linear-gradient(
          135deg,
          ${toColorRgba} 0%,
          transparent 30%,
          transparent 70%,
          ${fromColorRgba} 100%
        )`,
      }}
    />
  );
}

// CSS 애니메이션 정의 (globals.css에 추가 필요)
// @keyframes diagonalSweep {
//   0% {
//     opacity: 0;
//     transform: translateX(100%) translateY(-100%);
//   }
//   50% {
//     opacity: 1;
//   }
//   100% {
//     opacity: 0;
//     transform: translateX(-100%) translateY(100%);
//   }
// }

