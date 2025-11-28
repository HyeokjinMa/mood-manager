// src/lib/auth/mockMode.ts
/**
 * 목업 모드 관리
 * 
 * 관리자 계정으로 로그인 시 모든 플로우를 목업으로 처리
 */

/**
 * 관리자 계정 이메일/비밀번호
 * TODO: 환경 변수로 관리 권장
 */
export const ADMIN_EMAIL = "admin@moodmanager.com";
export const ADMIN_PASSWORD = "admin1234";

/**
 * 관리자 계정인지 확인
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
 */
export function isMockMode(session: { user?: { email?: string; id?: string } } | null): boolean {
  if (!session?.user?.email) {
    return false;
  }
  return isAdminAccount(session.user.email);
}

