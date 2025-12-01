/**
 * Fragrance & Genre 시드 데이터 생성
 * 
 * 설문 팝업에서 사용하는 모든 향과 장르를 DB에 추가
 */

import { prisma } from "@/lib/prisma";

// 설문 팝업에서 사용하는 향 옵션 (16개)
const FRAGRANCE_DATA = [
  { name: "Citrus", description: "상큼하고 활기찬 시트러스 향", color: "#FFD700" },
  { name: "Floral", description: "우아하고 부드러운 꽃 향", color: "#FF69B4" },
  { name: "Woody", description: "따뜻하고 안정적인 나무 향", color: "#8B4513" },
  { name: "Fresh", description: "상쾌하고 깨끗한 신선한 향", color: "#00CED1" },
  { name: "Spicy", description: "따뜻하고 자극적인 스파이시 향", color: "#FF4500" },
  { name: "Sweet", description: "달콤하고 포근한 단향", color: "#FFB6C1" },
  { name: "Herbal", description: "자연스럽고 힐링되는 허브 향", color: "#9CAF88" },
  { name: "Fruity", description: "달콤하고 상큼한 과일 향", color: "#FF6347" },
  { name: "Musk", description: "우아하고 관능적인 머스크 향", color: "#F5F5DC" },
  { name: "Aromatic", description: "향긋하고 아로마틱한 향", color: "#B19CD9" },
  { name: "Honey", description: "달콤하고 따뜻한 꿀 향", color: "#FFD700" },
  { name: "Green", description: "신선하고 자연스러운 그린 향", color: "#50C878" },
  { name: "Dry", description: "건조하고 따뜻한 드라이 향", color: "#CD853F" },
  { name: "Leathery", description: "고급스럽고 깊은 가죽 향", color: "#654321" },
  { name: "Marine", description: "시원하고 청량한 마린 향", color: "#87CEEB" },
  { name: "Powdery", description: "부드럽고 포근한 파우더 향", color: "#FFB6C1" },
];

// 설문 팝업에서 사용하는 음악 장르 옵션 (10개)
const GENRE_DATA = [
  { name: "newage", description: "뉴에이지 음악" },
  { name: "classical", description: "클래식 음악" },
  { name: "jazz", description: "재즈 음악" },
  { name: "ambient", description: "앰비언트 음악" },
  { name: "nature", description: "자연 소리" },
  { name: "meditation", description: "명상 음악" },
  { name: "piano", description: "피아노 음악" },
  { name: "guitar", description: "기타 음악" },
  { name: "orchestral", description: "오케스트라 음악" },
  { name: "electronic", description: "일렉트로닉 음악" },
];

/**
 * 향 이름을 소문자로 변환 (DB 저장용)
 * @internal
 */
function normalizeScentName(name: string): string {
  return name.toLowerCase();
}

/**
 * Fragrance 시드 데이터 생성 (중복 체크 후 추가)
 */
export async function seedFragrances(): Promise<number[]> {
  const fragranceIds: number[] = [];

  for (const fragranceData of FRAGRANCE_DATA) {
    const normalizedName = normalizeScentName(fragranceData.name);
    
    // 이미 존재하는지 확인
    const existing = await prisma.fragrance.findFirst({
      where: { name: { equals: fragranceData.name, mode: "insensitive" } },
    });

    if (existing) {
      // 이미 존재하면 ID만 추가하고 스킵
      fragranceIds.push(existing.id);
      continue;
    }

    // componentsJson 생성 (향 타입을 소문자로 변환)
    const componentsJson = {
      type: normalizedName,
      intensity: 5,
      notes: [],
    };

    const created = await prisma.fragrance.create({
      data: {
        name: fragranceData.name,
        description: fragranceData.description,
        color: fragranceData.color,
        intensityLevel: 5, // 기본 강도
        operatingMin: 30, // 기본 작동 시간 (분)
        componentsJson: componentsJson,
      },
    });

    fragranceIds.push(created.id);
  }

  return fragranceIds;
}

/**
 * Genre 시드 데이터 생성 (중복 체크 후 추가)
 */
export async function seedGenres(): Promise<number[]> {
  const genreIds: number[] = [];

  for (const genreData of GENRE_DATA) {
    // 이미 존재하는지 확인 (name은 unique)
    const existing = await prisma.genre.findUnique({
      where: { name: genreData.name },
    });

    if (existing) {
      // 이미 존재하면 ID만 추가하고 스킵
      genreIds.push(existing.id);
      continue;
    }

    const created = await prisma.genre.create({
      data: {
        name: genreData.name,
        description: genreData.description,
      },
    });

    genreIds.push(created.id);
  }

  return genreIds;
}

/**
 * 모든 시드 데이터 생성
 */
/**
 * 모든 시드 데이터 생성
 * 중복 체크 후 없는 항목만 추가
 */
export async function seedAll(): Promise<{ fragranceIds: number[]; genreIds: number[] }> {
  const fragranceIds = await seedFragrances();
  const genreIds = await seedGenres();

  return { fragranceIds, genreIds };
}

