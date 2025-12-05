/**
 * 간단한 음악 트랙 조회 (musicID 기반)
 * 
 * musicID 선택 → JSON 파일에서 해당 트랙 로드
 */

import musicTracksData from "./musicTracks.json";

interface MusicTrack {
  musicID: number; // 10-69
  genre: string; // "Balad", "Pop" 등
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
 * musicID로 음악 트랙 찾기
 * 
 * @param musicID - 10-69
 * @returns MusicTrack 또는 null
 */
export function getMusicTrackByID(musicID: number): MusicTrack | null {
  const track = musicTracks.tracks.find(t => t.musicID === musicID);
  return track || null;
}

/**
 * 장르별로 그룹화된 트랙 목록 가져오기
 * 
 * @param genre - "Balad", "Pop" 등
 * @returns 해당 장르의 모든 트랙
 */
export function getMusicTracksByGenre(genre: string): MusicTrack[] {
  return musicTracks.tracks.filter(t => t.genre === genre);
}

/**
 * 모든 트랙 가져오기
 */
export function getAllMusicTracks(): MusicTrack[] {
  return musicTracks.tracks;
}

/**
 * LLM용 트랙 목록 가져오기 (musicID + description만)
 */
export function getTracksForLLM(): Array<{ musicID: number; description: string }> {
  return musicTracks.tracks.map(track => ({
    musicID: track.musicID,
    description: track.description,
  }));
}

