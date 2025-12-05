// src/lib/llm/validateResponse.ts
/**
 * LLM 응답 검증 및 정규화
 * 
 * OpenAI 응답에서 필요한 값만 추출하고 검증
 * 
 * Phase 2: 새로운 CompleteSegmentOutput 구조 지원 추가
 * 하위 호환성을 위해 기존 BackgroundParamsResponse 구조도 유지
 */

import type { MusicTrack } from "@/hooks/useMoodStream/types";
import type { CompleteSegmentOutput } from "./types/completeOutput";
import { validateCompleteSegmentOutput, convertToBackgroundParamsResponse } from "./validators/completeOutputValidator";

/**
 * @deprecated BackgroundParamsResponse는 Phase 1 리팩토링으로 인해 점진적으로 제거됩니다.
 * 새로운 CompleteSegmentOutput 타입을 사용하세요.
 * 
 * 하위 호환성을 위해 일시적으로 유지됩니다.
 */
export interface BackgroundParamsResponse {
  moodAlias: string;
  musicSelection: number | string; // musicID (10-69) 또는 문자열 (하위 호환성)
  moodColor: string;
  lighting: {
    brightness: number;
    temperature?: number;
  };
  backgroundIcon: {
    name: string;
    category: string;
  };
  // LLM이 선택한 원시 아이콘 키 배열 (최대 4개, 첫 번째는 backgroundIcon 에 매핑됨)
  iconKeys?: string[];
  backgroundWind: {
    direction: number;
    speed: number;
  };
  animationSpeed: number;
  iconOpacity: number;
  // 사용되지 않는 필드들 (제거 예정)
  // iconCount?: number;
  // iconSize?: number;
  // particleEffect?: boolean;
  // gradientColors?: string[];
  // transitionDuration?: number;
  // DB에서 매핑된 실제 음악 트랙 (선택적, streamHandler에서 추가)
  musicTracks?: MusicTrack[];
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

export function mapIconCategory(rawCategory: unknown): { name: string; category: string } {
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
      categories?: unknown;
    };
    backgroundIcons?: unknown;
    backgroundWind?: {
      direction?: unknown;
      speed?: unknown;
    };
    animationSpeed?: unknown;
    iconOpacity?: unknown;
    // 사용되지 않는 필드 제거
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
  // 1) backgroundIcons (배열) 또는 2) backgroundIcon.categories (배열) 또는 3) backgroundIcon.category (단일)
  let rawIconKeys: string[] = [];

  if (Array.isArray((rawSegment as Record<string, unknown>).backgroundIcons)) {
    rawIconKeys = ((rawSegment as Record<string, unknown>).backgroundIcons as unknown[])
      .map((v: unknown) => String(v || "").trim())
      .filter((v: string) => v.length > 0);
  } else if (rawSegment.backgroundIcon && typeof rawSegment.backgroundIcon === 'object' && 'categories' in rawSegment.backgroundIcon && Array.isArray(rawSegment.backgroundIcon.categories)) {
    rawIconKeys = (rawSegment.backgroundIcon.categories as unknown[])
      .map((v: unknown) => String(v || "").trim())
      .filter((v: string) => v.length > 0);
  } else if (rawSegment.backgroundIcon?.category) {
    rawIconKeys = [String(rawSegment.backgroundIcon.category).trim()];
  }

  // 1~4개로 제한, 없으면 기본값
  if (rawIconKeys.length === 0) {
    rawIconKeys = ["leaf_gentle"];
  }
  rawIconKeys = rawIconKeys.slice(0, 4);

  const primaryIconKey = rawIconKeys[0];
  const mappedIcon = mapIconCategory(primaryIconKey);

  // 아이콘 매핑 로깅 (매핑 실패 시)
  if (primaryIconKey && mappedIcon.name === "FaCircle" && mappedIcon.category === "abstract") {
    console.warn(`⚠️  [validateResponse] Icon category mapping issue: "${primaryIconKey}" → default icon`);
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

  // 사용되지 않는 필드 제거 (iconCount, iconSize, particleEffect, gradientColors, transitionDuration)

  // musicSelection을 숫자로 변환 시도 (musicID 10-69)
  const musicSelectionRaw = rawSegment.musicSelection;
  let musicSelection: number | string;
  if (typeof musicSelectionRaw === 'number') {
    musicSelection = musicSelectionRaw;
  } else {
    const parsed = parseInt(String(musicSelectionRaw || ""), 10);
    musicSelection = isNaN(parsed) ? String(musicSelectionRaw || "").trim() : parsed;
  }

  return {
    moodAlias: String(rawSegment.moodAlias || "").trim(),
    musicSelection,
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
    iconKeys: rawIconKeys,
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
  // 10개 세그먼트 배열 응답 처리
  if (rawResponse.segments && Array.isArray(rawResponse.segments)) {
    // 새로운 구조인지 확인 (lighting.rgb, scent, music 객체 존재 여부)
    const firstSegment = rawResponse.segments[0];
    const isNewStructure = !!(firstSegment?.lighting?.rgb || firstSegment?.scent || firstSegment?.music);
    
    console.log(`\n✅ [LLM Response] ${rawResponse.segments.length} segments, ${isNewStructure ? "NEW structure" : "OLD structure"}`);
    
    const validatedSegments = rawResponse.segments.map((segment, index) => {
      try {
        if (isNewStructure) {
          // 새로운 구조: CompleteSegmentOutput 검증 후 BackgroundParamsResponse로 변환
          const completeOutput = validateCompleteSegmentOutput(segment);
          // 로그 간소화: 에러만 표시
          if (index < 3 || index === rawResponse.segments.length - 1) {
            console.log(`  Segment ${index}: ${completeOutput.moodAlias} | musicID ${completeOutput.music.musicID} | ${completeOutput.background.icons.length} icons`);
          }
          return convertToBackgroundParamsResponse(completeOutput);
        } else {
          // 기존 구조: 기존 검증 로직 사용
          console.log(`[validateResponse] Segment ${index} ⚠️  OLD structure (will be converted)`);
          return validateSingleSegment(segment as RawLLMResponse);
        }
      } catch (error) {
        console.error(`[validateResponse] Segment ${index} validation failed:`, error);
        // 기본값으로 대체
        return {
          moodAlias: `Segment ${index}`,
          musicSelection: 20, // Fallback musicID
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
    // 색상 중복 검사 및 수정 (로그 간소화)
    const colorCounts = new Map<string, number[]>();
    validatedSegments.forEach((seg, idx) => {
      const color = seg.moodColor.toLowerCase();
      if (!colorCounts.has(color)) {
        colorCounts.set(color, []);
      }
      colorCounts.get(color)!.push(idx);
    });
    
    // 중복이 3개 이상인 경우 수정
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
        // 3개 이상 중복인 경우, 첫 번째는 유지하고 나머지는 변경
        for (let i = 1; i < indices.length; i++) {
          const segIndex = indices[i];
          let newColor = alternativeColors[colorIndex % alternativeColors.length];
          while (newColor.toLowerCase() === color || 
                 validatedSegments.some((s, idx) => idx !== segIndex && s.moodColor.toLowerCase() === newColor.toLowerCase())) {
            colorIndex++;
            newColor = alternativeColors[colorIndex % alternativeColors.length];
          }
          validatedSegments[segIndex].moodColor = newColor;
          colorIndex++;
          fixedCount++;
        }
      }
    });
    
    if (fixedCount > 0) {
      console.log(`  ⚠️  Fixed ${fixedCount} duplicate color(s)`);
    }
    
    return { segments: validatedSegments };
  }
  
  // 단일 세그먼트 응답 (하위 호환성)
  return validateSingleSegment(rawResponse);
}


