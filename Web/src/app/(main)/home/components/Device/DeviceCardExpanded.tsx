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

import { useState, useEffect, useRef } from "react";
import { Device } from "@/types/device";
import { type Mood } from "@/types/mood";
import { Power } from "lucide-react";
import { useDeviceCard } from "./hooks/useDeviceCard";
import DeviceNameEditor from "./components/DeviceNameEditor";
import DeviceControls from "./components/DeviceControls";
import { getDeviceIcon, getDeviceStatusDescription } from "./utils/deviceUtils";
import type { MoodStreamSegment } from "@/hooks/useMoodStream/types";
import { hexToRgb } from "@/lib/utils/color";
import { blendWithWhite, reduceWhiteTint } from "@/lib/utils";

export default function DeviceCardExpanded({
  device,
  currentMood,
  onClose,
  onDelete,
  onTogglePower,
  onUpdateName,
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
  volume?: number; // 0-100 범위
  onUpdateVolume?: (volume: number) => void; // 0-100 범위
  onDeviceUpdate?: (updatedDevice: Device) => void; // 디바이스 업데이트 콜백
  onDeviceControlChange?: (changes: { color?: string; brightness?: number; scentLevel?: number; volume?: number }) => void; // 디바이스 컨트롤 변경 콜백
  onUpdateCurrentSegment?: (updates: Partial<MoodStreamSegment>) => void; // 현재 세그먼트 업데이트 콜백
  currentSegment?: MoodStreamSegment | null; // 현재 세그먼트 데이터
}) {
  const {
    lightColor: hookLightColor,
    lightBrightness,
    scentLevel,
    backgroundColor: baseBackgroundColor,
  } = useDeviceCard({ device, currentMood });
  
  // device.output.color 또는 currentMood.color 우선 사용
  const lightColor = device.output.color || currentMood?.color || hookLightColor;

  // 로컬 상태 초기값: device.output에서 직접 가져오거나 기본값 사용
  const [localLightColor, setLocalLightColor] = useState(() => 
    device.output.color || currentMood?.color || hookLightColor
  );
  const [localLightBrightness, setLocalLightBrightness] = useState(() => 
    device.output.brightness ?? 50
  );
  const [localScentLevel, setLocalScentLevel] = useState(() => 
    device.output.scentLevel ?? 5
  );
  const [localVolume, setLocalVolume] = useState(() => 
    volume ?? device.output.volume ?? 70
  );

  // 배경색은 localLightColor가 있으면 우선 사용, 없으면 baseBackgroundColor 사용
  // 컬러피커로 색을 변경했을 때 즉시 반영되도록
  const getBackgroundColor = () => {
    if (!device.power) {
      return "rgba(200, 200, 200, 0.8)";
    }
    // localLightColor가 변경되었으면 우선 사용 (컬러피커 변경 즉시 반영)
    if (localLightColor && localLightColor !== (device.output.color || currentMood?.color)) {
      const adjustedColor = reduceWhiteTint(localLightColor);
      return blendWithWhite(adjustedColor, 0.9);
    }
    // 기본값은 baseBackgroundColor 사용
    return baseBackgroundColor;
  };
  
  const backgroundColor = getBackgroundColor();

  // 디바이스 output 변경 시 로컬 상태 동기화 (사용자가 변경 중이 아닐 때만)
  const isUserChangingRef = useRef({ brightness: false, scent: false, volume: false });
  
  useEffect(() => {
    if (!isUserChangingRef.current.brightness && device.output.brightness !== undefined) {
      const newBrightness = device.output.brightness;
      if (newBrightness !== localLightBrightness) {
        setLocalLightBrightness(newBrightness);
      }
    }
  }, [device.output.brightness, localLightBrightness]);
  
  useEffect(() => {
    if (!isUserChangingRef.current.scent && device.output.scentLevel !== undefined) {
      const newScentLevel = device.output.scentLevel;
      if (newScentLevel !== localScentLevel) {
        setLocalScentLevel(newScentLevel);
      }
    }
  }, [device.output.scentLevel, localScentLevel]);
  
  useEffect(() => {
    // 사용자가 변경 중이 아닐 때만 props 동기화
    if (isUserChangingRef.current.volume) {
      return; // ✅ 사용자 변경 중에는 props 무시
    }
    
    const newVolume = volume ?? device.output.volume ?? 70;
    // ✅ Phase 2-3: 차이가 3% 이상일 때만 업데이트 (진동 방지)
    if (Math.abs(newVolume - localVolume) > 3) {
      setLocalVolume(newVolume);
    }
  }, [volume, device.output.volume]); // ✅ localVolume을 의존성에서 제거하여 무한 루프 방지
  
  useEffect(() => {
    const effectiveColor = device.output.color || currentMood?.color || lightColor;
    if (effectiveColor !== localLightColor) {
      setLocalLightColor(effectiveColor);
    }
  }, [device.output.color, currentMood?.color, lightColor, localLightColor]);

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
      className={`p-3.5 rounded-xl shadow-md border-2 relative animate-expand cursor-pointer transition-all duration-300 min-h-[180px] backdrop-blur-sm hover:shadow-lg
        ${device.power ? "" : "opacity-60"}
      `}
      style={{
        backgroundColor: device.power
          ? `${backgroundColor}CC` // 80% 투명도 (CC = 204/255)
          : "rgba(200, 200, 200, 0.8)",
        borderColor: localLightColor || currentMood?.color || "#E6F3FF", // 로컬 컬러로 테두리 색상 연동
      }}
      key={`device-${device.id}-${device.power}`} // 전원 상태 변경 시 리렌더링
      onClick={(e) => {
        // 컬러 피커나 컨트롤 영역 클릭 시에는 닫히지 않음
        const target = e.target as HTMLElement;
        // 컬러 피커의 팝업 창이 열려있을 때는 카드가 닫히지 않도록
        if (
          target.closest('input[type="color"]') || 
          target.closest('input[type="range"]') || 
          target.closest('.space-y-2') ||
          target.closest('label') ||
          // 컬러 피커 팝업이 열려있는지 확인 (브라우저 기본 컬러 피커)
          (document.activeElement?.tagName === 'INPUT' && (document.activeElement as HTMLInputElement).type === 'color')
        ) {
          return;
        }
        onClose();
      }}
      onMouseDown={(e) => {
        // 컬러 피커가 포커스되어 있을 때는 카드가 닫히지 않도록
        const target = e.target as HTMLElement;
        if (
          target.closest('input[type="color"]') || 
          target.closest('input[type="range"]') || 
          target.closest('.space-y-2') ||
          target.closest('label')
        ) {
          e.preventDefault(); // mousedown 이벤트 전파 방지
        }
      }}
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
            setLocalLightColor(color); // 즉시 로컬 상태 업데이트
            
            // RGB 변경 시 즉시 onDeviceControlChange 호출하여 home으로 전달
            // route.ts 업데이트는 home에서 handleDeviceControlChange를 통해 처리됨
            if (onDeviceControlChange) {
              onDeviceControlChange({ color });
            }
            // 무드대시보드 색상 즉각 반영을 위해 세그먼트도 즉시 업데이트
            if (onUpdateCurrentSegment && currentSegment?.mood) {
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
            console.log("[DeviceCardExpanded] onUpdateLightBrightness 호출:", {
              oldLocalBrightness: localLightBrightness,
              newBrightness: brightness
            });
            isUserChangingRef.current.brightness = true;
            setLocalLightBrightness(brightness);
            console.log("[DeviceCardExpanded] setLocalLightBrightness 호출됨");
            if (onDeviceControlChange) {
              onDeviceControlChange({ brightness });
            }
            setTimeout(() => {
              isUserChangingRef.current.brightness = false;
            }, 500);
          }}
          onUpdateScentLevel={(level) => {
            console.log("[DeviceCardExpanded] onUpdateScentLevel 호출:", {
              oldLocalScentLevel: localScentLevel,
              newLevel: level
            });
            isUserChangingRef.current.scent = true;
            setLocalScentLevel(level);
            console.log("[DeviceCardExpanded] setLocalScentLevel 호출됨");
            if (onDeviceControlChange) {
              onDeviceControlChange({ scentLevel: level });
            }
            setTimeout(() => {
              isUserChangingRef.current.scent = false;
            }, 500);
          }}
          onUpdateVolume={(newVolume) => {
            console.log("[DeviceCardExpanded] onUpdateVolume 호출:", {
              oldLocalVolume: localVolume,
              newVolume: newVolume
            });
            isUserChangingRef.current.volume = true;
            setLocalVolume(newVolume);
            console.log("[DeviceCardExpanded] setLocalVolume 호출됨");
            if (onUpdateVolume) {
              onUpdateVolume(newVolume);
            }
            if (onDeviceControlChange) {
              onDeviceControlChange({ volume: newVolume });
            }
            setTimeout(() => {
              isUserChangingRef.current.volume = false;
            }, 500);
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
