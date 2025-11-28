// ======================================================
// File: src/app/(main)/mypage/privacy/page.tsx
// ======================================================

/*
  [Privacy Policy Page 역할]

  - 개인정보처리방침 내용 표시
*/

"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="flex flex-col h-screen overflow-hidden relative bg-white">
      <div className="flex-1 overflow-y-auto pb-20">
        <div className="max-w-[375px] mx-auto">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-4 flex items-center">
          <Link href="/mypage" className="mr-3">
            <ArrowLeft size={20} className="text-gray-600" />
          </Link>
          <h1 className="text-xl font-semibold">Privacy Policy</h1>
        </div>

        {/* Content */}
        <div className="bg-white mt-4 px-4 py-6">
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
    </div>
  );
}

