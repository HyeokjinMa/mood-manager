/**
 * 무드스트림 전역 상태 관리 Context
 * 
 * 페이지 이동 시에도 무드스트림 상태를 유지하기 위한 Provider
 */

"use client";

import { createContext, useContext, ReactNode } from "react";
import { useMoodStream } from "@/hooks/useMoodStream";
import type { MoodStream, MoodStreamSegment } from "@/hooks/useMoodStream/types";

interface MoodStreamContextValue {
  moodStream: MoodStream | null;
  currentSegment: MoodStreamSegment | null;
  currentSegmentIndex: number;
  isLoading: boolean;
  refreshMoodStream: () => void;
  setCurrentSegmentIndex: (index: number) => void;
  switchToNextStream: () => void;
  nextStreamAvailable: boolean;
  isGeneratingNextStream: boolean;
}

const MoodStreamContext = createContext<MoodStreamContextValue | undefined>(undefined);

export function MoodStreamProvider({ children }: { children: ReactNode }) {
  const moodStreamValue = useMoodStream();

  return (
    <MoodStreamContext.Provider value={moodStreamValue}>
      {children}
    </MoodStreamContext.Provider>
  );
}

export function useMoodStreamContext(): MoodStreamContextValue {
  const context = useContext(MoodStreamContext);
  if (context === undefined) {
    throw new Error("useMoodStreamContext must be used within a MoodStreamProvider");
  }
  return context;
}

