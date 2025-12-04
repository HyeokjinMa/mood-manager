/**
 * File: src/app/(main)/home/components/SurveyOverlay/SurveyOverlay.tsx
 *
 * SurveyOverlay Component
 *
 * 역할:
 *  - 홈 화면에서 무드 대시보드 위에 표시되는 설문 팝업
 *  - 두 단계로 진행: 1) 향 선호도, 2) 음악 장르 선호도
 *  - +/- 버튼으로 선호도 선택 (긍정/부정)
 *  - 우측 상단 X 버튼으로 건너뛰기 (확인 메시지)
 *
 * Props:
 *  - onComplete(scentLiked, scentDisliked, musicLiked, musicDisliked): 설문 완료 시 호출
 *  - onSkip(): 설문 건너뛰기 시 호출 (모든 요소를 긍정으로 처리)
 */

"use client";

import { useState } from "react";
import { X } from "lucide-react";

interface SurveyOverlayProps {
  onComplete: (
    scentLiked: string[],
    scentDisliked: string[],
    musicLiked: string[],
    musicDisliked: string[],
    tagLiked: string[],
    tagDisliked: string[]
  ) => void;
  onSkip: () => void;
}

// 향 옵션
const SCENT_OPTIONS = [
  "Citrus", "Floral", "Woody", "Fresh", "Spicy", "Sweet", "Herbal", "Fruity", 
  "Musk", "Aromatic", "Honey", "Green", "Dry", "Leathery", "Marine", "Powdery"
];

// 음악 장르 옵션 (정제된 장르 축)
const MUSIC_OPTIONS = [
  "lofi",
  "pop",
  "k-pop",
  "jazz",
  "classical",
  "christmas",
];

// 음악 태그 옵션 (무드/상황 태그)
const TAG_OPTIONS = [
  "focus",
  "sleep",
  "relax",
  "calm",
  "energy",
  "christmas",
];

type SurveyStep = "scent" | "music" | "tag";

export default function SurveyOverlay({ onComplete, onSkip }: SurveyOverlayProps) {
  const [step, setStep] = useState<SurveyStep>("scent");
  const [scentDisliked, setScentDisliked] = useState<Set<string>>(new Set());
  const [musicDisliked, setMusicDisliked] = useState<Set<string>>(new Set());
  const [tagDisliked, setTagDisliked] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSkipConfirm, setShowSkipConfirm] = useState(false);

  // 향 클릭 처리 (호/불호 전환)
  const handleScentClick = (scent: string) => {
    setScentDisliked((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(scent)) {
        newSet.delete(scent); // 불호 → 호
      } else {
        newSet.add(scent); // 호 → 불호
      }
      return newSet;
    });
  };

  // 음악 장르 클릭 처리 (호/불호 전환)
  const handleMusicClick = (music: string) => {
    setMusicDisliked((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(music)) {
        newSet.delete(music); // 불호 → 호
      } else {
        newSet.add(music); // 호 → 불호
      }
      return newSet;
    });
  };

  // 음악 태그 클릭 처리 (호/불호 전환)
  const handleTagClick = (tag: string) => {
    setTagDisliked((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(tag)) {
        newSet.delete(tag); // 불호 → 호
      } else {
        newSet.add(tag); // 호 → 불호
      }
      return newSet;
    });
  };

  // 다음 단계로 이동
  const handleNext = () => {
    if (step === "scent") {
      setStep("music");
    } else if (step === "music") {
      setStep("tag");
    } else {
      handleComplete();
    }
  };

  // 설문 완료
  const handleComplete = async () => {
    setIsSubmitting(true);
    
    // 싫어하는 항목을 제외한 나머지는 모두 선호
    const scentLiked = SCENT_OPTIONS.filter((scent) => !scentDisliked.has(scent));
    const scentDislikedArray = Array.from(scentDisliked);
    const musicLiked = MUSIC_OPTIONS.filter((music) => !musicDisliked.has(music));
    const musicDislikedArray = Array.from(musicDisliked);
    const tagLiked = TAG_OPTIONS.filter((tag) => !tagDisliked.has(tag));
    const tagDislikedArray = Array.from(tagDisliked);

    onComplete(
      scentLiked,
      scentDislikedArray,
      musicLiked,
      musicDislikedArray,
      tagLiked,
      tagDislikedArray
    );
  };

  // 건너뛰기 확인
  const handleSkipConfirm = () => {
    setShowSkipConfirm(false);
    onSkip();
  };

  return (
    <>
      {/* 반투명 배경 */}
      <div className="fixed inset-0 z-50 bg-black/40" />

      {/* 설문 모달 */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="relative bg-white rounded-xl p-6 w-[330px] shadow-xl">
          {/* 닫기 버튼 */}
          <button
            onClick={() => setShowSkipConfirm(true)}
            className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition"
            aria-label="Close"
          >
            <X size={20} className="text-gray-500" />
          </button>

          {/* 향 선호도 단계 */}
          {step === "scent" && (
            <>
              <h2 className="text-2xl font-bold mb-2">Scent Preferences</h2>
              <p className="text-gray-600 mb-6 text-sm">
                Click on scents to toggle your preference. Green = liked, Gray = disliked.
              </p>

              <div className="flex flex-wrap gap-2 mb-6 max-h-[60vh] overflow-y-auto">
                {SCENT_OPTIONS.map((scent) => {
                  const isDisliked = scentDisliked.has(scent);
                  return (
                    <button
                      key={scent}
                      type="button"
                      onClick={() => handleScentClick(scent)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        isDisliked
                          ? "bg-gray-400 text-white hover:bg-gray-500 line-through"
                          : "bg-green-500 text-white hover:bg-green-600"
                      }`}
                    >
                      {scent}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={handleNext}
                className="w-full py-3 px-4 bg-black text-white rounded-lg hover:bg-gray-800 transition font-medium"
              >
                Next
              </button>
            </>
          )}

          {/* 음악 장르 선호도 단계 */}
          {step === "music" && (
            <>
              <h2 className="text-2xl font-bold mb-2">Music Genre Preferences</h2>
              <p className="text-gray-600 mb-6 text-sm">
                Click on genres to toggle your preference. Green = liked, Gray = disliked.
              </p>

              <div className="flex flex-wrap gap-2 mb-6 max-h-[60vh] overflow-y-auto">
                {MUSIC_OPTIONS.map((music) => {
                  const isDisliked = musicDisliked.has(music);
                  return (
                    <button
                      key={music}
                      type="button"
                      onClick={() => handleMusicClick(music)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        isDisliked
                          ? "bg-gray-400 text-white hover:bg-gray-500 line-through"
                          : "bg-green-500 text-white hover:bg-green-600"
                      }`}
                    >
                      {music}
                    </button>
                  );
                })}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep("scent")}
                  className="flex-1 py-3 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
                >
                  Back
                </button>
                <button
                  onClick={handleNext}
                  disabled={isSubmitting}
                  className="flex-1 py-3 px-4 bg-black text-white rounded-lg hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  Next
                </button>
              </div>
            </>
          )}

          {/* 음악 태그 선호도 단계 */}
          {step === "tag" && (
            <>
              <h2 className="text-2xl font-bold mb-2">Music Tag Preferences</h2>
              <p className="text-gray-600 mb-6 text-sm">
                Click on tags to toggle your preference. Green = liked, Gray = disliked.
              </p>

              <div className="flex flex-wrap gap-2 mb-6 max-h-[60vh] overflow-y-auto">
                {TAG_OPTIONS.map((tag) => {
                  const isDisliked = tagDisliked.has(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleTagClick(tag)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        isDisliked
                          ? "bg-gray-400 text-white hover:bg-gray-500 line-through"
                          : "bg-green-500 text-white hover:bg-green-600"
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep("music")}
                  className="flex-1 py-3 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
                >
                  Back
                </button>
                <button
                  onClick={handleComplete}
                  disabled={isSubmitting}
                  className="flex-1 py-3 px-4 bg-black text-white rounded-lg hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {isSubmitting ? "Saving..." : "Save"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 건너뛰기 확인 모달 */}
      {showSkipConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl p-6 w-[330px] shadow-xl">
            <h3 className="text-xl font-bold mb-4">Skip Survey?</h3>
            <p className="text-gray-600 mb-6">
              If you skip, all preferences will be set to positive. You can change this later in settings.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowSkipConfirm(false)}
                className="flex-1 py-2 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
              >
                No
              </button>
              <button
                onClick={handleSkipConfirm}
                className="flex-1 py-2 px-4 bg-black text-white rounded-lg hover:bg-gray-800 transition font-medium"
              >
                Yes, Skip
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
