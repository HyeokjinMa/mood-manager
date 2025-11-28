// ======================================================
// File: src/app/api/moods/preference/route.ts
// ======================================================

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";

/**
 * POST /api/moods/preference
 * 
 * 무드 선호도 카운트 증가 API
 * - 무드 이름 더블클릭 시 호출
 * - 무드당 최대 3번까지만 카운트 가능
 * - 장르/향/컬러에 대한 선호도 카운트 증가
 * 
 * Request Body:
 * {
 *   moodId: string;
 *   moodName: string;
 *   musicGenre: string;
 *   scentType: string;
 *   moodColor: string;
 * }
 * 
 * Response:
 * {
 *   success: boolean;
 *   currentCount: number; // 현재 무드에 대한 선호도 카운트 (1-3)
 *   maxReached: boolean; // 최대 3번 도달 여부
 *   preferenceCounts: {
 *     music: Record<string, number>; // 장르별 카운트
 *     scent: Record<string, number>; // 향별 카운트
 *     color: Record<string, number>; // 컬러별 카운트
 *   };
 * }
 */

export async function POST(request: NextRequest) {
  try {
    const sessionOrError = await requireAuth();
    if (sessionOrError instanceof NextResponse) {
      return sessionOrError;
    }
    // const session = sessionOrError; // 향후 사용 예정

    const body = await request.json();
    const { moodId, moodName, musicGenre, scentType, moodColor } = body;

    if (!moodId || !moodName || !musicGenre || !scentType || !moodColor) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // TODO: 실제 DB 연동 시 Firestore 사용
    // 현재는 메모리 기반 목업 데이터 구조만 정의
    // 
    // Firestore 구조:
    // users/{userId}/preferences/mood/{moodId} {
    //   count: number (1-3),
    //   lastUpdated: timestamp
    // }
    // users/{userId}/preferences/music/{genre} {
    //   count: number,
    //   lastUpdated: timestamp
    // }
    // users/{userId}/preferences/scent/{scentType} {
    //   count: number,
    //   lastUpdated: timestamp
    // }
    // users/{userId}/preferences/color/{colorHex} {
    //   count: number,
    //   lastUpdated: timestamp
    // }

    // [MOCK] 목업 응답
    // 실제 구현 시:
    // 1. Firestore에서 현재 무드의 선호도 카운트 조회
    // 2. 3번 미만이면 카운트 증가, 3번이면 에러 반환
    // 3. 장르/향/컬러 카운트도 각각 증가
    // 4. Firestore에 저장

    const mockCurrentCount = Math.floor(Math.random() * 3) + 1; // 1-3 랜덤
    const maxReached = mockCurrentCount >= 3;

    if (maxReached) {
      return NextResponse.json(
        {
          success: false,
          error: "Maximum preference count (3) reached for this mood",
          currentCount: 3,
          maxReached: true,
        },
        { status: 400 }
      );
    }

    const newCount = mockCurrentCount + 1;

    return NextResponse.json({
      success: true,
      currentCount: newCount,
      maxReached: newCount >= 3,
      preferenceCounts: {
        music: {
          [musicGenre]: (Math.floor(Math.random() * 5) + 1), // 목업: 1-5 랜덤
        },
        scent: {
          [scentType]: (Math.floor(Math.random() * 5) + 1), // 목업: 1-5 랜덤
        },
        color: {
          [moodColor]: (Math.floor(Math.random() * 5) + 1), // 목업: 1-5 랜덤
        },
      },
    });
  } catch (error) {
    console.error("Error updating mood preference:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/moods/preference
 * 
 * 현재 사용자의 선호도 통계 조회
 * 
 * Response:
 * {
 *   moodPreferences: Record<string, number>; // 무드별 카운트 (최대 3)
 *   musicPreferences: Record<string, number>; // 장르별 카운트
 *   scentPreferences: Record<string, number>; // 향별 카운트
 *   colorPreferences: Record<string, number>; // 컬러별 카운트
 * }
 */
export async function GET() {
  try {
    const sessionOrError = await requireAuth();
    if (sessionOrError instanceof NextResponse) {
      return sessionOrError;
    }
    // const session = sessionOrError; // 향후 사용 예정


    // TODO: 실제 DB 연동 시 Firestore에서 조회
    // [MOCK] 목업 응답
    return NextResponse.json({
      moodPreferences: {
        "calm-1": 2,
        "focus-1": 3,
        "energy-1": 1,
      },
      musicPreferences: {
        newage: 5,
        classical: 3,
        jazz: 2,
      },
      scentPreferences: {
        Marine: 4,
        Musk: 3,
        Citrus: 2,
      },
      colorPreferences: {
        "#E6F3FF": 3,
        "#F5F5DC": 2,
        "#FFD700": 1,
      },
    });
  } catch (error) {
    console.error("Error fetching mood preferences:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

