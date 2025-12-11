/**
 * CompleteSegmentOutput 검증 및 변환
 * 
 * Phase 2: 새로운 CompleteSegmentOutput 구조를 처리하는 검증 로직
 */

import type { CompleteSegmentOutput } from "@/types/llm";
import type { BackgroundParamsResponse } from "@/types/llm";
import { mapIconCategory } from "../validateResponse";
import { SCENT_DEFINITIONS, type ScentType } from "@/types/mood";

/**
 * HEX 색상을 RGB 배열로 변환
 */
function hexToRgb(hex: string): [number, number, number] | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16),
      ]
    : null;
}

/**
 * 값 범위 제한
 */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * 새로운 CompleteSegmentOutput 구조를 검증하고 정규화
 */
export function validateCompleteSegmentOutput(
  rawSegment: unknown
): CompleteSegmentOutput {
  // 타입 가드: unknown을 Record로 변환
  // 타입 가드: unknown을 Record로 변환
  const segment = rawSegment as Record<string, unknown>;
  
  // 기본 정보
  const moodAlias = String(segment.moodAlias || "").trim();
  if (!moodAlias) {
    throw new Error("Invalid response: moodAlias is required");
  }

  const moodColor = String(segment.moodColor || "").trim();
  if (!moodColor || !/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(moodColor)) {
    throw new Error("Invalid response: moodColor is required and must be a valid HEX color");
  }

  // RGB 변환 (moodColor에서 추출)
  const rgbFromHex = hexToRgb(moodColor);
  const lighting = segment.lighting as Record<string, unknown> | undefined;
  const rgbArray = lighting?.rgb as number[] | undefined;
  const rgb = rgbArray
    ? [
        clamp(Math.round(Number(rgbArray[0]) || 0), 0, 255),
        clamp(Math.round(Number(rgbArray[1]) || 0), 0, 255),
        clamp(Math.round(Number(rgbArray[2]) || 0), 0, 255),
      ]
    : rgbFromHex || [107, 142, 159]; // 기본값

  // 조명
  const brightness = clamp(
    Math.round(Number(lighting?.brightness) || 50),
    0,
    100
  );
  const temperature = clamp(
    Math.round(Number(lighting?.temperature) || 4000),
    2000,
    6500
  );

  // 향
  const scent = segment.scent as Record<string, unknown> | undefined;
  const rawScentType = String(scent?.type || "").trim();
  
  // ScentType이 이미 12개로 통일되었으므로 직접 사용
  // 유효하지 않은 타입이면 기본값 "Floral" 사용
  const validScentTypes: ScentType[] = ["Musk", "Aromatic", "Woody", "Citrus", "Honey", "Green", "Dry", "Leathery", "Marine", "Spicy", "Floral", "Powdery"];
  const finalScentType: ScentType = (validScentTypes.includes(rawScentType as ScentType)) 
    ? (rawScentType as ScentType) 
    : "Floral";
  
  // scent.name이 없으면 SCENT_DEFINITIONS에서 기본값 선택 (하드코딩 "Rose" 제거)
  let scentName = String(scent?.name || "").trim();
  if (!scentName) {
    const definitions = SCENT_DEFINITIONS[finalScentType];
    scentName = definitions && definitions.length > 0 ? definitions[0].name : "Default";
  }
  const scentLevel = clamp(
    Math.round(Number(scent?.level) || 5),
    1,
    10
  );
  const scentInterval = [5, 10, 15, 20, 25, 30].includes(Number(scent?.interval ?? 15))
    ? Number(scent?.interval ?? 15)
    : 15;

  // 음악
  const music = segment.music as Record<string, unknown> | undefined;
  const musicIDRaw = music?.musicID ?? segment.musicSelection;
  const musicID = typeof musicIDRaw === 'number'
    ? musicIDRaw
    : parseInt(String(musicIDRaw || ""), 10);
  
  if (isNaN(musicID) || musicID < 10 || musicID > 69) {
    throw new Error(`Invalid response: music.musicID must be a number between 10-69, got: ${musicIDRaw}`);
  }

  const volume = clamp(
    Math.round(Number(music?.volume) || 70),
    0,
    100
  );
  // fadeIn/fadeOut: LLM이 초 단위로 반환할 수 있으므로 밀리초로 변환
  const fadeInRaw = Number(music?.fadeIn) || 750;
  const fadeIn = fadeInRaw < 100 ? fadeInRaw * 1000 : clamp(Math.round(fadeInRaw), 0, 5000);
  
  const fadeOutRaw = Number(music?.fadeOut) || 750;
  const fadeOut = fadeOutRaw < 100 ? fadeOutRaw * 1000 : clamp(Math.round(fadeOutRaw), 0, 5000);

  // 배경 효과
  const background = segment.background as Record<string, unknown> | undefined;
  let icons: string[] = [];
  if (background?.icons && Array.isArray(background.icons)) {
    icons = background.icons
      .map((v: unknown) => String(v || "").trim())
      .filter((v: string) => v.length > 0)
      .slice(0, 4);
  } else if (segment.backgroundIcons && Array.isArray(segment.backgroundIcons)) {
    // 하위 호환성: 기존 구조
    icons = segment.backgroundIcons
      .map((v: unknown) => String(v || "").trim())
      .filter((v: string) => v.length > 0)
      .slice(0, 4);
  }
  
  if (icons.length === 0) {
    icons = ["leaf_gentle"]; // 기본값
  }

  const wind = background?.wind as Record<string, unknown> | undefined;
  const animation = background?.animation as Record<string, unknown> | undefined;
  const backgroundWind = segment.backgroundWind as Record<string, unknown> | undefined;
  
  const windDirection = clamp(
    Math.round(Number(wind?.direction ?? backgroundWind?.direction) || 180),
    0,
    360
  );
  const windSpeed = clamp(
    Number(wind?.speed ?? backgroundWind?.speed) || 5,
    0,
    10
  );

  const animationSpeed = clamp(
    Number(animation?.speed ?? segment.animationSpeed) || 5,
    0,
    10
  );
  const iconOpacity = clamp(
    Number(animation?.iconOpacity ?? segment.iconOpacity) || 0.7,
    0,
    1
  );

  return {
    moodAlias,
    moodColor,
    lighting: {
      rgb: rgb as [number, number, number],
      brightness,
      temperature,
    },
    scent: {
      type: finalScentType, // ScentType이 이미 12개로 통일됨
      name: scentName,
      level: scentLevel,
      interval: scentInterval,
    },
    music: {
      musicID,
      volume,
      fadeIn,
      fadeOut,
    },
    background: {
      icons,
      wind: {
        direction: windDirection,
        speed: windSpeed,
      },
      animation: {
        speed: animationSpeed,
        iconOpacity,
      },
    },
  };
}

/**
 * CompleteSegmentOutput를 BackgroundParamsResponse로 변환 (하위 호환성)
 */
export function convertToBackgroundParamsResponse(
  output: CompleteSegmentOutput
): BackgroundParamsResponse {
  // 첫 번째 아이콘을 backgroundIcon으로 매핑
  const primaryIcon = output.background.icons[0] || "leaf_gentle";
  const mappedIcon = mapIconCategory(primaryIcon);
  
  return {
    moodAlias: output.moodAlias,
    musicSelection: output.music.musicID,
    moodColor: output.moodColor,
    lighting: {
      brightness: output.lighting.brightness,
      temperature: output.lighting.temperature,
    },
    backgroundIcon: {
      name: mappedIcon.name,
      category: mappedIcon.category,
    },
    iconKeys: output.background.icons,
    backgroundWind: output.background.wind,
    animationSpeed: output.background.animation.speed,
    iconOpacity: output.background.animation.iconOpacity,
    // 향 정보 포함 (LLM 응답에서 가져온 값)
    scent: {
      type: output.scent.type,
      name: output.scent.name,
    },
  };
}

