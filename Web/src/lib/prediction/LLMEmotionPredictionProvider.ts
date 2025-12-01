/**
 * LLM 기반 감정 예측 제공자
 * 
 * 현재 구현: OpenAI GPT를 사용한 감정 예측
 * 향후: 시계열+마르코프 체인 모델로 교체 가능
 */

import type { EmotionPredictionProvider, EmotionSegment, EmotionPredictionInput } from "./EmotionPredictionProvider";
import { prepareLLMInput } from "@/lib/llm/prepareLLMInput";
import { generateOptimizedPrompt } from "@/lib/llm/optimizePrompt";
import { validateAndNormalizeResponse, type BackgroundParamsResponse } from "@/lib/llm/validateResponse";
import OpenAI from "openai";

export class LLMEmotionPredictionProvider implements EmotionPredictionProvider {
  readonly name = "LLM";
  readonly version = "1.0.0";
  
  private openai: OpenAI | null = null;
  
  constructor() {
    // OpenAI 클라이언트 초기화
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
    } else {
      console.warn("[LLMEmotionPredictionProvider] OPENAI_API_KEY not found");
    }
  }
  
  async predictEmotions(input: EmotionPredictionInput): Promise<EmotionSegment[]> {
    if (!this.openai) {
      throw new Error("OpenAI client not initialized");
    }
    
    const segmentCount = input.segmentCount || 3;
    
    // LLM 입력 준비
    // TODO: prepareLLMInput의 실제 시그니처에 맞게 수정 필요
    // 현재는 임시 구현으로 스킵 (실제 사용 시 수정 필요)
    // emotionEvents가 undefined일 수 있으므로 기본값 제공
    const preprocessedWithDefaults = {
      ...input.preprocessed,
      emotionEvents: input.preprocessed.emotionEvents || {
        laughter: [],
        sigh: [],
        anger: [],
        sadness: [],
        neutral: [],
      },
    };
    
    const llmInput = {
      moodName: "calm",
      musicGenre: "newage",
      scentType: "citrus",
      preprocessed: preprocessedWithDefaults,
      userPreferences: {
        music: {},
        color: {},
        scent: {},
      },
    };
    
    // 프롬프트 생성 (3세그 구조에 맞춰 수정 필요)
    const prompt = generateOptimizedPrompt(llmInput, undefined); // TODO: segments 파라미터 전달
    
    try {
      // OpenAI API 호출
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "JSON만 응답" },
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" },
        temperature: 0.3, // 일관성 우선
      });
      
      const rawResponse = JSON.parse(completion.choices[0]?.message?.content || "{}");
      
      // 응답 검증 및 정규화
      const validated = validateAndNormalizeResponse(rawResponse);
      
      // EmotionSegment 배열로 변환
      // TODO: validated 응답을 EmotionSegment 배열로 변환하는 로직 필요
      // 현재는 BackgroundParamsResponse를 반환하므로, 이를 EmotionSegment로 변환해야 함
      
      // 임시 구현: validated 응답에서 세그먼트 추출
      const segments: EmotionSegment[] = [];
      
      if ('segments' in validated && Array.isArray(validated.segments)) {
        // 3세그 구조 응답
        validated.segments.forEach((seg: BackgroundParamsResponse, index: number) => {
          segments.push({
            timestamp: input.currentTime + (index * 10 * 60 * 1000), // 대략 10분 간격
            duration: 10 * 60 * 1000, // 대략 10분
            emotion: seg.moodAlias || "calm", // 임시: moodAlias를 emotion으로 사용
            intensity: 50, // 임시: 기본값
            confidence: 0.8, // 임시: 기본값
          });
        });
      } else {
        // 단일 세그먼트 응답 (하위 호환성)
        const singleSegment = validated as BackgroundParamsResponse;
        segments.push({
          timestamp: input.currentTime,
          duration: 10 * 60 * 1000,
          emotion: singleSegment.moodAlias || "calm",
          intensity: 50,
          confidence: 0.8,
        });
      }
      
      return segments;
    } catch (error) {
      console.error("[LLMEmotionPredictionProvider] Error predicting emotions:", error);
      throw error;
    }
  }
}

