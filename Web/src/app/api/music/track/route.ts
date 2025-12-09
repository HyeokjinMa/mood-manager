/**
 * GET /api/music/track
 * 
 * 음악 트랙 정보 조회 API (제목 기반)
 * 
 * Query Parameters:
 * - title: 음악 제목
 */

import { NextRequest, NextResponse } from "next/server";
import { getMusicTrackByTitle } from "@/lib/music/getMusicTrackByID";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const title = searchParams.get("title");

    if (!title) {
      return NextResponse.json(
        { error: "Title parameter is required" },
        { status: 400 }
      );
    }

    const track = await getMusicTrackByTitle(title);

    if (!track) {
      return NextResponse.json(
        { error: "Track not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(track);
  } catch (error) {
    console.error("[GET /api/music/track] 에러:", error);
    return NextResponse.json(
      { error: "Failed to fetch track" },
      { status: 500 }
    );
  }
}

