/**
 * 마르코프 체인용 144개 DailyPreprocessedSlot 데이터 생성 스크립트
 * 
 * 사용법:
 * npx tsx scripts/generate-markov-data.ts [userId] [date]
 * 
 * 예시:
 * npx tsx scripts/generate-markov-data.ts user123 2024-12-05
 * npx tsx scripts/generate-markov-data.ts user123  # 오늘 날짜 사용
 */

import { ensureDailySlotsForUser } from "../src/backend/jobs/dailyPreprocessedSlots";
import { prisma } from "../src/lib/prisma";

async function main() {
  const args = process.argv.slice(2);
  let userId = args[0];
  const dateStr = args[1] || new Date().toISOString().split("T")[0]; // YYYY-MM-DD

  // userId가 없으면 DB에서 첫 번째 사용자 찾기
  if (!userId) {
    const firstUser = await prisma.user.findFirst({
      select: { id: true, email: true },
    });
    if (!firstUser) {
      console.error("❌ DB에 사용자가 없습니다. 먼저 회원가입을 해주세요.");
      process.exit(1);
    }
    userId = firstUser.id;
    console.log(`ℹ️  사용자 ID를 지정하지 않아 첫 번째 사용자를 사용합니다: ${firstUser.email} (${userId})`);
  }

  console.log(`🎲 마르코프 체인용 144개 슬롯 데이터 생성 시작...\n`);
  console.log(`   User ID: ${userId}`);
  console.log(`   Date: ${dateStr}\n`);

  try {
    // 사용자 존재 확인
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true },
    });

    if (!user) {
      console.error(`❌ 사용자를 찾을 수 없습니다: ${userId}`);
      console.log(`\n💡 사용 가능한 사용자 목록:`);
      const users = await prisma.user.findMany({
        select: { id: true, email: true },
        take: 10,
      });
      users.forEach((u) => console.log(`   - ${u.email} (${u.id})`));
      process.exit(1);
    }

    console.log(`✅ 사용자 확인: ${user.email}\n`);

    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      throw new Error(`Invalid date format: ${dateStr}. Use YYYY-MM-DD format.`);
    }

    // 144개 슬롯 생성
    await ensureDailySlotsForUser(userId, date);

    // 생성된 슬롯 개수 확인
    const count = await prisma.dailyPreprocessedSlot.count({
      where: {
        userId,
        date: new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0),
      },
    });

    console.log(`✅ 완료! ${count}개 슬롯이 생성되었습니다.\n`);

    if (count < 144) {
      console.log(`⚠️  경고: 144개가 아닌 ${count}개만 생성되었습니다.`);
    } else {
      console.log(`✨ 144개 슬롯이 모두 생성되었습니다!`);
    }
  } catch (error) {
    console.error("❌ 에러:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
