/**
 * 감정 예측 제공자 팩토리 및 설정
 * 
 * 환경 변수나 설정에 따라 LLM 또는 마르코프 체인 모델을 선택
 */

import type { EmotionPredictionProvider } from "./EmotionPredictionProvider";
// LLM 관련 코드 주석 처리 (Python으로 교체)
// import { LLMEmotionPredictionProvider } from "./LLMEmotionPredictionProvider";
import { createPythonProvider } from "./PythonProviderFactory";
import { MarkovEmotionPredictionProvider } from "./MarkovEmotionPredictionProvider";

/**
 * 예측 모드 타입
 */
export type PredictionMode = "python" | "markov" | "auto";

/**
 * 감정 예측 제공자 팩토리
 */
export class EmotionPredictionProviderFactory {
  /**
   * 예측 제공자 생성
   * 
   * @param mode 예측 모드 ("python" | "markov" | "auto")
   * @returns EmotionPredictionProvider 인스턴스
   */
  static create(mode: PredictionMode = "auto"): EmotionPredictionProvider {
    // 환경 변수에서 모드 확인
    const envMode = process.env.EMOTION_PREDICTION_MODE as PredictionMode | undefined;
    const finalMode = mode !== "auto" ? mode : (envMode || "python");
    
    switch (finalMode) {
      case "markov":
        console.log("[EmotionPredictionProviderFactory] Using Markov Chain model");
        return new MarkovEmotionPredictionProvider();
      
      case "python":
      default:
        console.log("[EmotionPredictionProviderFactory] Using Python server");
        return createPythonProvider();
    }
  }
  
  /**
   * 기본 제공자 반환 (현재는 Python)
   */
  static getDefault(): EmotionPredictionProvider {
    return this.create("auto");
  }
}

// 기본 제공자 export (편의용)
export const defaultPredictionProvider = EmotionPredictionProviderFactory.getDefault();

