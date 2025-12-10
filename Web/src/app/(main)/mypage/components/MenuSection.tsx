/**
 * MenuSection
 * 
 * 마이페이지 메뉴 항목들 (QNA, 1:1 Inquiry, Privacy Policy, Logout, Delete Account)
 */

"use client";

import { HelpCircle, MessageSquare, Shield, LogOut, Trash2, Key } from "lucide-react";

interface MenuSectionProps {
  onLogout: () => void;
  onDeleteAccount: () => void;
  onChangePassword: () => void;
  onQnaClick: () => void;
  onInquiryClick: () => void;
  onPrivacyClick: () => void;
}

export default function MenuSection({ 
  onLogout, 
  onDeleteAccount, 
  onChangePassword,
  onQnaClick,
  onInquiryClick,
  onPrivacyClick,
}: MenuSectionProps) {
  return (
    <div className="bg-white mt-4">
      <button
        onClick={onQnaClick}
        className="w-full flex items-center justify-between px-4 py-4 border-b border-gray-200 hover:bg-gray-50 transition text-left"
      >
        <div className="flex items-center">
          <HelpCircle size={20} className="text-gray-400 mr-3" />
          <span className="text-gray-700">Q&A</span>
        </div>
        <span className="text-gray-400">›</span>
      </button>

      <button
        onClick={onInquiryClick}
        className="w-full flex items-center justify-between px-4 py-4 border-b border-gray-200 hover:bg-gray-50 transition text-left"
      >
        <div className="flex items-center">
          <MessageSquare size={20} className="text-gray-400 mr-3" />
          <span className="text-gray-700">1:1 Inquiry</span>
        </div>
        <span className="text-gray-400">›</span>
      </button>

      <button
        onClick={onPrivacyClick}
        className="w-full flex items-center justify-between px-4 py-4 border-b border-gray-200 hover:bg-gray-50 transition text-left"
      >
        <div className="flex items-center">
          <Shield size={20} className="text-gray-400 mr-3" />
          <span className="text-gray-700">Privacy Policy</span>
        </div>
        <span className="text-gray-400">›</span>
      </button>

      <button
        onClick={onChangePassword}
        className="w-full flex items-center justify-between px-4 py-4 border-b border-gray-200 hover:bg-gray-50 transition text-left"
      >
        <div className="flex items-center">
          <Key size={20} className="text-gray-400 mr-3" />
          <span className="text-gray-700">Change Password</span>
        </div>
        <span className="text-gray-400">›</span>
      </button>

      <button
        onClick={onLogout}
        className="w-full flex items-center px-4 py-4 border-b border-gray-200 hover:bg-gray-50 transition text-left"
      >
        <LogOut size={20} className="text-gray-400 mr-3" />
        <span className="text-gray-700">Logout</span>
      </button>

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

