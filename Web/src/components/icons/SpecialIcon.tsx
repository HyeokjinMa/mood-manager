/**
 * 특수 아이콘 컴포넌트
 * 자연/날씨, 감정/상태, 활동/이벤트 카테고리 아이콘
 */

"use client";

import { SPECIAL_ICONS, type SpecialIconType } from "@/lib/constants/scents";

interface SpecialIconProps {
  type: SpecialIconType;
  size?: number | string;
  className?: string;
  color?: string; // 색상 오버라이드 (선택적)
}

/**
 * 특수 아이콘 컴포넌트
 * @param type - 특수 아이콘 타입
 * @param size - 아이콘 크기 (기본값: 32)
 * @param className - 추가 CSS 클래스
 * @param color - 색상 오버라이드 (기본값: 디자이너 가이드 색상)
 */
export default function SpecialIcon({ 
  type, 
  size = 32, 
  className = "w-8 h-8",
  color,
}: SpecialIconProps) {
  const iconConfig = SPECIAL_ICONS[type];
  
  if (!iconConfig) {
    console.warn(`Special icon not found for: ${type}`);
    return null;
  }

  const IconComponent = iconConfig.component;
  const iconColor = color || iconConfig.color;

  return (
    <IconComponent 
      size={size} 
      className={className}
      color={iconColor}
    />
  );
}

