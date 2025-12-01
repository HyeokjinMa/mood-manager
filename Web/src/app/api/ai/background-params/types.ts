/**
 * background-params API 타입 정의
 */

import type { MoodStreamSegment } from "@/hooks/useMoodStream/types";

// PreprocessingResponse와 MoodStreamResponse는 prepareLLMInput.ts에 private interface로 정의되어 있음
// 여기서는 필요한 구조만 정의
interface PreprocessingResponse {
  average_stress_index: number;
  recent_stress_index: number;
  latest_sleep_score: number;
  latest_sleep_duration: number;
  weather: {
    temperature: number;
    humidity: number;
    rainType: number;
    sky: number;
  };
  emotionEvents?: {
    laughter: number[];
    sigh: number[];
    anger: number[];
    sadness: number[];
    neutral: number[];
  };
  emotionCounts?: {
    laughter: number;
    sigh: number;
    crying: number;
  };
  accumulationDurationSeconds?: number;
  lastResetTime?: number;
}

interface MoodStreamResponse {
  currentMood: {
    id: string;
    name: string;
    cluster: string;
    music: {
      genre: string;
      title: string;
    };
    scent: {
      type: string;
      name: string;
    };
    lighting: {
      color: string;
      rgb: [number, number, number];
    };
  };
  userDataCount: number;
}

export interface CommonData {
  preprocessed: PreprocessingResponse;
  moodStream: MoodStreamResponse & {
    moodStream: MoodStreamSegment[];
  };
}

export interface StreamHandlerParams {
  segments: MoodStreamSegment[];
  preprocessed: PreprocessingResponse;
  moodStream: MoodStreamResponse & {
    moodStream: MoodStreamSegment[];
  };
  userPreferences?: {
    music: Record<string, '+' | '-'>;
    color: Record<string, '+' | '-'>;
    scent: Record<string, '+' | '-'>;
  };
  forceFresh: boolean;
  userId: string; // 로그인 세션 기준 처리
  session?: { user?: { email?: string; id?: string } } | null; // 목업 모드 확인용
}

export interface ScentHandlerParams {
  segment: MoodStreamSegment;
  segmentIndexFromBody?: number;
  preprocessed: PreprocessingResponse;
  moodStream: MoodStreamResponse & {
    moodStream: MoodStreamSegment[];
  };
  userPreferences?: {
    music: Record<string, '+' | '-'>;
    color: Record<string, '+' | '-'>;
    scent: Record<string, '+' | '-'>;
  };
}

export interface MusicHandlerParams {
  segment: MoodStreamSegment;
  segmentIndexFromBody?: number;
  preprocessed: PreprocessingResponse;
  moodStream: MoodStreamResponse & {
    moodStream: MoodStreamSegment[];
  };
  userPreferences?: {
    music: Record<string, '+' | '-'>;
    color: Record<string, '+' | '-'>;
    scent: Record<string, '+' | '-'>;
  };
}

