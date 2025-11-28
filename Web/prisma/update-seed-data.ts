// prisma/update-seed-data.ts
/**
 * 기존 Seed 데이터 업데이트 스크립트
 * - Fragrance 테이블에 color 필드 추가
 * - Sound 테이블에 duration 필드 추가
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// 향 타입별 대표 색상
const fragranceColors: Record<string, string> = {
  Musk: "#F5F5DC", // Beige
  Aromatic: "#E6E6FA", // Lavender
  Woody: "#8B4513", // SaddleBrown
  Citrus: "#FFD700", // Gold
  Honey: "#FFA500", // Orange
  Green: "#90EE90", // LightGreen
  Dry: "#D2B48C", // Tan
  Leathery: "#654321", // Dark Brown
  Marine: "#87CEEB", // Sky Blue
  Spicy: "#FF6347", // Tomato
  Floral: "#FFB6C1", // Light Pink
  Powdery: "#FFE4E1", // Misty Rose
};

async function main() {
  console.log("🔄 Seed 데이터 업데이트 시작...\n");

  try {
    // 1. Fragrance 테이블 color 업데이트
    console.log("📦 Fragrance color 업데이트 중...");

    const fragrances = await prisma.fragrance.findMany();
    let fragranceUpdateCount = 0;

    for (const fragrance of fragrances) {
      const components = fragrance.componentsJson as any;
      const fragranceType = components.type || "Musk";
      const color = fragranceColors[fragranceType] || "#FFFFFF";

      await prisma.fragrance.update({
        where: { id: fragrance.id },
        data: { color },
      });

      console.log(`  ✅ ${fragrance.name}: ${color} (${fragranceType})`);
      fragranceUpdateCount++;
    }

    console.log(`\n✅ Fragrance 업데이트 완료: ${fragranceUpdateCount}개\n`);

    // 2. Sound 테이블 duration 업데이트
    console.log("🎵 Sound duration 업데이트 중...");

    const sounds = await prisma.sound.findMany();
    let soundUpdateCount = 0;

    // 기본 duration: 180초 (3분)
    const defaultDuration = 180;

    // 특정 곡에 맞는 duration (예시)
    const soundDurations: Record<string, number> = {
      "Calm Breeze": 182,
      "Deep Focus": 240,
      "Ocean Waves": 195,
      "Gentle Rain": 210,
      "Sunrise": 180,
      "Morning Coffee": 165,
      "Night Sky": 220,
      "Forest Walk": 205,
      "Cozy Evening": 190,
      "Bright Day": 175,
    };

    for (const sound of sounds) {
      const duration = soundDurations[sound.name] || defaultDuration;

      await prisma.sound.update({
        where: { id: sound.id },
        data: { duration },
      });

      console.log(`  ✅ ${sound.name}: ${duration}초`);
      soundUpdateCount++;
    }

    console.log(`\n✅ Sound 업데이트 완료: ${soundUpdateCount}개\n`);

    console.log("🎉 모든 데이터 업데이트 완료!");
  } catch (error) {
    console.error("❌ 업데이트 중 오류 발생:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
