// src/app/api/preferences/route.ts
/**
 * [파일 역할]
 * - 사용자 선호도 저장 및 조회 API
 * - 설문 완료 시 선호도를 DB에 저장
 * - LLM Input 형식(Record<string, '+' | '-'>)으로 저장
 *
 * [사용되는 위치]
 * - POST /api/preferences: 설문 완료 시 선호도 저장
 * - GET /api/preferences: 사용자 선호도 조회
 *
 * [주의사항]
 * - 인증이 필요한 엔드포인트
 * - 선호도는 JSON 형식으로 저장 (scentPreferences, colorPreferences, musicPreferences)
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth, checkMockMode } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import {
  getMockScentPreference,
  upsertMockScentPreference,
  getMockGenrePreference,
  upsertMockGenrePreference,
  initializeMockPreferences,
} from "@/lib/mock/mockPreferenceStore";

/**
 * 설문 완료 시 가중치 업데이트
 * - 호 (초록색 유지): 가중치 +10 (초기 1 + 10 = 11)
 * - 불호 (초록색 끔): 가중치 +1 (초기 1 + 1 = 2, 최소값 1 유지)
 */
async function updatePreferenceWeights(
  userId: string,
  scentLiked: string[],
  scentDisliked: string[],
  musicLiked: string[],
  musicDisliked: string[],
  tagLiked: string[],
  tagDisliked: string[],
  isMockMode: boolean = false
) {
  try {
    // 목업 모드: 메모리 저장소 초기화
    if (isMockMode) {
      initializeMockPreferences(userId);
    }

    // 향 선호도 업데이트
    // 호 (초록색 유지): 가중치 +10
    for (const scentName of scentLiked) {
      if (isMockMode) {
        // 목업 모드: 메모리 저장소 사용
        const existing = getMockScentPreference(userId, scentName);
        const currentWeight = existing?.weight || 1;
        const newWeight = currentWeight + 10; // 호: +10
        upsertMockScentPreference(userId, scentName, newWeight);
      } else {
        // 일반 모드: DB 저장
        const fragrance = await prisma.fragrance.findFirst({
          where: { name: { equals: scentName, mode: "insensitive" } },
        });

        if (fragrance) {
          // 현재 가중치 조회
          const existing = await prisma.scentPreference.findUnique({
            where: {
              userId_scentId: {
                userId,
                scentId: fragrance.id,
              },
            },
          });

          const currentWeight = existing?.weight || 1;
          const newWeight = currentWeight + 10; // 호: +10

          await prisma.scentPreference.upsert({
            where: {
              userId_scentId: {
                userId,
                scentId: fragrance.id,
              },
            },
            update: {
              weight: newWeight,
            },
            create: {
              userId,
              scentId: fragrance.id,
              weight: newWeight,
            },
          });
        }
      }
    }

    // 불호 (초록색 끔): 가중치 +1 (최소값 1 유지)
    for (const scentName of scentDisliked) {
      if (isMockMode) {
        // 목업 모드: 메모리 저장소 사용
        const existing = getMockScentPreference(userId, scentName);
        const currentWeight = existing?.weight || 1;
        const newWeight = Math.max(1, currentWeight + 1); // 불호: +1, 최소값 1
        upsertMockScentPreference(userId, scentName, newWeight);
      } else {
        // 일반 모드: DB 저장
        const fragrance = await prisma.fragrance.findFirst({
          where: { name: { equals: scentName, mode: "insensitive" } },
        });

        if (fragrance) {
          // 현재 가중치 조회
          const existing = await prisma.scentPreference.findUnique({
            where: {
              userId_scentId: {
                userId,
                scentId: fragrance.id,
              },
            },
          });

          const currentWeight = existing?.weight || 1;
          const newWeight = Math.max(1, currentWeight + 1); // 불호: +1, 최소값 1

          await prisma.scentPreference.upsert({
            where: {
              userId_scentId: {
                userId,
                scentId: fragrance.id,
              },
            },
            update: {
              weight: newWeight,
            },
            create: {
              userId,
              scentId: fragrance.id,
              weight: newWeight,
            },
          });
        }
      }
    }

    // 장르 선호도 업데이트
    // 호 (초록색 유지): 가중치 +10
    for (const genreName of musicLiked) {
      if (isMockMode) {
        // 목업 모드: 메모리 저장소 사용
        const existing = getMockGenrePreference(userId, genreName);
        const currentWeight = existing?.weight || 1;
        const newWeight = currentWeight + 10; // 호: +10
        upsertMockGenrePreference(userId, genreName, newWeight);
      } else {
        // 일반 모드: DB 저장
        const genre = await prisma.genre.findUnique({
          where: { name: genreName },
        });

        if (genre) {
          // 현재 가중치 조회
          const existing = await prisma.genrePreference.findUnique({
            where: {
              userId_genreId: {
                userId,
                genreId: genre.id,
              },
            },
          });

          const currentWeight = existing?.weight || 1;
          const newWeight = currentWeight + 10; // 호: +10

          await prisma.genrePreference.upsert({
            where: {
              userId_genreId: {
                userId,
                genreId: genre.id,
              },
            },
            update: {
              weight: newWeight,
            },
            create: {
              userId,
              genreId: genre.id,
              weight: newWeight,
            },
          });
        }
      }
    }

    // 불호 (초록색 끔): 가중치 +1 (최소값 1 유지)
    for (const genreName of musicDisliked) {
      if (isMockMode) {
        // 목업 모드: 메모리 저장소 사용
        const existing = getMockGenrePreference(userId, genreName);
        const currentWeight = existing?.weight || 1;
        const newWeight = Math.max(1, currentWeight + 1); // 불호: +1, 최소값 1
        upsertMockGenrePreference(userId, genreName, newWeight);
      } else {
        // 일반 모드: DB 저장
        const genre = await prisma.genre.findUnique({
          where: { name: genreName },
        });

        if (genre) {
          // 현재 가중치 조회
          const existing = await prisma.genrePreference.findUnique({
            where: {
              userId_genreId: {
                userId,
                genreId: genre.id,
              },
            },
          });

          const currentWeight = existing?.weight || 1;
          const newWeight = Math.max(1, currentWeight + 1); // 불호: +1, 최소값 1

          await prisma.genrePreference.upsert({
            where: {
              userId_genreId: {
                userId,
                genreId: genre.id,
              },
            },
            update: {
              weight: newWeight,
            },
            create: {
              userId,
              genreId: genre.id,
              weight: newWeight,
            },
          });
        }
      }
    }

    // 태그 선호도 업데이트
    // 호 (초록색 유지): 가중치 +10
    for (const tagName of tagLiked) {
      if (isMockMode) {
        // 현재는 태그에 대한 별도 mock 저장소가 없으므로, 목업 모드에서는 스킵
        continue;
      } else {
        const tag = await prisma.tag.findUnique({
          where: { name: tagName },
        });

        if (tag) {
          const existing = await prisma.tagPreference.findUnique({
            where: {
              userId_tagId: {
                userId,
                tagId: tag.id,
              },
            },
          });

          const currentWeight = existing?.weight || 1;
          const newWeight = currentWeight + 10;

          await prisma.tagPreference.upsert({
            where: {
              userId_tagId: {
                userId,
                tagId: tag.id,
              },
            },
            update: {
              weight: newWeight,
            },
            create: {
              userId,
              tagId: tag.id,
              weight: newWeight,
            },
          });
        }
      }
    }

    // 불호 (초록색 끔): 가중치 +1 (최소값 1 유지)
    for (const tagName of tagDisliked) {
      if (isMockMode) {
        // 현재는 태그에 대한 별도 mock 저장소가 없으므로, 목업 모드에서는 스킵
        continue;
      } else {
        const tag = await prisma.tag.findUnique({
          where: { name: tagName },
        });

        if (tag) {
          const existing = await prisma.tagPreference.findUnique({
            where: {
              userId_tagId: {
                userId,
                tagId: tag.id,
              },
            },
          });

          const currentWeight = existing?.weight || 1;
          const newWeight = Math.max(1, currentWeight + 1);

          await prisma.tagPreference.upsert({
            where: {
              userId_tagId: {
                userId,
                tagId: tag.id,
              },
            },
            update: {
              weight: newWeight,
            },
            create: {
              userId,
              tagId: tag.id,
              weight: newWeight,
            },
          });
        }
      }
    }

    console.log(`[updatePreferenceWeights] 가중치 업데이트 완료 (userId: ${userId})`);
  } catch (error) {
    console.error("[updatePreferenceWeights] 가중치 업데이트 실패:", error);
    // 가중치 업데이트 실패는 치명적이지 않으므로 에러를 던지지 않음
  }
}

/**
 * GET /api/preferences
 *
 * 사용자 선호도 조회
 *
 * 응답:
 * - 성공: { success: true, preferences: {...} }
 * - 실패: { error: "ERROR_CODE", message: "에러 메시지" }
 */
export async function GET() {
  try {
    // 1. 세션 검증
    const sessionOrError = await requireAuth();
    if (sessionOrError instanceof NextResponse) {
      return sessionOrError;
    }
    const session = sessionOrError;

    // 2. 목업 모드 확인 (관리자 계정)
    if (await checkMockMode(session)) {
      console.log("[GET /api/preferences] 목업 모드: 관리자 계정");
      // 목업 선호도 반환 (설문 완료 가정: 대부분 호, 일부 불호)
      return NextResponse.json({
        success: true,
        preferences: {
          scentLiked: "Citrus,Floral,Woody,Fresh,Sweet,Herbal,Fruity,Musk,Aromatic,Honey,Green,Marine,Powdery",
          scentDisliked: "Spicy,Dry,Leathery",
          colorLiked: "warmWhite,skyBlue",
          colorDisliked: null,
          musicLiked: "newage,classical,jazz,ambient,nature,meditation,piano,electronic",
          musicDisliked: "guitar,orchestral",
        },
        mock: true,
      });
    }

    // 3. 선호도 조회
    let preferences;
    try {
      preferences = await prisma.userPreferences.findUnique({
        where: { userId: session.user.id },
      });
    } catch (dbError) {
      console.error("[GET /api/preferences] DB 조회 실패, 목업 데이터 반환:", dbError);
      // 목업 선호도 반환
      return NextResponse.json({
        success: true,
        preferences: {
          scentLiked: "Citrus,Floral,Woody",
          scentDisliked: null,
          colorLiked: "warmWhite,skyBlue",
          colorDisliked: null,
          musicLiked: "newage,classical",
          musicDisliked: null,
        },
        mock: true,
      });
    }

    return NextResponse.json({
      success: true,
      preferences: preferences || null,
    });
  } catch (error) {
    console.error("[GET /api/preferences] 선호도 조회 실패:", error);
    return NextResponse.json(
      {
        error: "INTERNAL_ERROR",
        message: "선호도 조회 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/preferences
 *
 * 사용자 선호도 저장 (설문 완료 시)
 *
 * 요청:
 * {
 *   "scentLiked": ["Citrus", "Floral", "Woody"],
 *   "scentDisliked": ["Musk", "Leathery"],
 *   "colorLiked": ["warmWhite", "skyBlue"],
 *   "colorDisliked": ["red"],
 *   "musicLiked": ["newage", "classical"],
 *   "musicDisliked": ["jazz"]
 * }
 *
 * 응답:
 * - 성공: { success: true }
 * - 실패: { error: "ERROR_CODE", message: "에러 메시지" }
 */
export async function POST(request: NextRequest) {
  try {
    // 1. 세션 검증
    const sessionOrError = await requireAuth();
    if (sessionOrError instanceof NextResponse) {
      return sessionOrError;
    }
    const session = sessionOrError;

    // 2. 요청 본문 파싱
    const body = await request.json();
    const {
      scentLiked,
      scentDisliked,
      colorLiked,
      colorDisliked,
      musicLiked,
      musicDisliked,
      tagLiked = [],
      tagDisliked = [],
    } = body;

    // 3. 목업 모드 확인 (관리자 계정)
    const isMockMode = await checkMockMode(session);
    if (isMockMode) {
      console.log("[POST /api/preferences] 목업 모드: 관리자 계정");
      console.log("[POST /api/preferences] 목업 모드 - 설문 데이터:", {
        scentLiked: Array.isArray(scentLiked) ? scentLiked.length : 0,
        scentDisliked: Array.isArray(scentDisliked) ? scentDisliked.length : 0,
        musicLiked: Array.isArray(musicLiked) ? musicLiked.length : 0,
        musicDisliked: Array.isArray(musicDisliked) ? musicDisliked.length : 0,
        tagLiked: Array.isArray(tagLiked) ? tagLiked.length : 0,
        tagDisliked: Array.isArray(tagDisliked) ? tagDisliked.length : 0,
      });
      // 목업 모드: 실제 로직 실행 (메모리 저장소 사용, DB 저장 없음)
      // 가중치 업데이트 로직을 실행하여 유효한 아웃풋 생성
      await updatePreferenceWeights(
        session.user.id,
        Array.isArray(scentLiked) ? scentLiked : [],
        Array.isArray(scentDisliked) ? scentDisliked : [],
        Array.isArray(musicLiked) ? musicLiked : [],
        Array.isArray(musicDisliked) ? musicDisliked : [],
        Array.isArray(tagLiked) ? tagLiked : [],
        Array.isArray(tagDisliked) ? tagDisliked : [],
        true, // isMockMode = true
      );
      console.log("[POST /api/preferences] 목업 모드: 가중치 업데이트 완료 (메모리 저장소)");
      return NextResponse.json({ success: true, mock: true });
    }

    // 4. 배열을 쉼표로 구분된 문자열로 변환
    const scentLikedStr = Array.isArray(scentLiked) ? scentLiked.join(',') : (typeof scentLiked === 'string' ? scentLiked : null);
    const scentDislikedStr = Array.isArray(scentDisliked) ? scentDisliked.join(',') : (typeof scentDisliked === 'string' ? scentDisliked : null);
    const colorLikedStr = Array.isArray(colorLiked) ? colorLiked.join(',') : (typeof colorLiked === 'string' ? colorLiked : null);
    const colorDislikedStr = Array.isArray(colorDisliked) ? colorDisliked.join(',') : (typeof colorDisliked === 'string' ? colorDisliked : null);
    const musicLikedStr = Array.isArray(musicLiked) ? musicLiked.join(',') : (typeof musicLiked === 'string' ? musicLiked : null);
    const musicDislikedStr = Array.isArray(musicDisliked) ? musicDisliked.join(',') : (typeof musicDisliked === 'string' ? musicDisliked : null);

    // 5. 선호도 저장 (upsert)
    try {
      await prisma.userPreferences.upsert({
        where: { userId: session.user.id },
        create: {
          userId: session.user.id,
          scentLiked: scentLikedStr,
          scentDisliked: scentDislikedStr,
          colorLiked: colorLikedStr,
          colorDisliked: colorDislikedStr,
          musicLiked: musicLikedStr,
          musicDisliked: musicDislikedStr,
        },
        update: {
          scentLiked: scentLikedStr,
          scentDisliked: scentDislikedStr,
          colorLiked: colorLikedStr,
          colorDisliked: colorDislikedStr,
          musicLiked: musicLikedStr,
          musicDisliked: musicDislikedStr,
        },
      });

      // 6. User.hasSurvey 업데이트
      await prisma.user.update({
        where: { id: session.user.id },
        data: { hasSurvey: true },
      });

      // 7. 가중치 시스템 업데이트 (ScentPreference, GenrePreference)
      await updatePreferenceWeights(
        session.user.id,
        Array.isArray(scentLiked) ? scentLiked : [],
        Array.isArray(scentDisliked) ? scentDisliked : [],
        Array.isArray(musicLiked) ? musicLiked : [],
        Array.isArray(musicDisliked) ? musicDisliked : [],
        Array.isArray(tagLiked) ? tagLiked : [],
        Array.isArray(tagDisliked) ? tagDisliked : [],
        false, // isMockMode = false (일반 모드)
      );
    } catch (dbError) {
      console.error("[POST /api/preferences] DB 저장 실패, 목업 모드로 처리:", dbError);
      // DB 저장 실패 시 목업 모드로 처리
      return NextResponse.json({ success: true, mock: true });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[POST /api/preferences] 선호도 저장 실패:", error);
    return NextResponse.json(
      {
        error: "INTERNAL_ERROR",
        message: "선호도 저장 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}
