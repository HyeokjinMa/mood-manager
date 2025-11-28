// ======================================================
// File: src/app/(main)/home/components/MoodDashboard/components/ScentControl.tsx
// ======================================================

import { TbSpray } from "react-icons/tb";
import type { Mood } from "@/types/mood";
import { hexToRgba } from "@/lib/utils";

interface ScentControlProps {
  mood: Mood;
  onScentClick: () => void;
  moodColor?: string; // LLM 추천 무드 색상
}

export default function ScentControl({ mood, onScentClick, moodColor }: ScentControlProps) {
  // 무드 색상 사용 (투명도 낮게 - 더 진하게)
  const buttonColor = moodColor || mood.color;
  
  return (
    <div className="flex items-center justify-end gap-1.5 mb-2">
      <span className="text-sm text-gray-700">{mood.scent.name}</span>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onScentClick();
        }}
        className="w-7 h-7 rounded-full shadow flex items-center justify-center hover:scale-105 transition cursor-pointer"
        style={{ backgroundColor: hexToRgba(buttonColor, 0.85) }} // 투명도 85% (더 진하게)
        title="Change scent"
      >
        <TbSpray
          size={16}
          style={{ color: "#ffffff" }} // 흰색 아이콘으로 대비 확보
        />
      </button>
    </div>
  );
}

