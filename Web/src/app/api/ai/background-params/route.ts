/**
 * POST /api/ai/background-params
 * 
 * LLM으로 동적 배경 파라미터 생성
 */

import { NextRequest, NextResponse } from "next/server";

// AWS EC2에서 긴 실행 시간을 허용하기 위해 maxDuration 설정 (최대 300초 = 5분)
export const maxDuration = 300;
import { requireAuth, checkMockMode } from "@/lib/auth/session";
import { getCommonData } from "./utils/getCommonData";
import { getMockResponse } from "./utils/mockResponse";
import { handleStreamMode } from "./handlers/streamHandler";
import { handleScentMode } from "./handlers/scentHandler";
import { handleMusicMode } from "./handlers/musicHandler";

/**
 * OpenAI API 호출 및 배경 파라미터 생성
 *
 * mode:
 * - "stream" (default): 10개 세그먼트 전체에 대한 배경 파라미터 생성
 * - "scent": 현재 세그먼트의 향 / 아이콘만 재추천
 * - "music": 현재 세그먼트의 음악 / 풍향·풍속만 재추천
 */
export async function POST(request: NextRequest) {
  try {
    // 세션 확인 (인증 필요)
    const sessionOrError = await requireAuth();
    if (sessionOrError instanceof NextResponse) {
      return sessionOrError;
    }
    const session = sessionOrError;
    
    // 관리자 모드 확인 (데이터는 목업이지만 LLM은 실제 호출)
    const isAdminMode = await checkMockMode(session);
    if (isAdminMode) {
      console.log("[LLM API] 관리자 모드: 데이터는 목업이지만 LLM은 실제 호출");
    }

    const body = await request.json();
    const mode = (body.mode || "stream") as "stream" | "scent" | "music";
    const forceFresh = body.forceFresh === true;

    // ------------------------------
    // 1) 공통: 전처리 / 무드스트림 데이터 조회
    // 관리자 모드여도 목업 데이터를 가져와서 LLM에 실제로 전달
    // ------------------------------
    const { preprocessed, moodStream } = await getCommonData(request, isAdminMode);

    // ------------------------------
    // 2) mode 별 분기
    // ------------------------------

    // (A) 스트림 전체용: Python 서버 연동 (3개 세그먼트)
    if (mode === "stream") {
      // handleStreamMode 내부에서 예외가 발생하면
      // 이 함수(POST)의 try/catch에서 잡을 수 있도록 반드시 await 사용
      return await handleStreamMode({
        segments: body.segments || [],
        preprocessed,
        moodStream,
        userPreferences: body.userPreferences,
        forceFresh,
        userId: session.user.id, // 로그인 세션 기준
        session, // 목업 모드 확인용 세션 전달
      });
    }

    // (B) 향 전용: 현재 세그먼트의 향 / 아이콘만 재추천
    if (mode === "scent") {
      return await handleScentMode({
        segment: body.segment,
        segmentIndexFromBody: body.segmentIndex,
        preprocessed,
        moodStream,
        userPreferences: body.userPreferences,
      });
    }

    // (C) 음악 전용: 현재 세그먼트의 음악 / 풍향·풍속만 재추천
    if (mode === "music") {
      return await handleMusicMode({
        segment: body.segment,
        segmentIndexFromBody: body.segmentIndex,
        preprocessed,
        moodStream,
        userPreferences: body.userPreferences,
      });
    }

    // 방어 코드 (이곳에 도달하지 않아야 함)
    return NextResponse.json(getMockResponse());
  } catch (error) {
    console.error("Background params generation error:", error);
    
    // 에러 발생 시 목업 응답 반환 (서비스 중단 방지)
    return NextResponse.json(getMockResponse());
  }
}
