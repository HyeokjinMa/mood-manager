/**
 * 간단한 musicID → MusicTrack 매핑
 * 
 * LLM이 musicID를 선택하면 → JSON에서 해당 트랙 로드
 */

import type { MusicTrack as MoodStreamMusicTrack } from "@/hooks/useMoodStream/types";
import { getMusicTrackByID } from "./getMusicTrackByID";

/**
 * musicID 선택을 MusicTrack으로 변환
 * 
 * @param musicID - 10-69
 * @returns MusicTrack 1개
 */
export async function mapMusicIDToTrack(musicID: number): Promise<MoodStreamMusicTrack[]> {
  const track = getMusicTrackByID(musicID);
  
  if (!track) {
    console.warn(`[mapMusicIDToTrack] musicID를 찾을 수 없음: ${musicID}`);
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

