/**
 * Phase 3 검증 로직 테스트
 * 
 * 새로운 CompleteSegmentOutput 구조 검증 및 매핑 테스트
 * 
 * 사용법: npx tsx scripts/test-phase3-validation.ts
 */

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
    {
      moodAlias: "Cozy Evening",
      moodColor: "#FF6347",
      lighting: {
        rgb: [255, 99, 71],
        brightness: 80,
        temperature: 3000,
      },
      scent: {
        type: "Spicy",
        name: "Cinnamon",
        level: 6,
        interval: 20,
      },
      music: {
        musicID: 22,
        volume: 75,
        fadeIn: 750,
        fadeOut: 750,
      },
      background: {
        icons: ["candle_warm", "fireplace_cozy"],
        wind: {
          direction: 90,
          speed: 2,
        },
        animation: {
          speed: 4,
          iconOpacity: 0.7,
        },
      },
    },
  ],
};

async function testPhase3Validation() {
  console.log("🧪 Phase 3 검증 로직 테스트 시작...\n");
  console.log("=".repeat(100));
  
  try {
    const { validateAndNormalizeResponse } = await import("../src/lib/llm/validateResponse");
    const { mapCompleteOutputToMoodStreamSegment } = await import("../src/lib/llm/mappers/completeOutputMapper");
    const { validateCompleteSegmentOutput } = await import("../src/lib/llm/validators/completeOutputValidator");
    
    // 1. 검증 테스트
    console.log("\n📋 테스트 1: CompleteSegmentOutput 검증");
    console.log("-".repeat(100));
    const firstSegment = mockNewResponse.segments[0];
    const validatedOutput = validateCompleteSegmentOutput(firstSegment);
    console.log("✅ 검증 성공:");
    console.log(JSON.stringify(validatedOutput, null, 2));
    
    // 2. validateAndNormalizeResponse 테스트
    console.log("\n📋 테스트 2: validateAndNormalizeResponse (새로운 구조)");
    console.log("-".repeat(100));
    const normalizedResponse = validateAndNormalizeResponse(mockNewResponse);
    console.log("✅ 정규화 성공:");
    if ('segments' in normalizedResponse) {
      console.log(`총 ${normalizedResponse.segments.length}개 세그먼트`);
      normalizedResponse.segments.forEach((seg, idx) => {
        console.log(`\n[Segment ${idx}]`);
        console.log(`  moodAlias: "${seg.moodAlias}"`);
        console.log(`  musicSelection: ${seg.musicSelection}`);
        console.log(`  moodColor: "${seg.moodColor}"`);
        console.log(`  lighting: brightness=${seg.lighting?.brightness}, temperature=${seg.lighting?.temperature}`);
        console.log(`  backgroundIcon: ${seg.backgroundIcon?.name} (${seg.backgroundIcon?.category})`);
        console.log(`  iconKeys: [${seg.iconKeys?.join(", ")}]`);
      });
    }
    
    // 3. MoodStreamSegment 매핑 테스트
    console.log("\n📋 테스트 3: CompleteSegmentOutput → MoodStreamSegment 매핑");
    console.log("-".repeat(100));
    const timestamp = Date.now();
    const moodSegment = await mapCompleteOutputToMoodStreamSegment(validatedOutput, timestamp);
    console.log("✅ 매핑 성공:");
    console.log(`  timestamp: ${moodSegment.timestamp}`);
    console.log(`  duration: ${moodSegment.duration}ms (${Math.round(moodSegment.duration / 1000)}초)`);
    console.log(`  mood.name: "${moodSegment.mood.name}"`);
    console.log(`  mood.color: "${moodSegment.mood.color}"`);
    console.log(`  mood.music: ${moodSegment.mood.music.genre} - "${moodSegment.mood.music.title}"`);
    console.log(`  mood.scent: ${moodSegment.mood.scent.type} (${moodSegment.mood.scent.name})`);
    console.log(`  mood.lighting.rgb: [${moodSegment.mood.lighting.rgb.join(', ')}]`);
    console.log(`  musicTracks: ${moodSegment.musicTracks.length}개`);
    if (moodSegment.musicTracks.length > 0) {
      const track = moodSegment.musicTracks[0];
      console.log(`    - title: "${track.title}"`);
      console.log(`    - duration: ${track.duration}ms`);
      console.log(`    - fileUrl: ${track.fileUrl}`);
      console.log(`    - albumImageUrl: ${track.albumImageUrl || "N/A"}`);
      console.log(`    - fadeIn: ${track.fadeIn}ms, fadeOut: ${track.fadeOut}ms`);
    }
    console.log(`  backgroundIcons: [${moodSegment.backgroundIcons?.join(", ")}]`);
    console.log(`  backgroundWind: direction=${moodSegment.backgroundWind?.direction}°, speed=${moodSegment.backgroundWind?.speed}`);
    console.log(`  animationSpeed: ${moodSegment.animationSpeed}, iconOpacity: ${moodSegment.iconOpacity}`);
    
    console.log("\n" + "=".repeat(100));
    console.log("✅ 모든 테스트 통과!");
    console.log("=".repeat(100));
    
  } catch (error) {
    console.error("\n❌ 테스트 실패:", error);
    if (error instanceof Error) {
      console.error("에러 메시지:", error.message);
      console.error("스택:", error.stack);
    }
    process.exit(1);
  }
}

// 실행
testPhase3Validation();

