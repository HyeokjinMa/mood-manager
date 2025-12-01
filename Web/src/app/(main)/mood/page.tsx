// ======================================================
// File: src/app/(main)/mood/page.tsx
// ======================================================

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import TopNav from "@/components/navigation/TopNav";
import BottomNav from "@/components/navigation/BottomNav";
import MoodDeleteModal from "./components/MoodDeleteModal";
import MoodReplaceModal from "./components/MoodReplaceModal";
import { blendWithWhite } from "@/lib/utils";
import { getSavedMoods, deleteSavedMood, initializeSampleMoods, type SavedMood as SavedMoodType } from "@/lib/mock/savedMoodsStorage";
import { ADMIN_EMAIL } from "@/lib/auth/mockMode";

// 한 페이지에 6개(2 x 3) 무드 카드를 보여주기 위한 페이지당 개수
const MOODS_PER_PAGE = 6;

export default function MoodSetPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const isAdminMode = session?.user?.email === ADMIN_EMAIL;
  
  const [savedMoods, setSavedMoods] = useState<SavedMoodType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [moodToDelete, setMoodToDelete] = useState<SavedMoodType | null>(null);
  const [moodToReplace, setMoodToReplace] = useState<SavedMoodType | null>(null);

  // 저장된 무드 목록 조회
  useEffect(() => {
    const fetchSavedMoods = async () => {
      try {
        if (isAdminMode) {
          // 관리자 모드: localStorage에서 읽기 (API 호출 스킵)
          initializeSampleMoods(); // 샘플 데이터 초기화 (이미 있으면 무시)
          const savedMoods = getSavedMoods();
          // savedAt 기준으로 최신순 정렬
          savedMoods.sort((a, b) => b.savedAt - a.savedAt);
          setSavedMoods(savedMoods);
          setIsLoading(false);
          return; // API 호출하지 않음 (목업 모드 최적화)
        }
        
        // 일반 모드: API 호출
        const response = await fetch("/api/moods/saved", {
          credentials: "include",
        });
        if (response.ok) {
          const data = await response.json();
          setSavedMoods(data.savedMoods || []);
        }
      } catch (error) {
        console.error("Error fetching saved moods:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSavedMoods();
  }, [isAdminMode]);

  // 페이지네이션 계산
  const totalPages = Math.ceil(savedMoods.length / MOODS_PER_PAGE);
  const startIndex = (currentPage - 1) * MOODS_PER_PAGE;
  const endIndex = startIndex + MOODS_PER_PAGE;
  const currentMoods = savedMoods.slice(startIndex, endIndex);

  // 무드 삭제
  const handleDelete = async (savedMoodId: string) => {
    try {
      if (isAdminMode) {
        // 관리자 모드: localStorage에서 삭제 (API 호출 스킵)
        deleteSavedMood(savedMoodId);
        setSavedMoods((prev) => prev.filter((m) => m.id !== savedMoodId));
        
        // 현재 페이지에 아이템이 없으면 이전 페이지로 이동
        const remainingMoods = savedMoods.filter((m) => m.id !== savedMoodId);
        const newTotalPages = Math.ceil(remainingMoods.length / MOODS_PER_PAGE);
        if (currentPage > newTotalPages && newTotalPages > 0) {
          setCurrentPage(newTotalPages);
        }
        return; // API 호출하지 않음 (목업 모드 최적화)
      }
      
      // 일반 모드: API 호출
      const response = await fetch(`/api/moods/saved/${savedMoodId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (response.ok) {
        setSavedMoods((prev) => prev.filter((m) => m.id !== savedMoodId));
        
        // 현재 페이지에 아이템이 없으면 이전 페이지로 이동
        const remainingMoods = savedMoods.filter((m) => m.id !== savedMoodId);
        const newTotalPages = Math.ceil(remainingMoods.length / MOODS_PER_PAGE);
        if (currentPage > newTotalPages && newTotalPages > 0) {
          setCurrentPage(newTotalPages);
        }
      }
    } catch (error) {
      console.error("Error deleting saved mood:", error);
    }
  };

  // 무드 적용 (세그먼트 교체 확인 모달 표시)
  const handleApply = (savedMood: SavedMoodType) => {
    setMoodToReplace(savedMood);
  };

  // 세그먼트 교체 확인
  const handleReplaceConfirm = async () => {
    if (!moodToReplace) return;
    
    try {
      // API 호출 (관리자 모드에서도 호출 가능 - 목업 응답 반환)
      const response = await fetch(`/api/moods/saved/${moodToReplace.id}/apply`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          replaceCurrentSegment: true, // 현재 세그먼트를 대체
        }),
      });
      
      if (response.ok) {
        // 홈으로 이동하여 변경된 무드 확인
        router.push("/home");
      }
    } catch (error) {
      console.error("Error applying saved mood:", error);
    } finally {
      setMoodToReplace(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden relative">
      <TopNav />
      
      <div className="flex-1 overflow-hidden pb-20 px-4 pt-4">
        <div className="max-w-[375px] mx-auto h-full flex flex-col">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">My Mood Set</h1>

          {savedMoods.length === 0 ? (
              <div className="flex flex-col items-center justify-center flex-1 text-center">
              <div className="text-6xl mb-4">⭐</div>
              <p className="text-gray-600 mb-2">No saved moods</p>
              <p className="text-sm text-gray-500">
                Tap the star on the Mood Dashboard to save your current mood.
              </p>
            </div>
          ) : (
            <>
              {/* 무드 카드 - 2 x 3 그리드 구조 */}
              <div className="flex-1">
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {currentMoods.map((savedMood) => {
                    // 파스텔 컬러 적용
                    const pastelColor = blendWithWhite(savedMood.moodColor, 0.85);
                    
                    return (
                      <div
                        key={savedMood.id}
                        className="relative rounded-xl p-3 cursor-pointer transition-transform hover:scale-[1.02] shadow-sm flex flex-col gap-2"
                        style={{
                          backgroundColor: pastelColor,
                          border: `1px solid ${savedMood.moodColor}60`,
                        }}
                        onDoubleClick={() => handleApply(savedMood)}
                        onClick={() => {}}
                      >
                        {/* 삭제 버튼 */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setMoodToDelete(savedMood);
                          }}
                          className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-black/10 flex items-center justify-center text-gray-700 hover:text-red-500 transition text-[11px] z-10"
                          title="Delete"
                        >
                          ×
                        </button>

                        {/* 무드 정보 - 단일 세그먼트 카드 */}
                        <div className="flex-1 flex flex-col gap-1">
                          <p className="text-xs font-semibold text-gray-700 truncate">
                            {savedMood.moodName}
                          </p>
                          <p className="text-xs text-gray-600 truncate">
                            🎵 {savedMood.music?.title || "N/A"}
                          </p>
                          <p className="text-xs text-gray-600 truncate">
                            🌸 {savedMood.scent?.name || "N/A"}
                          </p>
                          <p className="text-[10px] text-gray-400 mt-1">
                            {new Date(savedMood.savedAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 페이지네이션 */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pb-4">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className={`px-4 py-2 rounded-lg font-medium transition ${
                      currentPage === 1
                        ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    Prev
                  </button>
                  <span className="text-sm text-gray-600">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className={`px-4 py-2 rounded-lg font-medium transition ${
                      currentPage === totalPages
                        ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      
      <BottomNav />

      {/* 삭제 확인 모달 */}
      {moodToDelete && (
        <MoodDeleteModal
          savedMood={moodToDelete}
          onConfirm={() => {
            handleDelete(moodToDelete.id);
            setMoodToDelete(null);
          }}
          onCancel={() => setMoodToDelete(null)}
        />
      )}

      {/* 세그먼트 교체 확인 모달 */}
      {moodToReplace && (
        <MoodReplaceModal
          savedMood={moodToReplace}
          onConfirm={handleReplaceConfirm}
          onCancel={() => setMoodToReplace(null)}
        />
      )}
    </div>
  );
}
