/**
 * LLM 응답 테스트 스크립트
 * 
 * 실제 LLM 응답이 새로운 CompleteSegmentOutput 구조를 따르는지 확인
 * 
 * 사용법: npx tsx scripts/test-llm-response.ts
 */

// 테스트용 모의 LLM 응답 (기존 구조)
const mockOldResponse = {
  segments: [
    {
      moodAlias: "Warm Christmas Glow",
      musicSelection: 10,
      moodColor: "#FF4C4C",
      lighting: {
        brightness: 80,
        temperature: 3000,
      },
      backgroundIcons: ["candle_warm", "snow_soft"],
      backgroundWind: {
        direction: 45,
        speed: 3,
      },
      animationSpeed: 5,
      iconOpacity: 0.8,
    },
  ],
};

// 테스트용 모의 LLM 응답 (새로운 구조)
const mockNewResponse = {
  segments: [
    {
      moodAlias: "Winter Morning Calm",
      moodColor: "#6B8E9F",
      lighting: {
        rgb: [107, 142, 159],
        brightness: 60,
        temperature: 4000,
      },
      scent: {
        type: "Woody",
        name: "Pine",
        level: 5,
        interval: 15,
      },
      music: {
        musicID: 15,
        volume: 70,
        fadeIn: 750,
        fadeOut: 750,
      },
      background: {
        icons: ["snow_soft", "mountain_silhouette"],
        wind: {
          direction: 180,
          speed: 3,
        },
        animation: {
          speed: 5,
          iconOpacity: 0.8,
        },
      },
    },
  ],
};

async function testValidation() {
  console.log("🧪 LLM 응답 검증 테스트 시작...\n");
  console.log("=".repeat(100));
  
  try {
    const { validateAndNormalizeResponse } = await import("../src/lib/llm/validateResponse");
    
    // 기존 구조 테스트
    console.log("\n📋 테스트 1: 기존 구조 (BackgroundParamsResponse)");
    console.log("-".repeat(100));
    try {
      const result1 = validateAndNormalizeResponse(mockOldResponse);
      console.log("✅ 기존 구조 검증 성공");
      console.log(JSON.stringify(result1, null, 2));
    } catch (error) {
      console.error("❌ 기존 구조 검증 실패:", error);
    }
    
    // 새로운 구조 테스트
    console.log("\n📋 테스트 2: 새로운 구조 (CompleteSegmentOutput)");
    console.log("-".repeat(100));
    try {
      const result2 = validateAndNormalizeResponse(mockNewResponse);
      console.log("✅ 새로운 구조 검증 성공");
      console.log(JSON.stringify(result2, null, 2));
    } catch (error) {
      console.error("❌ 새로운 구조 검증 실패:", error);
    }
    
    // 구조 감지 테스트
    console.log("\n📋 테스트 3: 구조 자동 감지");
    console.log("-".repeat(100));
    const firstSegmentOld = mockOldResponse.segments[0];
    const firstSegmentNew = mockNewResponse.segments[0];
    
    const isOldStructure = !!(firstSegmentOld.musicSelection || firstSegmentOld.backgroundIcons);
    const isNewStructure = !!(firstSegmentNew.lighting?.rgb || firstSegmentNew.scent || firstSegmentNew.music);
    
    console.log(`기존 구조 감지: ${isOldStructure ? "✅" : "❌"}`);
    console.log(`새로운 구조 감지: ${isNewStructure ? "✅" : "❌"}`);
    
  } catch (error) {
    console.error("\n❌ 테스트 실패:", error);
    process.exit(1);
  }
}

// 실행
testValidation();

