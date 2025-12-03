/**
 * 감정 예측 제공자 추상화 인터페이스
 * 
 * 현재는 LLM 기반으로 구현되지만, 향후 시계열+마르코프 체인 모델로 교체 가능
 */

// PreprocessedData 타입은 prepareLLMInput에서 정의된 PreprocessingResponse를 사용
interface PreprocessedData {
  average_stress_index: number;
  recent_stress_index: number;
  latest_sleep_score: number;
  latest_sleep_duration: number;
  weather: {
    temperature: number;
    humidity: number;
    rainType: number;
    sky: number;
  };
  // 이전 형식 (타임스탬프 배열) - 하위 호환성
  emotionEvents?: {
    laughter: number[];
    sigh: number[];
    anger: number[];
    sadness: number[];
    neutral: number[];
  };
  // 새로운 형식 (카운트 기반)
  emotionCounts?: {
    laughter: number;
    sigh: number;
    crying: number;
  };
  accumulationDurationSeconds?: number; // 축적 기간 (초)
  lastResetTime?: number; // 마지막 클렌징 시간 (밀리초)
}

/**
 * 감정 세그먼트 (Stage 1 출력)
 */
export interface EmotionSegment {
  timestamp: number; // 세그먼트 시작 시간 (밀리초)
  duration: number; // 세그먼트 길이 (밀리초)
  emotion: string; // 감정 타입 (예: "calm", "energetic", "focused")
  intensity: number; // 감정 강도 (0-100)
  confidence?: number; // 예측 신뢰도 (0-1, 선택적)
}

/**
 * 감정 예측 요청 입력
 */
export interface EmotionPredictionInput {
  preprocessed: PreprocessedData;
  currentTime: number; // 현재 시간 (밀리초)
  previousSegments?: EmotionSegment[]; // 이전 세그먼트들 (선택적, 컨텍스트용)
  segmentCount?: number; // 생성할 세그먼트 개수 (기본값: 10)
}

/**
 * 감정 예측 제공자 인터페이스
 * 
 * 이 인터페이스를 구현하여 LLM 또는 시계열+마르코프 체인 모델을 사용할 수 있습니다.
 */
export interface EmotionPredictionProvider {
  /**
   * 감정 세그먼트 예측
   * 
   * @param input 예측 입력 데이터
   * @returns 예측된 감정 세그먼트 배열
   */
  predictEmotions(input: EmotionPredictionInput): Promise<EmotionSegment[]>;
  
  /**
   * 제공자 이름 (디버깅/로깅용)
   */
  readonly name: string;
  
  /**
   * 제공자 버전 (디버깅/로깅용)
   */
  readonly version: string;
}

