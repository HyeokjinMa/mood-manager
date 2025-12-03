// ======================================================
// File: src/app/(main)/home/components/MoodDashboard/components/MoodHeader.tsx
// ======================================================

"use client";

import { useState } from "react";
import { RefreshCw, Star } from "lucide-react";
import type { Mood } from "@/types/mood";
import HeartAnimation from "./HeartAnimation";

interface MoodHeaderProps {
  mood: Mood;
  isSaved: boolean;
  onSaveToggle: () => void;
  onRefresh: () => void;
  llmSource?: string;
  onPreferenceClick?: () => void; // preference click handler
  preferenceCount?: number; // current mood preference count (0-3)
  maxReached?: boolean; // max 3 times reached
  onDoubleClick?: (x: number, y: number) => void; // dashboard double-click handler
  isRefreshing?: boolean; // LLM refresh in progress
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
      // 300ms 이내 더블클릭 감지 시 선호도 추가
      if (!maxReached && onPreferenceClick) {
        setHeartPosition({ x: e.clientX, y: e.clientY });
        setShowHeartAnimation(true);
        onPreferenceClick();
      }
      setLastClickTime(0); // reset
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
                ? "Maximum preference count (3) reached"
                : "Double-click to add preference (max 3 times)"
            }
          >
            {mood.name}
          </div>
          {/* LLM 사용 여부 항상 명확하게 표시 */}
          <span
            className="inline-flex mt-0.5 max-w-[160px] items-center rounded-full bg-white/70 px-2 py-[1px] text-[9px] font-medium text-gray-600"
            title={
              llmSource
                ? llmSource === "openai-fallback"
                  ? "LLM: OpenAI only (without Markov pipeline)"
                  : `LLM source: ${llmSource}`
                : "LLM: Not called yet or mock response"
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
          {/* mood set save button (star) */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSaveToggle();
            }}
            className={`p-1.5 rounded-full bg-white/40 backdrop-blur hover:bg-white/60 transition ${
              isSaved ? "text-yellow-500" : "text-gray-400"
            }`}
            title={isSaved ? "Saved mood (click to remove)" : "Save mood"}
          >
            <Star size={16} fill={isSaved ? "currentColor" : "none"} strokeWidth={isSaved ? 0 : 1.5} />
          </button>
          {/* refresh button (change within mood cluster) */}
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
            <RefreshCw
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
