// ======================================================
// File: src/app/(main)/home/components/MoodDashboard/components/MoodDuration.tsx
// ======================================================

import type { Mood } from "@/types/mood";
import { blendWithWhite } from "@/lib/utils";

interface MoodDurationProps {
  mood: Mood;
  currentIndex: number;
  totalSegments: number;
  onSegmentSelect?: (index: number) => void;
  moodColorCurrent?: string; // 현재 세그먼트 무드 컬러 (raw)
  moodColorPast?: string;    // 지나간 세그먼트 무드 컬러 (pastel)
}

export default function MoodDuration({
  mood,
  currentIndex,
  totalSegments,
  onSegmentSelect,
  moodColorCurrent,
  moodColorPast,
}: MoodDurationProps) {
  const rawColor = moodColorCurrent || mood.color;
  const pastColor = moodColorPast || blendWithWhite(rawColor, 0.9);
  // 아직 가지 않은 세그먼트는 무드컬러를 아주 연한 회색빛으로 (거의 흰색에 가까운 톤)
  const futureColor = blendWithWhite(rawColor, 0.97);
  const clampedTotal = totalSegments > 0 ? totalSegments : 10;
  const clampedIndex =
    currentIndex >= 0 ? (currentIndex < clampedTotal ? currentIndex : clampedTotal - 1) : 0;

  // 세그먼트 기준 진행 정보
  const currentSegmentNumber = clampedIndex + 1; // 1-based

  const ticks = Array.from({ length: clampedTotal }, (_, idx) => idx);

  return (
    <div className="mb-0">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-gray-600">Mood Duration</span>
        <span className="text-xs font-medium text-gray-800">
          {currentSegmentNumber}/{clampedTotal}
        </span>
      </div>
      {/* 10개 세그먼트 눈금 바 */}
      <div className="w-full flex gap-[2px]">
        {ticks.map((idx) => {
          const isCurrent = idx === clampedIndex;
          const isPast = idx < clampedIndex;
          const backgroundColor = isCurrent
            ? rawColor
            : isPast
            ? pastColor
            : futureColor;
          const opacity = isCurrent ? 1 : isPast ? 0.7 : 0.35;

          return (
            <div
              key={idx}
              className="flex-1 h-2 rounded-full transition-all cursor-pointer hover:opacity-70"
              onClick={(e) => {
                e.stopPropagation();
                onSegmentSelect?.(idx);
              }}
              style={{
                backgroundColor,
                opacity,
              }}
              title={`${idx + 1}번째 구간으로 이동`}
            />
          );
        })}
      </div>
    </div>
  );
}

