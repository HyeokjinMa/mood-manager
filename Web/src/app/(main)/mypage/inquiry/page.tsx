// ======================================================
// File: src/app/(main)/mypage/inquiry/page.tsx
// ======================================================

/*
  [1:1 Inquiry Page 역할]

  - 사용자가 1:1 문의를 작성하고 제출
  - 제출된 문의는 백엔드로 전송
*/

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Send } from "lucide-react";
import toast from "react-hot-toast";

export default function InquiryPage() {
  const router = useRouter();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!subject.trim()) {
      toast.error("Subject is required.");
      return;
    }
    if (subject.trim().length < 3) {
      toast.error("Subject must be at least 3 characters.");
      return;
    }
    if (subject.trim().length > 100) {
      toast.error("Subject must be less than 100 characters.");
      return;
    }
    if (!message.trim()) {
      toast.error("Message is required.");
      return;
    }
    if (message.trim().length < 10) {
      toast.error("Message must be at least 10 characters.");
      return;
    }
    if (message.trim().length > 2000) {
      toast.error("Message must be less than 2000 characters.");
      return;
    }

    setIsSubmitting(true);

    try {
      // [MOCK] 1:1 문의 제출 (로컬 상태만 업데이트)
      // TODO: 백엔드 API로 교체 필요
      // API 명세:
      // POST /api/inquiry
      // - 인증: NextAuth session (쿠키 기반)
      // - 요청: { subject: string, message: string }
      // - 응답: { success: boolean, inquiryId: string }
      // - 설명: 1:1 문의 제출 및 저장

      // Mock: Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // const response = await fetch("/api/inquiry", {
      //   method: "POST",
      //   headers: {
      //     "Content-Type": "application/json",
      //   },
      //   credentials: "include",
      //   body: JSON.stringify({ subject, message }),
      // });

      // if (!response.ok) {
      //   const error = await response.json();
      //   throw new Error(error.message || "Failed to submit inquiry");
      // }

      toast.success("Inquiry submitted successfully. We'll get back to you soon.");
      setIsSubmitted(true);
    } catch (error) {
      console.error("Error submitting inquiry:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to submit inquiry. Please try again.";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="flex flex-col h-screen overflow-hidden relative bg-white">
        <div className="flex-1 overflow-y-auto pb-20 flex items-center justify-center">
          <div className="max-w-[375px] mx-auto px-4 w-full">
          <div className="bg-white rounded-lg p-6 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Send size={32} className="text-green-600" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Inquiry Submitted</h2>
            <p className="text-sm text-gray-600 mb-6">
              Your inquiry has been submitted successfully. We&apos;ll get back to you soon.
            </p>
            <button
              onClick={() => router.push("/mypage")}
              className="w-full bg-black text-white py-2 rounded-lg font-medium hover:bg-gray-800 transition"
            >
              Back to My Page
            </button>
          </div>
        </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden relative bg-white">
      <div className="flex-1 overflow-y-auto pb-20">
        <div className="max-w-[375px] mx-auto">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-4 flex items-center">
          <Link href="/mypage" className="mr-3">
            <ArrowLeft size={20} className="text-gray-600" />
          </Link>
          <h1 className="text-xl font-semibold">1:1 Inquiry</h1>
        </div>

        {/* Form */}
        <div className="bg-white mt-4 px-4 py-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Enter subject"
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Enter your message"
                rows={8}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-black resize-none"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-black text-white py-2 rounded-lg font-medium hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Submitting..." : "Submit"}
            </button>
          </form>
        </div>
        </div>
      </div>
    </div>
  );
}

