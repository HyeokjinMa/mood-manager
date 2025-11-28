// prisma/seed.ts
/**
 * [파일 역할]
 * - Prisma 시드 스크립트
 * - Fragrance, Light, Sound 테이블에 초기 데이터를 삽입합니다.
 * - src/types/mood.ts의 SCENT_DEFINITIONS와 MOODS를 기반으로 생성됩니다.
 *
 * [실행 방법]
 * npx prisma db seed
 *
 * [주의사항]
 * - 이미 데이터가 있으면 중복 삽입되지 않도록 upsert 사용
 * - Fragrance, Light, Sound는 Preset과 연결되므로 삭제 시 주의
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 시드 데이터 삽입 시작...");

  // ===================================================
  // 1. Fragrance 시드 데이터 (향)
  // ===================================================
  console.log("📦 Fragrance 데이터 삽입 중...");

  const fragrances = [
    // Musk (3개)
    {
      name: "Cloud",
      description: "부드럽고 아늑한 머스크 향",
      intensityLevel: 5,
      operatingMin: 30,
      componentsJson: { type: "Musk", baseNotes: ["White Musk", "Cotton"] },
    },
    {
      name: "Cloud Cream",
      description: "크리미한 머스크 향",
      intensityLevel: 6,
      operatingMin: 30,
      componentsJson: { type: "Musk", baseNotes: ["Musk", "Vanilla"] },
    },
    {
      name: "Cloud Beige",
      description: "따뜻한 베이지 머스크 향",
      intensityLevel: 7,
      operatingMin: 30,
      componentsJson: { type: "Musk", baseNotes: ["Musk", "Amber"] },
    },

    // Aromatic (2개)
    {
      name: "Herb",
      description: "상쾌한 허브 향",
      intensityLevel: 5,
      operatingMin: 25,
      componentsJson: { type: "Aromatic", topNotes: ["Sage", "Rosemary"] },
    },
    {
      name: "Lavender",
      description: "진정 효과가 있는 라벤더 향",
      intensityLevel: 6,
      operatingMin: 30,
      componentsJson: { type: "Aromatic", topNotes: ["Lavender", "Chamomile"] },
    },

    // Woody (3개)
    {
      name: "Wood",
      description: "깊고 진한 우디 향",
      intensityLevel: 7,
      operatingMin: 35,
      componentsJson: { type: "Woody", baseNotes: ["Sandalwood", "Cedar"] },
    },
    {
      name: "Wood Grey",
      description: "회갈색 우디 향",
      intensityLevel: 6,
      operatingMin: 30,
      componentsJson: { type: "Woody", baseNotes: ["Oakmoss", "Patchouli"] },
    },
    {
      name: "Wood Sepia",
      description: "짙은 세피아 우디 향",
      intensityLevel: 8,
      operatingMin: 40,
      componentsJson: { type: "Woody", baseNotes: ["Agarwood", "Vetiver"] },
    },

    // Citrus (3개)
    {
      name: "Orange",
      description: "상큼한 오렌지 향",
      intensityLevel: 7,
      operatingMin: 20,
      componentsJson: { type: "Citrus", topNotes: ["Orange", "Bergamot"] },
    },
    {
      name: "Lemon",
      description: "산뜻한 레몬 향",
      intensityLevel: 8,
      operatingMin: 20,
      componentsJson: { type: "Citrus", topNotes: ["Lemon", "Lime"] },
    },
    {
      name: "Lime",
      description: "청량한 라임 향",
      intensityLevel: 7,
      operatingMin: 20,
      componentsJson: { type: "Citrus", topNotes: ["Lime", "Grapefruit"] },
    },

    // Honey (3개)
    {
      name: "Honey",
      description: "달콤한 꿀 향",
      intensityLevel: 6,
      operatingMin: 25,
      componentsJson: { type: "Honey", middleNotes: ["Honey", "Beeswax"] },
    },
    {
      name: "Honeycomb",
      description: "벌집의 달콤한 향",
      intensityLevel: 7,
      operatingMin: 25,
      componentsJson: { type: "Honey", middleNotes: ["Honeycomb", "Propolis"] },
    },
    {
      name: "Honey Gold",
      description: "진한 골드 꿀 향",
      intensityLevel: 8,
      operatingMin: 30,
      componentsJson: { type: "Honey", middleNotes: ["Raw Honey", "Amber"] },
    },

    // Green (2개)
    {
      name: "Sprout",
      description: "신선한 새싹 향",
      intensityLevel: 6,
      operatingMin: 20,
      componentsJson: { type: "Green", topNotes: ["Green Leaves", "Grass"] },
    },
    {
      name: "Grass",
      description: "풀밭의 에메랄드 향",
      intensityLevel: 7,
      operatingMin: 25,
      componentsJson: { type: "Green", topNotes: ["Cut Grass", "Mint"] },
    },

    // Dry (2개)
    {
      name: "Earth",
      description: "따뜻한 흙 향",
      intensityLevel: 5,
      operatingMin: 30,
      componentsJson: { type: "Dry", baseNotes: ["Clay", "Sand"] },
    },
    {
      name: "Soil",
      description: "연한 회색빛 토양 향",
      intensityLevel: 4,
      operatingMin: 30,
      componentsJson: { type: "Dry", baseNotes: ["Dry Soil", "Stone"] },
    },

    // Leathery (3개)
    {
      name: "Leather",
      description: "고급스러운 가죽 향",
      intensityLevel: 7,
      operatingMin: 35,
      componentsJson: { type: "Leathery", baseNotes: ["Leather", "Suede"] },
    },
    {
      name: "Leather Stitch",
      description: "마호가니 가죽 향",
      intensityLevel: 8,
      operatingMin: 35,
      componentsJson: { type: "Leathery", baseNotes: ["Leather", "Tobacco"] },
    },
    {
      name: "Leather Black",
      description: "블랙 가죽 향",
      intensityLevel: 9,
      operatingMin: 40,
      componentsJson: { type: "Leathery", baseNotes: ["Black Leather", "Birch"] },
    },

    // Marine (2개)
    {
      name: "Wave",
      description: "시원한 파도 향",
      intensityLevel: 6,
      operatingMin: 25,
      componentsJson: { type: "Marine", topNotes: ["Sea Salt", "Ozone"] },
    },
    {
      name: "Shell",
      description: "신선한 조개 향",
      intensityLevel: 7,
      operatingMin: 25,
      componentsJson: { type: "Marine", topNotes: ["Aquatic", "Seaweed"] },
    },

    // Spicy (2개)
    {
      name: "Pepper",
      description: "따뜻한 후추 향",
      intensityLevel: 7,
      operatingMin: 30,
      componentsJson: { type: "Spicy", topNotes: ["Black Pepper", "Pink Pepper"] },
    },
    {
      name: "Cinnamon Stick",
      description: "달콤한 계피 향",
      intensityLevel: 8,
      operatingMin: 30,
      componentsJson: { type: "Spicy", middleNotes: ["Cinnamon", "Clove"] },
    },

    // Floral (3개)
    {
      name: "Rose",
      description: "우아한 장미 향",
      intensityLevel: 7,
      operatingMin: 25,
      componentsJson: { type: "Floral", middleNotes: ["Rose", "Peony"] },
    },
    {
      name: "Rose Coral",
      description: "코랄빛 장미 향",
      intensityLevel: 6,
      operatingMin: 25,
      componentsJson: { type: "Floral", middleNotes: ["Coral Rose", "Jasmine"] },
    },
    {
      name: "Rose Purple",
      description: "진한 자주색 장미 향",
      intensityLevel: 8,
      operatingMin: 30,
      componentsJson: { type: "Floral", middleNotes: ["Purple Rose", "Iris"] },
    },

    // Powdery (2개)
    {
      name: "Cosmetic",
      description: "파스텔 파우더 향",
      intensityLevel: 5,
      operatingMin: 20,
      componentsJson: { type: "Powdery", middleNotes: ["Powder", "Violet"] },
    },
    {
      name: "Powder",
      description: "부드러운 파우더 블루 향",
      intensityLevel: 6,
      operatingMin: 20,
      componentsJson: { type: "Powdery", middleNotes: ["Baby Powder", "Iris"] },
    },
  ];

  for (const fragrance of fragrances) {
    await prisma.fragrance.upsert({
      where: { id: fragrances.indexOf(fragrance) + 1 },
      update: {},
      create: {
        ...fragrance,
        componentsJson: fragrance.componentsJson,
      },
    });
  }

  console.log(`✅ Fragrance ${fragrances.length}개 삽입 완료`);

  // ===================================================
  // 2. Light 시드 데이터 (조명)
  // ===================================================
  console.log("💡 Light 데이터 삽입 중...");

  const lights = [
    // Calm 계열 (파란색 계열)
    { name: "Sky Blue", color: "#E6F3FF", brightness: 70 },
    { name: "Light Blue", color: "#D4E6F1", brightness: 75 },
    { name: "Azure Blue", color: "#AED6F1", brightness: 80 },

    // Focus 계열 (베이지/아이보리 계열)
    { name: "Ivory White", color: "#F5F5DC", brightness: 85 },
    { name: "Cream White", color: "#FFFDD0", brightness: 80 },
    { name: "Beige", color: "#F5DEB3", brightness: 75 },

    // Energy 계열 (노란색/오렌지 계열)
    { name: "Gold Yellow", color: "#FFD700", brightness: 90 },
    { name: "Orange", color: "#FFA500", brightness: 85 },
    { name: "Lime Green", color: "#32CD32", brightness: 80 },

    // Relax 계열 (녹색/갈색 계열)
    { name: "Sage Green", color: "#9CAF88", brightness: 65 },
    { name: "Lavender Purple", color: "#B19CD9", brightness: 60 },
    { name: "Brown", color: "#8B4513", brightness: 55 },

    // Romantic 계열 (핑크/레드 계열)
    { name: "Hot Pink", color: "#FF69B4", brightness: 70 },
    { name: "Coral", color: "#FF7F50", brightness: 75 },
    { name: "Dark Magenta", color: "#8B008B", brightness: 60 },
  ];

  for (const light of lights) {
    await prisma.light.upsert({
      where: { id: lights.indexOf(light) + 1 },
      update: {},
      create: light,
    });
  }

  console.log(`✅ Light ${lights.length}개 삽입 완료`);

  // ===================================================
  // 3. Sound 시드 데이터 (음악)
  // ===================================================
  console.log("🎵 Sound 데이터 삽입 중...");

  const sounds = [
    // Calm 계열
    { name: "Calm Breeze", fileUrl: "/sounds/calm-breeze.mp3" },
    { name: "Ocean Waves", fileUrl: "/sounds/ocean-waves.mp3" },
    { name: "Gentle Rain", fileUrl: "/sounds/gentle-rain.mp3" },

    // Focus 계열
    { name: "Deep Focus", fileUrl: "/sounds/deep-focus.mp3" },
    { name: "Concentration", fileUrl: "/sounds/concentration.mp3" },
    { name: "Study Time", fileUrl: "/sounds/study-time.mp3" },

    // Energy 계열
    { name: "Sunrise", fileUrl: "/sounds/sunrise.mp3" },
    { name: "Vitality", fileUrl: "/sounds/vitality.mp3" },
    { name: "Fresh Start", fileUrl: "/sounds/fresh-start.mp3" },

    // Relax 계열
    { name: "Soft Evening", fileUrl: "/sounds/soft-evening.mp3" },
    { name: "Peaceful Night", fileUrl: "/sounds/peaceful-night.mp3" },
    { name: "Cozy Fireplace", fileUrl: "/sounds/cozy-fireplace.mp3" },

    // Romantic 계열
    { name: "Love Song", fileUrl: "/sounds/love-song.mp3" },
    { name: "Intimate", fileUrl: "/sounds/intimate.mp3" },
    { name: "Passion", fileUrl: "/sounds/passion.mp3" },
  ];

  for (const sound of sounds) {
    await prisma.sound.upsert({
      where: { id: sounds.indexOf(sound) + 1 },
      update: {},
      create: sound,
    });
  }

  console.log(`✅ Sound ${sounds.length}개 삽입 완료`);

  console.log("🎉 시드 데이터 삽입 완료!");
  console.log(`   - Fragrance: ${fragrances.length}개`);
  console.log(`   - Light: ${lights.length}개`);
  console.log(`   - Sound: ${sounds.length}개`);
}

main()
  .catch((e) => {
    console.error("❌ 시드 데이터 삽입 실패:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
