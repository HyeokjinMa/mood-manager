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
  isRefreshing?: boolean; // LLM 새로고침 진행 중 여부
}

export default function MoodHeader({
  mood,
  isSaved,
  onSaveToggle,
  onRefresh,
  llmSource,
  onPreferenceClick,
  maxReached = false,
  isRefreshing = false,
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
          {/* LLM 사용 여부를 항상 명확하게 표시 */}
          <span
            className="inline-flex mt-0.5 max-w-[160px] items-center rounded-full bg-white/70 px-2 py-[1px] text-[9px] font-medium text-gray-600"
            title={
              llmSource
                ? llmSource === "openai-fallback"
                  ? "LLM: OpenAI only (without Markov pipeline)"
                  : `LLM source: ${llmSource}`
                : "LLM: 아직 호출되지 않았거나 목업 응답입니다."
            }
          >
            {(() => {
              if (!llmSource) return "LLM: idle/mock";
              if (llmSource === "openai-fallback")
                return "LLM: active (openai / no markov)";
              if (llmSource.startsWith("openai") || llmSource === "cache")
                return `LLM: active (${llmSource})`;
              return `LLM: mock (${llmSource})`;
            })()}
          </span>
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
            onClick={isRefreshing ? () => {} : onRefresh}
            disabled={isRefreshing}
            className={`p-1.5 rounded-full bg-white/40 backdrop-blur transition text-gray-800 ${
              isRefreshing ? "opacity-70 cursor-wait" : "hover:bg-white/60"
            }`}
            title={
              isRefreshing
                ? "Refreshing... (LLM is generating new mood stream)"
                : "Refresh mood (same mood cluster)"
            }
          >
            <RefreshCcw
              size={16}
              className={isRefreshing ? "animate-spin" : ""}
              style={isRefreshing ? { animationDuration: "1.8s" } : undefined}
            />
          </button>
        </div>
      </div>
    </>
  );
}
