/**
 * LLM 응답 유효성 분석 스크립트
 * 
 * 실제 LLM 응답의 유효성을 체크
 */

// 실제 로그에서 추출한 LLM 응답
const actualLLMResponse = {
  segments: [
    {
      moodAlias: "Festive Red Glow",
      musicSelection: 12,
      moodColor: "#C72C3B",
      lighting: {
        brightness: 85,
        temperature: 3000,
      },
      backgroundIcons: ["candle_warm", "snow_soft"],
      backgroundWind: {
        direction: 45,
        speed: 3,
      },
      animationSpeed: 2,
      iconOpacity: 0.8,
    },
    {
      moodAlias: "Cheerful Green Vibes",
      musicSelection: 15,
      moodColor: "#4B8B3B",
      lighting: {
        brightness: 75,
        temperature: 3200,
      },
      backgroundIcons: ["leaf_gentle", "tree_peace"],
      backgroundWind: {
        direction: 90,
        speed: 4,
      },
      animationSpeed: 3,
      iconOpacity: 0.7,
    },
    {
      moodAlias: "Golden Holiday Spirit",
      musicSelection: 18,
      moodColor: "#D6A65B",
      lighting: {
        brightness: 80,
        temperature: 3500,
      },
      backgroundIcons: ["flower_soft", "candle_warm"],
      backgroundWind: {
        direction: 135,
        speed: 2,
      },
      animationSpeed: 4,
      iconOpacity: 0.9,
    },
    {
      moodAlias: "Warm Winter Evening",
      musicSelection: 22,
      moodColor: "#B22222",
      lighting: {
        brightness: 90,
        temperature: 2800,
      },
      backgroundIcons: ["fireplace_cozy", "snow_soft"],
      backgroundWind: {
        direction: 180,
        speed: 1,
      },
      animationSpeed: 1,
      iconOpacity: 0.85,
    },
    {
      moodAlias: "Joyful Holiday Cheer",
      musicSelection: 25,
      moodColor: "#A52A2A",
      lighting: {
        brightness: 70,
        temperature: 3000,
      },
      backgroundIcons: ["star_sparkle", "candle_warm"],
      backgroundWind: {
        direction: 225,
        speed: 5,
      },
      animationSpeed: 3,
      iconOpacity: 0.75,
    },
    {
      moodAlias: "Serene Snowfall",
      musicSelection: 30,
      moodColor: "#8B0000",
      lighting: {
        brightness: 60,
        temperature: 3200,
      },
      backgroundIcons: ["fog_mist", "snow_soft"],
      backgroundWind: {
        direction: 270,
        speed: 2,
      },
      animationSpeed: 2,
      iconOpacity: 0.8,
    },
    {
      moodAlias: "Cozy Cabin Retreat",
      musicSelection: 35,
      moodColor: "#C0C0C0",
      lighting: {
        brightness: 75,
        temperature: 3500,
      },
      backgroundIcons: ["forest_deep", "candle_warm"],
      backgroundWind: {
        direction: 315,
        speed: 3,
      },
      animationSpeed: 4,
      iconOpacity: 0.65,
    },
    {
      moodAlias: "Twinkling Night Sky",
      musicSelection: 40,
      moodColor: "#FFD700",
      lighting: {
        brightness: 80,
        temperature: 4000,
      },
      backgroundIcons: ["star_sparkle", "moon_calm"],
      backgroundWind: {
        direction: 360,
        speed: 4,
      },
      animationSpeed: 5,
      iconOpacity: 0.9,
    },
    {
      moodAlias: "Gentle Winter Breeze",
      musicSelection: 45,
      moodColor: "#FF6347",
      lighting: {
        brightness: 65,
        temperature: 3300,
      },
      backgroundIcons: ["breeze_wind", "cloud_soft"],
      backgroundWind: {
        direction: 30,
        speed: 6,
      },
      animationSpeed: 3,
      iconOpacity: 0.7,
    },
    {
      moodAlias: "Charming Holiday Glow",
      musicSelection: 50,
      moodColor: "#FF4500",
      lighting: {
        brightness: 90,
        temperature: 3100,
      },
      backgroundIcons: ["candle_warm", "flower_soft"],
      backgroundWind: {
        direction: 75,
        speed: 5,
      },
      animationSpeed: 2,
      iconOpacity: 0.8,
    },
  ],
};

function analyzeResponse() {
  console.log("🔍 LLM 응답 유효성 분석\n");
  console.log("=".repeat(100));

  const segments = actualLLMResponse.segments;
  const checks: Array<{ category: string; check: string; status: "✅" | "⚠️" | "❌"; details?: string }> = [];

  // 1. 구조 검증
  console.log("\n📋 1. 구조 검증");
  console.log("-".repeat(100));
  
  const firstSegment = segments[0];
  const hasNewStructure = !!(firstSegment.lighting?.rgb || firstSegment.scent || firstSegment.music);
  const hasOldStructure = !!(firstSegment.musicSelection || firstSegment.backgroundIcons);
  
  checks.push({
    category: "구조",
    check: "새로운 CompleteSegmentOutput 구조",
    status: hasNewStructure ? "✅" : "❌",
    details: hasNewStructure ? "새로운 구조 사용 중" : "기존 구조 사용 중 (lighting.rgb, scent, music 객체 없음)",
  });
  
  checks.push({
    category: "구조",
    check: "기존 BackgroundParamsResponse 구조",
    status: hasOldStructure ? "⚠️" : "✅",
    details: hasOldStructure ? "기존 구조로 응답 (하위 호환성 유지)" : "새로운 구조로 응답",
  });

  // 2. 필수 필드 검증
  console.log("\n📋 2. 필수 필드 검증");
  console.log("-".repeat(100));
  
  segments.forEach((seg, idx) => {
    if (!seg.moodAlias) {
      checks.push({ category: "필수 필드", check: `Segment ${idx}: moodAlias`, status: "❌" });
    }
    if (!seg.moodColor) {
      checks.push({ category: "필수 필드", check: `Segment ${idx}: moodColor`, status: "❌" });
    }
    if (!seg.lighting) {
      checks.push({ category: "필수 필드", check: `Segment ${idx}: lighting`, status: "❌" });
    }
    if (!seg.lighting?.brightness && seg.lighting?.brightness !== 0) {
      checks.push({ category: "필수 필드", check: `Segment ${idx}: lighting.brightness`, status: "❌" });
    }
    if (!seg.lighting?.temperature && seg.lighting?.temperature !== 0) {
      checks.push({ category: "필수 필드", check: `Segment ${idx}: lighting.temperature`, status: "❌" });
    }
  });

  // 3. 새로운 구조 필드 검증
  if (!hasNewStructure) {
    console.log("\n📋 3. 새로운 구조 필드 (누락됨)");
    console.log("-".repeat(100));
    
    checks.push({
      category: "새로운 구조",
      check: "lighting.rgb",
      status: "❌",
      details: "RGB 값이 없음 (moodColor에서 추출 가능하지만 명시적으로 요구됨)",
    });
    
    checks.push({
      category: "새로운 구조",
      check: "scent 객체",
      status: "❌",
      details: "향 정보가 없음 (type, name, level, interval)",
    });
    
    checks.push({
      category: "새로운 구조",
      check: "music 객체",
      status: "❌",
      details: "음악 정보가 musicSelection으로만 제공됨 (musicID, volume, fadeIn, fadeOut 필요)",
    });
    
    checks.push({
      category: "새로운 구조",
      check: "background 객체",
      status: "❌",
      details: "배경 정보가 평면적으로 제공됨 (background.icons, background.wind, background.animation 필요)",
    });
  }

  // 4. musicID 검증
  console.log("\n📋 4. musicID 검증");
  console.log("-".repeat(100));
  
  const musicIDs = segments.map(seg => seg.musicSelection).filter(id => typeof id === 'number');
  const uniqueMusicIDs = new Set(musicIDs);
  const musicIDRange = musicIDs.filter(id => id >= 10 && id <= 69);
  
  checks.push({
    category: "musicID",
    check: "musicID 범위 (10-69)",
    status: musicIDRange.length === musicIDs.length ? "✅" : "❌",
    details: `${musicIDRange.length}/${musicIDs.length}개가 유효한 범위`,
  });
  
  checks.push({
    category: "musicID",
    check: "musicID 고유성",
    status: uniqueMusicIDs.size === musicIDs.length ? "✅" : "❌",
    details: `${uniqueMusicIDs.size}개 고유 ID (총 ${musicIDs.length}개)`,
  });
  
  // musicID 패턴 분석
  const sortedIDs = [...musicIDs].sort((a, b) => a - b);
  const differences = sortedIDs.slice(1).map((id, i) => id - sortedIDs[i]);
  const avgDifference = differences.reduce((a, b) => a + b, 0) / differences.length;
  
  checks.push({
    category: "musicID",
    check: "musicID 다양성",
    status: avgDifference <= 3 ? "⚠️" : "✅",
    details: `평균 차이: ${avgDifference.toFixed(1)} (너무 규칙적일 수 있음)`,
  });
  
  console.log(`  musicIDs: [${musicIDs.join(', ')}]`);
  console.log(`  고유 ID: ${uniqueMusicIDs.size}개`);
  console.log(`  평균 차이: ${avgDifference.toFixed(1)}`);

  // 5. 색상 검증
  console.log("\n📋 5. 색상 검증");
  console.log("-".repeat(100));
  
  const colors = segments.map(seg => seg.moodColor);
  const uniqueColors = new Set(colors);
  const validHexColors = colors.filter(color => /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color));
  
  checks.push({
    category: "색상",
    check: "HEX 색상 형식",
    status: validHexColors.length === colors.length ? "✅" : "❌",
    details: `${validHexColors.length}/${colors.length}개가 유효한 HEX 형식`,
  });
  
  checks.push({
    category: "색상",
    check: "색상 고유성",
    status: uniqueColors.size === colors.length ? "✅" : "❌",
    details: `${uniqueColors.size}개 고유 색상 (총 ${colors.length}개)`,
  });

  // 6. 아이콘 검증
  console.log("\n📋 6. 아이콘 검증");
  console.log("-".repeat(100));
  
  const allIcons = segments.flatMap(seg => seg.backgroundIcons || []);
  const uniqueIcons = new Set(allIcons);
  const iconCounts = segments.map(seg => (seg.backgroundIcons || []).length);
  const validIconCounts = iconCounts.filter(count => count >= 1 && count <= 4);
  
  checks.push({
    category: "아이콘",
    check: "아이콘 개수 (1-4개)",
    status: validIconCounts.length === segments.length ? "✅" : "❌",
    details: `${validIconCounts.length}/${segments.length}개 세그먼트가 유효한 아이콘 개수`,
  });
  
  checks.push({
    category: "아이콘",
    check: "아이콘 다양성",
    status: uniqueIcons.size >= 8 ? "✅" : "⚠️",
    details: `${uniqueIcons.size}개 고유 아이콘 (권장: 8-12개)`,
  });
  
  console.log(`  총 아이콘: ${allIcons.length}개`);
  console.log(`  고유 아이콘: ${uniqueIcons.size}개`);
  console.log(`  아이콘 목록: [${Array.from(uniqueIcons).join(', ')}]`);

  // 7. 범위 검증
  console.log("\n📋 7. 값 범위 검증");
  console.log("-".repeat(100));
  
  const brightnessValues = segments.map(seg => seg.lighting?.brightness).filter(v => v !== undefined);
  const validBrightness = brightnessValues.filter(v => v >= 0 && v <= 100);
  
  checks.push({
    category: "범위",
    check: "brightness (0-100)",
    status: validBrightness.length === brightnessValues.length ? "✅" : "❌",
    details: `${validBrightness.length}/${brightnessValues.length}개가 유효한 범위`,
  });
  
  const temperatureValues = segments.map(seg => seg.lighting?.temperature).filter(v => v !== undefined);
  const validTemperature = temperatureValues.filter(v => v >= 2000 && v <= 6500);
  
  checks.push({
    category: "범위",
    check: "temperature (2000-6500K)",
    status: validTemperature.length === temperatureValues.length ? "✅" : "❌",
    details: `${validTemperature.length}/${temperatureValues.length}개가 유효한 범위`,
  });

  // 결과 요약
  console.log("\n" + "=".repeat(100));
  console.log("📊 검증 결과 요약");
  console.log("=".repeat(100));
  
  const byStatus = {
    "✅": checks.filter(c => c.status === "✅"),
    "⚠️": checks.filter(c => c.status === "⚠️"),
    "❌": checks.filter(c => c.status === "❌"),
  };
  
  console.log(`\n✅ 통과: ${byStatus["✅"].length}개`);
  console.log(`⚠️  경고: ${byStatus["⚠️"].length}개`);
  console.log(`❌ 실패: ${byStatus["❌"].length}개`);
  
  if (byStatus["❌"].length > 0) {
    console.log("\n❌ 실패 항목:");
    byStatus["❌"].forEach(check => {
      console.log(`  - [${check.category}] ${check.check}`);
      if (check.details) {
        console.log(`    ${check.details}`);
      }
    });
  }
  
  if (byStatus["⚠️"].length > 0) {
    console.log("\n⚠️  경고 항목:");
    byStatus["⚠️"].forEach(check => {
      console.log(`  - [${check.category}] ${check.check}`);
      if (check.details) {
        console.log(`    ${check.details}`);
      }
    });
  }

  // 전체 유효성 점수
  const totalChecks = checks.length;
  const passedChecks = byStatus["✅"].length;
  const score = Math.round((passedChecks / totalChecks) * 100);
  
  console.log(`\n📈 전체 유효성 점수: ${score}%`);
  
  if (score >= 80) {
    console.log("✅ 대부분 유효함");
  } else if (score >= 60) {
    console.log("⚠️  일부 문제 있음");
  } else {
    console.log("❌ 많은 문제 있음");
  }
}

// 실행
analyzeResponse();

