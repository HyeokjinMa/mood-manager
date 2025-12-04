// src/lib/llm/prepareLLMInput.ts
/**
 * LLM Input 준비
 * 
 * 백엔드 API 응답을 조합하여 LLM 프롬프트에 전송할 Input 생성
 */

import { detectCurrentEvent } from "@/lib/events/detectEvents";

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
  emotionEvents: {
    laughter: number[];
    sigh: number[];
    anger: number[];
    sadness: number[];
    neutral: number[];
  };
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

interface UserPreferences {
  music: Record<string, '+' | '-'>;
  color: Record<string, '+' | '-'>;
  scent: Record<string, '+' | '-'>;
}

export interface LLMInput {
  moodName: string;
  musicGenre: string;
  scentType: string;
  preprocessed: PreprocessingResponse;
  userPreferences: UserPreferences;
  timeOfDay?: number;
  currentCluster?: string;
  userDataCount?: number;
  previousMood?: string;
  season?: string;
  event?: {
    type: string;
    name: string;
    description: string;
    musicCategory?: string;
    iconSet: string[];
  } | null;
}

/**
 * 계절 추론
 */
function inferSeason(month: number): string {
  if (month >= 3 && month <= 5) return "Spring";
  if (month >= 6 && month <= 8) return "Summer";
  if (month >= 9 && month <= 11) return "Autumn";
  return "Winter";
}

/**
 * 기본 사용자 선호도 (콜드스타트)
 * 
 * 프로젝트 목적: 정서적 안정과 긍정적 독려
 * - 부정 클러스터(-) → 중립/긍정 무드 선호
 * - 중립/긍정 클러스터 → 긍정적 무드 선호
 */
function getDefaultUserPreferences(): UserPreferences {
  return {
    music: {
      // 기본적으로 차분하고 긍정적인 장르 선호
      "classical": "+",
      "jazz": "+",
      "newage": "+",
      "folk": "+",
      "pop": "+",
      "reggae": "+",
      // 자극적인 장르는 비선호
      "hiphop_rap": "-",
      "rnb_soul": "-",
      "electronic_dance": "-",
      "rock": "-",
      "else": "+",
    },
    color: {
      // 어두운 색상 비선호
      "black": "-",
      // 밝고 따뜻한 색상 선호
      "white": "+",
      "blue": "+",
      "yellow": "+",
      "purple": "+",
      "orange": "+",
      "red": "+",
      "green": "+", // 자연스러운 색상
      "else": "+",
    },
    scent: {
      // 자극적인 향 비선호
      "spicy": "-",
      // 차분하고 긍정적인 향 선호
      "citrus": "+",
      "floral": "+",
      "woody": "+",
      "marine": "+",
      "musk": "+",
      "aromatic": "+",
      "honey": "+",
      "powdery": "+",
      "green": "+",
      "dry": "+",
      "leathery": "-",
      "else": "+",
    },
  };
}

/**
 * LLM Input 준비
 */
export async function prepareLLMInput(
  preprocessed: PreprocessingResponse,
  moodStream: MoodStreamResponse,
  userPreferences?: UserPreferences
): Promise<LLMInput> {
  const timeOfDay = new Date().getHours();
  const season = inferSeason(new Date().getMonth() + 1);
  
  // 현재 이벤트 감지 (크리스마스, 신년 등)
  const currentEvent = detectCurrentEvent();

  return {
    moodName: moodStream.currentMood.name,
    musicGenre: moodStream.currentMood.music.genre,
    scentType: moodStream.currentMood.scent.type,
    preprocessed,
    userPreferences: userPreferences || getDefaultUserPreferences(),
    timeOfDay,
    currentCluster: moodStream.currentMood.cluster,
    userDataCount: moodStream.userDataCount,
    season,
    event: currentEvent ? {
      type: currentEvent.type || "",
      name: currentEvent.name,
      description: currentEvent.description,
      musicCategory: currentEvent.musicCategory,
      iconSet: currentEvent.iconSet,
    } : null,
  };
}

