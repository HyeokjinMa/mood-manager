/**
 * File: src/types/mood.ts
 *
 * Mood Type Definition
 */

// 향 타입 (기존 호환성을 위해 PascalCase 유지, 내부적으로는 소문자 사용)
export type ScentType =
  | "Musk"
  | "Aromatic"
  | "Woody"
  | "Citrus"
  | "Honey"
  | "Green"
  | "Dry"
  | "Leathery"
  | "Marine"
  | "Spicy"
  | "Floral"
  | "Powdery";

// 향 카테고리 변환 헬퍼 (PascalCase → snake_case)
export function scentTypeToCategory(scentType: ScentType): string {
  const map: Record<ScentType, string> = {
    Musk: "musk",
    Aromatic: "aromatic",
    Woody: "woody",
    Citrus: "citrus",
    Honey: "honey",
    Green: "green",
    Dry: "dry",
    Leathery: "leathery",
    Marine: "marine",
    Spicy: "spicy",
    Floral: "floral",
    Powdery: "powdery",
  };
  return map[scentType];
}

export interface Scent {
  type: ScentType;
  name: string;
  color: string; // HEX color
}

export interface Mood {
  id: string;
  name: string;
  color: string; // HEX color for dashboard background
  song: {
    title: string;
    duration: number;
  };
  scent: Scent;
}

// 향 타입별 정의
export const SCENT_DEFINITIONS: Record<ScentType, Scent[]> = {
  Musk: [
    { type: "Musk", name: "Cloud", color: "#F5F5DC" }, // 아이보리
    { type: "Musk", name: "Cloud", color: "#FFFDD0" }, // 크림
    { type: "Musk", name: "Cloud", color: "#F5DEB3" }, // 연한 베이지
  ],
  Aromatic: [
    { type: "Aromatic", name: "Herb", color: "#9CAF88" }, // 세이지 그린
    { type: "Aromatic", name: "Lavender", color: "#B19CD9" }, // 라벤더 퍼플
  ],
  Woody: [
    { type: "Woody", name: "Wood", color: "#8B4513" }, // 진한 갈색
    { type: "Woody", name: "Wood", color: "#A0826D" }, // 회갈색
    { type: "Woody", name: "Wood", color: "#704214" }, // 짙은 세피아
  ],
  Citrus: [
    { type: "Citrus", name: "Orange", color: "#FFD700" }, // 선명한 노란색
    { type: "Citrus", name: "Lemon", color: "#FFA500" }, // 밝은 주황색
    { type: "Citrus", name: "Lime", color: "#32CD32" }, // 라임 그린
  ],
  Honey: [
    { type: "Honey", name: "Honey", color: "#FFD700" }, // 골드
    { type: "Honey", name: "Honeycomb", color: "#FFBF00" }, // 앰버
    { type: "Honey", name: "Honey", color: "#FFD700" }, // 짙은 노란색
  ],
  Green: [
    { type: "Green", name: "Sprout", color: "#00FF00" }, // 선명한 녹색
    { type: "Green", name: "Grass", color: "#50C878" }, // 에메랄드 그린
  ],
  Dry: [
    { type: "Dry", name: "Earth", color: "#CD853F" }, // 황토색
    { type: "Dry", name: "Soil", color: "#A9A9A9" }, // 연한 회색빛 갈색
  ],
  Leathery: [
    { type: "Leathery", name: "Leather", color: "#654321" }, // 다크 브라운
    { type: "Leathery", name: "Leather Stitch", color: "#800000" }, // 마호가니
    { type: "Leathery", name: "Leather", color: "#000000" }, // 블랙
  ],
  Marine: [
    { type: "Marine", name: "Wave", color: "#87CEEB" }, // 연한 하늘색
    { type: "Marine", name: "Shell", color: "#00CED1" }, // 아쿠아 블루
  ],
  Spicy: [
    { type: "Spicy", name: "Pepper", color: "#8B4513" }, // 붉은 갈색
    { type: "Spicy", name: "Cinnamon Stick", color: "#FF4500" }, // 오렌지 레드
  ],
  Floral: [
    { type: "Floral", name: "Rose", color: "#FF69B4" }, // 분홍색
    { type: "Floral", name: "Rose", color: "#FF7F50" }, // 코랄
    { type: "Floral", name: "Rose", color: "#8B008B" }, // 진한 자주색
  ],
  Powdery: [
    { type: "Powdery", name: "Cosmetic", color: "#FFB6C1" }, // 연한 파스텔 핑크
    { type: "Powdery", name: "Powder", color: "#B0E0E6" }, // 파우더 블루
  ],
};

// 향 카테고리별 설명
export const SCENT_DESCRIPTIONS: Record<ScentType, string> = {
  Musk: "부드럽고 따뜻한 향으로 편안함과 안정감을 줍니다.",
  Aromatic: "상쾌하고 허브 향으로 집중력 향상과 스트레스 완화에 도움이 됩니다.",
  Woody: "깊고 따뜻한 나무 향으로 차분함과 안정감을 제공합니다.",
  Citrus: "밝고 상쾌한 과일 향으로 활력과 기분 전환에 좋습니다.",
  Honey: "달콤하고 따뜻한 꿀 향으로 편안함과 행복감을 줍니다.",
  Green: "신선하고 자연스러운 풀 향으로 상쾌함과 활력을 줍니다.",
  Dry: "건조하고 따뜻한 대지 향으로 차분함과 안정감을 제공합니다.",
  Leathery: "고급스럽고 따뜻한 가죽 향으로 세련됨과 편안함을 줍니다.",
  Marine: "시원하고 상쾌한 바다 향으로 활력과 기분 전환에 좋습니다.",
  Spicy: "따뜻하고 자극적인 향으로 활력과 집중력 향상에 도움이 됩니다.",
  Floral: "부드럽고 달콤한 꽃 향으로 편안함과 행복감을 줍니다.",
  Powdery: "부드럽고 따뜻한 파우더 향으로 편안함과 안정감을 제공합니다.",
};

// 무드 데이터 (각 무드별 3개 세트)
export const MOODS: Mood[] = [
  // 무드 1: Calm
  {
    id: "calm-1",
    name: "Calm Breeze",
    color: "#E6F3FF",
    song: { title: "Calm Breeze", duration: 182 },
    scent: SCENT_DEFINITIONS.Marine[0],
  },
  {
    id: "calm-2",
    name: "Calm Breeze",
    color: "#D4E6F1",
    song: { title: "Ocean Waves", duration: 195 },
    scent: SCENT_DEFINITIONS.Marine[1],
  },
  {
    id: "calm-3",
    name: "Calm Breeze",
    color: "#AED6F1",
    song: { title: "Gentle Rain", duration: 210 },
    scent: SCENT_DEFINITIONS.Green[0],
  },
  // 무드 2: Focus
  {
    id: "focus-1",
    name: "Deep Focus",
    color: "#F5F5DC",
    song: { title: "Deep Focus", duration: 240 },
    scent: SCENT_DEFINITIONS.Musk[0],
  },
  {
    id: "focus-2",
    name: "Deep Focus",
    color: "#FFFDD0",
    song: { title: "Concentration", duration: 220 },
    scent: SCENT_DEFINITIONS.Musk[1],
  },
  {
    id: "focus-3",
    name: "Deep Focus",
    color: "#F5DEB3",
    song: { title: "Study Time", duration: 200 },
    scent: SCENT_DEFINITIONS.Musk[2],
  },
  // 무드 3: Energy
  {
    id: "energy-1",
    name: "Morning Energy",
    color: "#FFD700",
    song: { title: "Sunrise", duration: 180 },
    scent: SCENT_DEFINITIONS.Citrus[0],
  },
  {
    id: "energy-2",
    name: "Morning Energy",
    color: "#FFA500",
    song: { title: "Vitality", duration: 190 },
    scent: SCENT_DEFINITIONS.Citrus[1],
  },
  {
    id: "energy-3",
    name: "Morning Energy",
    color: "#32CD32",
    song: { title: "Fresh Start", duration: 175 },
    scent: SCENT_DEFINITIONS.Citrus[2],
  },
  // 무드 4: Relax
  {
    id: "relax-1",
    name: "Evening Relax",
    color: "#9CAF88",
    song: { title: "Soft Evening", duration: 195 },
    scent: SCENT_DEFINITIONS.Aromatic[0],
  },
  {
    id: "relax-2",
    name: "Evening Relax",
    color: "#B19CD9",
    song: { title: "Peaceful Night", duration: 210 },
    scent: SCENT_DEFINITIONS.Aromatic[1],
  },
  {
    id: "relax-3",
    name: "Evening Relax",
    color: "#8B4513",
    song: { title: "Cozy Fireplace", duration: 225 },
    scent: SCENT_DEFINITIONS.Woody[0],
  },
  // 무드 5: Romantic
  {
    id: "romantic-1",
    name: "Romantic Night",
    color: "#FF69B4",
    song: { title: "Love Song", duration: 200 },
    scent: SCENT_DEFINITIONS.Floral[0],
  },
  {
    id: "romantic-2",
    name: "Romantic Night",
    color: "#FF7F50",
    song: { title: "Intimate", duration: 185 },
    scent: SCENT_DEFINITIONS.Floral[1],
  },
  {
    id: "romantic-3",
    name: "Romantic Night",
    color: "#8B008B",
    song: { title: "Passion", duration: 195 },
    scent: SCENT_DEFINITIONS.Floral[2],
  },
];

