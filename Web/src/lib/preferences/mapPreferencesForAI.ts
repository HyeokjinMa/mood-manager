// src/lib/preferences/mapPreferencesForAI.ts
/**
 * UserPreferences DB row → LLM Input 형식으로 변환
 *
 * [변환 로직]
 * - DB: 쉼표로 구분된 문자열 (예: "Citrus,Floral,Woody")
 * - LLM Input: Record<string, '+' | '-'> (예: { "citrus": "+", "floral": "+", "else": "+" })
 * - 선호 항목: '+' (좋아함)
 * - 비선호 항목: '-' (싫어함)
 * - 나머지 항목: 'else: +' (기본 긍정)
 */

import type { UserPreferences } from "@prisma/client";

type PreferenceMap = Record<string, '+' | '-'>;

/**
 * UserPreferences → LLM Input 형식 변환
 */
export function mapPreferencesForAI(prefs: UserPreferences | null) {
  // 기본값: 모든 항목 긍정
  const defaultPreferences: PreferenceMap = { else: "+" };

  if (!prefs) {
    return {
      music: defaultPreferences,
      color: defaultPreferences,
      scent: defaultPreferences,
    };
  }

  // 1. 향 선호도 변환
  const scent = convertToPreferenceMap(
    prefs.scentLiked,
    prefs.scentDisliked
  );

  // 2. 색상 선호도 변환
  const color = convertToPreferenceMap(
    prefs.colorLiked,
    prefs.colorDisliked
  );

  // 3. 음악 장르 선호도 변환
  const music = convertToPreferenceMap(
    prefs.musicLiked,
    prefs.musicDisliked
  );

  return {
    music: music,
    color: color,
    scent: scent,
  };
}

/**
 * 쉼표로 구분된 문자열을 PreferenceMap으로 변환
 *
 * @param liked - 좋아하는 항목들 (쉼표로 구분, 예: "Citrus,Floral,Woody")
 * @param disliked - 싫어하는 항목들 (쉼표로 구분, 예: "Musk,Leathery")
 * @returns PreferenceMap (예: { "citrus": "+", "floral": "+", "musk": "-", "else": "+" })
 *
 * [대소문자 정규화 규칙]
 * - DB 저장: 대문자 시작 (예: "Citrus", "Floral", "Woody")
 * - LLM Input: 소문자 (예: "citrus", "floral", "woody")
 * - 이유: src/types/mood.ts의 ScentType과 일치시키기 위함
 */
function convertToPreferenceMap(
  liked: string | null | undefined,
  disliked: string | null | undefined
): PreferenceMap {
  const result: PreferenceMap = {};

  // 좋아하는 항목들 추가 (대문자 → 소문자 변환)
  if (liked) {
    const likedItems = liked.split(',').map(s => s.trim()).filter(Boolean);
    likedItems.forEach(item => {
      result[item.toLowerCase()] = '+';  // LLM Input 형식: 소문자
    });
  }

  // 싫어하는 항목들 추가 (대문자 → 소문자 변환)
  if (disliked) {
    const dislikedItems = disliked.split(',').map(s => s.trim()).filter(Boolean);
    dislikedItems.forEach(item => {
      result[item.toLowerCase()] = '-';  // LLM Input 형식: 소문자
    });
  }

  // 기본값 추가
  result.else = '+';

  return result;
}
