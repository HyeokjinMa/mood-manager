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
      // Manager는 컨트롤에서 모든 정보를 표시하므로 상태 설명은 간단하게
      return "All device controls are available above.";
    case "light":
      // Light는 밝기 조정 슬라이더가 있으므로 상태 설명 불필요
      return "";
    case "scent":
      // Scent는 레벨 조정 슬라이더가 있으므로 상태 설명 불필요
      return "";
    case "speaker":
      // Speaker는 음량 조정 슬라이더가 있으므로 상태 설명 불필요
      return "";
    default:
      return "";
  }
}

