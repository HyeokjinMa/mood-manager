// src/lib/prisma.ts
/**
 * [파일 역할]
 * - Prisma Client 싱글톤 인스턴스를 생성하고 export 합니다.
 * - Next.js 개발 환경에서 HMR(Hot Module Replacement)로 인한
 *   Prisma Client 중복 생성을 방지합니다.
 * - Phase 4: 타임아웃 및 재시도 로직 추가로 안정성 향상
 *
 * [사용되는 위치]
 * - 모든 API Route Handler에서 import하여 DB 작업 수행
 * - 예: import { prisma } from "@/lib/prisma";
 *
 * [주의사항]
 * - Prisma Client는 서버 사이드에서만 사용 가능 (클라이언트 컴포넌트에서 사용 금지)
 * - DATABASE_URL 환경 변수 필수
 * - 초기화 실패 시 타임아웃(5초) 및 재시도(최대 3회) 적용
 */

import { PrismaClient } from "@prisma/client";

// Prisma Client 전역 타입 선언 (개발 환경 HMR 대응)
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  prismaInitAttempts: number;
  prismaLastError: Error | undefined;
};

// Phase 4: 초기화 설정
const MAX_INIT_ATTEMPTS = 3;
const INIT_TIMEOUT = 5000; // 5초

/**
 * Phase 4: 타임아웃을 사용한 Prisma Client 연결 테스트
 * 
 * Prisma Client 연결을 5초 내에 완료해야 함
 * 타임아웃 시 에러를 throw하여 무한 대기 방지
 */
async function testPrismaConnection(client: PrismaClient): Promise<void> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error("Prisma Client connection timeout (5s)"));
    }, INIT_TIMEOUT);
    
    // 연결 테스트 (간단한 쿼리로 연결 확인)
    client.$queryRaw`SELECT 1`
      .then(() => {
        clearTimeout(timeout);
        resolve();
      })
      .catch((error) => {
        clearTimeout(timeout);
        reject(error);
      });
  });
}

/**
 * Phase 4: 재시도 로직을 포함한 Prisma Client 연결 테스트
 * 
 * 최대 3회 재시도, 지수 백오프 사용 (1초 → 2초 → 4초)
 */
async function testPrismaConnectionWithRetry(client: PrismaClient): Promise<void> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < MAX_INIT_ATTEMPTS; attempt++) {
    try {
      await testPrismaConnection(client);
      // 성공 시 전역 상태 초기화
      if (globalForPrisma) {
        globalForPrisma.prismaInitAttempts = 0;
        globalForPrisma.prismaLastError = undefined;
      }
      return;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // 전역 상태 업데이트
      if (globalForPrisma) {
        globalForPrisma.prismaLastError = lastError;
        globalForPrisma.prismaInitAttempts = (globalForPrisma.prismaInitAttempts || 0) + 1;
      }
      
      if (attempt < MAX_INIT_ATTEMPTS - 1) {
        const delay = Math.min(1000 * Math.pow(2, attempt), 5000);
        console.warn(
          `[Prisma] Connection test attempt ${attempt + 1}/${MAX_INIT_ATTEMPTS} failed, retrying in ${delay}ms...`
        );
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  // 모든 재시도 실패
  const errorMessage = `Prisma Client connection test failed after ${MAX_INIT_ATTEMPTS} attempts: ${lastError?.message}`;
  console.error(`[Prisma] ${errorMessage}`);
  throw new Error(errorMessage);
}

/**
 * Phase 4: Prisma Client 싱글톤 (안정화 버전)
 * 
 * 타임아웃 및 재시도 로직을 포함한 안전한 초기화
 * 
 * 주의: Prisma Client 생성은 동기적이지만, 연결은 비동기입니다.
 * 실제 연결 실패는 첫 쿼리 시점에 감지되므로, 각 API Route에서
 * try-catch로 폴백 처리하는 것을 권장합니다.
 */
export const prisma = (() => {
  // 개발 환경: globalThis에서 재사용
  if (process.env.NODE_ENV !== "production" && globalForPrisma.prisma) {
    return globalForPrisma.prisma;
  }
  
  // Prisma Client 생성 (동기적)
  const client = new PrismaClient({
    log: process.env.NODE_ENV === "development" 
      ? ["query", "error", "warn"] 
      : ["error"],
  });
  
  // Phase 4: 연결 테스트를 백그라운드에서 수행 (타임아웃 및 재시도 적용)
  // 초기화 실패는 로그만 남기고, 실제 쿼리 시점에 에러 발생
  // 각 API Route에서 try-catch로 폴백 처리 권장
  testPrismaConnectionWithRetry(client)
    .then(() => {
      console.log("[Prisma] Client initialized and connected successfully");
    })
    .catch((error) => {
      console.error("[Prisma] Client connection test failed:", error);
      console.warn("[Prisma] The client will be available, but queries may fail.");
      console.warn("[Prisma] Each API route should handle Prisma errors with fallback logic.");
    });
  
  // 개발 환경에서만 globalThis에 저장
  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = client;
  }
  
  return client;
})();

/**
 * Prisma Client 연결 종료
 * - Next.js는 자동으로 연결을 관리하므로 일반적으로 호출 불필요
 * - 특수한 경우(테스트, 스크립트 등)에만 사용
 */
export async function disconnectPrisma() {
  await prisma.$disconnect();
}
