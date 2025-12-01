// ======================================================
// File: src/app/api/moods/saved/[savedMoodId]/route.ts
// ======================================================

import { NextRequest, NextResponse } from "next/server";
import { requireAuth, checkMockMode } from "@/lib/auth/session";
import type { ScentType } from "@/types/mood";

/**
 * DELETE /api/moods/saved/{savedMoodId}
 * 
 * 저장된 무드 삭제
 * 
 * Response:
 * {
 *   success: boolean;
 *   deletedId: string;
 * }
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ savedMoodId: string }> }
) {
  try {
    const sessionOrError = await requireAuth();
    if (sessionOrError instanceof NextResponse) {
      return sessionOrError;
    }
    const session = sessionOrError;

    const { savedMoodId } = await params;

    // 목업 모드 확인 (관리자 계정)
    if (await checkMockMode(session)) {
      console.log("[DELETE /api/moods/saved/:savedMoodId] 목업 모드: 관리자 계정");
      console.log("[DELETE /api/moods/saved/:savedMoodId] 목업 모드 - 삭제 ID:", savedMoodId);
      // 관리자 모드에서는 항상 성공 응답 (클라이언트에서 localStorage에서 삭제 처리)
      return NextResponse.json({
        success: true,
        deletedId: savedMoodId,
      });
    }

    // TODO: 실제 DB 연동 시 Firestore에서 삭제
    // Firestore: users/{userId}/savedMoods/{savedMoodId} 삭제

    return NextResponse.json({
      success: true,
      deletedId: savedMoodId,
    });
  } catch (error) {
    console.error("Error deleting saved mood:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/moods/saved/{savedMoodId}/apply
 * 
 * 저장된 무드를 현재 무드로 적용
 * 
 * Response:
 * {
 *   success: boolean;
 *   mood: Mood;
 *   updatedDevices: Device[];
 * }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ savedMoodId: string }> }
) {
  try {
    const sessionOrError = await requireAuth();
    if (sessionOrError instanceof NextResponse) {
      return sessionOrError;
    }
    // const session = sessionOrError; // 향후 사용 예정

    const { savedMoodId } = await params;

    // TODO: 실제 DB 연동 시 Firestore에서 저장된 무드 조회
    // [MOCK] 목업 응답
    interface SavedMood {
      id: string;
      moodId: string;
      moodName: string;
      moodColor: string;
      music: {
        genre: string;
        title: string;
      };
      scent: {
        type: string;
        name: string;
      };
    }
    const savedMood: SavedMood = {
      id: savedMoodId,
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
    };

    // TODO: 실제 무드 객체로 변환 (MOODS 배열에서 찾기)
    const mood = {
      id: savedMood.moodId,
      name: savedMood.moodName,
      color: savedMood.moodColor,
      song: {
        title: savedMood.music.title,
        duration: 180, // 기본값
      },
      scent: {
        type: savedMood.scent.type as ScentType,
        name: savedMood.scent.name,
        color: savedMood.moodColor, // 임시
      },
    };

    return NextResponse.json({
      success: true,
      mood,
      updatedDevices: [],
    });
  } catch (error) {
    console.error("Error applying saved mood:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

