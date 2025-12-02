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

    if (!subject || !message) {
      toast.error("Please fill in all fields.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/inquiry", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ subject, message }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to submit inquiry");
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || "Failed to submit inquiry");
      }

      setIsSubmitted(true);
    } catch (error) {
      console.error("Error submitting inquiry:", error);
      toast.error(error instanceof Error ? error.message : "Failed to submit inquiry. Please try again.");
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

