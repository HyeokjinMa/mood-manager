// src/lib/prisma.ts
/**
 * [파일 역할]
 * - Prisma Client 싱글톤 인스턴스를 생성하고 export 합니다.
 * - Next.js 개발 환경에서 HMR(Hot Module Replacement)로 인한
 *   Prisma Client 중복 생성을 방지합니다.
 *
 * [사용되는 위치]
 * - 모든 API Route Handler에서 import하여 DB 작업 수행
 * - 예: import { prisma } from "@/lib/prisma";
 *
 * [주의사항]
 * - Prisma Client는 서버 사이드에서만 사용 가능 (클라이언트 컴포넌트에서 사용 금지)
 * - DATABASE_URL 환경 변수 필수
 */

import { PrismaClient } from "@prisma/client";

// Prisma Client 전역 타입 선언 (개발 환경 HMR 대응)
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Prisma Client 싱글톤 생성
 * - 개발 환경: globalThis에 저장하여 HMR 시에도 재사용
 * - 프로덕션: 매번 새 인스턴스 생성 (서버리스 환경 대응)
 */
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });

// 개발 환경에서만 globalThis에 저장
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

/**
 * Prisma Client 연결 종료
 * - Next.js는 자동으로 연결을 관리하므로 일반적으로 호출 불필요
 * - 특수한 경우(테스트, 스크립트 등)에만 사용
 */
export async function disconnectPrisma() {
  await prisma.$disconnect();
}
