/**
 * 인증 관련 타입 정의
 * 
 * Phase 2 리팩토링: lib/auth 내부의 타입을 통합
 */

/**
 * 세션 타입 정의
 * (src/lib/auth/session.ts에서 이동)
 */
export interface AuthSession {
  user: {
    id: string;
    email: string;
    name?: string | null;
    image?: string | null;
  };
}

