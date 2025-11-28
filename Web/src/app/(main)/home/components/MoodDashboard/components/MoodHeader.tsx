// ======================================================
// File: src/app/(main)/home/components/MoodDashboard/components/MoodHeader.tsx
// ======================================================

"use client";

import { useState } from "react";
import { RefreshCcw, Star } from "lucide-react";
import type { Mood } from "@/types/mood";
import HeartAnimation from "./HeartAnimation";

interface MoodHeaderProps {
  mood: Mood;
  isSaved: boolean;
  onSaveToggle: () => void;
  onRefresh: () => void;
  llmSource?: string;
  onPreferenceClick?: () => void; // 선호도 클릭 핸들러
  preferenceCount?: number; // 현재 무드의 선호도 카운트 (0-3)
  maxReached?: boolean; // 최대 3번 도달 여부
  onDoubleClick?: (x: number, y: number) => void; // 대시보드 더블클릭 핸들러
}

export default function MoodHeader({
  mood,
  isSaved,
  onSaveToggle,
  onRefresh,
  llmSource,
  onPreferenceClick,
  maxReached = false,
}: MoodHeaderProps) {
  const [showHeartAnimation, setShowHeartAnimation] = useState(false);
  const [heartPosition, setHeartPosition] = useState<{ x: number; y: number } | null>(null);
  const [lastClickTime, setLastClickTime] = useState(0);

  // 더블클릭 감지
  const handleDoubleClick = (e: React.MouseEvent) => {
    const now = Date.now();
    const timeSinceLastClick = now - lastClickTime;

    if (timeSinceLastClick < 300) {
      // 더블클릭 감지 (300ms 이내)
      if (!maxReached && onPreferenceClick) {
        setHeartPosition({ x: e.clientX, y: e.clientY });
        setShowHeartAnimation(true);
        onPreferenceClick();
      }
      setLastClickTime(0); // 리셋
    } else {
      setLastClickTime(now);
    }
  };

  return (
    <>
      {showHeartAnimation && heartPosition && (
        <HeartAnimation
          x={heartPosition.x}
          y={heartPosition.y}
          onComplete={() => {
            setShowHeartAnimation(false);
            setHeartPosition(null);
          }}
        />
      )}
      <div className="flex items-center justify-between mb-2">
        <div className="flex flex-col flex-1">
          <div
            className="text-base font-semibold text-gray-800 cursor-pointer select-none"
            onDoubleClick={handleDoubleClick}
            title={
              maxReached
                ? "최대 선호도 카운트(3)에 도달했습니다"
                : "더블클릭하여 선호도 표시 (최대 3번)"
            }
          >
            {mood.name}
          </div>
          {llmSource && (
            <span className="text-[10px] text-gray-500">
              LLM: {llmSource}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* 무드셋 저장 버튼 (별) */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSaveToggle();
            }}
            className={`p-1.5 rounded-full bg-white/40 backdrop-blur hover:bg-white/60 transition ${
              isSaved ? "text-yellow-500" : "text-gray-400"
            }`}
            title={isSaved ? "저장된 무드 (클릭하여 제거)" : "무드 저장하기"}
          >
            <Star size={16} fill={isSaved ? "currentColor" : "none"} strokeWidth={isSaved ? 0 : 1.5} />
          </button>
          {/* 새로고침 버튼 (무드 클러스터 내에서 변경) */}
          <button
            onClick={onRefresh}
            className="p-1.5 rounded-full bg-white/40 backdrop-blur hover:bg-white/60 transition text-gray-800"
            title="Refresh mood (same mood cluster)"
          >
            <RefreshCcw size={16} />
          </button>
        </div>
      </div>
    </>
  );
}
