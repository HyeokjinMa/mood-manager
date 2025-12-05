/**
 * 무드스트림 관련 타입 정의
 * 
 * Phase 1 리팩토링: CompleteSegmentOutput 타입과의 매핑 관계 정의
 */

import type { CompleteSegmentOutput } from "@/lib/llm/types/completeOutput";

/**
 * 음악 트랙 정보
 */
export interface MusicTrack {
  title: string;
  artist?: string;
  duration: number; // 실제 노래 길이 (밀리초)
  startOffset: number; // 세그먼트 내 시작 시점 (밀리초)
  fadeIn?: number; // 페이드인 시간 (밀리초, 기본값: 750)
  fadeOut?: number; // 페이드아웃 시간 (밀리초, 기본값: 750)
  fileUrl: string; // 실제 오디오 파일 URL (예: /music/pop/Song(Artist)_Pop.mp3)
  albumImageUrl?: string; // 앨범 이미지 URL (예: /albums/Song(Artist)_Pop.jpg)
}

/**
 * 무드스트림 세그먼트
 * 
 * 1곡이 하나의 세그먼트
 * - duration: 1곡의 실제 길이 (MP3 파일 길이)
 * - musicTracks: 1개 노래 배열
 */
export interface MoodStreamSegment {
  timestamp: number;
  duration: number; // 가변적 (1곡의 실제 길이, 밀리초)
  mood: {
    id: string;
    name: string;
    color: string;
    music: {
      genre: string;
      title: string; // 노래 제목
    };
    scent: {
      type: string;
      name: string;
    };
    lighting: {
      color: string;
      rgb: [number, number, number];
    };
  };
  musicTracks: MusicTrack[]; // 1개 노래
  // 배경 효과 (선택적)
  backgroundIcon?: {
    name: string;
    category: string;
  };
  backgroundIcons?: string[]; // 아이콘 키 배열
  backgroundWind?: {
    direction: number;
    speed: number;
  };
  animationSpeed?: number;
  iconOpacity?: number;
}

export interface MoodStream {
  streamId: string; // 스트림 고유 ID (재생성 시 변경)
  currentMood: MoodStreamSegment["mood"];
  segments: MoodStreamSegment[];
  createdAt: number;
  userDataCount: number;
  nextStreamAvailable?: boolean; // 다음 스트림 존재 여부
  nextStreamStartTime?: number; // 다음 스트림 시작 시간
}

