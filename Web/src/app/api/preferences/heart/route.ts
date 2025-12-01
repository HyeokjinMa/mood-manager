/**
 * POST /api/preferences/heart
 * 
 * 하트 클릭 시 가중치 +1 업데이트
 * 
 * 요청:
 * {
 *   fragranceName?: string;  // 향 이름 (예: "Citrus")
 *   genreName?: string;      // 장르 이름 (예: "newage")
 * }
 * 
 * 응답:
 * - 성공: { success: true }
 * - 실패: { error: "ERROR_CODE", message: "에러 메시지" }
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
    const { fragranceName, genreName } = body;

    // 3. 목업 모드 확인 (관리자 계정)
    const isMockMode = await checkMockMode(session);
    if (isMockMode) {
      console.log("[POST /api/preferences/heart] 목업 모드: 관리자 계정");
      console.log("[POST /api/preferences/heart] 목업 모드 - 하트 클릭 데이터:", {
        fragranceName,
        genreName,
      });
      // 목업 모드: 실제 로직 실행 (메모리 저장소 사용, DB 저장 없음)
      // 가중치 업데이트 로직을 실행하여 유효한 아웃풋 생성
      
      // 메모리 저장소 초기화
      initializeMockPreferences(session.user.id);
      
      // 향 가중치 업데이트 (+1)
      if (fragranceName) {
        const existing = getMockScentPreference(session.user.id, fragranceName);
        const currentWeight = existing?.weight || 1;
        const newWeight = currentWeight + 1; // 하트 클릭: +1
        upsertMockScentPreference(session.user.id, fragranceName, newWeight);
        console.log(`[POST /api/preferences/heart] 목업 모드 - 향 가중치 업데이트: ${fragranceName} (${currentWeight} → ${newWeight})`);
      }
      
      // 장르 가중치 업데이트 (+1)
      if (genreName) {
        const existing = getMockGenrePreference(session.user.id, genreName);
        const currentWeight = existing?.weight || 1;
        const newWeight = currentWeight + 1; // 하트 클릭: +1
        upsertMockGenrePreference(session.user.id, genreName, newWeight);
        console.log(`[POST /api/preferences/heart] 목업 모드 - 장르 가중치 업데이트: ${genreName} (${currentWeight} → ${newWeight})`);
      }
      
      console.log("[POST /api/preferences/heart] 목업 모드: 가중치 업데이트 완료 (메모리 저장소)");
      return NextResponse.json({ success: true, mock: true });
    }

    if (!fragranceName && !genreName) {
      return NextResponse.json(
        { error: "INVALID_INPUT", message: "fragranceName 또는 genreName이 필요합니다." },
        { status: 400 }
      );
    }

    // 4. 향 가중치 업데이트 (+1)
    if (fragranceName) {
      const fragrance = await prisma.fragrance.findFirst({
        where: { name: { equals: fragranceName, mode: "insensitive" } },
      });

      if (fragrance) {
        // 현재 가중치 조회
        const existing = await prisma.scentPreference.findUnique({
          where: {
            userId_scentId: {
              userId: session.user.id,
              scentId: fragrance.id,
            },
          },
        });

        const currentWeight = existing?.weight || 1;
        const newWeight = currentWeight + 1; // 하트 클릭: +1

        await prisma.scentPreference.upsert({
          where: {
            userId_scentId: {
              userId: session.user.id,
              scentId: fragrance.id,
            },
          },
          update: {
            weight: newWeight,
          },
          create: {
            userId: session.user.id,
            scentId: fragrance.id,
            weight: newWeight,
          },
        });

        console.log(`[POST /api/preferences/heart] 향 가중치 업데이트: ${fragranceName} (${currentWeight} → ${newWeight})`);
      } else {
        console.warn(`[POST /api/preferences/heart] 향을 찾을 수 없음: ${fragranceName}`);
      }
    }

    // 5. 장르 가중치 업데이트 (+1)
    if (genreName) {
      const genre = await prisma.genre.findUnique({
        where: { name: genreName },
      });

      if (genre) {
        // 현재 가중치 조회
        const existing = await prisma.genrePreference.findUnique({
          where: {
            userId_genreId: {
              userId: session.user.id,
              genreId: genre.id,
            },
          },
        });

        const currentWeight = existing?.weight || 1;
        const newWeight = currentWeight + 1; // 하트 클릭: +1

        await prisma.genrePreference.upsert({
          where: {
            userId_genreId: {
              userId: session.user.id,
              genreId: genre.id,
            },
          },
          update: {
            weight: newWeight,
          },
          create: {
            userId: session.user.id,
            genreId: genre.id,
            weight: newWeight,
          },
        });

        console.log(`[POST /api/preferences/heart] 장르 가중치 업데이트: ${genreName} (${currentWeight} → ${newWeight})`);
      } else {
        console.warn(`[POST /api/preferences/heart] 장르를 찾을 수 없음: ${genreName}`);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[POST /api/preferences/heart] 가중치 업데이트 실패:", error);
    return NextResponse.json(
      {
        error: "INTERNAL_ERROR",
        message: "가중치 업데이트 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}

