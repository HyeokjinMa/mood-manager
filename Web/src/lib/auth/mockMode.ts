// src/lib/auth/mockMode.ts
/**
 * 목업 모드 관리
 * 
 * 관리자 계정으로 로그인 시 모든 플로우를 목업으로 처리
 * 
 * TODO: DB 연결 후 User.isAdmin 필드를 조회하도록 변경 필요
 */

import { prisma } from "@/lib/prisma";

/**
 * 관리자 계정 이메일/비밀번호 (하위 호환성 유지)
 * TODO: DB 연결 후 제거 예정
 */
export const ADMIN_EMAIL = "admin@moodmanager.com";
export const ADMIN_PASSWORD = "admin1234";

/**
 * 관리자 계정인지 확인 (DB에서 isAdmin 필드 조회)
 * 
 * @param userId - 사용자 ID
 * @returns 관리자 여부
 */
export async function isAdminUser(userId: string): Promise<boolean> {
  // V1 목업 모드용 최적화:
  // CredentialsProvider에서 관리자 계정은 id를 "admin-mock-user-id"로 고정 발급하므로
  // 이 경우 DB 조회 없이 바로 true를 반환하여, 로컬 개발 시 불필요한 DB 연결 시도를 막는다.
  if (userId === "admin-mock-user-id") {
    return true;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isAdmin: true },
    });
    return user?.isAdmin ?? false;
  } catch (error) {
    console.error("[isAdminUser] DB 조회 실패, 하위 호환성 모드 사용:", error);
    // DB 연결 실패 시 하위 호환성 모드
    return false;
  }
}

/**
 * 관리자 계정인지 확인 (이메일 기반, 하위 호환성)
 * @deprecated DB 연결 후 isAdminUser 사용 권장
 */
export function isAdminAccount(email: string, password?: string): boolean {
  if (email === ADMIN_EMAIL) {
    if (password !== undefined) {
      return password === ADMIN_PASSWORD;
    }
    return true; // 이메일만 확인하는 경우
  }
  return false;
}

/**
 * 세션에서 목업 모드 여부 확인
 * 
 * 우선순위:
 * 1. DB에서 isAdmin 필드 조회 (userId가 있는 경우)
 * 2. 사용자 ID가 "admin-mock-user-id"인 경우 (관리자 계정으로 로그인한 경우만)
 * 
 * 보안: 이메일만으로는 관리자 모드를 판단하지 않음 (비밀번호 확인 필요)
 */
export async function isMockMode(session: { user?: { email?: string; id?: string } } | null): Promise<boolean> {
  if (!session?.user) {
    return false;
  }

  // 1. 사용자 ID 기반 확인 (가장 안전)
  if (session.user.id) {
    // 관리자 계정으로 로그인한 경우 (NextAuth에서 "admin-mock-user-id"로 설정)
    if (session.user.id === "admin-mock-user-id") {
      console.log("[isMockMode] 관리자 계정으로 로그인됨 (admin-mock-user-id)");
      return true;
    }

    // DB에서 isAdmin 필드 조회 시도
    try {
      const isAdmin = await isAdminUser(session.user.id);
      if (isAdmin) {
        console.log("[isMockMode] DB에서 관리자 확인됨", { userId: session.user.id });
        return true;
      }
    } catch (error) {
      console.warn("[isMockMode] DB 조회 실패:", error);
      // DB 조회 실패 시 false 반환 (보안상 안전한 선택)
    }
  }

  // 이메일만으로는 관리자 모드를 판단하지 않음 (보안상 위험)
  // 비밀번호 확인 없이 이메일만으로 관리자 모드 진입 방지
  return false;
}


