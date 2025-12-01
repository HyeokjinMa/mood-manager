/**
 * 사용자 선호도 가중치 조회
 */

import { prisma } from "@/lib/prisma";
import { normalizeWeightMap, formatWeightsForLLM } from "./normalizeWeights";
import { isMockMode } from "@/lib/auth/mockMode";
import {
  getAllMockScentPreferences,
  getAllMockGenrePreferences,
} from "@/lib/mock/mockPreferenceStore";

/**
 * 목업 가중치 데이터 (관리자 모드용)
 */
const MOCK_SCENT_WEIGHTS: Record<string, number> = {
  "Citrus": 11,    // 초기 1 + 설문 호 10
  "Floral": 11,
  "Woody": 11,
  "Fresh": 11,
  "Spicy": 2,      // 초기 1 + 설문 불호 1
  "Sweet": 11,
  "Herbal": 11,
  "Fruity": 11,
  "Musk": 11,
  "Aromatic": 11,
  "Honey": 11,
  "Green": 11,
  "Dry": 2,
  "Leathery": 2,
  "Marine": 11,
  "Powdery": 11,
};

const MOCK_GENRE_WEIGHTS: Record<string, number> = {
  "newage": 11,
  "classical": 11,
  "jazz": 11,
  "ambient": 11,
  "nature": 11,
  "meditation": 11,
  "piano": 11,
  "guitar": 2,
  "orchestral": 2,
  "electronic": 11,
};

/**
 * 사용자의 향 선호도 가중치 조회 및 정규화
 */
export async function getUserScentWeights(userId: string, session?: { user?: { email?: string; id?: string } } | null): Promise<Record<string, number>> {
  // 목업 모드 확인
  if (session) {
    const isMock = await isMockMode(session);
    if (isMock) {
      // 목업 모드: 메모리 저장소에서 조회 (실제 로직 실행 결과)
      const mockWeights = getAllMockScentPreferences(userId);
      if (Object.keys(mockWeights).length > 0) {
        console.log("[getUserScentWeights] 목업 모드: 메모리 저장소에서 가중치 조회");
        return normalizeWeightMap(mockWeights);
      }
      // 메모리 저장소에 데이터가 없으면 기본 목업 가중치 반환
      console.log("[getUserScentWeights] 목업 모드: 기본 목업 가중치 반환");
      return normalizeWeightMap(MOCK_SCENT_WEIGHTS);
    }
  }

  try {
    const preferences = await prisma.scentPreference.findMany({
      where: { userId },
      include: {
        scent: {
          select: { name: true },
        },
      },
    });

    // 가중치 맵 생성 { fragranceName: weight }
    const weightMap: Record<string, number> = {};
    preferences.forEach((pref) => {
      weightMap[pref.scent.name] = pref.weight;
    });

    // 정규화
    return normalizeWeightMap(weightMap);
  } catch (error) {
    console.error("[getUserScentWeights] 가중치 조회 실패:", error);
    return {};
  }
}

/**
 * 사용자의 장르 선호도 가중치 조회 및 정규화
 */
export async function getUserGenreWeights(userId: string, session?: { user?: { email?: string; id?: string } } | null): Promise<Record<string, number>> {
  // 목업 모드 확인
  if (session) {
    const isMock = await isMockMode(session);
    if (isMock) {
      // 목업 모드: 메모리 저장소에서 조회 (실제 로직 실행 결과)
      const mockWeights = getAllMockGenrePreferences(userId);
      if (Object.keys(mockWeights).length > 0) {
        console.log("[getUserGenreWeights] 목업 모드: 메모리 저장소에서 가중치 조회");
        return normalizeWeightMap(mockWeights);
      }
      // 메모리 저장소에 데이터가 없으면 기본 목업 가중치 반환
      console.log("[getUserGenreWeights] 목업 모드: 기본 목업 가중치 반환");
      return normalizeWeightMap(MOCK_GENRE_WEIGHTS);
    }
  }

  try {
    const preferences = await prisma.genrePreference.findMany({
      where: { userId },
      include: {
        genre: {
          select: { name: true },
        },
      },
    });

    // 가중치 맵 생성 { genreName: weight }
    const weightMap: Record<string, number> = {};
    preferences.forEach((pref) => {
      weightMap[pref.genre.name] = pref.weight;
    });

    // 정규화
    return normalizeWeightMap(weightMap);
  } catch (error) {
    console.error("[getUserGenreWeights] 가중치 조회 실패:", error);
    return {};
  }
}

/**
 * 사용자의 모든 선호도 가중치 조회 (향 + 장르)
 */
export async function getAllUserPreferenceWeights(userId: string, session?: { user?: { email?: string; id?: string } } | null): Promise<{
  scents: Record<string, number>;
  genres: Record<string, number>;
}> {
  const [scents, genres] = await Promise.all([
    getUserScentWeights(userId, session),
    getUserGenreWeights(userId, session),
  ]);

  return { scents, genres };
}

/**
 * LLM 프롬프트용 가중치 포맷팅 (향 + 장르)
 */
export async function formatPreferenceWeightsForLLM(userId: string, session?: { user?: { email?: string; id?: string } } | null): Promise<string> {
  try {
    const { scents, genres } = await getAllUserPreferenceWeights(userId, session);

    const scentSection = formatWeightsForLLM(scents);
    const genreSection = formatWeightsForLLM(genres);

    return `[USER PREFERENCE WEIGHTS]

Fragrance Preferences (higher = more preferred):
${scentSection}

Genre Preferences (higher = more preferred):
${genreSection}

Please prioritize items with higher weights when selecting fragrances and genres for mood generation.`;
  } catch (error) {
    console.error("[formatPreferenceWeightsForLLM] 가중치 포맷팅 실패:", error);
    return "[USER PREFERENCE WEIGHTS]\n  (선호도 정보를 불러올 수 없음)";
  }
}

