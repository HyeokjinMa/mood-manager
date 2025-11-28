// ======================================================
// File: src/app/(main)/mypage/components/MenuSection.tsx
// ======================================================

/*
  [MenuSection 역할]
  
  - 마이페이지 메뉴 항목들 (QNA, 1:1 Inquiry, Privacy Policy, Logout, Delete Account)
*/

"use client";

import Link from "next/link";
import { HelpCircle, MessageSquare, Shield, LogOut, Trash2 } from "lucide-react";

interface MenuSectionProps {
  onLogout: () => void;
  onDeleteAccount: () => void;
}

export default function MenuSection({ onLogout, onDeleteAccount }: MenuSectionProps) {
  return (
    <div className="bg-white mt-4">
      {/* QNA */}
      <Link
        href="/mypage/qna"
        className="flex items-center justify-between px-4 py-4 border-b border-gray-200 hover:bg-gray-50 transition"
      >
        <div className="flex items-center">
          <HelpCircle size={20} className="text-gray-400 mr-3" />
          <span className="text-gray-700">Q&A</span>
        </div>
        <span className="text-gray-400">›</span>
      </Link>

      {/* 1:1 Inquiry */}
      <Link
        href="/mypage/inquiry"
        className="flex items-center justify-between px-4 py-4 border-b border-gray-200 hover:bg-gray-50 transition"
      >
        <div className="flex items-center">
          <MessageSquare size={20} className="text-gray-400 mr-3" />
          <span className="text-gray-700">1:1 Inquiry</span>
        </div>
        <span className="text-gray-400">›</span>
      </Link>

      {/* Privacy Policy */}
      <Link
        href="/mypage/privacy"
        className="flex items-center justify-between px-4 py-4 border-b border-gray-200 hover:bg-gray-50 transition"
      >
        <div className="flex items-center">
          <Shield size={20} className="text-gray-400 mr-3" />
          <span className="text-gray-700">Privacy Policy</span>
        </div>
        <span className="text-gray-400">›</span>
      </Link>

      {/* Logout */}
      <button
        onClick={onLogout}
        className="w-full flex items-center px-4 py-4 border-b border-gray-200 hover:bg-gray-50 transition text-left"
      >
        <LogOut size={20} className="text-gray-400 mr-3" />
        <span className="text-gray-700">Logout</span>
      </button>

      {/* Delete Account */}
      <button
        onClick={onDeleteAccount}
        className="w-full flex items-center px-4 py-4 hover:bg-red-50 transition text-left"
      >
        <Trash2 size={20} className="text-red-400 mr-3" />
        <span className="text-red-600">Delete Account</span>
      </button>
    </div>
  );
}

