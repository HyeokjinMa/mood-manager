/**
 * 공통 데이터 조회 로직
 * 전처리 및 무드스트림 데이터를 조회하는 공통 함수
 */

import { NextRequest } from "next/server";
import type { CommonData } from "../types";
import { getMockCommonData } from "./mockDataHelper";

/**
 * 전처리 및 무드스트림 데이터를 조회하는 공통 함수
 * 
 * @param request NextRequest 객체
 * @param isAdminMode 관리자 모드 여부
 * @returns 전처리 데이터와 무드스트림 데이터
 */
export async function getCommonData(
  request: NextRequest,
  isAdminMode: boolean
): Promise<CommonData> {
  // 관리자 모드인 경우 목업 데이터 직접 사용
  if (isAdminMode) {
    console.log("[getCommonData] 관리자 모드: 목업 데이터 직접 사용");
    return getMockCommonData();
  }

  // 일반 모드: API 호출 (서버 사이드에서 쿠키 전달)
  const requestHeaders = new Headers();
  const cookies = request.headers.get("cookie");
  if (cookies) {
    requestHeaders.set("cookie", cookies);
  }

  try {
    // 타임아웃을 위한 AbortController 생성
    const controller1 = new AbortController();
    const controller2 = new AbortController();
    const timeout1 = setTimeout(() => controller1.abort(), 30000); // 30초 타임아웃
    const timeout2 = setTimeout(() => controller2.abort(), 30000); // 30초 타임아웃
    
    // AWS EC2에서는 자기 자신을 호출할 때 localhost를 사용해야 함
    // NEXT_PUBLIC_BASE_URL이 외부 URL이면 순환 참조나 느린 응답 가능
    // 서버 사이드에서는 항상 localhost 사용 (자기 자신 호출)
    const baseUrl = typeof window === "undefined" 
      ? "http://localhost:3000"  // 서버 사이드: localhost 사용
      : (process.env.NEXT_PUBLIC_BASE_URL || ""); // 클라이언트 사이드: 환경 변수 사용
    
    const [preprocessedRes, moodStreamRes] = await Promise.all([
      fetch(`${baseUrl}/api/preprocessing`, {
        headers: requestHeaders,
        credentials: "include",
        signal: controller1.signal,
      }),
      fetch(`${baseUrl}/api/moods/current`, {
        headers: requestHeaders,
        credentials: "include",
        signal: controller2.signal,
      }),
    ]);
    
    clearTimeout(timeout1);
    clearTimeout(timeout2);

    if (!preprocessedRes.ok || !moodStreamRes.ok) {
      // 에러 발생 시 목업 데이터로 대체
      console.warn("[getCommonData] API 호출 실패, 목업 데이터 사용");
      return getMockCommonData();
    }

    let preprocessed, moodStream;
    try {
      preprocessed = await preprocessedRes.json();
      moodStream = await moodStreamRes.json();
    } catch (jsonError) {
      console.error("[getCommonData] JSON 파싱 실패, 목업 데이터 사용:", jsonError);
      return getMockCommonData();
    }

    return {
      preprocessed,
      moodStream,
    };
  } catch (error) {
    // 네트워크 에러, 타임아웃 등 예외 발생 시 목업 데이터로 대체
    if (error instanceof Error && error.name === "AbortError") {
      console.error("[getCommonData] Request timeout after 30 seconds");
    } else {
      console.error("[getCommonData] 에러 발생, 목업 데이터 사용:", error);
    }
    return getMockCommonData();
  }
}
