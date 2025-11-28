// src/lib/constants/mood.ts
/**
 * 무드, 향, 음악 장르 상수 정의
 */

// 향 카테고리 (소문자, snake_case)
export const FRAGRANCE_CATEGORIES = [
  "musk",
  "aromatic",
  "woody",
  "citrus",
  "honey",
  "green",
  "dry",
  "leathery",
  "marine",
  "spicy",
  "floral",
  "powdery",
] as const;

export type FragranceCategory = (typeof FRAGRANCE_CATEGORIES)[number];

// 음악 장르 (소문자, snake_case)
export const SOUND_GENRES = [
  "classical",
  "jazz",
  "pop",
  "rock",
  "hiphop_rap",
  "rnb_soul",
  "electronic_dance",
  "folk",
  "newage",
  "reggae",
] as const;

export type SoundGenre = (typeof SOUND_GENRES)[number];

// 무드 패턴 (개선된 버전)
// 감정 클러스터별로 분류: 부정(-), 중립(0), 긍정(+)
export const MOOD_PATTERNS = [
  // 부정 클러스터 (-) → 안정 추구
  "Recovery Mode",      // 회복 모드 (스트레스 높을 때)
  "Calm Down",          // 진정 (불안/스트레스)
  
  // 중립 클러스터 (0) → 안정 유지
  "Deep Relax",         // 깊은 휴식 (저녁/밤)
  "Focus Mode",         // 집중 모드 (업무/학습)
  "Stabilizing Mood",   // 안정화 (일반 상태)
  
  // 긍정 클러스터 (+) → 긍정 강화
  "Bright Morning",     // 밝은 아침 (활기)
  "Energy Boost",       // 에너지 충전 (피로 회복)
  "Happy Light",        // 행복한 빛 (기쁨)
] as const;

export type MoodPattern = (typeof MOOD_PATTERNS)[number];

// 무드 패턴별 클러스터 매핑
export const MOOD_CLUSTER_MAP: Record<MoodPattern, '-' | '0' | '+'> = {
  "Recovery Mode": '-',
  "Calm Down": '-',
  "Deep Relax": '0',
  "Focus Mode": '0',
  "Stabilizing Mood": '0',
  "Bright Morning": '+',
  "Energy Boost": '+',
  "Happy Light": '+',
};

// 무드 패턴별 설명
export const MOOD_PATTERN_DESCRIPTIONS: Record<MoodPattern, string> = {
  "Recovery Mode": "스트레스가 높을 때 회복을 돕는 무드",
  "Calm Down": "불안이나 스트레스를 진정시키는 무드",
  "Deep Relax": "저녁이나 밤에 깊은 휴식을 제공하는 무드",
  "Focus Mode": "업무나 학습에 집중할 수 있도록 돕는 무드",
  "Stabilizing Mood": "일반적인 상태를 안정적으로 유지하는 무드",
  "Bright Morning": "아침에 활기를 주는 밝은 무드",
  "Energy Boost": "피로를 회복하고 에너지를 충전하는 무드",
  "Happy Light": "기쁨과 행복을 느낄 수 있는 밝은 무드",
};

