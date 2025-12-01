/**
 * 향 아이콘 컴포넌트
 * 디자이너 가이드에 따른 향별 아이콘 표시
 */

"use client";

import { SCENT_ICONS } from "@/lib/constants/scents";
import { scentTypeToCategory } from "@/types/mood";
import type { ScentType } from "@/types/mood";
import type { FragranceCategory } from "@/lib/constants/mood";

interface ScentIconProps {
  scentType: ScentType | FragranceCategory;
  size?: number | string;
  className?: string;
  color?: string; // 색상 오버라이드 (선택적)
}

/**
 * 향 아이콘 컴포넌트
 * @param scentType - 향 타입 (PascalCase 또는 snake_case)
 * @param size - 아이콘 크기 (기본값: 24)
 * @param className - 추가 CSS 클래스
 * @param color - 색상 오버라이드 (기본값: 디자이너 가이드 색상)
 */
export default function ScentIcon({ 
  scentType, 
  size = 24, 
  className = "w-6 h-6",
  color,
}: ScentIconProps) {
  // PascalCase → snake_case 변환
  let category: FragranceCategory;
  
  if (typeof scentType === 'string') {
    // PascalCase인지 확인 (첫 글자가 대문자)
    if (scentType[0] === scentType[0].toUpperCase() && scentType !== scentType.toLowerCase()) {
      const converted = scentTypeToCategory(scentType as ScentType);
      category = converted as FragranceCategory;
    } else {
      category = scentType as FragranceCategory;
    }
  } else {
    category = scentType as FragranceCategory;
  }

  // 타입 가드: category가 유효한 FragranceCategory인지 확인
  if (!(category in SCENT_ICONS)) {
    console.warn(`Scent icon not found for: ${scentType}`);
    return null;
  }

  const iconConfig = SCENT_ICONS[category];
  
  if (!iconConfig) {
    console.warn(`Scent icon not found for: ${scentType}`);
    return null;
  }

  const IconComponent = iconConfig.component;
  const iconColor = color || iconConfig.color;

  // 디버깅 로그
  console.log("[ScentIcon] Render:", {
    category,
    size,
    className,
    color: color || 'default',
    iconColor,
    defaultColor: iconConfig.color,
  });

  return (
    <IconComponent 
      size={typeof size === 'number' ? size : parseInt(String(size)) || 24} 
      className={className}
      color={iconColor}
    />
  );
}

