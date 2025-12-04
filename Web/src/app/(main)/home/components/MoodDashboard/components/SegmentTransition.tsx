// ======================================================
// File: src/app/(main)/home/components/MoodDashboard/components/SegmentTransition.tsx
// ======================================================

/**
 * 세그먼트 전환 대각선 애니메이션 컴포넌트 (Phase 2 개선)
 * 
 * 우측상단에서 좌측하단으로 대각선으로 색이 점점 물들어가는 효과
 * - 이전 색상 레이어 위에 새 색상 레이어가 대각선으로 서서히 드러남
 * - "껍질을 벗기듯" 자연스러운 색상 전환
 */

"use client";

import { useEffect, useState } from "react";

interface SegmentTransitionProps {
  fromColor: string;
  toColor: string;
  isVisible: boolean;
  onComplete: () => void;
}

export default function SegmentTransition({
  fromColor,
  isVisible,
  onComplete,
}: SegmentTransitionProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isVisible) {
      // 과한 오버레이 대신, 아주 짧은 페이드 느낌만 주고 바로 전환
      setIsAnimating(true);
      const timer = setTimeout(() => {
        setIsAnimating(false);
        onComplete();
      }, 300); // 0.3초 정도만 살짝 어두워졌다가 복원

      return () => clearTimeout(timer);
    }
  }, [isVisible, onComplete]);

  if (!isVisible || !isAnimating) {
    return null;
  }

  // 전체 화면을 차지하는 별도의 블록/도형 없이,
  // 살짝 어두운 투명 레이어만 잠깐 덮었다가 사라지는 방식으로
  // 세그먼트 전환을 "느낌" 정도만 전달
  return (
    <div
      className="fixed inset-0 pointer-events-none z-40"
      style={{
        backgroundColor: fromColor,
        opacity: 0.15,
        transition: "opacity 0.3s ease-out",
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

