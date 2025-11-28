// src/app/api/sleep/generate/route.ts
/**
 * [파일 역할]
 * - 수면 테스트 데이터를 생성하는 API 엔드포인트
 * - GET /api/sleep/generate
 *
 * 호출 시:
 * - 어제 22:00 ~ 오늘 08:00까지 약 60~72개의 raw_periodic 데이터 생성
 * - 이후 /api/sleep/today 호출하면 정상적으로 수면 점수 계산됨
 */

import { NextResponse } from "next/server";
import { generateDummySleepData } from "@/backend/jobs/generateDummySleepData";

const USER_ID = "testUser";

export async function GET() {
  try {
    const count = await generateDummySleepData({
      userId: USER_ID,
      intervalMinutes: 10,
    });

    return NextResponse.json(
      {
        status: "ok",
        generated: count,
        message: `총 ${count}개의 더미 수면 데이터가 생성되었습니다.`,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("[sleep/generate] Error:", err);
    return NextResponse.json(
      { error: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
