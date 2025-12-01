/**
 * Python 예측 관련 공통 타입 정의
 */

/**
 * Python 서버로 전송하는 요청 타입
 */
export interface PythonPredictionRequest {
  average_stress_index: number;
  recent_stress_index: number;
  latest_sleep_score: number;
  latest_sleep_duration: number;
  temperature: number;
  humidity: number;
  rainType: number;
  sky: number;
  laughter: number;
  sigh: number;
  crying: number;
}

/**
 * Python 서버에서 받는 응답 타입
 */
export interface PythonPredictionResponse {
  user_id: string;
  inference_time: string;
  current_id: number;
  current_title: string;
  current_description: string;
  future_id: number;
  future_title: string;
  future_description: string;
}

