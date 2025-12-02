// ======================================================
// File: src/app/(main)/mypage/qna/page.tsx
// ======================================================

/*
  [Q&A Page 역할]

  - 자주 묻는 질문 목록 표시
  - 질문 클릭 시 답변 표시/숨김
*/

"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronDown, ChevronUp } from "lucide-react";

interface FAQ {
  id: number;
  question: string;
  answer: string;
}

const faqs: FAQ[] = [
  {
    id: 1,
    question: "How do I connect my devices?",
    answer:
      "You can add devices by clicking the '+' button on the home screen. Select the device type (Manager, Light, Speaker, or Scent) and enter a name for your device. The device will appear in your device list and can be controlled from the home screen.",
  },
  {
    id: 2,
    question: "How does mood detection work?",
    answer:
      "Mood Manager analyzes your biometric data (heart rate, HRV, stress indicators) from WearOS devices and audio events (laughter, sighs) to determine your current mood state. The system uses AI to generate personalized mood streams with colors, music, scents, and lighting.",
  },
  {
    id: 3,
    question: "Can I customize the mood settings?",
    answer:
      "Yes, you can interact with the mood dashboard in several ways: double-click the dashboard to like the current mood (adds preference weight), click the star icon to save the current mood segment, use the refresh button to generate a new mood stream, and navigate between segments using the arrow buttons or the duration bar.",
  },
  {
    id: 4,
    question: "How do I change my password?",
    answer:
      "Go to My Page and click 'Change Password' in the menu. Enter your current password and your new password. Make sure your new password is at least 6 characters long. If you forgot your password, use the 'Forgot password?' link on the login page.",
  },
  {
    id: 5,
    question: "What devices are supported?",
    answer:
      "Currently, we support four device types: Manager (integrated control), Light (smart lighting), Speaker (audio output), and Scent (aroma diffuser). More device types will be added in future updates.",
  },
  {
    id: 6,
    question: "How do I save my favorite moods?",
    answer:
      "When viewing a mood on the home screen, click the star icon in the top right corner of the mood dashboard. The saved mood will appear on the Mood page, where you can view all your saved moods, replace the current segment with a saved mood, or delete saved moods.",
  },
  {
    id: 7,
    question: "What is the survey for?",
    answer:
      "The initial survey helps us understand your preferences for scents and music genres. This information is used to personalize your mood recommendations. You can update your preferences later by clicking the heart icon on the mood dashboard (up to 3 times per mood).",
  },
  {
    id: 8,
    question: "Can I use Mood Manager without a WearOS device?",
    answer:
      "Yes, you can use Mood Manager without a WearOS device. The system will use default values and your preferences to generate mood recommendations. However, for the best experience, we recommend using a WearOS device to collect real-time biometric data.",
  },
];

export default function QNAPage() {
  const [openId, setOpenId] = useState<number | null>(null);

  return (
    <div className="flex flex-col h-screen overflow-hidden relative bg-white">
      <div className="flex-1 overflow-y-auto pb-20">
        <div className="max-w-[375px] mx-auto">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-4 flex items-center">
          <Link href="/mypage" className="mr-3">
            <ArrowLeft size={20} className="text-gray-600" />
          </Link>
          <h1 className="text-xl font-semibold">Q&A</h1>
        </div>

        {/* FAQ List */}
        <div className="bg-white mt-4">
          {faqs.map((faq) => (
            <div key={faq.id} className="border-b border-gray-200 last:border-b-0">
              <button
                onClick={() => setOpenId(openId === faq.id ? null : faq.id)}
                className="w-full flex items-center justify-between px-4 py-4 hover:bg-gray-50 transition text-left"
              >
                <span className="text-gray-700 font-medium pr-4">{faq.question}</span>
                {openId === faq.id ? (
                  <ChevronUp size={20} className="text-gray-400 flex-shrink-0" />
                ) : (
                  <ChevronDown size={20} className="text-gray-400 flex-shrink-0" />
                )}
              </button>
              {openId === faq.id && (
                <div className="px-4 pb-4 text-sm text-gray-600">{faq.answer}</div>
              )}
            </div>
          ))}
        </div>
        </div>
      </div>
    </div>
  );
}

