/**
 * POST /api/ml/emotion-counts
 * 
 * ML 서버(Lambda 등)에서 감정 이벤트 결과를 받아서 누적
 *
 * [요청 형식 - 단일 이벤트]
 * {
 *   "timestamp": 1733200000000,
 *   "result": "Laughter" | "Sigh" | "Crying" | "Negative",
 *   "confidence": 92.3,
 *   "userId": "optional-user-id"
 * }
 *
 * [요청 형식 - 배치 이벤트]
 * {
 *   "events": [
 *     { "timestamp": ..., "result": "...", "confidence": ..., "userId": "..." },
 *     ...
 *   ]
 * }
 */

import { NextRequest, NextResponse } from "next/server";
import { addEmotionCounts } from "@/lib/emotionCounts/EmotionCountStore";

type MLResultType = "Laughter" | "Sigh" | "Crying" | "Negative";

interface MLEventPayload {
  timestamp: number;
  result: MLResultType;
  confidence: number;
  userId?: string;
}

/**
 * ML 서버에서 주기적으로 호출되는 엔드포인트
 */
export async function POST(request: NextRequest) {
  try {
    // ML 서버 인증 (API 키 기반)
    const mlApiKey = request.headers.get("x-ml-api-key");
    const expectedKey = process.env.ML_API_KEY;
    
    // 디버깅: API 키 검증 실패 시 상세 로그
    if (!mlApiKey) {
      console.error("[ML Emotion Counts] ❌ x-ml-api-key 헤더가 없습니다.");
      return NextResponse.json(
        { error: "Unauthorized", message: "Missing x-ml-api-key header" },
        { status: 401 }
      );
    }
    
    if (!expectedKey) {
      console.error("[ML Emotion Counts] ❌ 서버의 ML_API_KEY 환경변수가 설정되지 않았습니다.");
      return NextResponse.json(
        { error: "Unauthorized", message: "Server ML_API_KEY not configured" },
        { status: 401 }
      );
    }
    
    if (mlApiKey !== expectedKey) {
      console.error("[ML Emotion Counts] ❌ API 키 불일치:", {
        received: mlApiKey.substring(0, 4) + "..." + mlApiKey.substring(mlApiKey.length - 4),
        expected: expectedKey.substring(0, 4) + "..." + expectedKey.substring(expectedKey.length - 4),
        receivedLength: mlApiKey.length,
        expectedLength: expectedKey.length,
      });
      return NextResponse.json(
        { error: "Unauthorized", message: "Invalid API key" },
        { status: 401 }
      );
    }
    
    console.log("[ML Emotion Counts] ✅ API 키 검증 성공 - ML 서버 요청을 수신합니다.");
    
    const body = await request.json();

    const events: MLEventPayload[] = Array.isArray(body.events)
      ? body.events
      : [body];

    if (events.length === 0) {
      return NextResponse.json(
        { error: "No events provided" },
        { status: 400 }
      );
    }

    let processedCount = 0;

    for (const rawEvent of events) {
      const timestamp = typeof rawEvent.timestamp === "number" ? rawEvent.timestamp : Date.now();
      const result = rawEvent.result as MLResultType | undefined;
      const confidence = typeof rawEvent.confidence === "number" ? rawEvent.confidence : NaN;
      const userId = (rawEvent.userId as string | undefined) || "testUser";

      // 필수 값 검증
      if (!result || Number.isNaN(confidence)) {
        console.warn("[ML Emotion Counts] Invalid event payload skipped:", rawEvent);
        continue;
      }

      if (!["Laughter", "Sigh", "Crying", "Negative"].includes(result)) {
        console.warn(`[ML Emotion Counts] Invalid result value: ${result}`);
        continue;
      }

      // 신뢰도 70 미만은 무시 (emotionCache와 동일 정책)
      if (confidence < 70) {
        console.log(
          `[ML Emotion Counts] ${userId} - ${result} ignored (low confidence: ${confidence})`
        );
        continue;
      }

      // result 를 내부 카운트(laughter / sigh / crying)로 매핑
      let laughter = 0;
      let sigh = 0;
      let crying = 0;

      switch (result) {
        case "Laughter":
          laughter = 1;
          break;
        case "Sigh":
          sigh = 1;
          break;
        case "Crying":
          crying = 1;
          break;
        case "Negative":
          // Negative 는 부정적 감정 포착으로 보고 crying 에 매핑 (임시 정책)
          crying = 1;
          break;
      }

      addEmotionCounts(userId, {
        laughter,
        sigh,
        crying,
      });

      processedCount++;

      console.log(`[ML Emotion Counts] Added event for user ${userId}:`, {
        timestamp,
        result,
        confidence,
        mapped: { laughter, sigh, crying },
      });
    }

    if (processedCount > 0) {
      console.log(
        `[ML Emotion Counts] ✅ 유효한 ML 이벤트 ${processedCount}개를 EmotionCountStore에 반영했습니다.`
      );
    } else {
      console.log(
        "[ML Emotion Counts] ⚠️ 유효한 ML 이벤트가 없어 EmotionCountStore에는 변경이 없습니다."
      );
    }
    
    return NextResponse.json({ status: "success", processed: processedCount });
  } catch (error) {
    console.error("[ML Emotion Counts] Error:", error);
    return NextResponse.json(
      { error: "Failed to process emotion counts" },
      { status: 500 }
    );
  }
}

