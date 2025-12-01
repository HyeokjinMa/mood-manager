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
    const [preprocessedRes, moodStreamRes] = await Promise.all([
      fetch(`${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/preprocessing`, {
        headers: requestHeaders,
        credentials: "include",
      }),
      fetch(`${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/moods/current`, {
        headers: requestHeaders,
        credentials: "include",
      }),
    ]);

    if (!preprocessedRes.ok || !moodStreamRes.ok) {
      // 에러 발생 시 목업 데이터로 대체
      console.warn("[getCommonData] API 호출 실패, 목업 데이터 사용");
      return getMockCommonData();
    }

    const preprocessed = await preprocessedRes.json();
    const moodStream = await moodStreamRes.json();

    return {
      preprocessed,
      moodStream,
    };
  } catch (error) {
    // 네트워크 에러 등 예외 발생 시 목업 데이터로 대체
    console.error("[getCommonData] 에러 발생, 목업 데이터 사용:", error);
    return getMockCommonData();
  }
}
