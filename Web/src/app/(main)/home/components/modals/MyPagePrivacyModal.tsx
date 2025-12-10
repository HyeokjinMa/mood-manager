/**
 * MyPagePrivacyModal
 * 
 * 개인정보 처리방침 Modal 컴포넌트
 */

"use client";

import { X } from "lucide-react";

interface MyPagePrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MyPagePrivacyModal({ isOpen, onClose }: MyPagePrivacyModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200">
          <h1 className="text-xl font-semibold">Privacy Policy</h1>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition"
          >
            <X size={20} className="text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 py-6">
          <div className="prose prose-sm max-w-none">
            <h2 className="text-lg font-semibold mb-4">1. Information We Collect</h2>
            <p className="text-sm text-gray-600 mb-6">
              We collect information that you provide directly to us, including your name, email
              address, date of birth, and gender when you register for an account.
            </p>

            <h2 className="text-lg font-semibold mb-4">2. How We Use Your Information</h2>
            <p className="text-sm text-gray-600 mb-6">
              We use the information we collect to provide, maintain, and improve our services,
              process transactions, and communicate with you.
            </p>

            <h2 className="text-lg font-semibold mb-4">3. Data Security</h2>
            <p className="text-sm text-gray-600 mb-6">
              We implement appropriate security measures to protect your personal information against
              unauthorized access, alteration, disclosure, or destruction.
            </p>

            <h2 className="text-lg font-semibold mb-4">4. Your Rights</h2>
            <p className="text-sm text-gray-600 mb-6">
              You have the right to access, update, or delete your personal information at any time
              through your account settings.
            </p>

            <h2 className="text-lg font-semibold mb-4">5. Contact Us</h2>
            <p className="text-sm text-gray-600">
              If you have any questions about this Privacy Policy, please contact us at
              support@moodmanager.com.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

