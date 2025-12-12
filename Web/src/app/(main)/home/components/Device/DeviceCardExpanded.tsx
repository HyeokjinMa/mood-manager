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
  onDeviceControlChange,
  onUpdateCurrentSegment,
  currentSegment,
  volumeIsUserChangingRef,
}: {
  device: Device;
  currentMood?: Mood;
  onClose: () => void;
  onDelete: () => void;
  onTogglePower: () => void;
  onUpdateName: (name: string) => void;
  volume?: number; // 0-100 범위
  onUpdateVolume?: (volume: number) => void; // 0-100 범위
  // ✅ Phase 1-4: onDeviceUpdate 제거 - Home에서 중앙 관리하므로 불필요
  onDeviceControlChange?: (changes: { color?: string; brightness?: number; scentLevel?: number; volume?: number; deviceId?: string }) => void; // 디바이스 컨트롤 변경 콜백
  onUpdateCurrentSegment?: (updates: Partial<MoodStreamSegment>) => void; // 현재 세그먼트 업데이트 콜백
  currentSegment?: MoodStreamSegment | null; // 현재 세그먼트 데이터
  // ✅ Fix: 볼륨 조작 추적 ref 전달
  volumeIsUserChangingRef?: React.MutableRefObject<boolean>;
}) {
  const {
    lightColor: hookLightColor,
    backgroundColor: baseBackgroundColor,
  } = useDeviceCard({ device, currentMood });
  
  // device.output.color 또는 currentMood.color 우선 사용
  const lightColor = device.output.color || currentMood?.color || hookLightColor;

  // 로컬 상태 초기값: device.output에서 직접 가져오거나 기본값 사용
  const [localLightColor, setLocalLightColor] = useState(() => 
    device.output.color || currentMood?.color || hookLightColor
  );
  
  // ✅ Phase 1: 슬라이더 즉시 UI 반영을 위한 로컬 state 재도입
  // useEffect 동기화 문제 최소화를 위해 사용자 변경 추적 ref 추가
  const isUserChangingRef = useRef({ brightness: false, scent: false, volume: false });
  
  // ✅ Fix: 스몰↔익스펜디드 전환 시 값 초기화 방지 - device.output 변경 시 초기값도 동기화
  const [localBrightness, setLocalBrightness] = useState(() => 
    device.output.brightness ?? 50
  );
  const [localScentLevel, setLocalScentLevel] = useState(() => 
    device.output.scentLevel ?? 5
  );
  
  // ✅ Fix: 드래그 종료 시 API 호출을 위한 최종 값 저장 ref
  const pendingBrightnessRef = useRef<number | null>(null);
  const pendingScentLevelRef = useRef<number | null>(null);
  const pendingVolumeRef = useRef<number | null>(null);
  
  // ✅ Fix: device.id 변경 시 (컴포넌트 리마운트 방지) 로컬 state를 device.output과 동기화
  const prevDeviceIdRef = useRef(device.id);
  useEffect(() => {
    if (prevDeviceIdRef.current !== device.id) {
      // 다른 디바이스로 전환된 경우 초기화
      prevDeviceIdRef.current = device.id;
      setLocalBrightness(device.output.brightness ?? 50);
      setLocalScentLevel(device.output.scentLevel ?? 5);
    }
  }, [device.id, device.output.brightness, device.output.scentLevel]);

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

  // ✅ Phase 1: useEffect 동기화 최적화 - 사용자 변경 중이 아닐 때만 동기화
  useEffect(() => {
    const effectiveColor = device.output.color || currentMood?.color || lightColor;
    if (effectiveColor !== localLightColor) {
      setLocalLightColor(effectiveColor);
    }
  }, [device.output.color, currentMood?.color, lightColor, localLightColor]);
  
  // ✅ Fix: brightness 동기화 - 드래그 중이 아닐 때만 전역 상태와 동기화
  // 드래그 중에는 로컬 상태를 사용하고, 드래그 종료 후 전역 상태로 동기화
  const prevBrightnessRef = useRef(device.output.brightness);
  useEffect(() => {
    // 사용자 조작 중이 아닐 때만 전역 상태(device.output.brightness)로 동기화
    if (!isUserChangingRef.current.brightness && device.output.brightness !== undefined) {
      // 이전 값과 실제로 다를 때만 업데이트 (불필요한 리렌더링 방지)
      if (prevBrightnessRef.current !== device.output.brightness) {
        prevBrightnessRef.current = device.output.brightness;
        setLocalBrightness(device.output.brightness);
      }
    }
  }, [device.output.brightness]);
  
  // ✅ Fix: scentLevel 동기화 - 드래그 중이 아닐 때만 전역 상태와 동기화
  // 드래그 중에는 로컬 상태를 사용하고, 드래그 종료 후 전역 상태로 동기화
  const prevScentLevelRef = useRef(device.output.scentLevel);
  useEffect(() => {
    // 사용자 조작 중이 아닐 때만 전역 상태(device.output.scentLevel)로 동기화
    if (!isUserChangingRef.current.scent && device.output.scentLevel !== undefined) {
      // 이전 값과 실제로 다를 때만 업데이트 (불필요한 리렌더링 방지)
      if (prevScentLevelRef.current !== device.output.scentLevel) {
        prevScentLevelRef.current = device.output.scentLevel;
        setLocalScentLevel(device.output.scentLevel);
      }
    }
  }, [device.output.scentLevel]);

  // ✅ Phase 1: API 호출 제거 - Home에서 중앙 관리
  // DeviceCardExpanded는 UI 반응성만 담당 (로컬 state 관리)
  // 모든 API 호출은 Home의 handleDeviceControlChange에서 처리


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
        // 컬러 피커나 슬라이더 영역에서는 카드가 닫히지 않도록 처리
        // 단, preventDefault()는 호출하지 않음 (슬라이더 드래그 동작을 위해)
        const target = e.target as HTMLElement;
        if (
          target.closest('input[type="color"]') || 
          target.closest('input[type="range"]') || 
          target.closest('.space-y-2') ||
          target.closest('label')
        ) {
          // preventDefault() 제거 - 슬라이더 드래그 동작을 막지 않도록
          e.stopPropagation(); // 이벤트 전파만 방지 (기본 동작은 허용)
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
          lightBrightness={isUserChangingRef.current.brightness ? localBrightness : (device.output.brightness ?? localBrightness ?? 50)}
          scentLevel={isUserChangingRef.current.scent ? localScentLevel : (device.output.scentLevel ?? localScentLevel ?? 5)}
          volume={volume ?? device.output.volume ?? 70}
          onUpdateLightColor={device.type === "light" || device.type === "manager" ? (color) => {
            setLocalLightColor(color); // 즉시 로컬 상태 업데이트
            
            // ✅ Phase 1: RGB 변경 시 즉시 onDeviceControlChange 호출하여 home으로 전달
            // route.ts 업데이트 및 DB 저장은 home에서 handleDeviceControlChange를 통해 처리됨
            if (onDeviceControlChange) {
              onDeviceControlChange({ color, deviceId: device.id });
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
            // ✅ 드래그 중: 로컬 상태만 즉시 업데이트 (UI 반응성)
            isUserChangingRef.current.brightness = true;
            setLocalBrightness(brightness);
            
            // 최종 값 저장 (드래그 종료 시 API 호출에 사용)
            pendingBrightnessRef.current = brightness;
          }}
          onBrightnessDragEnd={() => {
            // ✅ 드래그 종료 시: 최종 값으로 API 호출
            if (pendingBrightnessRef.current !== null && onDeviceControlChange) {
              const finalBrightness = pendingBrightnessRef.current;
              console.log(`[DeviceCardExpanded] 🔆 Brightness 드래그 종료 - 최종 값: ${finalBrightness}%`);
              onDeviceControlChange({ brightness: finalBrightness, deviceId: device.id });
              pendingBrightnessRef.current = null;
            }
            // ✅ Fix: 사용자 변경 플래그 리셋은 즉시 처리 (setTimeout 제거)
            isUserChangingRef.current.brightness = false;
          }}
          onUpdateScentLevel={(level) => {
            // ✅ 드래그 중: 로컬 상태만 즉시 업데이트 (UI 반응성)
            isUserChangingRef.current.scent = true;
            setLocalScentLevel(level);
            
            // 최종 값 저장 (드래그 종료 시 API 호출에 사용)
            pendingScentLevelRef.current = level;
          }}
          onScentLevelDragEnd={() => {
            // ✅ 드래그 종료 시: 최종 값으로 API 호출
            if (pendingScentLevelRef.current !== null && onDeviceControlChange) {
              const finalLevel = pendingScentLevelRef.current;
              console.log(`[DeviceCardExpanded] 🌸 Scent Level 드래그 종료 - 최종 값: ${finalLevel}`);
              onDeviceControlChange({ scentLevel: finalLevel, deviceId: device.id });
              pendingScentLevelRef.current = null;
            }
            // ✅ Fix: 사용자 변경 플래그 리셋은 즉시 처리 (setTimeout 제거)
            isUserChangingRef.current.scent = false;
          }}
          onUpdateVolume={(newVolume) => {
            // ✅ Fix: DeviceControls의 onMouseDown에서 이미 volumeIsUserChangingRef.current = true로 설정됨
            // 여기서는 중복 설정하지 않고, pendingVolumeRef만 업데이트
            // 로컬 플래그 (isUserChangingRef.current.volume) 로직 완전히 제거
            
            // 최종 값 저장 (드래그 종료 시 API 호출에 사용)
            pendingVolumeRef.current = newVolume;
          }}
          onVolumeDragEnd={() => {
            // ✅ 드래그 종료 시: 최종 값으로 API 호출 및 HomeContent로 전달
            if (pendingVolumeRef.current !== null) {
              const finalVolume = pendingVolumeRef.current;
              console.log(`[DeviceCardExpanded] 🔊 Volume 드래그 종료 - 최종 값: ${finalVolume}%`);
              
              // HomeContent로 전달 (HomePage의 setVolume 호출)
              if (onUpdateVolume) {
                onUpdateVolume(finalVolume);
              }
              
              // 디바이스 컨트롤 변경도 함께 전달
              if (onDeviceControlChange) {
                onDeviceControlChange({ volume: finalVolume, deviceId: device.id });
              }
              
              pendingVolumeRef.current = null;
            }
            // ✅ Fix: 사용자 변경 플래그 리셋은 즉시 처리
            // DeviceControls의 onMouseUp에서 이미 false로 설정되지만, 보조적으로 여기서도 설정
            if (volumeIsUserChangingRef) {
              volumeIsUserChangingRef.current = false;
            }
            // ✅ Fix: 로컬 플래그 (isUserChangingRef.current.volume) 로직 완전히 제거
          }}
          // ✅ Fix: 볼륨 조작 추적 ref 전달
          volumeIsUserChangingRef={volumeIsUserChangingRef}
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
