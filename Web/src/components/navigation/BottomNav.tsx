// ======================================================
// File: src/components/navigation/BottomNav.tsx
// ======================================================

/*
  [BottomNav 역할 정리]

  - 화면 하단 고정 네비게이션
  - app/layout.tsx 의 375px 중앙 정렬 영역의 bottom에 맞춰 렌더링
  - 3개 탭:
      1) Home
      2) Mood Library
      3) My Page
  - 현재 경로(pathname)에 따라 강조(active) 스타일 적용
*/

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FaHome, FaPalette, FaUser } from "react-icons/fa";
import React from "react";
import type { Mood } from "@/types/mood";

interface BottomNavProps {
  currentMood?: Mood;
  moodColor?: string; // LLM 추천 무드 색상 (LLM 배경 컬러)
  onMyPageClick?: () => void; // Phase 8: 모달 열기 콜백
  onMoodClick?: () => void; // Phase 8: 모달 열기 콜백
}

export default function BottomNav({ currentMood, moodColor, onMyPageClick, onMoodClick }: BottomNavProps = {}) {
  const path = usePathname();
  const homeColor = moodColor || currentMood?.color;

  return (
    <div className="fixed bottom-0 left-0 right-0 flex justify-center z-30">
      <div className="w-full max-w-[375px] backdrop-blur-sm border-t border-gray-200 flex justify-around py-2">
        {navItem("MYPAGE", <FaUser />, "/mypage", path, homeColor, onMyPageClick)}
        {navItem("HOME", <FaHome />, "/home", path, homeColor)}
        {navItem("MOOD", <FaPalette />, "/mood", path, homeColor, onMoodClick)}
      </div>
    </div>
  );
}

function navItem(
  label: string,
  icon: React.ReactNode,
  href: string,
  path: string,
  homeColor?: string,
  onClick?: () => void
) {
  const active = path.startsWith(href);

  // 아이콘별 색상 매핑
  const getIconColor = (label: string, isActive: boolean) => {
    if (isActive) {
      switch (label) {
        case "HOME":
          // HOME 아이콘은 무드 컬러 사용 (인라인 스타일로 처리)
          if (homeColor) return "";
          return "text-blue-600";
        case "MOOD":
          return "text-purple-600";
        case "MYPAGE":
          return "text-gray-700";
        default:
          return "text-gray-700";
      }
    } else {
      return "text-gray-400";
    }
  };
  
  // HOME 아이콘 색상 (무드 컬러 또는 기본 색상)
  const getHomeIconStyle = (isActive: boolean) => {
    if (isActive && homeColor) {
      return { color: homeColor };
    }
    return {};
  };

  // Phase 8: 모달이 있는 경우 버튼으로, 없으면 Link로
  const content = (
    <div
      className={`flex flex-col items-center text-xs transition-colors cursor-pointer ${
        active ? "font-semibold" : ""
      }`}
      onClick={onClick}
    >
      <div 
        className={`text-lg ${getIconColor(label, active)}`}
        style={label === "HOME" ? getHomeIconStyle(active) : {}}
      >
        {icon}
      </div>
      <span className={active ? "text-gray-700" : "text-gray-500"}>{label}</span>
    </div>
  );

  // onClick이 있으면 버튼, 없으면 Link
  if (onClick) {
    return content;
  }

  return (
    <Link
      href={href}
      className={`flex flex-col items-center text-xs transition-colors ${
        active ? "font-semibold" : ""
      }`}
    >
      <div 
        className={`text-lg ${getIconColor(label, active)}`}
        style={label === "HOME" ? getHomeIconStyle(active) : {}}
      >
        {icon}
      </div>
      <span className={active ? "text-gray-700" : "text-gray-500"}>{label}</span>
    </Link>
  );
}
