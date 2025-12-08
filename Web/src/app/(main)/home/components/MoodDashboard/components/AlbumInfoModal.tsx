/**
 * AlbumInfoModal
 * 
 * 앨범 정보 모달 컴포넌트
 * - 앨범 이미지, 노래 제목, 아티스트 표시
 * - description이 있으면 표시, 없으면 숨김
 */

"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import Image from "next/image";
import type { MusicTrack } from "@/hooks/useMoodStream/types";
import { getMusicTrackByTitle } from "@/lib/music/getMusicTrackByID";

interface AlbumInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  track: MusicTrack | null;
}

export default function AlbumInfoModal({
  isOpen,
  onClose,
  track,
}: AlbumInfoModalProps) {
  const [description, setDescription] = useState<string | null>(null);

  useEffect(() => {
    if (track?.title) {
      getMusicTrackByTitle(track.title).then((trackData) => {
        setDescription(trackData?.description || null);
      });
    } else {
      setDescription(null);
    }
  }, [track?.title]);

  if (!isOpen || !track) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 닫기 버튼 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-100 transition-colors"
          aria-label="Close"
        >
          <X size={20} className="text-gray-600" />
        </button>

        {/* 앨범 이미지 */}
        <div className="flex justify-center mb-4">
          {track.albumImageUrl ? (
            <Image
              src={track.albumImageUrl}
              alt={track.title || "Album Art"}
              width={200}
              height={200}
              className="w-48 h-48 rounded-lg object-cover shadow-lg"
              unoptimized
            />
          ) : (
            <div className="w-48 h-48 rounded-lg bg-gray-200 flex items-center justify-center">
              <span className="text-gray-400 text-sm">Album Art</span>
            </div>
          )}
        </div>

        {/* 노래 정보 */}
        <div className="text-center mb-4">
          <h3 className="text-xl font-bold text-gray-900 mb-1">
            {track.title}
          </h3>
          {track.artist && (
            <p className="text-sm text-gray-600">{track.artist}</p>
          )}
        </div>

        {/* 설명 (있을 때만 표시) */}
        {description && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-700 leading-relaxed">
              {description}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

