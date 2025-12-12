/**
 * MoodModal
 * 
 * mood 페이지를 모달로 전환한 컴포넌트
 */

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import MoodDeleteModal from "@/app/(main)/mood/components/MoodDeleteModal";
import MoodReplaceModal from "@/app/(main)/mood/components/MoodReplaceModal";
import { blendWithWhite } from "@/lib/utils";
import { deleteSavedMood, type SavedMood as SavedMoodType } from "@/lib/mock/savedMoodsStorage";
import { FaTimes } from "react-icons/fa";

// Number of mood cards per page (2 x 3 grid)
const MOODS_PER_PAGE = 6;

interface MoodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyMood?: () => void; // 무드 적용 후 콜백 (home으로 이동 대신)
}

export default function MoodModal({ isOpen, onClose, onApplyMood }: MoodModalProps) {
  const isAdminMode = false;
  
  const [savedMoods, setSavedMoods] = useState<SavedMoodType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [moodToDelete, setMoodToDelete] = useState<SavedMoodType | null>(null);
  const [moodToReplace, setMoodToReplace] = useState<SavedMoodType | null>(null);

  // Fetch saved moods
  useEffect(() => {
    if (!isOpen) return;
    
    const fetchSavedMoods = async () => {
      try {
        const response = await fetch("/api/moods/saved", { credentials: "include" });
        if (response.ok) {
          const data = await response.json();
          setSavedMoods(data.savedMoods || []);
        } else {
          console.error("Failed to fetch saved moods:", await response.text());
        }
      } catch (error) {
        console.error("Error fetching saved moods:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSavedMoods();
  }, [isOpen, isAdminMode]);

  // Pagination calculation
  const totalPages = Math.ceil(savedMoods.length / MOODS_PER_PAGE);
  const startIndex = (currentPage - 1) * MOODS_PER_PAGE;
  const endIndex = startIndex + MOODS_PER_PAGE;
  const currentMoods = savedMoods.slice(startIndex, endIndex);

  // Delete mood
  const handleDelete = async (savedMoodId: string) => {
    try {
      if (isAdminMode) {
        deleteSavedMood(savedMoodId);
        setSavedMoods((prev) => prev.filter((m) => m.id !== savedMoodId));
        
        const remainingMoods = savedMoods.filter((m) => m.id !== savedMoodId);
        const newTotalPages = Math.ceil(remainingMoods.length / MOODS_PER_PAGE);
        if (currentPage > newTotalPages && newTotalPages > 0) {
          setCurrentPage(newTotalPages);
        }
        return;
      }
      
      const response = await fetch(`/api/moods/saved/${savedMoodId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (response.ok) {
        setSavedMoods((prev) => prev.filter((m) => m.id !== savedMoodId));
        
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

  // Apply mood (show replace segment confirmation modal)
  const handleApply = (savedMood: SavedMoodType) => {
    setMoodToReplace(savedMood);
  };

  // Confirm segment replacement
  const handleReplaceConfirm = async () => {
    if (!moodToReplace) return;
    
    try {
      const response = await fetch(`/api/moods/saved/${moodToReplace.id}/apply`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          replaceCurrentSegment: true,
        }),
      });
      
      if (response.ok) {
        // 모달 닫기 및 콜백 호출
        onClose();
        if (onApplyMood) {
          onApplyMood();
        } else {
          // 기본 동작: home으로 이동 (하지만 이미 home에 있으므로 리프레시)
          window.location.reload();
        }
      }
    } catch (error) {
      console.error("Error applying saved mood:", error);
    } finally {
      setMoodToReplace(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl w-full max-w-[375px] max-h-[90vh] overflow-hidden flex flex-col relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
        >
          <FaTimes className="text-gray-600" />
        </button>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col px-4 pt-4 pb-4">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">My Mood Set</h1>

          {isLoading ? (
            <div className="flex items-center justify-center flex-1">
              <div className="text-gray-500">Loading...</div>
            </div>
          ) : savedMoods.length === 0 ? (
            <div className="flex flex-col items-center justify-center flex-1 text-center">
              <div className="text-6xl mb-4">⭐</div>
              <p className="text-gray-600 mb-2">No saved moods</p>
              <p className="text-sm text-gray-500">
                Tap the star on the Mood Dashboard to save your current mood.
              </p>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto">
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {currentMoods.map((savedMood) => {
                    const pastelColor = blendWithWhite(savedMood.moodColor, 0.85);
                    
                    return (
                      <div
                        key={savedMood.id}
                        className="relative rounded-xl p-3 cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-md flex flex-col gap-2"
                        style={{
                          backgroundColor: pastelColor,
                          border: `1px solid ${savedMood.moodColor}60`,
                        }}
                        onDoubleClick={() => handleApply(savedMood)}
                        onClick={() => {}}
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setMoodToDelete(savedMood);
                          }}
                          className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-black/10 flex items-center justify-center text-gray-700 hover:bg-red-500 hover:text-white transition-all duration-200 text-[11px] z-10"
                          title="Delete"
                        >
                          ×
                        </button>

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

              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pb-4 flex-shrink-0">
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

