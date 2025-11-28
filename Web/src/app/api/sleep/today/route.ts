// src/app/api/sleep/today/route.ts
/**
 * [파일 역할]
 *
 * - "오늘 수면 점수"를 클라이언트/다른 서버(OpenAI 등)에 제공하는 API 엔드포인트.
 * - 경로: GET /api/sleep/today
 *
 * [응답 형태]
 * - 데이터가 있는 경우 (200):
 *   {
 *     sleep_score: number;        // 0~100
 *     totalMinutes: number;       // 총 수면 시간 (분)
 *     stageStats: { ... }         // 단계별 epoch 개수
 *     components: { ... }         // 내부 점수 구성요소 (0~1)
 *   }
 *
 * - 데이터가 없는 경우 (200):
 *   {
 *     sleep_score: null;
 *     reason: "NO_DATA" | "NO_SESSION";
 *   }
 *
 *  → 204(status) + body 조합은 Next.js에서 에러를 유발하므로 사용하지 않음.
 */

import { NextResponse } from "next/server";
import { calcTodaySleepScore } from "@/backend/jobs/calcTodaySleepScore";

// TODO: 실제 서비스에서는 세션/토큰에서 userId 추출
const USER_ID = "testUser";

export async function GET() {
  try {
    const result = await calcTodaySleepScore(USER_ID);

    // 수면 점수를 계산할 raw 데이터/세션이 없는 경우
    if (result.score === null) {
      return NextResponse.json(
        {
          sleep_score: null,
          reason: result.reason,
        },
        { status: 200 } // 204 + body 조합은 피하고, 200으로 통일
      );
    }

    // 정상적으로 하루 수면 점수가 계산된 경우
    return NextResponse.json(
      {
        sleep_score: result.score,
        totalMinutes: result.totalMinutes,
        stageStats: result.stageStats,
        components: result.components,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("[sleep/today] 에러 발생:", err);
    return NextResponse.json(
      { error: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
