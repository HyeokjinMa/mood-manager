/**
 * 간단한 음악 트랙 조회
 * 
 * genre 선택 → JSON 파일에서 해당 트랙 로드
 */

import musicTracksData from "./musicTracks.json";
import type { JsonMusicTrack } from "@/types/music";

interface MusicTracksJSON {
  version: string;
  lastUpdated: string;
  tracks: JsonMusicTrack[];
}

const musicTracks = musicTracksData as MusicTracksJSON;

/**
 * genre로 음악 트랙 찾기
 * 
 * @param genre - "Balad_1", "Pop_5" 등
 * @returns MusicTrack 또는 null
 */
export function getMusicTrackByGenre(genre: string): JsonMusicTrack | null {
  const track = musicTracks.tracks.find(t => t.genre === genre);
  return track || null;
}

/**
 * 장르별로 그룹화된 트랙 목록 가져오기
 * 
 * @param genreBase - "Balad", "Pop" 등 (번호 제외)
 * @returns 해당 장르의 모든 트랙
 */
export function getMusicTracksByGenreBase(genreBase: string): JsonMusicTrack[] {
  return musicTracks.tracks.filter(t => t.genre.startsWith(genreBase + "_"));
}

/**
 * 모든 트랙 가져오기
 */
export function getAllMusicTracks(): JsonMusicTrack[] {
  return musicTracks.tracks;
}

/**
 * LLM용 장르 목록 가져오기 (genre + description만)
 */
export function getGenresForLLM(): Array<{ genre: string; description: string }> {
  return musicTracks.tracks.map(track => ({
    genre: track.genre,
    description: track.description,
  }));
}

