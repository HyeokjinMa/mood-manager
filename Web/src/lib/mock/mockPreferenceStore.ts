/**
 * 목업 모드용 선호도 가중치 저장소 (메모리 기반)
 * 
 * 목업 모드일 때 DB 저장 없이 메모리에 가중치를 저장하여
 * 실제 로직을 실행하고 유효한 아웃풋을 생성할 수 있도록 함
 */

interface MockScentPreference {
  userId: string;
  scentName: string;
  weight: number;
}

interface MockGenrePreference {
  userId: string;
  genreName: string;
  weight: number;
}

// 메모리 기반 저장소
const mockScentPreferences = new Map<string, MockScentPreference>();
const mockGenrePreferences = new Map<string, MockGenrePreference>();

/**
 * 목업 향 선호도 조회
 */
export function getMockScentPreference(userId: string, scentName: string): MockScentPreference | null {
  const key = `${userId}:${scentName}`;
  return mockScentPreferences.get(key) || null;
}

/**
 * 목업 향 선호도 저장/업데이트
 */
export function upsertMockScentPreference(userId: string, scentName: string, weight: number): void {
  const key = `${userId}:${scentName}`;
  mockScentPreferences.set(key, {
    userId,
    scentName,
    weight,
  });
  console.log(`[MockPreferenceStore] 향 가중치 저장: ${scentName} = ${weight} (userId: ${userId})`);
}

/**
 * 목업 장르 선호도 조회
 */
export function getMockGenrePreference(userId: string, genreName: string): MockGenrePreference | null {
  const key = `${userId}:${genreName}`;
  return mockGenrePreferences.get(key) || null;
}

/**
 * 목업 장르 선호도 저장/업데이트
 */
export function upsertMockGenrePreference(userId: string, genreName: string, weight: number): void {
  const key = `${userId}:${genreName}`;
  mockGenrePreferences.set(key, {
    userId,
    genreName,
    weight,
  });
  console.log(`[MockPreferenceStore] 장르 가중치 저장: ${genreName} = ${weight} (userId: ${userId})`);
}

/**
 * 사용자의 모든 목업 향 선호도 조회
 */
export function getAllMockScentPreferences(userId: string): Record<string, number> {
  const weights: Record<string, number> = {};
  for (const [key, pref] of mockScentPreferences.entries()) {
    if (pref.userId === userId) {
      weights[pref.scentName] = pref.weight;
    }
  }
  return weights;
}

/**
 * 사용자의 모든 목업 장르 선호도 조회
 */
export function getAllMockGenrePreferences(userId: string): Record<string, number> {
  const weights: Record<string, number> = {};
  for (const [key, pref] of mockGenrePreferences.entries()) {
    if (pref.userId === userId) {
      weights[pref.genreName] = pref.weight;
    }
  }
  return weights;
}

/**
 * 목업 저장소 초기화 (사용자별)
 */
export function initializeMockPreferences(userId: string): void {
  // 초기 가중치 +1 부여 (모든 향과 장르에 대해)
  const allScents = [
    "Citrus", "Floral", "Woody", "Fresh", "Spicy", "Sweet", "Herbal", "Fruity",
    "Musk", "Aromatic", "Honey", "Green", "Dry", "Leathery", "Marine", "Powdery"
  ];
  const allGenres = [
    "newage", "classical", "jazz", "ambient", "nature",
    "meditation", "piano", "guitar", "orchestral", "electronic"
  ];

  // 이미 초기화되어 있으면 스킵
  const existingScent = getMockScentPreference(userId, allScents[0]);
  if (existingScent) {
    return; // 이미 초기화됨
  }

  // 초기 가중치 +1 부여
  for (const scentName of allScents) {
    upsertMockScentPreference(userId, scentName, 1);
  }
  for (const genreName of allGenres) {
    upsertMockGenrePreference(userId, genreName, 1);
  }

  console.log(`[MockPreferenceStore] 초기 가중치 부여 완료 (userId: ${userId})`);
}

