// ======================================================
// File: src/app/(main)/home/components/MoodDashboard/components/HeartAnimation.tsx
// ======================================================

"use client";

import { useEffect, useState } from "react";
import { Heart } from "lucide-react";

interface HeartAnimationProps {
  onComplete: () => void;
  x: number; // 클릭한 X 좌표
  y: number; // 클릭한 Y 좌표
}

/**
 * 하트 애니메이션 컴포넌트
 * - 더블클릭 시 나타나서 위로 올라가며 사라지는 애니메이션
 * - 2개의 하트가 약간의 간격을 두고 올라감
 */
export default function HeartAnimation({ onComplete, x, y }: HeartAnimationProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => {
        onComplete();
      }, 300); // 애니메이션 완료 후 콜백 호출
    }, 1200); // 1.2초 후 사라짐

    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!isVisible) return null;

  return (
    <div
      className="fixed pointer-events-none z-50"
      style={{
        left: `${x}px`,
        top: `${y}px`,
        transform: "translate(-50%, -50%)",
      }}
    >
      {/* 첫 번째 하트 */}
      <div
        className="absolute animate-heart-float"
        style={{
          animationDelay: "0ms",
          transform: "translate(-20px, 0)",
        }}
      >
        <Heart
          size={28}
          className="text-red-500 fill-red-500"
        />
      </div>
      {/* 두 번째 하트 */}
      <div
        className="absolute animate-heart-float"
        style={{
          animationDelay: "100ms",
          transform: "translate(20px, 0)",
        }}
      >
        <Heart
          size={32}
          className="text-red-500 fill-red-500"
        />
      </div>
    </div>
  );
}
