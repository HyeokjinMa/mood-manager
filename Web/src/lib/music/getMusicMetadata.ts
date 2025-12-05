/**
 * 음악 메타데이터 JSON에서 정보 가져오기
 * 
 * 번호 기반 매핑 시스템
 * 예: "Classic_1" → Classic_1.mp3, Classic_1.png
 */

import musicMetadata from "./musicMetadata.json";

export interface MusicMetadataTrack {
  id: string; // "Genre_Number" 형식
  genre: string;
  number: number;
  title: string;
  artist: string;
  description: string;
  fileName: string;
  imageFileName: string;
  fileUrl: string;
  imageUrl: string;
  originalFileName?: string;
}

export interface MusicMetadata {
  version: string;
  lastUpdated: string;
  tracks: MusicMetadataTrack[];
}

/**
 * 전체 메타데이터 가져오기
 */
export function getMusicMetadata(): MusicMetadata {
  return musicMetadata as MusicMetadata;
}

/**
 * ID로 트랙 찾기 (예: "Classic_1", "Pop_5")
 */
export function getTrackById(id: string): MusicMetadataTrack | null {
  const metadata = getMusicMetadata();
  return metadata.tracks.find((track) => track.id === id) || null;
}

/**
 * 장르와 번호로 트랙 찾기
 */
export function getTrackByGenreAndNumber(genre: string, number: number): MusicMetadataTrack | null {
  const metadata = getMusicMetadata();
  return metadata.tracks.find((track) => track.genre === genre && track.number === number) || null;
}

/**
 * description으로 트랙 찾기 (유연한 매칭)
 */
export function getTrackByDescription(description: string): MusicMetadataTrack | null {
  const metadata = getMusicMetadata();
  const normalizedDescription = description.toLowerCase().trim();
  
  return metadata.tracks.find((track) => 
    track.description.toLowerCase().trim() === normalizedDescription
  ) || null;
}

/**
 * title과 artist로 트랙 찾기 (유연한 매칭)
 */
export function getTrackByTitleAndArtist(title: string, artist?: string): MusicMetadataTrack | null {
  const metadata = getMusicMetadata();
  const normalizedTitle = title.toLowerCase().trim();
  
  if (artist) {
    const normalizedArtist = artist.toLowerCase().trim();
    return metadata.tracks.find((track) => 
      track.title.toLowerCase().trim() === normalizedTitle &&
      track.artist.toLowerCase().trim() === normalizedArtist
    ) || null;
  }
  
  return metadata.tracks.find((track) => 
    track.title.toLowerCase().trim() === normalizedTitle
  ) || null;
}

/**
 * 장르별 트랙 목록 가져오기
 */
export function getTracksByGenre(genre: string): MusicMetadataTrack[] {
  const metadata = getMusicMetadata();
  return metadata.tracks.filter((track) => track.genre === genre);
}

/**
 * 모든 트랙 목록 가져오기
 */
export function getAllTracks(): MusicMetadataTrack[] {
  const metadata = getMusicMetadata();
  return metadata.tracks;
}

/**
 * LLM의 musicSelection 문자열을 메타데이터 트랙으로 매핑
 * 
 * 우선순위:
 * 1. description 정확 매칭
 * 2. title + artist 매칭
 * 3. title만 매칭
 */
export function findTrackByMusicSelection(musicSelection: string): MusicMetadataTrack | null {
  // 1. description으로 찾기
  let track = getTrackByDescription(musicSelection);
  if (track) return track;
  
  // 2. "Title - Artist" 형식 파싱
  if (musicSelection.includes(" - ")) {
    const [title, artist] = musicSelection.split(" - ").map(s => s.trim());
    track = getTrackByTitleAndArtist(title, artist);
    if (track) return track;
  }
  
  // 3. "Title(Artist)" 형식 파싱
  const match = musicSelection.match(/^(.+?)\((.+?)\)$/);
  if (match) {
    const title = match[1].trim();
    const artist = match[2].trim();
    track = getTrackByTitleAndArtist(title, artist);
    if (track) return track;
  }
  
  // 4. title만으로 찾기
  track = getTrackByTitleAndArtist(musicSelection);
  if (track) return track;
  
  return null;
}

