/**
 * LLM 프롬프트 테스트 스크립트
 * 
 * Phase 2 테스트: 새로운 CompleteSegmentOutput 구조에 맞는 프롬프트가 올바르게 생성되는지 확인
 * 
 * 사용법: npx tsx scripts/test-llm-prompt.ts
 */

import { generatePromptFromPythonResponse } from "../src/lib/llm/optimizePromptForPython";
import type { LLMInput } from "../src/lib/llm/prepareLLMInput";
import type { PythonPredictionResponse } from "../src/lib/prediction/types";

// 테스트용 모의 데이터
const mockLLMInput: LLMInput = {
  moodName: "Calm",
  musicGenre: "Balad",
  scentType: "Floral",
  timeOfDay: 14,
  season: "Winter",
  preprocessed: {
    average_stress_index: 50,
    recent_stress_index: 45,
    latest_sleep_score: 75,
    latest_sleep_duration: 420,
    weather: {
      temperature: 5,
      humidity: 60,
      rainType: "없음",
      sky: "맑음",
    },
  },
  event: null,
};

const mockPythonResponse: PythonPredictionResponse = {
  current_id: "calm_001",
  future_id: "calm_002",
  segments: [
    {
      emotion: "calm",
      intensity: 0.7,
      duration: 180000,
    },
    {
      emotion: "relaxed",
      intensity: 0.8,
      duration: 180000,
    },
    {
      emotion: "peaceful",
      intensity: 0.6,
      duration: 180000,
    },
    {
      emotion: "serene",
      intensity: 0.75,
      duration: 180000,
    },
    {
      emotion: "tranquil",
      intensity: 0.65,
      duration: 180000,
    },
    {
      emotion: "calm",
      intensity: 0.7,
      duration: 180000,
    },
    {
      emotion: "relaxed",
      intensity: 0.8,
      duration: 180000,
    },
    {
      emotion: "peaceful",
      intensity: 0.6,
      duration: 180000,
    },
    {
      emotion: "serene",
      intensity: 0.75,
      duration: 180000,
    },
    {
      emotion: "tranquil",
      intensity: 0.65,
      duration: 180000,
    },
  ],
};

async function testPromptGeneration() {
  console.log("🧪 LLM 프롬프트 생성 테스트 시작...\n");
  console.log("=".repeat(100));
  
  try {
    const prompt = await generatePromptFromPythonResponse(
      mockLLMInput,
      mockPythonResponse,
      "test-user-id",
      undefined,
      null
    );
    
    console.log("✅ 프롬프트 생성 성공!\n");
    console.log("=".repeat(100));
    console.log("생성된 프롬프트:");
    console.log("=".repeat(100));
    console.log(prompt);
    console.log("=".repeat(100));
    
    // 프롬프트 구조 검증
    console.log("\n📋 프롬프트 구조 검증:");
    console.log("-".repeat(100));
    
    const checks = [
      {
        name: "CompleteSegmentOutput 구조 포함",
        check: prompt.includes('"lighting"') && 
               prompt.includes('"rgb"') && 
               prompt.includes('"brightness"') && 
               prompt.includes('"temperature"'),
      },
      {
        name: "Scent 필드 포함",
        check: prompt.includes('"scent"') && 
               prompt.includes('"type"') && 
               prompt.includes('"name"') && 
               prompt.includes('"level"') && 
               prompt.includes('"interval"'),
      },
      {
        name: "Music 필드 포함",
        check: prompt.includes('"music"') && 
               prompt.includes('"musicID"') && 
               prompt.includes('"volume"') && 
               prompt.includes('"fadeIn"') && 
               prompt.includes('"fadeOut"'),
      },
      {
        name: "Background 구조 포함",
        check: prompt.includes('"background"') && 
               prompt.includes('"icons"') && 
               prompt.includes('"wind"') && 
               prompt.includes('"animation"'),
      },
      {
        name: "필드별 상세 지침 포함",
        check: prompt.includes("LIGHTING") && 
               prompt.includes("SCENT") && 
               prompt.includes("MUSIC") && 
               prompt.includes("BACKGROUND"),
      },
      {
        name: "출력 구조 예시 포함",
        check: prompt.includes("EXAMPLE OUTPUT") || prompt.includes("Example"),
      },
      {
        name: "검증 규칙 명시",
        check: prompt.includes("CRITICAL RULES") || prompt.includes("CRITICAL"),
      },
    ];
    
    let allPassed = true;
    for (const check of checks) {
      const passed = check.check;
      const icon = passed ? "✅" : "❌";
      console.log(`${icon} ${check.name}: ${passed ? "PASS" : "FAIL"}`);
      if (!passed) allPassed = false;
    }
    
    console.log("-".repeat(100));
    if (allPassed) {
      console.log("\n🎉 모든 검증 통과!");
    } else {
      console.log("\n⚠️  일부 검증 실패. 프롬프트를 확인하세요.");
    }
    
    // 프롬프트 길이 확인
    console.log(`\n📊 프롬프트 통계:`);
    console.log(`- 총 길이: ${prompt.length} 문자`);
    console.log(`- 줄 수: ${prompt.split('\n').length} 줄`);
    
    // 주요 섹션 확인
    const sections = [
      "AVAILABLE MUSIC TRACKS",
      "ICON CATALOG",
      "CONTEXT",
      "EMOTION PREDICTION",
      "OUTPUT FORMAT",
      "FIELD-SPECIFIC GUIDELINES",
      "CRITICAL RULES",
    ];
    
    console.log(`\n📑 주요 섹션 포함 여부:`);
    for (const section of sections) {
      const included = prompt.includes(section);
      console.log(`  ${included ? "✅" : "❌"} ${section}`);
    }
    
  } catch (error) {
    console.error("\n❌ 프롬프트 생성 실패:");
    console.error(error);
    process.exit(1);
  }
}

// 실행
testPromptGeneration();

