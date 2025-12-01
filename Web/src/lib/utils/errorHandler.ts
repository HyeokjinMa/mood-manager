/**
 * 공통 에러 핸들링 유틸리티
 */

/**
 * 401 인증 에러 처리
 * @param response - HTTP 응답 객체
 * @returns 인증 에러인 경우 true, 아니면 false
 */
export function handleAuthError(response: Response): boolean {
  if (response.status === 401) {
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
    return true;
  }
  return false;
}

/**
 * API 호출 래퍼 (에러 핸들링 포함)
 * @param apiCall - API 호출 함수
 * @param mockData - 목업 데이터 fallback 함수
 * @returns API 응답 또는 목업 데이터
 */
export async function withAuthAndMockFallback<T>(
  apiCall: () => Promise<Response>,
  mockData: () => T
): Promise<T> {
  try {
    const response = await apiCall();
    
    // 401 에러 처리
    if (handleAuthError(response)) {
      throw new Error("Authentication required");
    }
    
    if (response.ok) {
      return await response.json();
    }
    
    // 응답이 실패한 경우 목업 데이터 사용
    console.warn("[withAuthAndMockFallback] API call failed, using mock data");
    return mockData();
  } catch (error) {
    console.error("[withAuthAndMockFallback] Error:", error);
    // 에러 발생 시 목업 데이터 사용
    return mockData();
  }
}

