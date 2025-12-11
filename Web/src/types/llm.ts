/**
 * LLM 관련 타입 정의
 * 
 * Phase 2 리팩토링: lib/llm 내부의 타입을 통합
 */

import type { ScentType } from "./mood";
import type { MusicTrack } from "@/hooks/useMoodStream/types";

/**
 * LLM이 생성하는 완전한 세그먼트 출력
 * (src/lib/llm/types/completeOutput.ts에서 이동)
 */
export interface CompleteSegmentOutput {
  // 기본 정보
  /** 무드 별칭 (예: "겨울비의 평온", "따뜻한 카페") */
  moodAlias: string;
  
  /** HEX 색상 (예: "#6B8E9F") */
  moodColor: string;
  
  // 조명 제어 (Lighting Device)
  lighting: {
    /** RGB 값 [0-255, 0-255, 0-255] */
    rgb: [number, number, number];
    
    /** 밝기 (0-100, 권장: 30-80) */
    brightness: number;
    
    /** 색온도 (2000-6500K) */
    temperature: number;
  };
  
  // 향 제어 (Scent Device)
  scent: {
    /** 향 타입 (12개 표준 타입) */
    type: ScentType;
    
    /** 구체적인 향 이름 (예: "Rose", "Pine", "Cinnamon") - DB 저장용 */
    name: string;
    
    /** 향 강도 (1-10, 기본값: 5, 레거시) */
    level: number;
    
    /** 향 분사 주기 (5, 10, 15, 20, 25, 30분, 기본값: 15) */
    interval: number;
  };
  
  // 음악 제어 (Speaker Device)
  music: {
    /** 음악 ID (10-69) - 매핑용 */
    musicID: number;
    
    /** 볼륨 (0-100, 기본값: 70) */
    volume: number;
    
    /** 페이드 인 시간 (ms, 기본값: 750) */
    fadeIn: number;
    
    /** 페이드 아웃 시간 (ms, 기본값: 750) */
    fadeOut: number;
  };
  
  // 배경 효과 제어 (UI/Visual Effects)
  background: {
    /** 아이콘 키 배열 (1-4개) */
    icons: string[];
    
    /** 풍향 및 풍속 */
    wind: {
      /** 풍향 (0-360도) */
      direction: number;
      
      /** 풍속 (0-10) */
      speed: number;
    };
    
    /** 애니메이션 설정 */
    animation: {
      /** 애니메이션 속도 (0-10) */
      speed: number;
      
      /** 아이콘 투명도 (0-1) */
      iconOpacity: number;
    };
  };
}

/**
 * 여러 세그먼트를 포함하는 완전한 출력
 * (src/lib/llm/types/completeOutput.ts에서 이동)
 */
export interface CompleteStreamOutput {
  segments: CompleteSegmentOutput[];
}

/**
 * 출력 디바이스별 필드 그룹화
 * (src/lib/llm/types/completeOutput.ts에서 이동)
 */
export interface DeviceOutputMapping {
  /** 조명 디바이스용 출력 */
  lighting: {
    color: string;        // HEX 색상
    brightness: number;  // 0-100
    temperature: number; // 2000-6500K
  };
  
  /** 향 디바이스용 출력 */
  scent: {
    scentType: string;    // 향 타입
    scentLevel: number;   // 향 강도 (1-10)
    scentInterval: number; // 분사 주기 (5, 10, 15, 20, 25, 30분)
  };
  
  /** 스피커 디바이스용 출력 */
  speaker: {
    volume: number;      // 0-100
    nowPlaying: string;  // 현재 재생 중인 음악 제목
  };
}

/**
 * @deprecated BackgroundParamsResponse는 Phase 1 리팩토링으로 인해 점진적으로 제거됩니다.
 * 새로운 CompleteSegmentOutput 타입을 사용하세요.
 * 
 * 하위 호환성을 위해 일시적으로 유지됩니다.
 * (src/lib/llm/validateResponse.ts에서 이동)
 */
export interface BackgroundParamsResponse {
  moodAlias: string;
  musicSelection: number | string; // musicID (10-69) 또는 문자열 (하위 호환성)
  moodColor: string;
  lighting: {
    brightness: number;
    temperature?: number;
  };
  backgroundIcon: {
    name: string;
    category: string;
  };
  // LLM이 선택한 원시 아이콘 키 배열 (최대 4개, 첫 번째는 backgroundIcon 에 매핑됨)
  iconKeys?: string[];
  backgroundWind: {
    direction: number;
    speed: number;
  };
  animationSpeed: number;
  iconOpacity: number;
  // 향 정보 (CompleteSegmentOutput에서 변환 시 포함)
  scent?: {
    type?: string;
    name?: string;
  };
  // 사용되지 않는 필드들 (제거 예정)
  // iconCount?: number;
  // iconSize?: number;
  // particleEffect?: boolean;
  // gradientColors?: string[];
  // transitionDuration?: number;
  // DB에서 매핑된 실제 음악 트랙 (선택적, streamHandler에서 추가)
  musicTracks?: MusicTrack[];
  // 세그먼트 duration (밀리초, streamHandler에서 추가)
  duration?: number;
}

/**
 * 출력 매핑
 * (src/lib/llm/types/mapping.ts에서 이동)
 */
export interface OutputMapping {
  lighting?: {
    color?: string;
    brightness?: number;
    temperature?: number;
  };
  scent?: {
    scentType?: string;
    scentLevel?: number;
    scentInterval?: number;
  };
  speaker?: {
    volume?: number;
    nowPlaying?: string;
  };
}

