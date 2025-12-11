// ======================================================
// File: src/app/(main)/home/components/Device/hooks/useDeviceCard.ts
// ======================================================

import { useState } from "react";
import type { Device } from "@/types/device";
import type { Mood } from "@/types/mood";
import { blendWithWhite, reduceWhiteTint } from "@/lib/utils";

interface UseDeviceCardProps {
  device: Device;
  currentMood?: Mood;
}

/**
 * 디바이스 카드 상태 관리 훅
 */
export function useDeviceCard({ device, currentMood }: UseDeviceCardProps) {
  // device.output.color를 우선 사용, 없으면 currentMood.color 사용
  const initialColor = device.output.color || currentMood?.color || "#FFD700";
  const [lightColor, setLightColor] = useState(initialColor);
  const [lightBrightness, setLightBrightness] = useState(device.output.brightness || 50);
  const [scentLevel, setScentLevel] = useState(device.output.scentLevel || 5);

  // device.output.color 또는 currentMood.color 변경 시 lightColor 동기화
  const effectiveColor = device.output.color || currentMood?.color || lightColor;
  if (effectiveColor !== lightColor) {
    setLightColor(effectiveColor);
  }

  // 무드 컬러를 흰색에 가깝게 블렌딩 (90% 흰색 + 10% 무드 컬러)
  // 전원이 켜져 있을 때만 무드 컬러 사용, 꺼져 있으면 회색
  // device.output.color가 있으면 우선 사용, 없으면 currentMood.color 사용
  const getBackgroundColor = () => {
    if (!device.power) {
      return "rgba(200, 200, 200, 0.8)";
    }
    const colorToUse = device.output.color || currentMood?.color;
    if (colorToUse) {
      // 흰색 과다 처리 후 블렌딩
      const adjustedColor = reduceWhiteTint(colorToUse);
      return blendWithWhite(adjustedColor, 0.9);
    }
    return "rgb(255, 255, 255)";
  };

  const backgroundColor = getBackgroundColor();

  return {
    lightColor,
    setLightColor,
    lightBrightness,
    setLightBrightness,
    scentLevel,
    setScentLevel,
    backgroundColor,
  };
}

