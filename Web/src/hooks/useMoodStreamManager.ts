// src/hooks/useMoodStreamManager.ts
/**
 * 무드스트림 관리 훅
 * 
 * 예약된 세그먼트가 3개 이하가 되면 자동으로 재생성
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { moodStreamScheduler, type ScheduledMoodSegment } from "@/lib/moodStream/scheduler";
import type { Mood } from "@/types/mood";

export interface MoodStreamSegment {
  id: string;
  timestamp: number;
  moodName: string;
  musicGenre: string;
  scentType: string;
  mood?: Mood;
  music?: Mood["song"];
  scent?: Mood["scent"];
  lighting?: {
    color: string;
    rgb: [number, number, number];
  };
  duration: number;
}

export function useMoodStreamManager() {
  const [scheduledSegments, setScheduledSegments] = useState<ScheduledMoodSegment[]>([]);
  const [currentSegment, setCurrentSegment] = useState<ScheduledMoodSegment | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * 무드스트림 생성 및 LLM 정보 추가
   */
  const generateMoodStream = useCallback(async (nextStartTime: number) => {
    if (isGenerating) return;
    
    setIsGenerating(true);
    moodStreamScheduler.startGeneration();
    
    try {
      // 1. 무드스트림 생성 (10개 세그먼트)
      const streamResponse = await fetch("/api/moods/current/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nextStartTime }),
      });
      
      if (!streamResponse.ok) {
        throw new Error("Failed to generate mood stream");
      }
      
      const { segments, streamId } = await streamResponse.json();
      
      // 2. LLM으로 나머지 정보 추가 (10개 세그먼트 전체)
      const llmResponse = await fetch("/api/ai/background-params", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          streamId,
          segments, // 10개 세그먼트 정보 전달
        }),
      });
      
      if (!llmResponse.ok) {
        throw new Error("Failed to generate background params");
      }
      
      const backgroundParams = await llmResponse.json();
      
      // 3. 세그먼트에 LLM 정보 추가
      const enrichedSegments: ScheduledMoodSegment[] = segments.map((seg: MoodStreamSegment) => ({
        id: seg.id,
        timestamp: seg.timestamp,
        moodName: seg.moodName,
        musicGenre: seg.musicGenre,
        scentType: seg.scentType,
        moodAlias: backgroundParams.moodAlias, // LLM 생성
        musicSelection: backgroundParams.musicSelection, // LLM 생성
        moodColor: backgroundParams.moodColor, // LLM 생성
        lighting: backgroundParams.lighting, // LLM 생성
        backgroundIcon: backgroundParams.backgroundIcon, // LLM 생성
        // ... 기타 LLM 생성 정보
      }));
      
      // 4. 스케줄러에 추가 (뒤로 붙음)
      moodStreamScheduler.appendSegments(enrichedSegments);
      setScheduledSegments(moodStreamScheduler.getScheduledSegments());
      
    } catch (error) {
      console.error("Error generating mood stream:", error);
    } finally {
      setIsGenerating(false);
      moodStreamScheduler.finishGeneration();
    }
  }, [isGenerating]);

  /**
   * 재생성 필요 여부 확인 및 실행
   */
  const checkAndRegenerate = useCallback(async () => {
    if (moodStreamScheduler.shouldRegenerate()) {
      const nextStartTime = moodStreamScheduler.getNextSegmentStartTime();
      await generateMoodStream(nextStartTime);
    }
  }, [generateMoodStream]);

  /**
   * 현재 세그먼트 업데이트
   */
  const updateCurrentSegment = useCallback(() => {
    const current = moodStreamScheduler.getCurrentSegment();
    setCurrentSegment(current);
    setScheduledSegments(moodStreamScheduler.getScheduledSegments());
  }, []);

  // 초기 로드: 첫 번째 무드스트림 생성
  useEffect(() => {
    generateMoodStream(Date.now());
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 주기적 확인: 재생성 필요 여부 체크 및 현재 세그먼트 업데이트
  useEffect(() => {
    // 1분마다 확인
    checkIntervalRef.current = setInterval(() => {
      updateCurrentSegment();
      checkAndRegenerate();
    }, 60 * 1000);

    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, [updateCurrentSegment, checkAndRegenerate]);

  // 현재 세그먼트 즉시 업데이트
  useEffect(() => {
    updateCurrentSegment();
  }, [updateCurrentSegment]);

  return {
    scheduledSegments,
    currentSegment,
    isGenerating,
    regenerate: () => {
      const nextStartTime = moodStreamScheduler.getNextSegmentStartTime();
      generateMoodStream(nextStartTime);
    },
  };
}

