/**
 * 음악 관련 타입 정의
 * 
 * Phase 2 리팩토링: lib 내부의 음악 관련 타입을 통합
 */

/**
 * DB에서 조회한 원본 음악 트랙 데이터
 * (src/lib/music/getMusicTrackByID.ts에서 이동)
 */
export interface DatabaseMusicTrack {
  musicID: number; // 10-69
  genre: string; // "Balad", "Pop" 등
  title: string;
  mp3Url: string;
  imageUrl: string;
  artist: string;
  description: string;
  duration: number; // seconds
}

/**
 * JSON 파일에서 로드한 음악 트랙 데이터
 * (src/lib/music/getMusicTrackByGenre.ts에서 이동)
 */
export interface JsonMusicTrack {
  genre: string; // "Balad_1", "Pop_5" 등
  title: string;
  mp3Url: string;
  imageUrl: string;
  artist: string;
  description: string;
  duration: number; // seconds
}

/**
 * 음악 메타데이터 트랙
 * (src/lib/music/getMusicMetadata.ts에서 이동)
 */
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

/**
 * 음악 메타데이터
 * (src/lib/music/getMusicMetadata.ts에서 이동)
 */
export interface MusicMetadata {
  version: string;
  lastUpdated: string;
  tracks: MusicMetadataTrack[];
}

/**
 * 오디오 플레이어 설정
 * (src/lib/audio/musicPlayer.ts에서 이동)
 */
export interface AudioPlayerConfig {
  src?: string; // 오디오 파일 URL
  volume?: number; // 볼륨 (0-1)
  fadeInDuration?: number; // 페이드인 시간 (밀리초, 기본값: 750)
  fadeOutDuration?: number; // 페이드아웃 시간 (밀리초, 기본값: 750)
}

