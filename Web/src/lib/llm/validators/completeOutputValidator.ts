/**
 * CompleteSegmentOutput 검증 및 변환
 * 
 * Phase 2: 새로운 CompleteSegmentOutput 구조를 처리하는 검증 로직
 */

import type { CompleteSegmentOutput } from "../types/completeOutput";
import type { BackgroundParamsResponse } from "../validateResponse";
import { mapIconCategory } from "../validateResponse";

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
  rawSegment: any
): CompleteSegmentOutput {
  // 기본 정보
  const moodAlias = String(rawSegment.moodAlias || "").trim();
  if (!moodAlias) {
    throw new Error("Invalid response: moodAlias is required");
  }

  const moodColor = String(rawSegment.moodColor || "").trim();
  if (!moodColor || !/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(moodColor)) {
    throw new Error("Invalid response: moodColor is required and must be a valid HEX color");
  }

  // RGB 변환 (moodColor에서 추출)
  const rgbFromHex = hexToRgb(moodColor);
  const rgb = rawSegment.lighting?.rgb
    ? [
        clamp(Math.round(Number(rawSegment.lighting.rgb[0]) || 0), 0, 255),
        clamp(Math.round(Number(rawSegment.lighting.rgb[1]) || 0), 0, 255),
        clamp(Math.round(Number(rawSegment.lighting.rgb[2]) || 0), 0, 255),
      ]
    : rgbFromHex || [107, 142, 159]; // 기본값

  // 조명
  const brightness = clamp(
    Math.round(Number(rawSegment.lighting?.brightness) || 50),
    0,
    100
  );
  const temperature = clamp(
    Math.round(Number(rawSegment.lighting?.temperature) || 4000),
    2000,
    6500
  );

  // 향
  const scentType = String(rawSegment.scent?.type || "Floral").trim();
  const validScentTypes = ["Floral", "Woody", "Spicy", "Fresh", "Citrus", "Herbal", "Musk", "Oriental"];
  const finalScentType = validScentTypes.includes(scentType) ? scentType : "Floral";
  
  const scentName = String(rawSegment.scent?.name || "Rose").trim();
  const scentLevel = clamp(
    Math.round(Number(rawSegment.scent?.level) || 5),
    1,
    10
  );
  const scentInterval = [5, 10, 15, 20, 25, 30].includes(Number(rawSegment.scent?.interval))
    ? Number(rawSegment.scent.interval)
    : 15;

  // 음악
  const musicIDRaw = rawSegment.music?.musicID ?? rawSegment.musicSelection;
  const musicID = typeof musicIDRaw === 'number'
    ? musicIDRaw
    : parseInt(String(musicIDRaw || ""), 10);
  
  if (isNaN(musicID) || musicID < 10 || musicID > 69) {
    throw new Error(`Invalid response: music.musicID must be a number between 10-69, got: ${musicIDRaw}`);
  }

  const volume = clamp(
    Math.round(Number(rawSegment.music?.volume) || 70),
    0,
    100
  );
  // fadeIn/fadeOut: LLM이 초 단위로 반환할 수 있으므로 밀리초로 변환
  const fadeInRaw = Number(rawSegment.music?.fadeIn) || 750;
  const fadeIn = fadeInRaw < 100 ? fadeInRaw * 1000 : clamp(Math.round(fadeInRaw), 0, 5000);
  
  const fadeOutRaw = Number(rawSegment.music?.fadeOut) || 750;
  const fadeOut = fadeOutRaw < 100 ? fadeOutRaw * 1000 : clamp(Math.round(fadeOutRaw), 0, 5000);

  // 배경 효과
  let icons: string[] = [];
  if (rawSegment.background?.icons && Array.isArray(rawSegment.background.icons)) {
    icons = rawSegment.background.icons
      .map((v: unknown) => String(v || "").trim())
      .filter((v: string) => v.length > 0)
      .slice(0, 4);
  } else if (rawSegment.backgroundIcons && Array.isArray(rawSegment.backgroundIcons)) {
    // 하위 호환성: 기존 구조
    icons = rawSegment.backgroundIcons
      .map((v: unknown) => String(v || "").trim())
      .filter((v: string) => v.length > 0)
      .slice(0, 4);
  }
  
  if (icons.length === 0) {
    icons = ["leaf_gentle"]; // 기본값
  }

  const windDirection = clamp(
    Math.round(Number(rawSegment.background?.wind?.direction ?? rawSegment.backgroundWind?.direction) || 180),
    0,
    360
  );
  const windSpeed = clamp(
    Number(rawSegment.background?.wind?.speed ?? rawSegment.backgroundWind?.speed) || 5,
    0,
    10
  );

  const animationSpeed = clamp(
    Number(rawSegment.background?.animation?.speed ?? rawSegment.animationSpeed) || 5,
    0,
    10
  );
  const iconOpacity = clamp(
    Number(rawSegment.background?.animation?.iconOpacity ?? rawSegment.iconOpacity) || 0.7,
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
      type: finalScentType as any,
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
  };
}

