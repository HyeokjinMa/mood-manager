/**
 * Python 예측 관련 공통 타입 정의
 */

/**
 * Python(마르코프) 서버로 전송하는 요청 타입
 *
 * realtime_inference_many.py 의 /inference 바디 스펙에 맞춘다.
 */
export interface PythonPredictionRequest {
  user_id: string;
  average_stress_index: number;
  recent_stress_index: number;
  latest_sleep_score: number;
  latest_sleep_duration: number;
  // weather, emotion 을 평탄화해서 보낸다.
  temperature: number;
  humidity: number;
  rainType: number;
  sky: number;
  sigh: number;
  laughter: number;
  // crying 은 Python 쪽에서 아직 사용하지 않지만,
  // 향후 확장을 위해 count 값만 전달할 수 있도록 남겨둔다.
  crying?: number;
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

