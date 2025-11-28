// ======================================================
// File: src/app/(main)/home/components/Device/hooks/useDeviceCard.ts
// ======================================================

import { useState } from "react";
import type { Device } from "@/types/device";
import type { Mood } from "@/types/mood";
import { blendWithWhite } from "@/lib/utils";

interface UseDeviceCardProps {
  device: Device;
  currentMood?: Mood;
}

/**
 * 디바이스 카드 상태 관리 훅
 */
export function useDeviceCard({ device, currentMood }: UseDeviceCardProps) {
  const [lightColor, setLightColor] = useState(device.output.color || "#FFD700");
  const [lightBrightness, setLightBrightness] = useState(device.output.brightness || 50);
  const [scentLevel, setScentLevel] = useState(device.output.scentLevel || 5);

  // 무드 컬러를 흰색에 가깝게 블렌딩 (90% 흰색 + 10% 무드 컬러)
  // 전원이 켜져 있을 때만 무드 컬러 사용, 꺼져 있으면 회색
  const getBackgroundColor = () => {
    if (!device.power) {
      return "rgba(200, 200, 200, 0.8)";
    }
    return currentMood
      ? blendWithWhite(currentMood.color, 0.9)
      : "rgb(255, 255, 255)";
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

