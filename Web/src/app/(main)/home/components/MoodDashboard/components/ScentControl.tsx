// ======================================================
// File: src/app/(main)/home/components/MoodDashboard/components/ScentControl.tsx
// ======================================================

import type { Mood } from "@/types/mood";
import { hexToRgba } from "@/lib/utils";
import ScentIcon from "@/components/icons/ScentIcon";

interface ScentControlProps {
  mood: Mood;
  onScentClick: () => void;
  moodColor?: string; // LLM 추천 무드 색상
}

export default function ScentControl({ mood, onScentClick, moodColor }: ScentControlProps) {
  // 무드 색상 사용 (투명도 낮게 - 더 진하게)
  const buttonColor = moodColor || mood.color;
  
  // 디버깅 로그
  console.log("[ScentControl] Render:", {
    scentType: mood.scent.type,
    moodColor: moodColor,
    buttonColor: buttonColor,
    defaultColor: mood.color,
  });
  
  return (
    <div className="flex items-center justify-end gap-1.5 mb-2">
      <span className="text-sm text-gray-700">{mood.scent.name}</span>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onScentClick();
        }}
        className="w-6 h-6 rounded-full shadow-sm flex items-center justify-center transition hover:scale-105 cursor-pointer"
        style={{ backgroundColor: hexToRgba(buttonColor, 0.85) }} // 투명도 85% (더 진하게)
        title="Change scent"
      >
        <ScentIcon
          scentType={mood.scent.type}
          size={16}
          className="w-4 h-4"
          color="#ffffff" // 아이콘 그림은 흰색으로 고정
        />
      </button>
    </div>
  );
}

