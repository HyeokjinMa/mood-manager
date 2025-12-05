/**
 * 무드스트림 전역 상태 관리 Context
 * 
 * 페이지 이동 시에도 무드스트림 상태를 유지하기 위한 Provider
 */

"use client";

import { createContext, useContext, ReactNode, useMemo } from "react";
import { usePathname } from "next/navigation";
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

// 빈 값 (로그인 페이지 등에서 사용)
const emptyMoodStreamValue: MoodStreamContextValue = {
  moodStream: null,
  currentSegment: null,
  currentSegmentIndex: 0,
  isLoading: false,
  refreshMoodStream: () => {},
  setCurrentSegmentIndex: () => {},
  switchToNextStream: () => {},
  nextStreamAvailable: false,
  isGeneratingNextStream: false,
};

export function MoodStreamProvider({ children }: { children: ReactNode }) {
  // 항상 useMoodStream 호출 (훅 규칙 준수)
  // useMoodStream 내부에서 인증 페이지일 때는 API 호출하지 않음
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

