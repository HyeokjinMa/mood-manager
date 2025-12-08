/**
 * ScentInfoModal
 * 
 * 향 정보 모달 컴포넌트
 * - 향 아이콘, 타입, 이름 표시
 * - 향 카테고리별 설명 표시
 */

"use client";

import { X } from "lucide-react";
import type { ScentType } from "@/types/mood";
import { SCENT_DESCRIPTIONS } from "@/types/mood";
import ScentIcon from "@/components/icons/ScentIcon";

interface ScentInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  scentType: ScentType;
  scentName: string;
}

export default function ScentInfoModal({
  isOpen,
  onClose,
  scentType,
  scentName,
}: ScentInfoModalProps) {
  if (!isOpen) return null;

  const description = SCENT_DESCRIPTIONS[scentType] || "향에 대한 설명이 없습니다.";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 닫기 버튼 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-100 transition-colors"
          aria-label="Close"
        >
          <X size={20} className="text-gray-600" />
        </button>

        {/* 향 아이콘 */}
        <div className="flex justify-center mb-4">
          <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center">
            <ScentIcon
              scentType={scentType}
              size={48}
              className="w-12 h-12"
              color="#6B7280"
            />
          </div>
        </div>

        {/* 향 정보 */}
        <div className="text-center mb-4">
          <h3 className="text-xl font-bold text-gray-900 mb-1">
            {scentName}
          </h3>
          <p className="text-sm text-gray-600">{scentType}</p>
        </div>

        {/* 설명 */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-700 leading-relaxed">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}

