// ======================================================
// File: src/app/api/moods/saved/route.ts
// ======================================================

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
        let genre = await (prisma as any).genre.findUnique({
          where: { name: genreName },
        });
        if (!genre) {
          genre = await (prisma as any).genre.create({
            data: {
              name: genreName,
              description: `${genreName} (auto-created)`,
            },
          });
        }

        // 2. 사운드 처리 (이름 + 장르 기준으로 조회, 없으면 생성)
        const soundTitle = music.title || moodName;
        let sound = await (prisma as any).sound.findFirst({
          where: {
            name: soundTitle,
            genreId: genre.id,
          },
        });

        if (!sound) {
          sound = await (prisma as any).sound.create({
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
              },
            } as any,
          });
        }

        // 3. 향(Fragrance) 처리 (이름 기준으로 조회, 없으면 생성)
        const fragranceName = scent.name || scent.type || "Default Fragrance";
        let fragrance = await (prisma as any).fragrance.findFirst({
          where: { name: fragranceName },
        });

        if (!fragrance) {
          fragrance = await (prisma as any).fragrance.create({
            data: {
              name: fragranceName,
              description: scent.type ?? null,
              color: moodColor,
              intensityLevel: 7,
              operatingMin: 30,
              componentsJson: {
                type: scent.type,
                name: fragranceName,
              },
            },
          });
        }

        // 4. 조명(Light) 처리 (색상 기준으로 조회, 없으면 생성)
        let light = await (prisma as any).light.findFirst({
          where: {
            color: moodColor,
          },
        });

        if (!light) {
          light = await (prisma as any).light.create({
            data: {
              name: `${moodName} Light`,
              color: moodColor,
              brightness: 80,
              temperature: 4000,
            },
          });
        }

        // 5. Preset 생성 (별표 표시용)
        const preset = await (prisma as any).preset.create({
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
        const presets = await (prisma as any).preset.findMany({
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

        const savedMoodsFromDb = (presets as any[]).map((preset) => {
          const components = (preset.sound?.componentsJson || {}) as any;
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
    // [MOCK] 목업 응답 (일반 모드) - 샘플 11개 무드셋
    const savedMoods = [
      {
        id: "saved-1",
        moodId: "calm-1",
        moodName: "Calm Breeze",
        moodColor: "#E6F3FF",
        music: {
          genre: "newage",
          title: "Calm Breeze",
        },
        scent: {
          type: "Marine",
          name: "Wave",
        },
        preferenceCount: 0,
        savedAt: Date.now() - 86400000 * 11,
      },
      {
        id: "saved-2",
        moodId: "focus-1",
        moodName: "Deep Focus",
        moodColor: "#F5F5DC",
        music: {
          genre: "classical",
          title: "Concentration",
        },
        scent: {
          type: "Musk",
          name: "Cloud",
        },
        preferenceCount: 0,
        savedAt: Date.now() - 86400000 * 10,
      },
      {
        id: "saved-3",
        moodId: "energy-1",
        moodName: "Morning Energy",
        moodColor: "#FFD700",
        music: {
          genre: "ambient",
          title: "Sunrise",
        },
        scent: {
          type: "Citrus",
          name: "Orange",
        },
        preferenceCount: 0,
        savedAt: Date.now() - 86400000 * 9,
      },
      {
        id: "saved-4",
        moodId: "relax-1",
        moodName: "Evening Relax",
        moodColor: "#9CAF88",
        music: {
          genre: "jazz",
          title: "Soft Evening",
        },
        scent: {
          type: "Aromatic",
          name: "Herb",
        },
        preferenceCount: 0,
        savedAt: Date.now() - 86400000 * 8,
      },
      {
        id: "saved-5",
        moodId: "romantic-1",
        moodName: "Romantic Night",
        moodColor: "#FF69B4",
        music: {
          genre: "piano",
          title: "Love Song",
        },
        scent: {
          type: "Floral",
          name: "Rose",
        },
        preferenceCount: 0,
        savedAt: Date.now() - 86400000 * 7,
      },
      {
        id: "saved-6",
        moodId: "calm-2",
        moodName: "Calm Breeze",
        moodColor: "#D4E6F1",
        music: {
          genre: "nature",
          title: "Ocean Waves",
        },
        scent: {
          type: "Marine",
          name: "Shell",
        },
        preferenceCount: 0,
        savedAt: Date.now() - 86400000 * 6,
      },
      {
        id: "saved-7",
        moodId: "focus-2",
        moodName: "Deep Focus",
        moodColor: "#FFFDD0",
        music: {
          genre: "classical",
          title: "Concentration",
        },
        scent: {
          type: "Musk",
          name: "Cloud",
        },
        preferenceCount: 0,
        savedAt: Date.now() - 86400000 * 5,
      },
      {
        id: "saved-8",
        moodId: "energy-2",
        moodName: "Morning Energy",
        moodColor: "#FFA500",
        music: {
          genre: "electronic",
          title: "Vitality",
        },
        scent: {
          type: "Citrus",
          name: "Lemon",
        },
        preferenceCount: 0,
        savedAt: Date.now() - 86400000 * 4,
      },
      {
        id: "saved-9",
        moodId: "relax-2",
        moodName: "Evening Relax",
        moodColor: "#B19CD9",
        music: {
          genre: "meditation",
          title: "Peaceful Night",
        },
        scent: {
          type: "Aromatic",
          name: "Lavender",
        },
        preferenceCount: 0,
        savedAt: Date.now() - 86400000 * 3,
      },
      {
        id: "saved-10",
        moodId: "romantic-2",
        moodName: "Romantic Night",
        moodColor: "#FF7F50",
        music: {
          genre: "piano",
          title: "Intimate",
        },
        scent: {
          type: "Floral",
          name: "Rose",
        },
        preferenceCount: 0,
        savedAt: Date.now() - 86400000 * 2,
      },
      {
        id: "saved-11",
        moodId: "calm-3",
        moodName: "Calm Breeze",
        moodColor: "#AED6F1",
        music: {
          genre: "nature",
          title: "Gentle Rain",
        },
        scent: {
          type: "Green",
          name: "Sprout",
        },
        preferenceCount: 0,
        savedAt: Date.now() - 86400000,
      },
    ];

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

