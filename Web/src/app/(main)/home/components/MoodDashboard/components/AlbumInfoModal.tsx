/**
 * AlbumInfoModal
 * 
 * 앨범 정보 모달 컴포넌트
 * - 앨범 이미지, 노래 제목, 아티스트 표시
 * - description이 있으면 표시, 없으면 숨김
 */

"use client";

import { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";
import Image from "next/image";
import type { MusicTrack } from "@/hooks/useMoodStream/types";

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
  const prevTrackTitleRef = useRef<string | null>(null);

  useEffect(() => {
    // track?.title이 실제로 변경되었을 때만 호출 (무한 루프 방지)
    if (!track?.title) {
      if (prevTrackTitleRef.current !== null) {
        prevTrackTitleRef.current = null;
        setDescription(null);
      }
      return;
    }
    
    if (prevTrackTitleRef.current === track.title) {
      return; // 이미 같은 제목이면 호출하지 않음
    }
    
    prevTrackTitleRef.current = track.title;
    
    // API 라우트를 통해 서버 사이드에서 조회
    fetch(`/api/music/track?title=${encodeURIComponent(track.title)}`)
      .then((res) => res.json())
      .then((trackData) => {
        setDescription(trackData?.description || null);
      })
      .catch((error) => {
        console.error("[AlbumInfoModal] Failed to fetch track description:", error);
        setDescription(null);
      });
  }, [track?.title]);

  if (!isOpen || !track) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-xl shadow-2xl p-6 w-[calc(100%-2rem)] max-w-[320px] mx-4 overflow-y-auto"
        style={{
          maxHeight: "calc(100vh - 4rem - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px))",
          marginTop: "calc(2rem + env(safe-area-inset-top, 0px))",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 닫기 버튼 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-100 transition-colors z-10"
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
              width={160}
              height={160}
              className="w-40 h-40 rounded-lg object-cover shadow-md"
              unoptimized
            />
          ) : (
            <div className="w-40 h-40 rounded-lg bg-gray-200 flex items-center justify-center">
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

