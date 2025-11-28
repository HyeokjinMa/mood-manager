// ======================================================
// File: src/app/(main)/home/components/MoodDashboard/components/MusicControls.tsx
// ======================================================

import { Play, Pause, SkipBack, SkipForward } from "lucide-react";
import type { Mood } from "@/types/mood";
import { formatTime } from "../utils/moodUtils";

interface MusicControlsProps {
  mood: Mood;
  progress: number;
  playing: boolean;
  onPlayToggle: () => void;
  onPrevious: () => void;
  onNext: () => void;
}

export default function MusicControls({
  mood,
  progress,
  playing,
  onPlayToggle,
  onPrevious,
  onNext,
}: MusicControlsProps) {
  return (
    <>
      {/* Progress Bar */}
      <div className="w-full flex items-center mb-2">
        <span className="text-xs mr-2 text-gray-800">
          {formatTime(progress)}
        </span>
        <div className="flex-1 h-1 bg-white/50 rounded">
          <div
            className="h-1 bg-black rounded"
            style={{ width: `${(progress / mood.song.duration) * 100}%` }}
          />
        </div>
        <span className="text-xs ml-2 text-gray-800">
          {formatTime(mood.song.duration)}
        </span>
      </div>

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

