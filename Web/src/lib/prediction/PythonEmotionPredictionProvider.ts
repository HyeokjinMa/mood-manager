/**
 * Python 기반 감정 예측 제공자
 * 
 * 시계열+마르코프 체인 모델로 구현된 Python 서버와 통신
 * 
 * 입력: 카운트 기반 감정 데이터
 * 출력: current/future 감정 상태
 */

import type { EmotionPredictionProvider, EmotionPredictionInput } from "./EmotionPredictionProvider";
import type { EmotionSegment } from "./EmotionPredictionProvider";

import type { PythonPredictionRequest, PythonPredictionResponse } from "./types";

export class PythonEmotionPredictionProvider implements EmotionPredictionProvider {
  readonly name = "Python";
  readonly version = "1.0.0";
  
  private pythonServerUrl: string;
  private timeout: number;
  
  constructor() {
    const url = process.env.PYTHON_SERVER_URL;
    if (!url) {
      throw new Error("PYTHON_SERVER_URL environment variable is required");
    }
    this.pythonServerUrl = url;
    this.timeout = parseInt(process.env.PYTHON_SERVER_TIMEOUT || "30000", 10);
  }
  
  async predictEmotions(input: EmotionPredictionInput): Promise<EmotionSegment[]> {
    // 전처리 데이터를 Python 입력 형식으로 변환
    const requestBody: PythonPredictionRequest = {
      average_stress_index: input.preprocessed.average_stress_index,
      recent_stress_index: input.preprocessed.recent_stress_index,
      latest_sleep_score: input.preprocessed.latest_sleep_score,
      latest_sleep_duration: input.preprocessed.latest_sleep_duration,
      temperature: input.preprocessed.weather.temperature,
      humidity: input.preprocessed.weather.humidity,
      rainType: input.preprocessed.weather.rainType,
      sky: input.preprocessed.weather.sky,
      laughter: (input.preprocessed.emotionCounts?.laughter || 0),
      sigh: (input.preprocessed.emotionCounts?.sigh || 0),
      crying: (input.preprocessed.emotionCounts?.crying || 0),
    };
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);
      
      const response = await fetch(`${this.pythonServerUrl}/api/predict`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`Python server error: ${response.status} ${response.statusText}`);
      }
      
      const data: PythonPredictionResponse = await response.json();
      
      // Python 출력을 EmotionSegment 배열로 변환
      // current와 future를 각각 하나의 세그먼트로 변환
      const segments: EmotionSegment[] = [];
      
      // Current 세그먼트 (첫 번째)
      segments.push({
        timestamp: input.currentTime,
        duration: 10 * 60 * 1000, // 10분 (대략)
        emotion: this.mapEmotionIdToName(data.current_id, data.current_title),
        intensity: this.extractIntensityFromDescription(data.current_description),
        confidence: 0.85, // Python 모델의 confidence는 별도 필드가 없다면 기본값
      });
      
      // Future 세그먼트 (두 번째)
      segments.push({
        timestamp: input.currentTime + (10 * 60 * 1000),
        duration: 10 * 60 * 1000,
        emotion: this.mapEmotionIdToName(data.future_id, data.future_title),
        intensity: this.extractIntensityFromDescription(data.future_description),
        confidence: 0.85,
      });
      
      // segmentCount가 10이면 기본 세그먼트 하나 더 추가
      if ((input.segmentCount || 10) > 2) {
        segments.push({
          timestamp: input.currentTime + (20 * 60 * 1000),
          duration: 10 * 60 * 1000,
          emotion: this.mapEmotionIdToName(data.future_id, data.future_title), // future와 동일
          intensity: this.extractIntensityFromDescription(data.future_description),
          confidence: 0.85,
        });
      }
      
      return segments;
    } catch (error) {
      console.error("[PythonEmotionPredictionProvider] Error calling Python server:", error);
      throw error;
    }
  }
  
  /**
   * 감정 ID와 타이틀을 감정 이름으로 매핑
   */
  private mapEmotionIdToName(id: number, title: string): string {
    // ID 기반 매핑
    const idMap: Record<number, string> = {
      1: "stressed",
      2: "neutral",
      3: "positive",
      4: "calm",
      5: "energetic",
    };
    
    if (idMap[id]) {
      return idMap[id];
    }
    
    // 타이틀 기반 추론
    const titleLower = title.toLowerCase();
    if (titleLower.includes("긍정") || titleLower.includes("기분 좋")) {
      return "positive";
    }
    if (titleLower.includes("안정") || titleLower.includes("차분")) {
      return "calm";
    }
    if (titleLower.includes("스트레스") || titleLower.includes("압박")) {
      return "stressed";
    }
    if (titleLower.includes("에너지") || titleLower.includes("활기")) {
      return "energetic";
    }
    
    return "neutral";
  }
  
  /**
   * 설명에서 감정 강도 추출 (간단한 휴리스틱)
   */
  private extractIntensityFromDescription(description: string): number {
    // 기본값
    let intensity = 50;
    
    const descLower = description.toLowerCase();
    
    // 강도 관련 키워드
    if (descLower.includes("매우") || descLower.includes("크게")) {
      intensity += 20;
    } else if (descLower.includes("약간") || descLower.includes("조금")) {
      intensity -= 10;
    }
    
    if (descLower.includes("높") || descLower.includes("올라")) {
      intensity += 15;
    }
    if (descLower.includes("낮") || descLower.includes("내려")) {
      intensity -= 15;
    }
    
    // 0-100 범위로 클램핑
    return Math.max(0, Math.min(100, intensity));
  }
  
  /**
   * Python 응답을 그대로 반환 (LLM 프롬프팅용)
   */
  async getPythonResponse(input: EmotionPredictionInput): Promise<PythonPredictionResponse> {
    const requestBody: PythonPredictionRequest = {
      average_stress_index: input.preprocessed.average_stress_index,
      recent_stress_index: input.preprocessed.recent_stress_index,
      latest_sleep_score: input.preprocessed.latest_sleep_score,
      latest_sleep_duration: input.preprocessed.latest_sleep_duration,
      temperature: input.preprocessed.weather.temperature,
      humidity: input.preprocessed.weather.humidity,
      rainType: input.preprocessed.weather.rainType,
      sky: input.preprocessed.weather.sky,
      laughter: (input.preprocessed.emotionCounts?.laughter || 0),
      sigh: (input.preprocessed.emotionCounts?.sigh || 0),
      crying: (input.preprocessed.emotionCounts?.crying || 0),
    };
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);
    
    try {
      const response = await fetch(`${this.pythonServerUrl}/api/predict`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`Python server error: ${response.status} ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error(`Python server timeout after ${this.timeout}ms`);
      }
      throw error;
    }
  }
}
