/**
 * 이전 목업/잘못된 형식의 음악 데이터 삭제 스크립트
 * 
 * 올바른 형식만 남기고 나머지 삭제:
 * - fileUrl이 /musics/{Genre}/ 형식인 것만 유지
 * - 나머지 (/audio/mock/, /music/ 등) 모두 삭제
 */

import { prisma } from "../src/lib/prisma";

async function main() {
  console.log("🧹 이전 목업/잘못된 형식의 음악 데이터 정리 시작...\n");

  try {
    // 1. 올바른 형식의 데이터 확인
    const correctSounds = await prisma.sound.findMany({
      where: {
        fileUrl: {
          startsWith: "/musics/",
        },
      },
      select: {
        id: true,
        name: true,
        fileUrl: true,
      },
    });

    console.log(`✅ 올바른 형식의 데이터: ${correctSounds.length}개`);
    console.log(`   예시: ${correctSounds[0]?.fileUrl || "없음"}\n`);

    // 2. 삭제할 데이터 확인
    const toDelete = await prisma.sound.findMany({
      where: {
        NOT: {
          fileUrl: {
            startsWith: "/musics/",
          },
        },
      },
      select: {
        id: true,
        name: true,
        fileUrl: true,
      },
    });

    console.log(`🗑️  삭제할 데이터: ${toDelete.length}개`);
    if (toDelete.length > 0) {
      console.log("   예시:");
      toDelete.slice(0, 5).forEach((s) => {
        console.log(`   - ${s.name}: ${s.fileUrl}`);
      });
      if (toDelete.length > 5) {
        console.log(`   ... 외 ${toDelete.length - 5}개`);
      }
    }

    if (toDelete.length === 0) {
      console.log("\n✨ 삭제할 데이터가 없습니다. 이미 정리되어 있습니다!");
      return;
    }

    // 3. 삭제 실행
    console.log(`\n⚠️  ${toDelete.length}개 데이터를 삭제합니다...\n`);

    const deleteIds = toDelete.map((s) => s.id);
    
    // Preset과의 관계 확인 (sound relation을 통해)
    const presetsWithSounds = await prisma.preset.findMany({
      where: {
        soundId: {
          in: deleteIds,
        },
      },
      select: {
        id: true,
        name: true,
        soundId: true,
      },
    });

    if (presetsWithSounds.length > 0) {
      console.log(`⚠️  경고: ${presetsWithSounds.length}개 Preset이 이 Sound를 사용하고 있습니다.`);
      console.log("   올바른 형식의 Sound로 교체합니다...\n");
      
      // 올바른 형식의 Sound 중 첫 번째를 가져와서 교체용으로 사용
      const replacementSound = correctSounds[0];
      if (!replacementSound) {
        console.error("❌ 올바른 형식의 Sound가 없어서 Preset을 업데이트할 수 없습니다.");
        process.exit(1);
      }
      
      // 각 Preset의 soundId를 올바른 Sound로 교체
      for (const preset of presetsWithSounds) {
        await prisma.preset.update({
          where: { id: preset.id },
          data: {
            soundId: replacementSound.id,
          },
        });
        console.log(`   ✅ ${preset.name} → ${replacementSound.name}로 교체`);
      }
      console.log("");
    }

    // Sound 삭제
    const result = await prisma.sound.deleteMany({
      where: {
        id: {
          in: deleteIds,
        },
      },
    });

    console.log(`✅ ${result.count}개 데이터 삭제 완료!\n`);

    // 4. 최종 확인
    const finalCount = await prisma.sound.count();
    const correctCount = await prisma.sound.count({
      where: {
        fileUrl: {
          startsWith: "/musics/",
        },
      },
    });

    console.log("📊 최종 현황:");
    console.log(`   총 Sound 데이터: ${finalCount}개`);
    console.log(`   올바른 형식: ${correctCount}개`);
    console.log(`   기타: ${finalCount - correctCount}개\n`);

    if (finalCount === correctCount) {
      console.log("✨ 모든 데이터가 올바른 형식입니다!");
    }
  } catch (error) {
    console.error("❌ 에러:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

