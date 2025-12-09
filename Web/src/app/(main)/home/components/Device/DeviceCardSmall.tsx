/**
 * DeviceCardSmall
 * 
 * 2×N 그리드에서 기본적으로 보이는 작은 디바이스 카드
 * icon + battery icon + name + 상태 설명문 표시
 * 클릭 시 onClick 호출 → DeviceGrid에서 expandedId 설정
 * 전원이 꺼져 있으면 회색/반투명 UI 적용
 * 카드 높이 통일 (h-[100px])
 */

"use client";

import { Device } from "@/types/device";
import { type Mood } from "@/types/mood";
import {
  FaBatteryFull,
  FaBatteryHalf,
  FaBatteryEmpty,
  FaPalette,
  FaCog,
  FaLightbulb,
  FaSprayCan,
  FaVolumeUp,
} from "react-icons/fa";
import {
  HiOutlineMusicalNote,
  HiOutlineAdjustmentsHorizontal,
  HiOutlineSun,
  HiOutlineBeaker,
} from "react-icons/hi2";
import { ReactNode } from "react";
import { blendWithWhite, reduceWhiteTint } from "@/lib/utils";

export default function DeviceCardSmall({
  device,
  currentMood,
  onClick,
  isLoading = false,
}: {
  device: Device;
  currentMood?: Mood;
  onClick: () => void;
  isLoading?: boolean;
}) {
  /**
   * 무드 컬러를 흰색에 가깝게 블렌딩 (90% 흰색 + 10% 무드 컬러)
   * 전원이 켜져 있을 때만 무드 컬러 사용, 꺼져 있으면 회색
   */
  const getBackgroundColor = () => {
    if (!device.power) {
      return "rgba(200, 200, 200, 0.8)";
    }
    if (currentMood) {
      // 흰색 과다 처리 후 블렌딩
      const adjustedColor = reduceWhiteTint(currentMood.color);
      return blendWithWhite(adjustedColor, 0.9);
    }
    return "rgb(255, 255, 255)";
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
      <div className="flex items-center gap-2">
        <div className="text-base">{getIcon(device.type)}</div>
        <div className="text-xs font-medium flex-1 truncate">{device.name}</div>
        <div className="text-sm">{getBatteryIcon(device.battery, device.power)}</div>
      </div>

      <div className="text-[10px] text-gray-600">{getStatusDescription(device, isLoading, currentMood)}</div>
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
  if (battery >= 70) return <FaBatteryFull className="text-emerald-500" />;
  if (battery >= 30) return <FaBatteryHalf className="text-amber-500" />;
  return <FaBatteryEmpty className="text-red-500" />;
}

function getStatusDescription(device: Device, isLoading: boolean, currentMood?: Mood): ReactNode {
  if (!device.power) {
    return (
      <div className="flex items-center gap-1 text-gray-500">
        <HiOutlineAdjustmentsHorizontal className="text-[11px]" />
        <span>Off</span>
      </div>
    );
  }

  // 로딩 중이지만 currentMood가 있으면 정보 표시 (초기 세그먼트 정보 활용)
  // 로딩 중이고 currentMood도 없으면 스켈레톤 표시
  if (isLoading && !currentMood) {
    return (
      <div className="flex items-center gap-1 text-gray-400">
        <span className="animate-pulse">...</span>
      </div>
    );
  }

  switch (device.type) {
    case "manager":
      return (
        <div className="flex flex-col gap-0.5">
          {/* Light Status */}
          <div className="flex items-center gap-1">
            <HiOutlineSun className="text-[11px]" />
            <span className="truncate">
              {device.output.brightness 
                ? `${device.output.brightness}%` 
                : "50%"}
            </span>
          </div>
          {/* Scent Status */}
          <div className="flex items-center gap-1">
            <HiOutlineBeaker className="text-[11px]" />
            <span className="truncate">
              {device.output.scentType || currentMood?.scent.name || "Lavender"}
            </span>
          </div>
          {/* Music Status */}
          <div className="flex items-center gap-1">
            <HiOutlineMusicalNote className="text-[11px]" />
            <span className="truncate">
              {device.output.nowPlaying || currentMood?.song.title || "Unknown Song"}
            </span>
          </div>
        </div>
      );
    case "light":
      return (
        <div className="flex items-center gap-1">
          <HiOutlineSun className="text-[11px]" />
          <span>
            {device.output.brightness 
              ? `${device.output.brightness}%` 
              : "50%"}
          </span>
        </div>
      );
    case "scent":
      return (
        <div className="flex items-center gap-1">
          <HiOutlineBeaker className="text-[11px]" />
          <span className="truncate">
            {device.output.scentType 
              ? `${device.output.scentType} ${device.output.scentLevel ? `Lv${device.output.scentLevel}` : ""}`.trim()
              : `${currentMood?.scent.name || "Lavender"} ${device.output.scentLevel ? `Lv${device.output.scentLevel}` : "Lv5"}`.trim()}
          </span>
        </div>
      );
    case "speaker":
      return (
        <div className="flex items-center gap-1">
          <HiOutlineMusicalNote className="text-[11px]" />
          <span className="truncate">
            {device.output.nowPlaying || currentMood?.song.title || "Unknown Song"}
          </span>
        </div>
      );
    default:
      return "";
  }
}
