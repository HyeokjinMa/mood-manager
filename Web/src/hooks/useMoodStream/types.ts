/**
 * 무드스트림 관련 타입 정의
 */

/**
 * 음악 트랙 정보
 */
export interface MusicTrack {
  title: string;
  artist?: string;
  duration: number; // 실제 노래 길이 (밀리초)
  startOffset: number; // 세그먼트 내 시작 시점 (밀리초)
  fadeIn?: number; // 페이드인 시간 (밀리초, 기본값: 2000)
  fadeOut?: number; // 페이드아웃 시간 (밀리초, 기본값: 2000)
}

/**
 * 무드스트림 세그먼트
 * 
 * 3곡이 자연스럽게 연결되는 하나의 단위
 * - duration: 3곡의 실제 총 길이 (고정값 아님, 대략 10분)
 * - musicTracks: 3개 노래 배열
 */
export interface MoodStreamSegment {
  timestamp: number;
  duration: number; // 가변적 (3곡의 실제 총 길이, 밀리초)
  mood: {
    id: string;
    name: string;
    color: string;
    music: {
      genre: string;
      title: string; // 첫 번째 노래 제목 (하위 호환성)
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
  musicTracks: MusicTrack[]; // 3개 노래 (자연스러운 흐름)
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

