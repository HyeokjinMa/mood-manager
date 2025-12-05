/**
 * DB에 음악 데이터가 있는지 확인하는 스크립트
 */

import { prisma } from "../src/lib/prisma";

async function main() {
  console.log("🔍 DB 음악 데이터 확인 중...\n");

  // Genre 개수 확인
  const genreCount = await prisma.genre.count();
  console.log(`📀 Genre 개수: ${genreCount}`);
  
  if (genreCount > 0) {
    const genres = await prisma.genre.findMany({
      include: {
        _count: {
          select: { sounds: true },
        },
      },
    });
    
    console.log("\n📋 Genre 목록:");
    for (const genre of genres) {
      console.log(`  - ${genre.name}: ${genre._count.sounds}개 Sound`);
    }
  }

  // Sound 개수 확인
  const soundCount = await prisma.sound.count();
  console.log(`\n🎵 Sound 개수: ${soundCount}`);

  if (soundCount > 0) {
    const sampleSounds = await prisma.sound.findMany({
      take: 5,
      include: {
        genre: true,
      },
    });
    
    console.log("\n📋 샘플 Sound 목록 (최대 5개):");
    for (const sound of sampleSounds) {
      console.log(`  - ${sound.name} (${sound.genre?.name || "No genre"})`);
      console.log(`    fileUrl: ${sound.fileUrl}`);
    }
  }

  console.log("\n✨ 확인 완료!");
}

main()
  .catch((e) => {
    console.error("❌ 에러:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

