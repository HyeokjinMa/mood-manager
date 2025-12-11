/**
 * MusicControls
 */

import { Play, Pause, SkipBack, SkipForward } from "lucide-react";
import type { Mood } from "@/types/mood";
import type { MusicTrack } from "@/hooks/useMoodStream/types";
import { formatTime } from "../utils/moodUtils";

interface MusicControlsProps {
  mood: Mood;
  progress: number; // 현재 트랙의 진행 시간 (밀리초)
  totalProgress: number; // 세그먼트 전체 진행 시간 (밀리초)
  segmentDuration: number; // 세그먼트 전체 길이 (밀리초)
  currentTrack: MusicTrack | null; // 현재 재생 중인 트랙
  currentTrackIndex: number; // 현재 트랙 인덱스 (0-2)
  totalTracks: number; // 세그먼트 내 총 트랙 개수 (3)
  playing: boolean;
  onPlayToggle: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onSeek?: (time: number) => void; // seek 함수 (선택적)
  moodColor?: string; // 무드 컬러 (프로그레스 바 색상용)
}

export default function MusicControls({
  mood,
  progress,
  totalProgress,
  segmentDuration,
  currentTrack,
  currentTrackIndex,
  totalTracks,
  playing,
  onPlayToggle,
  onPrevious,
  onNext,
  onSeek,
  moodColor,
}: MusicControlsProps) {
  // 현재 트랙의 길이 (밀리초 → 초)
  const currentTrackDuration = currentTrack?.duration || mood.song.duration * 1000;
  
  // 세그먼트 전체 진행률
  const segmentProgressPercent = segmentDuration > 0 
    ? (totalProgress / segmentDuration) * 100 
    : 0;

  return (
    <>
      {/* 세그먼트 전체 Progress Bar */}
      <div className="w-full flex items-center mb-2">
        <span className="text-xs mr-2 text-gray-800">
          {formatTime(Math.floor(totalProgress / 1000))}
        </span>
        <div 
          className="flex-1 h-1 bg-white/50 rounded cursor-pointer"
          onClick={(e) => {
            if (!onSeek) return;
            e.stopPropagation();
            const progressBar = e.currentTarget;
            const clickX = e.clientX - progressBar.getBoundingClientRect().left;
            const width = progressBar.offsetWidth;
            const seekTime = (clickX / width) * segmentDuration;
            onSeek(seekTime);
          }}
        >
          <div
            className="h-1 rounded transition-all"
            style={{ 
              width: `${segmentProgressPercent}%`,
              backgroundColor: moodColor || mood.color || "#000000" // 무드 컬러 사용, 없으면 검은색
            }}
          />
        </div>
        <span className="text-xs ml-2 text-gray-800">
          {formatTime(Math.floor(segmentDuration / 1000))}
        </span>
      </div>

      {/* 현재 트랙 상세 정보(1/3: 제목, 0:00 / 3:45)는 V1에서는 숨김
          필요 시 디버깅이나 V2에서 다시 노출 가능 */}

      {/* 음악 컨트롤 버튼 */}
      <div className="flex justify-center items-center gap-4 mb-3">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPrevious();
          }}
          className="p-1.5 text-gray-800"
          title="Previous song"
        >
          <SkipBack size={18} />
        </button>

        <button
          className="p-2 bg-white rounded-full shadow text-gray-800"
          onClick={(e) => {
            e.stopPropagation();
            onPlayToggle();
          }}
          title={playing ? "Pause" : "Play"}
        >
          {playing ? <Pause size={16} /> : <Play size={16} />}
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onNext();
          }}
          className="p-1.5 text-gray-800"
          title="Next song"
        >
          <SkipForward size={18} />
        </button>
      </div>
    </>
  );
}

