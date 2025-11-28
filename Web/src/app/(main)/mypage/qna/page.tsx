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
      "You can add devices by clicking the '+' button on the home screen. Select the device type and enter a name for your device.",
  },
  {
    id: 2,
    question: "How does mood detection work?",
    answer:
      "Mood Manager analyzes your biometric data from WearOS devices and audio events to determine your current mood state.",
  },
  {
    id: 3,
    question: "Can I customize the mood settings?",
    answer:
      "Yes, you can adjust the scent interval, change songs, and modify lighting colors through the mood dashboard.",
  },
  {
    id: 4,
    question: "How do I reset my password?",
    answer:
      "Go to the login page and click 'Forgot password?' Enter your email address and follow the instructions sent to your email.",
  },
  {
    id: 5,
    question: "What devices are supported?",
    answer:
      "Currently, we support Manager, Light, Speaker, and Scent devices. More device types will be added in the future.",
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

