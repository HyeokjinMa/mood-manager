// ======================================================
// File: src/app/(main)/home/components/Device/AddDeviceCard.tsx
// ======================================================

/*
  [AddDeviceCard 역할]

  - 항상 마지막 줄에 나타나는 + 카드
  - 클릭 시 onAdd() 호출
  - 현재 무드 컬러에 따라 동적으로 스타일 변경
*/

"use client";

import { useState } from "react";
import { type Mood } from "@/types/mood";
import { blendWithWhite, hexToRgba } from "@/lib/utils";

interface AddDeviceCardProps {
  onAdd: () => void;
  currentMood?: Mood; // 현재 무드 (옵셔널, 없으면 기본 스타일)
}

export default function AddDeviceCard({
  onAdd,
  currentMood,
}: AddDeviceCardProps) {
  const [isClicked, setIsClicked] = useState(false);

  // 무드 컬러 (원본 HEX)
  const moodColor = currentMood?.color || "#6B7280";

  // 무드 대시보드 카드와 비슷한 느낌의 컬러 사용
  // - 대시보드 배경: hexToRgba(baseColor, 0.25)
  // 여기서는 테두리/아이콘 컬러를 그 배경색 톤과 맞춰서 살짝만 보이도록 설정
  const borderColor = currentMood
    ? hexToRgba(moodColor, 0.25)
    : "rgba(209, 213, 219, 0.4)"; // 기본 연한 회색 (살짝 투명)

  // 카드 배경은 기존처럼 "흰색에 가까운 파스텔" 느낌 유지
  // - 기본: 90% 흰색 + 10% 무드 컬러
  // - 클릭 시: 약간 더 진하게 85% 흰색 + 15% 무드 컬러
  const backgroundColor = currentMood
    ? blendWithWhite(moodColor, 0.9)
    : "rgb(255, 255, 255)";

  const clickedBackgroundColor = currentMood
    ? blendWithWhite(moodColor, 0.85)
    : "rgb(240, 240, 240)";

  const handleClick = () => {
    setIsClicked(true);
    // 애니메이션 후 원래 상태로 복귀
    setTimeout(() => {
      setIsClicked(false);
      onAdd();
    }, 150); // 150ms 후 원래 상태로
  };

  return (
    <div
      className={`h-[100px] p-3 rounded-xl shadow-sm cursor-pointer transition-all duration-150 flex flex-col justify-center items-center backdrop-blur-sm ${
        isClicked ? "scale-95" : "scale-100"
      }`}
      style={{
        // 테두리 색은 대시보드처럼 연한 파스텔톤으로
        borderColor,
        borderWidth: "1px",
        borderStyle: "solid",
        backgroundColor: isClicked
          ? clickedBackgroundColor
          : backgroundColor,
      }}
      onClick={handleClick}
    >
      <div 
        className="text-4xl font-light transition-colors duration-150"
        style={{
          // + 아이콘도 테두리와 동일한 파스텔 컬러 사용
          // 클릭 시 약간만 진하게
          color: isClicked ? blendWithWhite(moodColor, 0.8) : borderColor,
        }}
      >
        +
      </div>
    </div>
  );
}
