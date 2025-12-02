// src/app/api/ml/emotion/route.ts
/**
 * [파일 역할]
 * - ML 서버에서 오디오 분류 결과를 받는 API
 * - Laughter, Sigh, Negative 결과를 카운트
 *
 * [요청 형식]
 * GET /api/ml/emotion?docId=...&result=Laughter&confidence=0.92&timestamp=1234567890
 *
 * [응답 형식]
 * { success: true, message: "Emotion event recorded" }
 */

import { NextRequest, NextResponse } from "next/server";
import { incrementEmotionCount } from "@/lib/ml/emotionCache";

/**
 * GET /api/ml/emotion
 *
 * Query Params:
 * - docId: Firestore 문서 ID
 * - result: "Laughter" | "Sigh" | "Negative"
 * - confidence: 신뢰도 (0.0 ~ 100.0)
 * - timestamp: UNIX 타임스탬프 또는 ISO 8601
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const docId = searchParams.get("docId");
    const result = searchParams.get("result");
    const confidence = searchParams.get("confidence");
    const timestamp = searchParams.get("timestamp");

    // 입력 검증
    if (!docId || !result || !confidence || !timestamp) {
      console.warn("[ML Emotion] Missing required parameters:", { docId, result, confidence, timestamp });
      return NextResponse.json(
        {
          success: false,
          error: "INVALID_INPUT",
          message: "Missing required parameters: docId, result, confidence, timestamp",
        },
        { status: 400 }
      );
    }

    // result 값 검증
    if (!["Laughter", "Sigh", "Negative"].includes(result)) {
      console.warn(`[ML Emotion] Invalid result value: ${result}`);
      return NextResponse.json(
        {
          success: false,
          error: "INVALID_RESULT",
          message: "result must be one of: Laughter, Sigh, Negative",
        },
        { status: 400 }
      );
    }

    // userId 추출 (docId에서 파싱 또는 고정값 사용)
    // TODO: 실제 운영 시 docId에서 userId 추출하는 로직 필요
    // 현재는 테스트용으로 "testUser" 고정
    const userId = "testUser";

    // 카운트 증가
    const confidenceNum = parseFloat(confidence);
    incrementEmotionCount(userId, result as "Laughter" | "Sigh" | "Negative", confidenceNum);

    console.log(
      `[ML Emotion] Received - docId: ${docId}, result: ${result}, confidence: ${confidence}, timestamp: ${timestamp}`
    );

    return NextResponse.json({
      success: true,
      message: "Emotion event recorded",
    });
  } catch (error) {
    console.error("[ML Emotion] Error occurred:", error);
    return NextResponse.json(
      {
        success: false,
        error: "INTERNAL_ERROR",
        message: "Failed to process emotion event",
      },
      { status: 500 }
    );
  }
}
