/**
 * MyPageQnaModal
 * 
 * Q&A Modal 컴포넌트
 */

"use client";

import { useState } from "react";
import { X, ChevronDown, ChevronUp } from "lucide-react";

interface MyPageQnaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

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
      "You can add devices by clicking the '+' button on the home screen. Select the device type (Manager, Light, Speaker, or Scent) and enter a name for your device. The device will appear in your device list once added.",
  },
  {
    id: 2,
    question: "How does mood detection work?",
    answer:
      "Mood Manager analyzes your biometric data from WearOS devices (heart rate, HRV, stress indicators) and audio events (laughter, sighs) to determine your current mood state. The system uses AI to generate personalized mood streams with 10 segments.",
  },
  {
    id: 3,
    question: "Can I customize the mood settings?",
    answer:
      "Yes, you can adjust the scent level, change songs, and modify lighting colors through the mood dashboard. Double-click the dashboard to add preference weight to the current mood segment.",
  },
  {
    id: 4,
    question: "How do I reset my password?",
    answer:
      "Go to the login page and click 'Forgot password?' Enter your email address and follow the instructions sent to your email. You can also change your password from My Page > Change Password.",
  },
  {
    id: 5,
    question: "What devices are supported?",
    answer:
      "Currently, we support Manager (integrated control), Light (Philips Wiz via Raspberry Pi), Speaker (music playback), and Scent (spray control) devices. More device types will be added in the future.",
  },
  {
    id: 6,
    question: "How do I save a mood?",
    answer:
      "Click the star icon on the mood dashboard to save the current mood segment. Saved moods can be viewed and managed on the Mood page. Double-click a saved mood to replace the current segment.",
  },
  {
    id: 7,
    question: "What is the survey for?",
    answer:
      "The survey helps us understand your preferences for scents and music genres. This information is used to personalize your mood recommendations. You can update your preferences anytime.",
  },
  {
    id: 8,
    question: "How do I delete my account?",
    answer:
      "Go to My Page > Delete Account. You will need to type 'I understand' to confirm. This action cannot be undone and will permanently delete all your data.",
  },
];

export default function MyPageQnaModal({ isOpen, onClose }: MyPageQnaModalProps) {
  const [openId, setOpenId] = useState<number | null>(null);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col pointer-events-auto border border-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200">
          <h1 className="text-xl font-semibold">Q&A</h1>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition"
          >
            <X size={20} className="text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
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
  );
}

