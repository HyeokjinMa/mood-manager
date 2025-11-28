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
  return ICON_CATEGORY_MAP[key] || ICON_CATEGORY_MAP["default"];
}

/**
 * LLM 원시 응답 타입 (OpenAI API 응답 구조)
 */
interface RawLLMResponse {
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
 * LLM 응답 검증 및 정규화
 * 
 * OpenAI 응답에서 필요한 값만 추출하고 검증하여 안전한 형태로 변환
 */
export function validateAndNormalizeResponse(
  rawResponse: RawLLMResponse
): BackgroundParamsResponse {
  // 필수 필드 검증
  if (!rawResponse.moodAlias || typeof rawResponse.moodAlias !== 'string') {
    throw new Error("Invalid response: moodAlias is required and must be a string");
  }

  if (!rawResponse.moodColor || typeof rawResponse.moodColor !== 'string' || !isValidHexColor(rawResponse.moodColor)) {
    throw new Error("Invalid response: moodColor is required and must be a valid HEX color");
  }

  // lighting 객체 검증 (rgb는 moodColor와 중복이므로 제거)
  if (!rawResponse.lighting || typeof rawResponse.lighting !== 'object') {
    throw new Error("Invalid response: lighting is required and must be an object");
  }

  // 밝기 정규화 (0-100)
  const brightness = clamp(
    Math.round(Number(rawResponse.lighting?.brightness) || 50),
    0,
    100
  );

  // 색온도 정규화 (2000-6500)
  const temperature = rawResponse.lighting?.temperature
    ? clamp(Math.round(Number(rawResponse.lighting.temperature)), 2000, 6500)
    : 4000;

  // 배경 아이콘 검증
  const mappedIcon = mapIconCategory(rawResponse.backgroundIcon?.category);

  // 풍향 정규화 (0-360)
  const direction = clamp(
    Math.round(Number(rawResponse.backgroundWind?.direction) || 180),
    0,
    360
  );

  // 풍속 정규화 (0-10)
  const speed = clamp(
    Number(rawResponse.backgroundWind?.speed) || 5,
    0,
    10
  );

  // 애니메이션 속도 정규화 (0-10)
  const animationSpeed = clamp(
    Number(rawResponse.animationSpeed) || 5,
    0,
    10
  );

  // 아이콘 투명도 정규화 (0-1)
  const iconOpacity = clamp(
    Number(rawResponse.iconOpacity) || 0.7,
    0,
    1
  );

  // 선택적 필드
  const iconCount = rawResponse.iconCount
    ? clamp(Math.round(Number(rawResponse.iconCount)), 5, 10)
    : 8;

  const iconSize = rawResponse.iconSize
    ? clamp(Math.round(Number(rawResponse.iconSize)), 0, 100)
    : 50;

  const particleEffect = Boolean(rawResponse.particleEffect);

  // 그라데이션 색상 검증
  const gradientColors: string[] = [];
  if (Array.isArray(rawResponse.gradientColors)) {
    for (const color of rawResponse.gradientColors.slice(0, 3)) {
      if (typeof color === 'string' && isValidHexColor(color)) {
        gradientColors.push(color);
      }
    }
  }

  const transitionDuration = rawResponse.transitionDuration
    ? clamp(Math.round(Number(rawResponse.transitionDuration)), 100, 5000)
    : 1000;

  return {
    moodAlias: String(rawResponse.moodAlias).trim(),
    musicSelection: String(rawResponse.musicSelection || "").trim(),
    moodColor: rawResponse.moodColor,
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

