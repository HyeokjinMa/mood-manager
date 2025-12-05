// ======================================================
// File: src/app/(main)/home/components/MoodDashboard/components/AlbumSection.tsx
// ======================================================

import type { Mood } from "@/types/mood";
import Image from "next/image";

interface AlbumSectionProps {
  mood: Mood;
  onAlbumClick: () => void;
  musicSelection?: string; // LLM이 생성한 음악 제목
  albumImageUrl?: string; // 앨범 이미지 URL
}

export default function AlbumSection({ mood, onAlbumClick, musicSelection, albumImageUrl }: AlbumSectionProps) {
  return (
    <>
      {/* 앨범 이미지 */}
      <div className="flex justify-center mb-2">
        <button
          onClick={onAlbumClick}
          className="w-20 h-20 rounded-full bg-white shadow-md border overflow-hidden hover:scale-105 transition-all duration-500 ease-in-out cursor-pointer flex items-center justify-center"
        >
          {albumImageUrl ? (
            <Image
              src={albumImageUrl}
              alt={musicSelection || mood.song.title || "Album Art"}
              width={80}
              height={80}
              className="w-full h-full object-cover rounded-full"
              unoptimized // Next.js Image 최적화 비활성화 (public 폴더 이미지)
            />
          ) : (
            <span className="text-xs font-medium text-gray-500">Album Art</span>
          )}
        </button>
      </div>

      {/* 노래 제목 (음악) - LLM 생성값 우선 사용 */}
      <p className="text-center text-xs font-medium mb-1.5 text-gray-800 transition-all duration-500 ease-in-out">
        {musicSelection || mood.song.title}
      </p>
    </>
  );
}

