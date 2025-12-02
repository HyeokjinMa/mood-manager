// ======================================================
// File: src/app/(main)/home/components/Device/DeviceCardSmall.tsx
// ======================================================

/*
  [DeviceCardSmall 역할 정리]

  - 2×N 그리드에서 기본적으로 보이는 작은 디바이스 카드
  - icon + battery icon + name + 상태 설명문 표시
  - 클릭 시 onClick 호출 → DeviceGrid에서 expandedId 설정
  - 전원이 꺼져 있으면 회색/반투명 UI 적용
  - 카드 높이 통일 (h-[100px])
*/

"use client";

import { Device } from "@/types/device";
import { type Mood } from "@/types/mood";
import { FaBatteryFull, FaBatteryHalf, FaBatteryEmpty, FaPalette, FaLightbulb, FaSprayCan, FaVolumeUp, FaCog } from "react-icons/fa";
import { ReactNode } from "react";
import { blendWithWhite } from "@/lib/utils";

export default function DeviceCardSmall({
  device,
  currentMood,
  onClick,
}: {
  device: Device;
  currentMood?: Mood;
  onClick: () => void;
}) {
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

  return (
    <div
      onClick={onClick}
      className={`h-[100px] p-3 rounded-xl shadow-sm border cursor-pointer transition-all duration-300 flex flex-col backdrop-blur-sm hover:shadow-md hover:scale-[1.02] ${
        device.type === "manager" ? "justify-between" : "justify-start gap-2"
      }
        ${device.power ? "" : "opacity-60"}
      `}
      style={{
        backgroundColor: device.power
          ? `${backgroundColor}CC` // 80% 투명도 (CC = 204/255)
          : "rgba(200, 200, 200, 0.8)",
      }}
      key={`device-small-${device.id}-${device.power}`} // 전원 상태 변경 시 리렌더링 강제
    >
      {/* 상단: 아이콘 - 이름 - 배터리 일렬 배치 */}
      <div className="flex items-center gap-2">
        <div className="text-base">{getIcon(device.type)}</div>
        <div className="text-xs font-medium flex-1 truncate">{device.name}</div>
        <div className="text-sm">{getBatteryIcon(device.battery, device.power)}</div>
      </div>

      {/* 하단: 상태 설명문 */}
      <div className="text-xs text-gray-600">{getStatusDescription(device)}</div>
    </div>
  );
}

function getIcon(type: Device["type"]) {
  if (type === "manager") return <FaPalette className="text-purple-500" />;
  if (type === "light") return <FaLightbulb className="text-yellow-500" />;
  if (type === "scent") return <FaSprayCan className="text-green-500" />;
  if (type === "speaker") return <FaVolumeUp className="text-blue-500" />;
  return <FaCog className="text-gray-500" />;
}

function getBatteryIcon(battery: number, power: boolean) {
  if (!power) {
    return <FaBatteryFull className="text-gray-400" />;
  }
  if (battery >= 70) return <FaBatteryFull className="text-green-500" />;
  if (battery >= 30) return <FaBatteryHalf className="text-yellow-500" />;
  return <FaBatteryEmpty className="text-red-500" />;
}

function getStatusDescription(device: Device): ReactNode {
  if (!device.power) {
    return "Power Off";
  }

  switch (device.type) {
    case "manager":
      const lightStatus = device.output.brightness
        ? `Light: ${device.output.brightness}%`
        : "Light: -";
      const scentStatus = device.output.scentType
        ? `Scent: ${device.output.scentType}`
        : "Scent: -";
      const musicStatus = device.output.nowPlaying
        ? `Music: ${device.output.nowPlaying}`
        : "Music: -";
      return (
        <div className="flex flex-col gap-0.5">
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
