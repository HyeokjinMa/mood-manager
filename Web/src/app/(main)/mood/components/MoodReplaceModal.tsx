// ======================================================
// File: src/app/(main)/mood/components/MoodReplaceModal.tsx
// ======================================================

/*
  [MoodReplaceModal 역할]
  
  - 무드 카드 클릭 시 현재 세그먼트를 대체할지 확인하는 팝업
  - DeviceDeleteModal과 동일한 스타일
  - 확인 및 취소 기능
*/

"use client";

interface SavedMood {
  id: string;
  moodId: string;
  moodName: string;
  moodColor: string;
  music: {
    genre: string;
    title: string;
  };
  scent: {
    type: string;
    name: string;
  };
  preferenceCount: number;
  savedAt: number;
}

interface MoodReplaceModalProps {
  savedMood: SavedMood;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function MoodReplaceModal({
  savedMood,
  onConfirm,
  onCancel,
}: MoodReplaceModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
      <div className="bg-white w-[330px] rounded-xl p-6 shadow-xl relative">
        <h2 className="text-center text-lg font-semibold mb-4">
          Replace Current Segment
        </h2>

        {/* 무드 정보 */}
        <div 
          className="flex items-center gap-3 mb-6 p-3 rounded-lg"
          style={{
            backgroundColor: `${savedMood.moodColor}20`,
            border: `1px solid ${savedMood.moodColor}40`,
          }}
        >
          <div className="flex-1">
            <p className="font-medium text-gray-800">{savedMood.moodName}</p>
            <p className="text-sm text-gray-500">
              🎵 {savedMood.music.title}
            </p>
            <p className="text-sm text-gray-500">
              🌸 {savedMood.scent.name}
            </p>
          </div>
        </div>

        {/* 확인 메시지 */}
        <p className="text-center text-gray-600 mb-6 text-sm">
          Replace the current mood segment with this saved mood? This will immediately switch to the selected mood.
        </p>

        {/* 버튼 */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
          >
            Replace
          </button>
        </div>
      </div>
    </div>
  );
}

