/**
 * MoodDuration
 */

import type { Mood } from "@/types/mood";
import { blendWithWhite } from "@/lib/utils";

interface MoodDurationProps {
  mood: Mood;
  currentIndex: number;
  totalSegments: number;
  onSegmentSelect?: (index: number) => void;
  moodColorCurrent?: string; // 현재 세그먼트 무드 컬러 (raw)
  moodColorPast?: string;    // 지나간 세그먼트 무드 컬러 (pastel)
  nextStreamAvailable?: boolean; // 다음 스트림 존재 여부
  onNextStreamSelect?: () => void; // 다음 스트림 선택 핸들러
  totalSegmentsIncludingNext?: number; // 다음 스트림 포함 전체 세그먼트 개수 (동적 계산용)
  availableSegmentsCount?: number; // 실제 사용 가능한 세그먼트 개수 (클릭 가능한 범위)
  onSegmentSelectOutOfRange?: (index: number) => void; // 범위를 벗어난 세그먼트 선택 시 콜백
}

export default function MoodDuration({
  mood,
  currentIndex,
  totalSegments,
  onSegmentSelect,
  moodColorCurrent,
  moodColorPast,
  nextStreamAvailable = false,
  onNextStreamSelect,
  totalSegmentsIncludingNext,
  availableSegmentsCount,
  onSegmentSelectOutOfRange,
}: MoodDurationProps) {
  const rawColor = moodColorCurrent || mood.color;
  const pastColor = moodColorPast || blendWithWhite(rawColor, 0.9);
  // 아직 가지 않은 세그먼트는 무드컬러를 아주 연한 회색빛으로 (거의 흰색에 가까운 톤)
  const futureColor = blendWithWhite(rawColor, 0.97);

  // V1 기준: 1 스트림 = 10 세그먼트 구조 (항상 10칸을 보여줌)
  // 실제 segments 개수가 3개뿐이어도, 나머지는 미래 구간으로 연하게 표시
  const clampedTotal = 10;
  const clampedIndex =
    currentIndex >= 0 ? (currentIndex < clampedTotal ? currentIndex : clampedTotal - 1) : 0;

  // 실제 사용 가능한 세그먼트 개수 (클릭 가능한 범위)
  // availableSegmentsCount가 제공되면 사용, 없으면 totalSegments 사용
  const actualAvailableCount = availableSegmentsCount ?? totalSegments;

  // 세그먼트 기준 진행 정보
  const currentSegmentNumber = clampedIndex + 1; // 1-based
  // 인덱스 표시 텍스트: 항상 3세그먼트 기준 (1/3, 2/3, 3/3)
  const indexText = `${currentSegmentNumber}/${clampedTotal}`;

  const ticks = Array.from({ length: clampedTotal }, (_, idx) => idx);

  return (
    <div className="mb-0">
      {/* 상단 텍스트는 최대한 단순하게: 세그먼트 진행 상태만 작게 표시 */}
      <div className="flex items-center justify-end mb-1">
        <span className="text-[11px] text-gray-600 mr-1">{indexText}</span>
        {/* 다음 스트림 프리페치가 끝난 후, 뒤에서 3개(8/9/10) 구간에서만 화살표 표시 및 클릭 가능 */}
        {nextStreamAvailable && currentIndex >= clampedTotal - 3 && (
          <button
            type="button"
            className="text-[11px] text-gray-600 hover:text-gray-800 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              onNextStreamSelect?.();
            }}
            title="Switch to next stream"
          >
            →
          </button>
        )}
      </div>
      {/* 10개 세그먼트 눈금 바 */}
      <div className="w-full flex gap-[2px]">
        {ticks.map((idx) => {
          const isCurrent = idx === clampedIndex;
          const isPast = idx < clampedIndex;
          const isClickable = idx < actualAvailableCount; // 실제 사용 가능한 세그먼트만 클릭 가능

          const backgroundColor = isCurrent
            ? rawColor
            : isPast
            ? pastColor
            : futureColor;
          const opacity = isCurrent ? 1 : isPast ? 0.7 : 0.35;

          return (
            <div
              key={idx}
              className={`flex-1 h-2 rounded-full transition-all ${
                isClickable ? "cursor-pointer" : "cursor-not-allowed"
              }`}
              onClick={(e) => {
                e.stopPropagation();
                // 클릭 가능한 세그먼트만 선택 가능
                if (isClickable) {
                  onSegmentSelect?.(idx);
                } else {
                  // 범위를 벗어난 세그먼트 클릭 시 알림 콜백 호출
                  onSegmentSelectOutOfRange?.(idx);
                }
              }}
              style={{
                backgroundColor,
                opacity: isClickable ? opacity : 0.2, // 클릭 불가능한 세그먼트는 더 어둡게
              }}
              title={
                isClickable
                  ? `Go to segment ${idx + 1}`
                  : `Segment ${idx + 1} (not available yet)`
              }
            />
          );
        })}
      </div>
    </div>
  );
}

