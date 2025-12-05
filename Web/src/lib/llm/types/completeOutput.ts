/**
 * LLM이 생성하는 완전한 세그먼트 출력 타입 정의
 * 모든 출력 디바이스 제어 정보를 포함
 */

/**
 * 향 타입 (Scent Type)
 */
export type ScentType = "Floral" | "Woody" | "Spicy" | "Fresh" | "Citrus" | "Herbal" | "Musk" | "Oriental";

/**
 * LLM이 생성하는 완전한 세그먼트 출력
 * 
 * 이 타입은 LLM이 한 번의 호출로 모든 출력 디바이스 제어에 필요한
 * 완전한 정보를 생성하도록 설계되었습니다.
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
    /** 향 타입 */
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
 */
export interface CompleteStreamOutput {
  segments: CompleteSegmentOutput[];
}

/**
 * 출력 디바이스별 필드 그룹화
 * 
 * 각 디바이스 타입이 사용하는 필드를 명확히 정의
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

