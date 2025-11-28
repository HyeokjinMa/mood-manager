// src/lib/preferences/getPreferences.ts
/**
 * [파일 역할]
 * - user_preferences 테이블에서 특정 사용자의 선호도 데이터를 조회하는 모듈입니다.
 * - 향(Top3), 조명(RGB/밝기), 음향 장르(Top3) 정보를 가져옵니다.
 *
 * [입력]
 * - userId: number (사용자 PK)
 *
 * [출력]
 * - UserPreferences 객체 (Prisma Model)
 *
 * [주의사항]
 * - userId가 존재하지 않는 경우 null 반환.
 * - PrismaClient는 전역 싱글톤을 사용하는 것이 권장됩니다.
 * - 호출부에서 null 검사 필요.
 */

import { prisma } from "@/lib/prisma";

export async function getUserPreferences(userId: string) {
  if (!userId) return null;

  const preferences = await prisma.userPreferences.findUnique({
    where: { userId },
  });

  return preferences;
}
