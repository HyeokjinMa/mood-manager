/**
 * 간단한 genre → MusicTrack 매핑
 * 
 * LLM이 genre를 선택하면 → JSON에서 해당 트랙 로드
 */

import type { MusicTrack as MoodStreamMusicTrack } from "@/hooks/useMoodStream/types";
import { getMusicTrackByGenre } from "./getMusicTrackByGenre";

/**
 * genre 선택을 MusicTrack으로 변환
 * 
 * @param genre - "Balad_1", "Pop_5" 등
 * @returns MusicTrack 1개
 */
export async function mapGenreToTrack(genre: string): Promise<MoodStreamMusicTrack[]> {
  const track = getMusicTrackByGenre(genre);
  
  if (!track) {
    console.warn(`[mapGenreToTrack] genre를 찾을 수 없음: "${genre}"`);
    return [];
  }

  // MoodStreamMusicTrack 형식으로 변환
  return [{
    title: track.title,
    artist: track.artist,
    duration: track.duration * 1000, // 초 → 밀리초
    startOffset: 0,
    fadeIn: 750,
    fadeOut: 750,
    fileUrl: track.mp3Url,
    albumImageUrl: track.imageUrl,
  }];
}

