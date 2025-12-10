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

import { useState, useEffect } from "react";
import { Device } from "@/types/device";
import { type Mood } from "@/types/mood";
import { Power } from "lucide-react";
import { useDeviceCard } from "./hooks/useDeviceCard";
import DeviceNameEditor from "./components/DeviceNameEditor";
import DeviceControls from "./components/DeviceControls";
import { getDeviceIcon, getDeviceStatusDescription } from "./utils/deviceUtils";
import type { MoodStreamSegment } from "@/hooks/useMoodStream/types";

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
  volume,
  onUpdateVolume,
  onDeviceUpdate,
  onDeviceControlChange,
  onUpdateCurrentSegment,
  currentSegment,
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
  volume?: number; // 0-100 범위
  onUpdateVolume?: (volume: number) => void; // 0-100 범위
  onDeviceUpdate?: (updatedDevice: Device) => void; // 디바이스 업데이트 콜백
  onDeviceControlChange?: (changes: { color?: string; brightness?: number; scentLevel?: number; volume?: number }) => void; // 디바이스 컨트롤 변경 콜백
  onUpdateCurrentSegment?: (updates: Partial<MoodStreamSegment>) => void; // 현재 세그먼트 업데이트 콜백
  currentSegment?: MoodStreamSegment | null; // 현재 세그먼트 데이터
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

  // 로컬 상태로 변경사항 추적 (저장 전까지는 반영하지 않음)
  const [localLightColor, setLocalLightColor] = useState(lightColor);
  const [localLightBrightness, setLocalLightBrightness] = useState(lightBrightness);
  const [localScentLevel, setLocalScentLevel] = useState(scentLevel);
  const [localVolume, setLocalVolume] = useState(volume ?? device.output.volume ?? 70);

  // 디바이스 변경 시 로컬 상태 동기화 (세그먼트 이동 시 즉시 반영)
  useEffect(() => {
    setLocalLightColor(lightColor);
    setLocalLightBrightness(lightBrightness);
    setLocalScentLevel(scentLevel);
    setLocalVolume(volume ?? device.output.volume ?? 70);
  }, [lightColor, lightBrightness, scentLevel, volume, device.output.volume, currentMood?.color, currentSegment?.mood?.color]);

  // 즉시 저장 함수 (변경 시 자동 저장, 디바운스 적용)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const updateData: {
        color?: string;
        brightness?: number;
        scentLevel?: number;
        volume?: number;
      } = {};

      if (device.type === "light" || device.type === "manager") {
        updateData.color = localLightColor;
        updateData.brightness = localLightBrightness;
      }
      if (device.type === "scent" || device.type === "manager") {
        updateData.scentLevel = localScentLevel;
      }
      if (device.type === "speaker" || device.type === "manager") {
        updateData.volume = localVolume;
      }

      // 로컬 상태와 실제 디바이스 상태가 다를 때만 저장
      const hasChanges = 
        ((device.type === "light" || device.type === "manager") &&
        (localLightColor !== lightColor || localLightBrightness !== lightBrightness)) ||
        ((device.type === "scent" || device.type === "manager") &&
        localScentLevel !== scentLevel) ||
        ((device.type === "speaker" || device.type === "manager") &&
        localVolume !== (volume ?? device.output.volume ?? 70));

      if (hasChanges) {
        fetch(`/api/devices/${device.id}/update`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updateData),
        })
          .then((response) => {
            if (!response.ok) {
              throw new Error("Failed to save device settings");
            }
            return response.json();
          })
          .then((result) => {
            if (result.device && onDeviceUpdate) {
              onDeviceUpdate(result.device);
            }
          })
          .catch((error) => {
            console.error("Failed to save device settings:", error);
          });
      }
    }, 1000); // 1초 디바운스

    return () => clearTimeout(timeoutId);
  }, [localLightColor, localLightBrightness, localScentLevel, localVolume, lightColor, lightBrightness, scentLevel, volume, device.output.volume, device.type, device.id, onDeviceUpdate]);


  return (
    <div
      className={`p-4 rounded-xl shadow-md border-2 relative animate-expand cursor-pointer transition-all duration-300 min-h-[200px] backdrop-blur-sm hover:shadow-lg
        ${device.power ? "" : "opacity-60"}
      `}
      style={{
        backgroundColor: device.power
          ? `${backgroundColor}CC` // 80% 투명도 (CC = 204/255)
          : "rgba(200, 200, 200, 0.8)",
        borderColor: localLightColor || currentMood?.color || "#E6F3FF", // 로컬 컬러로 테두리 색상 연동
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
              ? localLightColor || currentMood?.color || "#10b981" // 로컬 컬러 우선 사용 (라이트 컬러와 연동)
              : "rgba(156, 163, 175, 1)", // 회색 (꺼짐)
          }}
          title={device.power ? "Power On" : "Power Off"}
        >
          <Power size={24} />
        </button>
      </div>

      {/* 타입별 컨트롤 */}
      <div className="mt-4 space-y-3 pb-12">
        <DeviceControls
          device={device}
          currentMood={currentMood}
          lightColor={localLightColor}
          lightBrightness={localLightBrightness}
          scentLevel={localScentLevel}
          volume={localVolume}
          onUpdateLightColor={device.type === "light" || device.type === "manager" ? (color) => {
            setLocalLightColor(color);
            // RGB 변경 시 즉시 onDeviceControlChange 호출하여 currentMood 업데이트
            if (onDeviceControlChange) {
              onDeviceControlChange({ color });
            }
            // 무드대시보드 색상 즉각 반영을 위해 세그먼트도 즉시 업데이트
            if (onUpdateCurrentSegment && currentSegment?.mood) {
              const hexToRgb = (hex: string): number[] => {
                const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
                return result ? [
                  parseInt(result[1], 16),
                  parseInt(result[2], 16),
                  parseInt(result[3], 16)
                ] : [0, 0, 0];
              };
              onUpdateCurrentSegment({
                mood: {
                  ...currentSegment.mood,
                  color: color,
                  lighting: {
                    ...(currentSegment.mood.lighting || {}),
                    color: color,
                    rgb: hexToRgb(color),
                  },
                },
              } as unknown as Partial<MoodStreamSegment>);
            }
          } : undefined}
          onUpdateLightBrightness={(brightness) => {
            setLocalLightBrightness(brightness);
          }}
          onUpdateScentLevel={(level) => {
            setLocalScentLevel(level);
          }}
          onUpdateVolume={(newVolume) => {
            setLocalVolume(newVolume);
            // 볼륨 즉각 반영
            if (onUpdateVolume) {
              onUpdateVolume(newVolume);
            }
            // currentMood에도 즉시 반영
            if (onDeviceControlChange) {
              onDeviceControlChange({ volume: newVolume });
            }
          }}
        />
      </div>

      {/* 타입별 상태 설명 (컨트롤이 있는 경우 표시하지 않음) */}
      {!device.power && (
        <div className="mt-4 pb-12 text-sm text-gray-600 leading-relaxed">
          {getDeviceStatusDescription(device)}
        </div>
      )}

      {/* 하단 버튼 영역: Delete만 표시 (Save 버튼 제거 - 즉시 반영) */}
      <div className="absolute bottom-4 left-4 right-4 flex justify-end items-center">
        <button
          onClick={(e) => {
            e.stopPropagation(); // 부모 클릭(onClose) 방지
            onDelete();
          }}
          className="text-red-500 text-sm underline cursor-pointer hover:text-red-700"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
