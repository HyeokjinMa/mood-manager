// ======================================================
// File: src/app/(main)/home/components/Device/utils/deviceUtils.tsx
// ======================================================

"use client";

import { ReactNode } from "react";
import { FaPalette, FaLightbulb, FaSprayCan, FaVolumeUp, FaCog } from "react-icons/fa";
import type { Device } from "@/types/device";

/**
 * 디바이스 타입별 아이콘 반환
 */
export function getDeviceIcon(type: Device["type"]) {
  if (type === "manager") return <FaPalette className="text-purple-500 text-3xl" />;
  if (type === "light") return <FaLightbulb className="text-yellow-500 text-3xl" />;
  if (type === "scent") return <FaSprayCan className="text-green-500 text-3xl" />;
  if (type === "speaker") return <FaVolumeUp className="text-blue-500 text-3xl" />;
  return <FaCog className="text-gray-500 text-3xl" />;
}

/**
 * 디바이스 타입별 상태 설명 반환
 */
export function getDeviceStatusDescription(device: Device): ReactNode {
  if (!device.power) {
    return "Power is turned off.";
  }

  switch (device.type) {
    case "manager":
      const lightStatus = device.output.brightness
        ? `Light Status: ${device.output.brightness}%`
        : "Light Status: -";
      const scentStatus = device.output.scentType
        ? `Scent Status: ${device.output.scentType} (Level ${device.output.scentLevel || 0})`
        : "Scent Status: -";
      const musicStatus = device.output.nowPlaying
        ? `Music Status: ${device.output.nowPlaying}`
        : "Music Status: -";
      return (
        <div className="flex flex-col gap-1">
          <div>{lightStatus}</div>
          <div>{scentStatus}</div>
          <div>{musicStatus}</div>
        </div>
      );
    case "light":
      return device.output.brightness
        ? `Light Status: ${device.output.brightness}%`
        : "Light Status: -";
    case "scent":
      return device.output.scentType
        ? `Scent Status: ${device.output.scentType} (Level ${device.output.scentLevel || 0})`
        : "Scent Status: -";
    case "speaker":
      return device.output.nowPlaying
        ? `Music Status: ${device.output.nowPlaying}`
        : "Music Status: -";
    default:
      return "";
  }
}

