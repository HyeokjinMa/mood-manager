// src/lib/mock/savedMoodsStorage.ts
/**
 * 관리자 모드용 저장된 무드 관리 (localStorage 기반)
 * 
 * 일회성 정보이지만 발표 시연을 위해 정보가 연결되도록 localStorage 사용
 */

const STORAGE_KEY = "admin_saved_moods";

export interface SavedMood {
  id: string;
  moodId: string;
  moodName: string;
  moodColor: string;
  music: {
    genre: string;
    title: string;
  };
  scent: {
    type: string;
    name: string;
  };
  preferenceCount: number;
  savedAt: number;
}

/**
 * 저장된 무드 목록 가져오기
 */
export function getSavedMoods(): SavedMood[] {
  if (typeof window === "undefined") return [];
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored) as SavedMood[];
  } catch (error) {
    console.error("Error loading saved moods from localStorage:", error);
    return [];
  }
}

/**
 * 무드 저장
 */
export function saveMood(mood: SavedMood): void {
  if (typeof window === "undefined") return;
  
  try {
    const savedMoods = getSavedMoods();
    // 중복 체크 (같은 moodId가 이미 있으면 제거)
    const filtered = savedMoods.filter((m) => m.moodId !== mood.moodId);
    const updated = [...filtered, mood];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error("Error saving mood to localStorage:", error);
  }
}

/**
 * 무드 삭제
 */
export function deleteSavedMood(savedMoodId: string): void {
  if (typeof window === "undefined") return;
  
  try {
    const savedMoods = getSavedMoods();
    const filtered = savedMoods.filter((m) => m.id !== savedMoodId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error("Error deleting saved mood from localStorage:", error);
  }
}

/**
 * 저장된 무드 ID로 조회
 */
export function getSavedMoodById(savedMoodId: string): SavedMood | null {
  const savedMoods = getSavedMoods();
  return savedMoods.find((m) => m.id === savedMoodId) || null;
}

/**
 * 샘플 무드 데이터 초기화 (관리자 모드용)
 * 이미 데이터가 있으면 초기화하지 않음
 */
export function initializeSampleMoods(): void {
  if (typeof window === "undefined") return;
  
  const existing = getSavedMoods();
  if (existing.length > 0) return; // 이미 데이터가 있으면 초기화하지 않음
  
  const now = Date.now();
  const sampleMoods: SavedMood[] = [
    {
      id: `saved-${now - 11 * 60000}`,
      moodId: "sample-1",
      moodName: "Bright Morning Bliss",
      moodColor: "#FFD700",
      music: { genre: "newage", title: "Morning Light" },
      scent: { type: "Citrus", name: "Lemon Zest" },
      preferenceCount: 0,
      savedAt: now - 11 * 60000,
    },
    {
      id: `saved-${now - 10 * 60000}`,
      moodId: "sample-2",
      moodName: "Calm Ocean Breeze",
      moodColor: "#87CEEB",
      music: { genre: "ambient", title: "Ocean Waves" },
      scent: { type: "Marine", name: "Sea Salt" },
      preferenceCount: 0,
      savedAt: now - 10 * 60000,
    },
    {
      id: `saved-${now - 9 * 60000}`,
      moodId: "sample-3",
      moodName: "Cozy Evening Warmth",
      moodColor: "#FF6B6B",
      music: { genre: "jazz", title: "Evening Jazz" },
      scent: { type: "Woody", name: "Cedar Wood" },
      preferenceCount: 0,
      savedAt: now - 9 * 60000,
    },
    {
      id: `saved-${now - 8 * 60000}`,
      moodId: "sample-4",
      moodName: "Fresh Spring Garden",
      moodColor: "#90EE90",
      music: { genre: "classical", title: "Spring Sonata" },
      scent: { type: "Floral", name: "Rose Garden" },
      preferenceCount: 0,
      savedAt: now - 8 * 60000,
    },
    {
      id: `saved-${now - 7 * 60000}`,
      moodId: "sample-5",
      moodName: "Energizing Citrus Burst",
      moodColor: "#FFA500",
      music: { genre: "pop", title: "Upbeat Pop" },
      scent: { type: "Citrus", name: "Orange Blossom" },
      preferenceCount: 0,
      savedAt: now - 7 * 60000,
    },
    {
      id: `saved-${now - 6 * 60000}`,
      moodId: "sample-6",
      moodName: "Serene Forest Walk",
      moodColor: "#228B22",
      music: { genre: "nature", title: "Forest Sounds" },
      scent: { type: "Green", name: "Pine Needles" },
      preferenceCount: 0,
      savedAt: now - 6 * 60000,
    },
    {
      id: `saved-${now - 5 * 60000}`,
      moodId: "sample-7",
      moodName: "Warm Honey Glow",
      moodColor: "#FFD700",
      music: { genre: "acoustic", title: "Honey Melody" },
      scent: { type: "Honey", name: "Golden Honey" },
      preferenceCount: 0,
      savedAt: now - 5 * 60000,
    },
    {
      id: `saved-${now - 4 * 60000}`,
      moodId: "sample-8",
      moodName: "Mystical Moonlight",
      moodColor: "#9370DB",
      music: { genre: "ambient", title: "Moonlight Sonata" },
      scent: { type: "Musk", name: "Midnight Musk" },
      preferenceCount: 0,
      savedAt: now - 4 * 60000,
    },
    {
      id: `saved-${now - 3 * 60000}`,
      moodId: "sample-9",
      moodName: "Spicy Autumn Spice",
      moodColor: "#CD5C5C",
      music: { genre: "world", title: "Spice Market" },
      scent: { type: "Spicy", name: "Cinnamon Spice" },
      preferenceCount: 0,
      savedAt: now - 3 * 60000,
    },
    {
      id: `saved-${now - 2 * 60000}`,
      moodId: "sample-10",
      moodName: "Powdery Soft Clouds",
      moodColor: "#E6E6FA",
      music: { genre: "lounge", title: "Cloud Dreams" },
      scent: { type: "Powdery", name: "Soft Powder" },
      preferenceCount: 0,
      savedAt: now - 2 * 60000,
    },
    {
      id: `saved-${now - 1 * 60000}`,
      moodId: "sample-11",
      moodName: "Leathery Vintage Charm",
      moodColor: "#8B4513",
      music: { genre: "blues", title: "Vintage Blues" },
      scent: { type: "Leathery", name: "Old Leather" },
      preferenceCount: 0,
      savedAt: now - 1 * 60000,
    },
  ];
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sampleMoods));
  } catch (error) {
    console.error("Error initializing sample moods:", error);
  }
}

