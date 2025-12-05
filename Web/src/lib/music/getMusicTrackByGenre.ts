/**
 * 간단한 음악 트랙 조회
 * 
 * genre 선택 → JSON 파일에서 해당 트랙 로드
 */

import musicTracksData from "./musicTracks.json";

interface MusicTrack {
  genre: string; // "Balad_1", "Pop_5" 등
  title: string;
  mp3Url: string;
  imageUrl: string;
  artist: string;
  description: string;
  duration: number; // seconds
}

interface MusicTracksJSON {
  version: string;
  lastUpdated: string;
  tracks: MusicTrack[];
}

const musicTracks = musicTracksData as MusicTracksJSON;

/**
 * genre로 음악 트랙 찾기
 * 
 * @param genre - "Balad_1", "Pop_5" 등
 * @returns MusicTrack 또는 null
 */
export function getMusicTrackByGenre(genre: string): MusicTrack | null {
  const track = musicTracks.tracks.find(t => t.genre === genre);
  return track || null;
}

/**
 * 장르별로 그룹화된 트랙 목록 가져오기
 * 
 * @param genreBase - "Balad", "Pop" 등 (번호 제외)
 * @returns 해당 장르의 모든 트랙
 */
export function getMusicTracksByGenreBase(genreBase: string): MusicTrack[] {
  return musicTracks.tracks.filter(t => t.genre.startsWith(genreBase + "_"));
}

/**
 * 모든 트랙 가져오기
 */
export function getAllMusicTracks(): MusicTrack[] {
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

