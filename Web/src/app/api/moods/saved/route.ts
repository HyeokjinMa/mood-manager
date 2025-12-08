/**
 * API Route: /api/moods/saved
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth, checkMockMode } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/moods/saved
 * 
 * 무드를 무드셋에 저장
 * 
 * Request Body:
 * {
 *   moodId: string;
 *   moodName: string;
 *   moodColor: string;
 *   music: { genre: string; title: string };
 *   scent: { type: string; name: string };
 *   preferenceCount?: number;
 * }
 * 
 * Response:
 * {
 *   success: boolean;
 *   savedMood: { ... };
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const sessionOrError = await requireAuth();
    if (sessionOrError instanceof NextResponse) {
      return sessionOrError;
    }
    const session = sessionOrError;

    const body = await request.json();
    // fullMood: 현재 대시보드에서 보이는 무드 전체 상태(JSON 스냅샷)
    const { moodId, moodName, moodColor, music, scent, preferenceCount = 0, fullMood } = body;

    if (!moodId || !moodName || !moodColor || !music || !scent) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // ============================================
    // 일반 모드: Prisma 기반 Preset + 컴포넌트 저장
    // (목업 모드는 아래에서 별도 처리)
    // ============================================
    if (!(await checkMockMode(session))) {
      try {
        const userId = session.user.id;

        // 1. 장르 처리 (없으면 생성)
        const genreName = music.genre || "newage";
        let genre = await prisma.genre.findUnique({
          where: { name: genreName },
        });
        if (!genre) {
          genre = await prisma.genre.create({
            data: {
              name: genreName,
              description: `${genreName} (auto-created)`,
            },
          });
        }

        // 2. 사운드 처리 (이름 + 장르 기준으로 조회, 없으면 생성)
        const soundTitle = music.title || moodName;
        let sound = await prisma.sound.findFirst({
          where: {
            name: soundTitle,
            genreId: genre.id,
          },
        });

        if (!sound) {
          sound = await prisma.sound.create({
            data: {
              name: soundTitle,
              fileUrl: "/audio/mock/" + encodeURIComponent(soundTitle), // V2: 실제 파일 경로로 대체 예정
              duration: null,
              genreId: genre.id,
              componentsJson: {
                genre: genreName,
                title: soundTitle,
                moodId,
                // 현재 무드 전체 상태를 함께 저장 (LLM/추천용 레퍼런스 데이터)
                fullMood,
              } as object,
            },
          });
        }

        // 3. 향(Fragrance) 처리 (이름 기준으로 조회, 없으면 생성)
        const fragranceName = scent.name || scent.type || "Default Fragrance";
        let fragrance = await prisma.fragrance.findFirst({
          where: { name: fragranceName },
        });

        if (!fragrance) {
          fragrance = await prisma.fragrance.create({
            data: {
              name: fragranceName,
              description: scent.type ?? null,
              color: moodColor,
              intensityLevel: 7,
              operatingMin: 30,
              componentsJson: {
                type: scent.type,
                name: fragranceName,
              } as object,
            },
          });
        }

        // 4. 조명(Light) 처리 (색상 기준으로 조회, 없으면 생성)
        let light = await prisma.light.findFirst({
          where: {
            color: moodColor,
          },
        });

        if (!light) {
          light = await prisma.light.create({
            data: {
              name: `${moodName} Light`,
              color: moodColor,
              brightness: 80,
              temperature: 4000,
            },
          });
        }

        // 5. Preset 생성 (별표 표시용)
        const preset = await prisma.preset.create({
          data: {
            userId,
            fragranceId: fragrance.id,
            lightId: light.id,
            soundId: sound.id,
            name: moodName,
            cluster: null,
            isDefault: false,
            isStarred: true,
            updatedType: "all",
          },
        });

        const savedMoodDb = {
          id: preset.id,
          moodId: preset.id,
          moodName: preset.name,
          moodColor,
          music: {
            genre: genreName,
            title: sound.name,
          },
          scent: {
            type: fragrance.name,
            name: fragrance.name,
          },
          preferenceCount,
          savedAt: preset.createdAt.getTime(),
        };

        return NextResponse.json({
          success: true,
          savedMood: savedMoodDb,
          source: "db-preset",
        });
      } catch (dbError) {
        console.error("[POST /api/moods/saved] DB 저장 실패, mock fallback:", dbError);

        // DB 저장 실패 시에도 UX를 깨지 않기 위해 mock 응답으로 폴백
        const savedMoodFallback = {
          id: `saved-${Date.now()}`,
          moodId,
          moodName,
          moodColor,
          music,
          scent,
          preferenceCount,
          savedAt: Date.now(),
        };

        return NextResponse.json({
          success: true,
          savedMood: savedMoodFallback,
          source: "mock-db-error",
        });
      }
    }

    // 목업 모드 확인 (관리자 계정)
    if (await checkMockMode(session)) {
      console.log("[POST /api/moods/saved] 목업 모드: 관리자 계정");
      console.log("[POST /api/moods/saved] 목업 모드 - 저장 데이터:", {
        moodId,
        moodName,
        moodColor,
        music,
        scent,
        preferenceCount,
      });
      // 관리자 모드에서는 요청한 데이터를 그대로 반환
      // 클라이언트에서 localStorage에 저장하므로 서버에서는 응답만 반환
      const savedMood = {
        id: `saved-${Date.now()}`,
        moodId,
        moodName,
        moodColor,
        music,
        scent,
        preferenceCount,
        savedAt: Date.now(),
      };
      return NextResponse.json({
        success: true,
        savedMood,
        mock: true,
      });
    }

    // TODO: 실제 DB 연동 시 Firestore 사용
    // Firestore 구조:
    // users/{userId}/savedMoods/{savedMoodId}
    // {
    //   moodId, moodName, moodColor, music, scent, preferenceCount,
    //   savedAt: timestamp, updatedAt: timestamp
    // }

    // [MOCK] 목업 응답 (일반 모드)
    const savedMood = {
      id: `saved-${Date.now()}`,
      moodId,
      moodName,
      moodColor,
      music,
      scent,
      preferenceCount,
      savedAt: Date.now(),
    };

    return NextResponse.json({
      success: true,
      savedMood,
    });
  } catch (error) {
    console.error("Error saving mood:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/moods/saved
 * 
 * 저장된 무드 목록 조회
 * 
 * Response:
 * {
 *   savedMoods: Array<{ ... }>;
 * }
 */
export async function GET() {
  try {
    const sessionOrError = await requireAuth();
    if (sessionOrError instanceof NextResponse) {
      return sessionOrError;
    }
    const session = sessionOrError;

    // ============================================
    // 일반 모드: Prisma 기반 Preset 조회
    // (목업 모드는 아래에서 별도 처리)
    // ============================================
    if (!(await checkMockMode(session))) {
      try {
        const presets = await prisma.preset.findMany({
          where: {
            userId: session.user.id,
            isStarred: true,
          },
          include: {
            fragrance: true,
            light: true,
            sound: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        });

        const savedMoodsFromDb = presets.map((preset: {
          id: string;
          name: string;
          createdAt: Date;
          sound?: { name: string; componentsJson: unknown } | null;
          light?: { color: string } | null;
          fragrance?: { name: string } | null;
        }) => {
          const components = ((preset.sound?.componentsJson as Record<string, unknown>) || {});
          const fullMood = components.fullMood as
            | {
                mood?: { name?: string; color?: string; song?: { title?: string }; scent?: { type?: string; name?: string } };
                currentSegment?: { mood?: { song?: { title?: string } } };
              }
            | undefined;

          const moodNameFromFull = fullMood?.mood?.name;
          const moodColorFromFull = fullMood?.mood?.color;
          const musicTitleFromFull =
            fullMood?.currentSegment?.mood?.song?.title || fullMood?.mood?.song?.title;
          const scentTypeFromFull = fullMood?.mood?.scent?.type;
          const scentNameFromFull = fullMood?.mood?.scent?.name;

          return {
            id: preset.id,
            moodId: preset.id,
            moodName: moodNameFromFull || preset.name,
            moodColor: moodColorFromFull || preset.light?.color || "#FFFFFF",
            music: {
              genre: components.genre || "newage",
              title: musicTitleFromFull || preset.sound?.name || "N/A",
            },
            scent: {
              type: scentTypeFromFull || preset.fragrance?.name || "Unknown",
              name: scentNameFromFull || preset.fragrance?.name || "Unknown",
            },
            preferenceCount: 0,
            savedAt: new Date(preset.createdAt).getTime?.() ?? preset.createdAt?.getTime?.() ?? Date.now(),
          };
        });

        return NextResponse.json({
          savedMoods: savedMoodsFromDb,
          source: "db-presets",
        });
      } catch (dbError) {
        console.error("[GET /api/moods/saved] DB 조회 실패, mock fallback:", dbError);

        // DB 조회 실패 시, 안전하게 빈 배열 + mock 플래그 반환
        return NextResponse.json({
          savedMoods: [],
          source: "mock-db-error",
        });
      }
    }

    // 목업 모드 확인 (관리자 계정)
    if (await checkMockMode(session)) {
      console.log("[GET /api/moods/saved] 목업 모드: 관리자 계정");
      // 관리자 모드에서는 빈 배열 반환 (클라이언트에서 localStorage로 관리)
      // 클라이언트에서 localStorage를 사용하므로 서버에서는 빈 배열 반환
      return NextResponse.json({
        savedMoods: [],
        mock: true,
      });
    }

    // TODO: 실제 DB 연동 시 Firestore에서 조회
    // 일반 모드에서는 실제 DB에서 조회해야 하므로 빈 배열 반환
    // [MOCK] 목업 응답은 관리자 모드에서만 사용
    const savedMoods: Array<{
      id: string;
      moodId: string;
      moodName: string;
      moodColor: string;
      music: { genre: string; title: string };
      scent: { type: string; name: string };
      preferenceCount: number;
      savedAt: number;
    }> = [];

    return NextResponse.json({
      savedMoods,
    });
  } catch (error) {
    console.error("Error fetching saved moods:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

