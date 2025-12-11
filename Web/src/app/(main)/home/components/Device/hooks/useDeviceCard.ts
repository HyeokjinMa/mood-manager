// ======================================================
// File: src/app/(main)/home/components/Device/hooks/useDeviceCard.ts
// ======================================================

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
  const effectiveColor = device.output.color || currentMood?.color || "#FFD700";
  
  return {
    lightColor: effectiveColor,
    setLightColor: () => {}, // 사용하지 않음
    lightBrightness: device.output.brightness ?? 50,
    setLightBrightness: () => {}, // 사용하지 않음
    scentLevel: device.output.scentLevel ?? 5,
    setScentLevel: () => {}, // 사용하지 않음

    backgroundColor: (() => {
      if (!device.power) {
        return "rgba(200, 200, 200, 0.8)";
      }
      const colorToUse = device.output.color || currentMood?.color;
      if (colorToUse) {
        const adjustedColor = reduceWhiteTint(colorToUse);
        return blendWithWhite(adjustedColor, 0.9);
      }
      return "rgb(255, 255, 255)";
    })(),
  };
}

