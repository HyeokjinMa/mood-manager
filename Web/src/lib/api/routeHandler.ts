/**
 * API Route Handler 유틸리티
 * 
 * Phase 1 리팩토링: 공통 인증 및 에러 처리 로직을 래퍼 함수로 추출
 * 
 * 사용 예시:
 * ```typescript
 * export async function GET() {
 *   return withAuth(async (session) => {
 *     // 세션이 보장된 상태에서 로직 실행
 *     const data = await fetchData(session.user.id);
 *     return NextResponse.json({ data });
 *   });
 * }
 * ```
 */

import { NextResponse } from "next/server";
import type { AuthSession } from "@/types/auth";
import { requireAuth, checkMockMode } from "@/lib/auth/session";

/**
 * 인증이 필요한 API 핸들러 래퍼
 * 
 * 세션 검증을 자동으로 수행하고, 검증된 세션을 핸들러에 전달합니다.
 * 
 * @param handler - 세션을 받아서 NextResponse를 반환하는 핸들러 함수
 * @returns NextResponse (401 에러 또는 핸들러의 응답)
 * 
 * @example
 * ```typescript
 * export async function GET() {
 *   return withAuth(async (session) => {
 *     return NextResponse.json({ userId: session.user.id });
 *   });
 * }
 * ```
 */
export async function withAuth<T extends NextResponse | Promise<NextResponse>>(
  handler: (session: AuthSession) => T
): Promise<NextResponse | T> {
  const sessionOrError = await requireAuth();
  if (sessionOrError instanceof NextResponse) {
    return sessionOrError; // 401 응답 반환
  }
  return handler(sessionOrError);
}

/**
 * 인증 및 목업 모드 처리가 포함된 API 핸들러 래퍼
 * 
 * 세션 검증 후 목업 모드인 경우 mockHandler를 실행하고,
 * 일반 모드인 경우 handler를 실행합니다.
 * 
 * @param handler - 일반 모드 핸들러
 * @param mockHandler - 목업 모드 핸들러
 * @returns NextResponse
 * 
 * @example
 * ```typescript
 * export async function GET() {
 *   return withAuthAndMock(
 *     async (session) => {
 *       // 일반 모드 로직
 *       const data = await prisma.user.findUnique({ where: { id: session.user.id } });
 *       return NextResponse.json({ data });
 *     },
 *     (session) => {
 *       // 목업 모드 로직
 *       return NextResponse.json({ data: getMockData() });
 *     }
 *   );
 * }
 * ```
 */
export async function withAuthAndMock(
  handler: (session: AuthSession) => NextResponse | Promise<NextResponse>,
  mockHandler: (session: AuthSession) => NextResponse | Promise<NextResponse>
): Promise<NextResponse> {
  const sessionOrError = await requireAuth();
  if (sessionOrError instanceof NextResponse) {
    return sessionOrError; // 401 응답 반환
  }
  
  const session = sessionOrError;
  if (await checkMockMode(session)) {
    return await mockHandler(session);
  }
  return await handler(session);
}

import { ERROR_CODES, ERROR_STATUS_MAP, ERROR_MESSAGES, type ErrorCode } from "./errorCodes";

/**
 * 표준 에러 응답 생성
 * 
 * Phase 4: 에러 코드 상수 사용 및 자동 상태 코드 매핑
 * 
 * 현재 형식 유지: { error: "CODE", message: "..." }
 * 
 * @param code - 에러 코드 (ERROR_CODES 사용 권장)
 * @param message - 에러 메시지 (기본 메시지 사용 가능)
 * @param status - HTTP 상태 코드 (자동 매핑 또는 수동 지정)
 * @returns NextResponse
 * 
 * @example
 * ```typescript
 * import { ERROR_CODES } from "@/lib/api/errorCodes";
 * 
 * // 기본 메시지 사용
 * return createErrorResponse(ERROR_CODES.NOT_FOUND);
 * 
 * // 커스텀 메시지 사용
 * return createErrorResponse(ERROR_CODES.NOT_FOUND, "특정 무드를 찾을 수 없습니다");
 * 
 * // 상태 코드 수동 지정
 * return createErrorResponse(ERROR_CODES.INTERNAL_ERROR, "커스텀 메시지", 503);
 * ```
 */
export function createErrorResponse(
  code: ErrorCode | string,
  message?: string,
  status?: number
): NextResponse {
  // 에러 코드가 ERROR_CODES에 있으면 자동으로 상태 코드와 메시지 매핑
  const isKnownCode = Object.values(ERROR_CODES).includes(code as ErrorCode);
  const finalStatus = status ?? (isKnownCode ? ERROR_STATUS_MAP[code as ErrorCode] : 500);
  const finalMessage = message ?? (isKnownCode ? ERROR_MESSAGES[code as ErrorCode] : "알 수 없는 오류가 발생했습니다");
  
  return NextResponse.json(
    {
      error: code,
      message: finalMessage,
    },
    { status: finalStatus }
  );
}

/**
 * 표준 성공 응답 생성
 * 
 * @param data - 응답 데이터
 * @param status - HTTP 상태 코드 (기본값: 200)
 * @returns NextResponse
 */
export function createSuccessResponse<T>(
  data: T,
  status: number = 200
): NextResponse {
  return NextResponse.json(data, { status });
}

