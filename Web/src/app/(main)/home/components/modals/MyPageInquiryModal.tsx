/**
 * MyPageInquiryModal
 * 
 * 1:1 문의 Modal 컴포넌트
 */

"use client";

import { useState } from "react";
import { X, Send } from "lucide-react";
import toast from "react-hot-toast";

interface MyPageInquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MyPageInquiryModal({ isOpen, onClose }: MyPageInquiryModalProps) {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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
      await new Promise((resolve) => setTimeout(resolve, 1000));

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

  const handleClose = () => {
    if (isSubmitted) {
      setSubject("");
      setMessage("");
      setIsSubmitted(false);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col pointer-events-auto border border-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200">
          <h1 className="text-xl font-semibold">1:1 Inquiry</h1>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-full transition"
          >
            <X size={20} className="text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 py-6">
          {isSubmitted ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Send size={32} className="text-green-600" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Inquiry Submitted</h2>
              <p className="text-sm text-gray-600 mb-6">
                Your inquiry has been submitted successfully. We&apos;ll get back to you soon.
              </p>
              <button
                onClick={handleClose}
                className="w-full bg-black text-white py-2 rounded-lg font-medium hover:bg-gray-800 transition"
              >
                Close
              </button>
            </div>
          ) : (
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
          )}
        </div>
      </div>
    </div>
  );
}

