// ======================================================
// File: src/app/(main)/home/components/MoodDashboard/components/AlbumSection.tsx
// ======================================================

import type { Mood } from "@/types/mood";

interface AlbumSectionProps {
  mood: Mood;
  onAlbumClick: () => void;
  musicSelection?: string; // LLM이 생성한 음악 제목
}

export default function AlbumSection({ mood, onAlbumClick, musicSelection }: AlbumSectionProps) {
  return (
    <>
      {/* 앨범 이미지 */}
      <div className="flex justify-center mb-2">
        <button
          onClick={onAlbumClick}
          className="w-20 h-20 rounded-full bg-white shadow-md border flex items-center justify-center text-xs font-medium hover:scale-105 transition-all duration-300 cursor-pointer"
        >
          Album Art
        </button>
      </div>

      {/* 노래 제목 (음악) - LLM 생성값 우선 사용 */}
      <p className="text-center text-xs font-medium mb-1.5 text-gray-800 transition-opacity duration-300">
        {musicSelection || mood.song.title}
      </p>
    </>
  );
}

