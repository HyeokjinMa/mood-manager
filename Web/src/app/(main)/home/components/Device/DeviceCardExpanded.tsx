// ======================================================
// File: src/app/(main)/home/components/Device/DeviceCardExpanded.tsx
// ======================================================

/*
  [DeviceCardExpanded 역할 정리]

  - 확장된 디바이스 카드 (col-span-2)
  - smallCard 클릭 → expanded 형태로 변경
  - 카드 전체를 클릭하면 다시 접힘(onClose)
  - 이름 변경 기능 (인라인 편집)
  - Power On/Off 버튼 클릭 시 전원 토글 (onTogglePower) - 전원 아이콘 사용
  - 오른쪽 아래 "Delete" 버튼 클릭 시 디바이스 삭제(onDelete)
  - 디바이스 타입에 따라 상태 설명문 다르게 표시
  - 디바이스 타입별 컨트롤 기능:
    - 조명: RGB 컬러 피커 + 밝기 슬라이더
    - 향: 분사량 슬라이더 (1-10)
    - 음악: 현재 노래 → 다음 노래 표기만 (대시보드에서 통제)
    - Manager: 모든 기능 통합 표시
*/

"use client";

import { Device } from "@/types/device";
import { type Mood } from "@/types/mood";
import { Power } from "lucide-react";
import { useDeviceCard } from "./hooks/useDeviceCard";
import DeviceNameEditor from "./components/DeviceNameEditor";
import DeviceControls from "./components/DeviceControls";
import { getDeviceIcon, getDeviceStatusDescription } from "./utils/deviceUtils";

export default function DeviceCardExpanded({
  device,
  currentMood,
  onClose,
  onDelete,
  onTogglePower,
  onUpdateName,
  onUpdateLightColor,
  onUpdateLightBrightness,
  onUpdateScentLevel,
}: {
  device: Device;
  currentMood?: Mood;
  onClose: () => void;
  onDelete: () => void;
  onTogglePower: () => void;
  onUpdateName: (name: string) => void;
  onUpdateLightColor?: (color: string) => void;
  onUpdateLightBrightness?: (brightness: number) => void;
  onUpdateScentLevel?: (level: number) => void;
}) {
  const {
    lightColor,
    setLightColor,
    lightBrightness,
    setLightBrightness,
    scentLevel,
    setScentLevel,
    backgroundColor,
  } = useDeviceCard({ device, currentMood });

  return (
    <div
      className={`p-4 rounded-xl shadow-md border relative animate-expand cursor-pointer transition-all min-h-[200px] backdrop-blur-sm
        ${device.power ? "" : "opacity-60"}
      `}
      style={{
        backgroundColor: device.power
          ? `${backgroundColor}CC` // 80% 투명도 (CC = 204/255)
          : "rgba(200, 200, 200, 0.8)",
      }}
      key={`device-${device.id}-${device.power}`} // 전원 상태 변경 시 리렌더링 강제
      onClick={onClose}
    >
      {/* 상단: 아이콘 + 이름 + 배터리 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="text-3xl">{getDeviceIcon(device.type)}</div>
          <DeviceNameEditor name={device.name} onUpdate={onUpdateName} />
        </div>

        <div className="text-sm font-medium">{device.battery}%</div>
      </div>

      {/* 전원 버튼 - 아이콘 사용 */}
      <div className="flex justify-center mt-4">
        <button
          onClick={(e) => {
            e.stopPropagation(); // 부모 클릭(onClose) 방지
            onTogglePower();
          }}
          className="p-3 rounded-full transition-all text-white hover:opacity-80"
          style={{
            backgroundColor: device.power
              ? currentMood?.color || "#10b981" // 무드 컬러 사용
              : "rgba(156, 163, 175, 1)", // 회색 (꺼짐)
          }}
          title={device.power ? "Power On" : "Power Off"}
        >
          <Power size={24} />
        </button>
      </div>

      {/* 타입별 컨트롤 */}
      <div className="mt-4 space-y-3">
        <DeviceControls
          device={device}
          currentMood={currentMood}
          lightColor={lightColor}
          lightBrightness={lightBrightness}
          scentLevel={scentLevel}
          onUpdateLightColor={device.type === "light" ? undefined : (color) => {
            setLightColor(color);
            onUpdateLightColor?.(color);
          }}
          onUpdateLightBrightness={(brightness) => {
            setLightBrightness(brightness);
            onUpdateLightBrightness?.(brightness);
          }}
          onUpdateScentLevel={(level) => {
            setScentLevel(level);
            onUpdateScentLevel?.(level);
          }}
        />
      </div>

      {/* 타입별 상태 설명 */}
      <div className="mt-4 pb-8 text-sm text-gray-600 leading-relaxed">
        {getDeviceStatusDescription(device)}
      </div>

      {/* Delete 버튼 */}
      <div
        onClick={(e) => {
          e.stopPropagation(); // 부모 클릭(onClose) 방지
          onDelete();
        }}
        className="absolute bottom-4 right-4 text-red-500 text-sm underline cursor-pointer hover:text-red-700"
      >
        Delete
      </div>
    </div>
  );
}
