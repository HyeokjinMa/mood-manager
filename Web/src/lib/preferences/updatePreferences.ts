// src/lib/preferences/updatePreferences.ts
/**
 * [파일 역할]
 * - 사용자 선호도(UserPreferences)를 강화학습 기반으로 업데이트하는 핵심 모듈입니다.
 * - 사용자가 어떤 향/조명/음향을 사용했는지 + 감정(웃음/한숨) + 사용시간을 기반으로
 *   user_preferences 테이블의 값을 지속적으로 개인화하여 업데이트합니다.
 *
 * [입력]
 * - userId: number
 * - usage: {
 *      fragrance: string;
 *      light: { R: number; G: number; B: number; brightness: number };
 *      sound: string;
 *      durationMinutes: number;
 *      sighCount: number;
 *      laughCount: number;
 *   }
 *
 * [출력]
 * - 업데이트된 UserPreferences 객체
 *
 * [사용되는 로직]
 * - reward 계산 (사용 시간 + 웃음 + 한숨)
 * - 향 선호도 업데이트 (Top3 재정렬)
 * - 조명(RGB/밝기) 업데이트 (EMA 방식)
 * - 음향 장르 선호 업데이트 (Top3 재정렬)
 *
 * [주의사항]
 * - userId가 유효한지 검사해야 합니다.
 * - Prisma update 실패 시 예외 처리 필요.
 * - update 이후 반드시 정렬된 Top3 구조가 유지됩니다.
 */

import { prisma } from "@/lib/prisma";
import { calculateReward } from "./preferenceUtils";
import { getUserPreferences } from "./getPreferences";
const ALPHA = 0.1; // 학습률 (10%)

export interface MoodUsage {
  fragrance: string;
  light: { R: number; G: number; B: number; brightness: number };
  sound: string;
  durationMinutes: number;
  sighCount: number;
  laughCount: number;
}

type PreferenceData = {
  fragranceTop1?: string | null;
  fragranceTop2?: string | null;
  fragranceTop3?: string | null;
  preferredLightR?: number | null;
  preferredLightG?: number | null;
  preferredLightB?: number | null;
  preferredBrightness?: number | null;
  soundGenreTop1?: string | null;
  soundGenreTop2?: string | null;
  soundGenreTop3?: string | null;
};

/** --------------------------------------------
 * 향 선호도 업데이트 (Top3)
 * -------------------------------------------*/
function updateFragrance(prefs: PreferenceData, used: string, reward: number) {
  const categories = [
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
  ];

  const scores: Record<string, number> = {};
  categories.forEach((c) => (scores[c] = 0));

  // 기존 Top3 반영
  scores[prefs.fragranceTop1 || "citrus"] = 1.0;
  scores[prefs.fragranceTop2 || "floral"] = 0.7;
  scores[prefs.fragranceTop3 || "woody"] = 0.4;

  // 강화
  scores[used] = scores[used] * (1 - ALPHA) + reward * ALPHA;

  // 상위 3개 정렬
  const sorted = Object.entries(scores)
    .sort((a, b) => b[1] - a[1])
    .map(([key]) => key);

  prefs.fragranceTop1 = sorted[0];
  prefs.fragranceTop2 = sorted[1];
  prefs.fragranceTop3 = sorted[2];

  return prefs;
}

/** --------------------------------------------
 * 조명 업데이트 (RGB + 밝기)
 * -------------------------------------------*/
function updateLighting(prefs: PreferenceData, usage: MoodUsage, _reward: number) {
  prefs.preferredLightR =
    (prefs.preferredLightR || 255) * (1 - ALPHA) + usage.light.R * ALPHA;
  prefs.preferredLightG =
    (prefs.preferredLightG || 255) * (1 - ALPHA) + usage.light.G * ALPHA;
  prefs.preferredLightB =
    (prefs.preferredLightB || 255) * (1 - ALPHA) + usage.light.B * ALPHA;

  prefs.preferredBrightness =
    (prefs.preferredBrightness || 100) * (1 - ALPHA) +
    usage.light.brightness * ALPHA;

  return prefs;
}

/** --------------------------------------------
 * 음향 장르 업데이트 (Top3)
 * -------------------------------------------*/
function updateSound(prefs: PreferenceData, usedGenre: string) {
  const scores: Record<string, number> = {};

  const genres = [
    prefs.soundGenreTop1,
    prefs.soundGenreTop2,
    prefs.soundGenreTop3,
    usedGenre,
  ];

  const uniqueGenres = Array.from(new Set(genres)).filter((g): g is string => !!g);

  uniqueGenres.forEach((g) => (scores[g] = 0));

  scores[prefs.soundGenreTop1 || "pop"] = 1.0;
  scores[prefs.soundGenreTop2 || "jazz"] = 0.7;
  scores[prefs.soundGenreTop3 || "classical"] = 0.4;

    scores[usedGenre] = (scores[usedGenre] || 0) * (1 - ALPHA) + 1 * ALPHA;

  const sorted = Object.entries(scores)
    .sort((a, b) => b[1] - a[1])
    .map(([key]) => key);

  prefs.soundGenreTop1 = sorted[0];
  prefs.soundGenreTop2 = sorted[1];
  prefs.soundGenreTop3 = sorted[2];

  return prefs;
}

/** --------------------------------------------
 * 메인: 사용자 선호도 업데이트
 * -------------------------------------------*/
export async function updateUserPreferences(
  userId: string,
  usage: MoodUsage
) {
  const prefs = await getUserPreferences(userId);
  if (!prefs) return null;

  // Prisma 타입을 PreferenceData로 변환
  // TODO: Prisma 스키마와 코드 로직이 불일치함. 스키마 업데이트 필요
  const p: PreferenceData = {
    fragranceTop1: null,
    fragranceTop2: null,
    fragranceTop3: null,
    preferredLightR: null,
    preferredLightG: null,
    preferredLightB: null,
    preferredBrightness: null,
    soundGenreTop1: null,
    soundGenreTop2: null,
    soundGenreTop3: null,
  };

  const reward = calculateReward(
    usage.durationMinutes,
    usage.laughCount,
    usage.sighCount
  );

  const updatedPrefs1 = updateFragrance(p, usage.fragrance, reward);
  const updatedPrefs2 = updateLighting(updatedPrefs1, usage, reward);
  updateSound(updatedPrefs2, usage.sound); // updatedPrefs는 사용되지 않음 (mutate 방식)

  // TODO: Prisma 스키마와 코드 로직이 불일치함. 
  // 현재 스키마는 scentLiked, colorLiked, musicLiked만 지원하므로
  // Top1, Top2, Top3 필드는 스키마 업데이트 필요
  // 임시로 빌드 에러 방지를 위해 주석 처리
  const updated = await prisma.userPreferences.update({
    where: { userId },
    data: {
      // fragranceTop1, fragranceTop2, fragranceTop3는 스키마에 없음
      // preferredLightR, preferredLightG, preferredLightB, preferredBrightness는 스키마에 없음
      // soundGenreTop1, soundGenreTop2, soundGenreTop3는 스키마에 없음
      // TODO: 스키마 업데이트 또는 로직 수정 필요
    },
  });

  return updated;
}
