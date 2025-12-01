/**
 * POST /api/ml/emotion-counts
 * 
 * ML 서버에서 10분마다 수집된 감정 이벤트를 받아서 누적
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import { addEmotionCounts } from "@/lib/emotionCounts/EmotionCountStore";

interface MLProcessingResult {
  timestamp: number;
  userId: string;
  laughter: number;
  sigh: number;
  crying: number;
}

/**
 * ML 서버에서 10분마다 호출되는 엔드포인트
 */
export async function POST(request: NextRequest) {
  try {
    // ML 서버 인증 (API 키 기반)
    const mlApiKey = request.headers.get("x-ml-api-key");
    if (mlApiKey !== process.env.ML_API_KEY) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // 세션 확인 (사용자 식별용)
    const sessionOrError = await requireAuth();
    if (sessionOrError instanceof NextResponse) {
      return sessionOrError;
    }
    const session = sessionOrError;
    
    const body = await request.json();
    
    // ML 서버에서 보내는 형식
    const mlResult: MLProcessingResult = {
      timestamp: body.timestamp || Date.now(),
      userId: session.user.id,
      laughter: Math.max(0, body.laughter || 0), // 음수 방지
      sigh: Math.max(0, body.sigh || 0),
      crying: Math.max(0, body.crying || 0),
    };
    
    // 감정 카운터에 누적
    addEmotionCounts(mlResult.userId, {
      laughter: mlResult.laughter,
      sigh: mlResult.sigh,
      crying: mlResult.crying,
    });
    
    console.log(`[ML Emotion Counts] Added counts for user ${mlResult.userId}:`, {
      laughter: mlResult.laughter,
      sigh: mlResult.sigh,
      crying: mlResult.crying,
    });
    
    return NextResponse.json({ status: "success" });
  } catch (error) {
    console.error("[ML Emotion Counts] Error:", error);
    return NextResponse.json(
      { error: "Failed to process emotion counts" },
      { status: 500 }
    );
  }
}

