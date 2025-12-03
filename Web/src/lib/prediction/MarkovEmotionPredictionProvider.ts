/**
 * 시계열+마르코프 체인 기반 감정 예측 제공자
 * 
 * 향후 구현: 전용 시계열 분석 및 마르코프 체인 모델 사용
 * 현재는 스켈레톤 구현 (Phase 4에서 완성 예정)
 */

import type { EmotionPredictionProvider, EmotionSegment, EmotionPredictionInput } from "./EmotionPredictionProvider";

export class MarkovEmotionPredictionProvider implements EmotionPredictionProvider {
  readonly name = "MarkovChain";
  readonly version = "0.1.0-alpha";
  
  async predictEmotions(input: EmotionPredictionInput): Promise<EmotionSegment[]> {
    const segmentCount = input.segmentCount || 10;
    
    // TODO: Phase 4에서 구현
    // 1. 시계열 분석 (생체 신호, 감정 이벤트 등)
    // 2. 마르코프 체인 상태 전이 확률 계산
    // 3. 3개 세그먼트 예측 (현재 → 다음 → 그 다음)
    
    console.warn("[MarkovEmotionPredictionProvider] Not yet implemented. Using fallback.");
    
    // 임시: 기본 감정 세그먼트 반환
    const segments: EmotionSegment[] = [];
    for (let i = 0; i < segmentCount; i++) {
      segments.push({
        timestamp: input.currentTime + (i * 10 * 60 * 1000),
        duration: 10 * 60 * 1000,
        emotion: "calm", // 임시
        intensity: 50, // 임시
        confidence: 0.5, // 임시
      });
    }
    
    return segments;
  }
}

