// src/lib/auth/session.ts
/**
 * 세션 관리 유틸리티
 * 
 * NextAuth 세션 검증 및 목업 모드 확인
 */

import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { isMockMode } from "./mockMode";

/**
 * 세션 타입 정의
 */
export interface AuthSession {
  user: {
    id: string;
    email: string;
    name?: string | null;
    image?: string | null;
  };
}

/**
 * 인증이 필요한 API에서 세션을 가져오고 검증
 * 
 * @returns 세션 객체 또는 401 응답
 */
export async function requireAuth(): Promise<AuthSession | NextResponse> {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json(
      { error: "UNAUTHORIZED", message: "인증이 필요합니다." },
      { status: 401 }
    );
  }

  // NextAuth 세션에서 id 추출 (JWT 콜백에서 설정됨)
  const userId = (session.user as { id?: string }).id;
  if (!userId) {
    return NextResponse.json(
      { error: "UNAUTHORIZED", message: "인증이 필요합니다." },
      { status: 401 }
    );
  }

  return {
    user: {
      id: userId,
      email: session.user.email || "",
      name: session.user.name || null,
      image: session.user.image || null,
    },
  };
}

/**
 * 목업 모드 여부 확인
 * 
 * @param session - AuthSession 또는 NextAuth 세션 객체
 * @returns 목업 모드 여부 (Promise)
 */
export async function checkMockMode(session: AuthSession | { user?: { email?: string; id?: string } } | null): Promise<boolean> {
  if (!session || !session.user) {
    return false;
  }
  return await isMockMode(session as { user?: { email?: string; id?: string } });
}
