// src/lib/llm/validateResponse.ts
/**
 * LLM 응답 검증 및 정규화
 * 
 * OpenAI 응답에서 필요한 값만 추출하고 검증
 */

export interface BackgroundParamsResponse {
  moodAlias: string;
  musicSelection: string;
  moodColor: string;
  lighting: {
    brightness: number;
    temperature?: number;
  };
  backgroundIcon: {
    name: string;
    category: string;
  };
  backgroundWind: {
    direction: number;
    speed: number;
  };
  animationSpeed: number;
  iconOpacity: number;
  iconCount?: number;
  iconSize?: number;
  particleEffect?: boolean;
  gradientColors?: string[];
  transitionDuration?: number;
}

/**
 * HEX 색상 검증
 */
function isValidHexColor(hex: string): boolean {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(hex);
}

/**
 * 값 범위 제한
 */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

// 아이콘 카테고리 → React Icons 매핑 (LLM이 선택하는 key 기준)
const ICON_CATEGORY_MAP: Record<
  string,
  {
    name: string;
    category: string;
  }
> = {
  // Weather (6)
  sun_soft: { name: "FaRegSun", category: "weather" },
  moon_calm: { name: "FaRegMoon", category: "weather" },
  cloud_soft: { name: "FaCloud", category: "weather" },
  rain_light: { name: "FaCloudRain", category: "weather" },
  snow_soft: { name: "FaSnowflake", category: "weather" },
  fog_mist: { name: "FaSmog", category: "weather" },

  // Nature (8)
  leaf_gentle: { name: "FaLeaf", category: "nature" },
  tree_peace: { name: "FaTree", category: "nature" },
  flower_soft: { name: "FaSpa", category: "nature" },
  wave_slow: { name: "FaWater", category: "nature" },
  mountain_silhouette: { name: "FaMountain", category: "nature" },
  forest_deep: { name: "FaTree", category: "nature" },
  star_sparkle: { name: "FaStar", category: "nature" },
  breeze_wind: { name: "FaWind", category: "nature" },

  // Objects / Space (8)
  candle_warm: { name: "FaCandle", category: "object" },
  coffee_mug: { name: "FaCoffee", category: "object" },
  book_focus: { name: "FaBookOpen", category: "object" },
  sofa_relax: { name: "FaCouch", category: "object" },
  window_light: { name: "FaWindowMaximize", category: "object" },
  lamp_soft: { name: "FaLightbulb", category: "object" },
  clock_slow: { name: "FaClock", category: "object" },
  fireplace_cozy: { name: "FaFire", category: "object" },

  // Emotion / Abstract (8)
  heart_soft: { name: "FaHeart", category: "abstract" },
  sparkle_energy: { name: "FaStar", category: "abstract" },
  bubble_thought: { name: "FaCommentDots", category: "abstract" },
  orb_glow: { name: "FaCircle", category: "abstract" },
  pulse_calm: { name: "FaHeartbeat", category: "abstract" },
  target_focus: { name: "FaBullseye", category: "abstract" },
  wave_brain: { name: "FaBrain", category: "abstract" },
  meditation_pose: { name: "FaOm", category: "abstract" },

  // 기본값
  default: { name: "FaCircle", category: "abstract" },
};

function mapIconCategory(rawCategory: unknown): { name: string; category: string } {
  const key = String(rawCategory || "leaf_gentle").toLowerCase().trim();
  const mapped = ICON_CATEGORY_MAP[key] || ICON_CATEGORY_MAP["default"];
  
  // 매핑 실패 시 로깅
  if (!ICON_CATEGORY_MAP[key]) {
    console.warn(`⚠️  [mapIconCategory] Unknown icon category: "${rawCategory}" (key: "${key}") → using default`);
  }
  
  return mapped;
}

/**
 * LLM 원시 응답 타입 (OpenAI API 응답 구조)
 */
interface RawLLMResponse {
  segments?: Array<{
    moodAlias?: unknown;
    musicSelection?: unknown;
    moodColor?: unknown;
    lighting?: {
      brightness?: unknown;
      temperature?: unknown;
    };
    backgroundIcon?: {
      category?: unknown;
    };
    backgroundWind?: {
      direction?: unknown;
      speed?: unknown;
    };
    animationSpeed?: unknown;
    iconOpacity?: unknown;
    iconCount?: unknown;
    iconSize?: unknown;
    particleEffect?: unknown;
    gradientColors?: unknown;
    transitionDuration?: unknown;
  }>;
  // 단일 세그먼트 응답 (하위 호환성)
  moodAlias?: unknown;
  musicSelection?: unknown;
  moodColor?: unknown;
  lighting?: {
    brightness?: unknown;
    temperature?: unknown;
  };
  backgroundIcon?: {
    category?: unknown;
  };
  backgroundWind?: {
    direction?: unknown;
    speed?: unknown;
  };
  animationSpeed?: unknown;
  iconOpacity?: unknown;
  iconCount?: unknown;
  iconSize?: unknown;
  particleEffect?: unknown;
  gradientColors?: unknown;
  transitionDuration?: unknown;
}

/**
 * 단일 세그먼트 검증 및 정규화
 */
function validateSingleSegment(
  rawSegment: RawLLMResponse
): BackgroundParamsResponse {
  // 필수 필드 검증
  if (!rawSegment.moodAlias || typeof rawSegment.moodAlias !== 'string') {
    throw new Error("Invalid response: moodAlias is required and must be a string");
  }

  if (!rawSegment.moodColor || typeof rawSegment.moodColor !== 'string' || !isValidHexColor(rawSegment.moodColor)) {
    throw new Error("Invalid response: moodColor is required and must be a valid HEX color");
  }

  // lighting 객체 검증 (rgb는 moodColor와 중복이므로 제거)
  if (!rawSegment.lighting || typeof rawSegment.lighting !== 'object') {
    throw new Error("Invalid response: lighting is required and must be an object");
  }

  // 밝기 정규화 (0-100)
  const brightness = clamp(
    Math.round(Number(rawSegment.lighting?.brightness) || 50),
    0,
    100
  );

  // 색온도 정규화 (2000-6500)
  const temperature = rawSegment.lighting?.temperature
    ? clamp(Math.round(Number(rawSegment.lighting.temperature)), 2000, 6500)
    : 4000;

  // 배경 아이콘 검증
  const rawIconCategory = rawSegment.backgroundIcon?.category;
  const mappedIcon = mapIconCategory(rawIconCategory);
  
  // 아이콘 매핑 로깅 (매핑 실패 시)
  if (rawIconCategory && mappedIcon.name === "FaCircle" && mappedIcon.category === "abstract") {
    console.warn(`⚠️  [validateResponse] Icon category mapping issue: "${rawIconCategory}" → default icon`);
  }

  // 풍향 정규화 (0-360)
  const direction = clamp(
    Math.round(Number(rawSegment.backgroundWind?.direction) || 180),
    0,
    360
  );

  // 풍속 정규화 (0-10)
  const speed = clamp(
    Number(rawSegment.backgroundWind?.speed) || 5,
    0,
    10
  );

  // 애니메이션 속도 정규화 (0-10)
  const animationSpeed = clamp(
    Number(rawSegment.animationSpeed) || 5,
    0,
    10
  );

  // 아이콘 투명도 정규화 (0-1)
  const iconOpacity = clamp(
    Number(rawSegment.iconOpacity) || 0.7,
    0,
    1
  );

  // 선택적 필드
  const iconCount = rawSegment.iconCount
    ? clamp(Math.round(Number(rawSegment.iconCount)), 5, 10)
    : 8;

  const iconSize = rawSegment.iconSize
    ? clamp(Math.round(Number(rawSegment.iconSize)), 0, 100)
    : 50;

  const particleEffect = Boolean(rawSegment.particleEffect);

  // 그라데이션 색상 검증
  const gradientColors: string[] = [];
  if (Array.isArray(rawSegment.gradientColors)) {
    for (const color of rawSegment.gradientColors.slice(0, 3)) {
      if (typeof color === 'string' && isValidHexColor(color)) {
        gradientColors.push(color);
      }
    }
  }

  const transitionDuration = rawSegment.transitionDuration
    ? clamp(Math.round(Number(rawSegment.transitionDuration)), 100, 5000)
    : 1000;

  return {
    moodAlias: String(rawSegment.moodAlias || "").trim(),
    musicSelection: String(rawSegment.musicSelection || "").trim(),
    moodColor: rawSegment.moodColor as string,
    lighting: {
      brightness,
      temperature,
    },
    backgroundIcon: {
      name: mappedIcon.name,
      category: mappedIcon.category,
    },
    backgroundWind: {
      direction,
      speed,
    },
    animationSpeed,
    iconOpacity,
    iconCount,
    iconSize,
    particleEffect,
    gradientColors: gradientColors.length > 0 ? gradientColors : undefined,
    transitionDuration,
  };
}

/**
 * LLM 응답 검증 및 정규화
 * 
 * OpenAI 응답에서 필요한 값만 추출하고 검증하여 안전한 형태로 변환
 * - 10개 세그먼트 배열 응답 지원
 * - 단일 세그먼트 응답도 하위 호환성 유지
 */
export function validateAndNormalizeResponse(
  rawResponse: RawLLMResponse
): BackgroundParamsResponse | { segments: BackgroundParamsResponse[] } {
  // ===== 검증 전 원시 데이터 로깅 =====
  console.log("\n" + "🔍 [validateResponse] Raw input:");
  console.log(JSON.stringify(rawResponse, null, 2));
  
  // 10개 세그먼트 배열 응답 처리
  if (rawResponse.segments && Array.isArray(rawResponse.segments)) {
    console.log(`\n📦 [validateResponse] Processing ${rawResponse.segments.length} segments...`);
    console.log(`\n📋 [validateResponse] Raw segments summary:`);
    rawResponse.segments.forEach((seg, idx: number) => {
      const segment = seg as RawLLMResponse["segments"] extends Array<infer T> ? T : RawLLMResponse;
      console.log(`  Segment ${idx}:`);
      console.log(`    moodAlias: "${String(segment.moodAlias || 'MISSING')}"`);
      console.log(`    musicSelection: "${String(segment.musicSelection || 'MISSING')}"`);
      console.log(`    moodColor: "${String(segment.moodColor || 'MISSING')}"`);
      console.log(`    backgroundIcon.category: "${String(segment.backgroundIcon?.category || 'MISSING')}"`);
    });
    
    const validatedSegments = rawResponse.segments.map((segment, index) => {
      try {
        return validateSingleSegment(segment as RawLLMResponse);
      } catch (error) {
        console.error(`[validateResponse] Segment ${index} validation failed:`, error);
        // 기본값으로 대체
        return {
          moodAlias: `Segment ${index}`,
          musicSelection: "Unknown",
          moodColor: "#E6F3FF",
          lighting: { brightness: 50, temperature: 4000 },
          backgroundIcon: { name: "FaCircle", category: "abstract" },
          backgroundWind: { direction: 180, speed: 3 },
          animationSpeed: 5,
          iconOpacity: 0.7,
        };
      }
    });
    
    // 컬러 중복 체크 및 수정 (최대 1개 중복 허용)
    console.log("\n🎨 [validateResponse] Color analysis before fix:");
    const colorCounts = new Map<string, number[]>();
    validatedSegments.forEach((seg, idx) => {
      const color = seg.moodColor.toLowerCase();
      if (!colorCounts.has(color)) {
        colorCounts.set(color, []);
      }
      colorCounts.get(color)!.push(idx);
    });
    
    colorCounts.forEach((indices, color) => {
      if (indices.length > 1) {
        console.log(`  ${color}: used in segments [${indices.join(', ')}] (${indices.length} times)`);
      }
    });
    
    // 중복이 2개 이상인 경우 수정
    const alternativeColors = [
      "#FFD700", "#FFA500", "#8B4513", "#A0522D", "#228B22", "#32CD32",
      "#9370DB", "#8A2BE2", "#FF6347", "#FF8C00", "#FF69B4", "#FF1493",
      "#008080", "#20B2AA", "#DC143C", "#B22222", "#FFB6C1", "#DDA0DD",
      "#F0E68C", "#98D8C8", "#FF7F50", "#6A5ACD"
    ];
    let colorIndex = 0;
    let fixedCount = 0;
    
    colorCounts.forEach((indices, color) => {
      if (indices.length > 2) {
        console.log(`\n🔧 [validateResponse] Fixing color ${color} (used ${indices.length} times, max 2 allowed)`);
        // 3개 이상 중복인 경우, 첫 번째는 유지하고 나머지는 변경
        for (let i = 1; i < indices.length; i++) {
          const segIndex = indices[i];
          // 기존 색상과 다른 색상 찾기
          let newColor = alternativeColors[colorIndex % alternativeColors.length];
          while (newColor.toLowerCase() === color || 
                 validatedSegments.some((s, idx) => idx !== segIndex && s.moodColor.toLowerCase() === newColor.toLowerCase())) {
            colorIndex++;
            newColor = alternativeColors[colorIndex % alternativeColors.length];
          }
          console.log(`  Segment ${segIndex}: ${color} → ${newColor}`);
          validatedSegments[segIndex].moodColor = newColor;
          colorIndex++;
          fixedCount++;
        }
      }
    });
    
    if (fixedCount > 0) {
      console.log(`\n✅ [validateResponse] Fixed ${fixedCount} color(s)`);
    }
    
    // 최종 컬러 상태 로깅
    console.log("\n🎨 [validateResponse] Final colors:");
    validatedSegments.forEach((seg, idx) => {
      console.log(`  Segment ${idx}: ${seg.moodColor}`);
    });
    
    return { segments: validatedSegments };
  }
  
  // 단일 세그먼트 응답 (하위 호환성)
  return validateSingleSegment(rawResponse);
}


