/**
 * API Route: /api/moods/preference
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/moods/preference
 * 
 * 무드 선호도 카운트 증가 API
 * - 무드 이름 더블클릭 시 호출
 * - 장르/향/컬러에 대한 선호도 가중치 증가
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
    const session = sessionOrError;
    const userId = session.user.id;

    const body = await request.json();
    const { moodId, moodName, musicGenre, scentType, moodColor } = body;

    console.log("[POST /api/moods/preference] 요청 수신:", {
      userId,
      moodId,
      moodName,
      musicGenre,
      scentType,
      moodColor,
    });

    if (!moodId || !moodName || !musicGenre || !scentType || !moodColor) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // 장르/향 가중치 +3 (설문 기준과 동일한 스케일)
    // - 저장 실패 시 UI는 그대로 두고, 서버 로그만 남긴다.
    let updatedGenreWeight: number | null = null;
    let updatedScentWeight: number | null = null;

    try {
      // GenrePreference 업데이트 (장르 이름 기반)
      const genre = await prisma.genre.upsert({
        where: { name: musicGenre },
        update: {},
        create: {
          name: musicGenre,
          description: null,
        },
      });

      const genrePref = await prisma.genrePreference.upsert({
        where: {
          userId_genreId: {
            userId,
            genreId: genre.id,
          },
        },
        update: {
          weight: {
            increment: 3,
          },
        },
        create: {
          userId,
          genreId: genre.id,
          weight: 3,
        },
      });
      updatedGenreWeight = genrePref.weight;
    } catch (e) {
      console.warn("[POST /api/moods/preference] GenrePreference 업데이트 실패(무시):", e);
    }

    try {
      // ScentPreference 업데이트 (향 이름을 Fragrance.name 으로 사용)
      // Fragrance.name 은 unique 가 아니므로, upsert(where: { name }) 를 쓸 수 없다.
      // 1) name 기준으로 기존 Fragrance 검색
      // 2) 없으면 새로 생성
      let fragrance = await prisma.fragrance.findFirst({
        where: { name: scentType },
      });

      if (!fragrance) {
        fragrance = await prisma.fragrance.create({
          data: {
            name: scentType,
            description: null,
            color: moodColor,
            intensityLevel: 5,
            operatingMin: 5,
            componentsJson: {},
          },
        });
      }

      const scentPref = await prisma.scentPreference.upsert({
        where: {
          userId_scentId: {
            userId,
            scentId: fragrance.id,
          },
        },
        update: {
          weight: {
            increment: 3,
          },
        },
        create: {
          userId,
          scentId: fragrance.id,
          weight: 3,
        },
      });
      updatedScentWeight = scentPref.weight;
    } catch (e) {
      console.warn("[POST /api/moods/preference] ScentPreference 업데이트 실패(무시):", e);
    }

    console.log("[POST /api/moods/preference] 선호도 업데이트 완료(DB 기반):", {
      userId,
      moodId,
      moodName,
      updatedGenreWeight,
      updatedScentWeight,
    });

    return NextResponse.json({
      success: true,
      // 하트 클릭 횟수는 별도 테이블이 없으므로, 현재는 null 로 두고
      // 장르/향 가중치만 반환한다.
      currentCount: null,
      maxReached: false,
      preferenceCounts: {
        music: updatedGenreWeight != null ? { [musicGenre]: updatedGenreWeight } : {},
        scent: updatedScentWeight != null ? { [scentType]: updatedScentWeight } : {},
        color: { [moodColor]: 1 },
      },
    });
  } catch (error) {
    console.error("[POST /api/moods/preference] 처리 중 예외 발생(무시 가능):", error);
    // 요청 자체는 성공으로 돌려보내고, 클라이언트에서는 UI를 그대로 유지
    return NextResponse.json({
      success: false,
      currentCount: null,
      maxReached: false,
      preferenceCounts: {
        music: {},
        scent: {},
        color: {},
      },
    });
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

