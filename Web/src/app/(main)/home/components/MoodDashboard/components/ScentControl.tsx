/**
 * ScentControl
 */

import type { Mood } from "@/types/mood";
import { hexToRgba } from "@/lib/utils";
import ScentIcon from "@/components/icons/ScentIcon";

interface ScentControlProps {
  mood: Mood;
  onScentClick: () => void;
  moodColor?: string; // LLM recommended mood color
}

export default function ScentControl({ mood, onScentClick, moodColor }: ScentControlProps) {
  // 무드 색상 사용 (투명도 낮게 설정하여 더 진하게 표시)
  const buttonColor = moodColor || mood.color;
  
  // debug log
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
        className="w-6 h-6 rounded-full shadow-sm flex items-center justify-center transition-all duration-300 hover:scale-105 cursor-pointer"
        style={{ backgroundColor: hexToRgba(buttonColor, 0.85) }} // 85% opacity (darker)
        title="Change scent"
      >
        <ScentIcon
          scentType={mood.scent.type}
          size={16}
          className="w-4 h-4"
          color="#ffffff" // icon color fixed to white
        />
      </button>
    </div>
  );
}

