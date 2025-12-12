// ======================================================
// File: src/app/(main)/home/components/Device/components/DeviceControls.tsx
// ======================================================

"use client"; // ✅ Fix: 클라이언트 컴포넌트로 지정 (슬라이더 인터랙션을 위해 필수)

import type { Device } from "@/types/device";
import type { Mood } from "@/types/mood";

interface DeviceControlsProps {
  device: Device;
  currentMood?: Mood;
  lightColor: string;
  lightBrightness: number;
  scentLevel: number;
  volume?: number; // 0-100 범위
  onUpdateLightColor?: (color: string) => void;
  onUpdateLightBrightness?: (brightness: number) => void;
  onUpdateScentLevel?: (level: number) => void;
  onUpdateVolume?: (volume: number) => void; // 0-100 범위
  // ✅ 드래그 종료 시점 핸들러 추가
  onBrightnessDragEnd?: () => void;
  onScentLevelDragEnd?: () => void;
  onVolumeDragEnd?: () => void;
  // ✅ Fix: 볼륨 슬라이더 조작 추적 ref (useMusicTrackPlayer의 isUserChangingRef)
  volumeIsUserChangingRef?: React.MutableRefObject<boolean>;
}

export default function DeviceControls({
  device,
  lightColor,
  lightBrightness,
  scentLevel,
  volume,
  onUpdateLightColor,
  onUpdateLightBrightness,
  onUpdateScentLevel,
  onUpdateVolume,
  onBrightnessDragEnd,
  onScentLevelDragEnd,
  onVolumeDragEnd,
  volumeIsUserChangingRef, // ✅ Fix: 볼륨 조작 추적 ref
}: DeviceControlsProps) {
  if (!device.power) return null;

  switch (device.type) {
    case "light":
      return (
        <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
          {/* 컬러 조정 */}
          <div>
            <label className="text-xs text-gray-600 mb-1 block">Light Color</label>
            <input
              type="color"
              value={lightColor}
              onChange={(e) => {
                const newColor = e.target.value;
                onUpdateLightColor?.(newColor);
              }}
              onClick={(e) => {
                e.stopPropagation(); // 컬러 피커 클릭 시 카드 닫힘 방지
              }}
              onFocus={(e) => {
                e.stopPropagation(); // 컬러 피커 포커스 시 카드 닫힘 방지
              }}
              className="w-full h-8 rounded cursor-pointer"
            />
          </div>
          {/* 밝기 조정 */}
          <div>
            <label className="text-xs text-gray-600 mb-1 block">
              Brightness: {lightBrightness}%
            </label>
            <input
              type="range"
              min={0}
              max={100}
              value={lightBrightness ?? 50}
              onChange={(e) => {
                const newBrightness = Number(e.target.value);
                console.log("[DeviceControls] 🔆 Brightness 슬라이더 onChange (Light):", {
                  oldValue: lightBrightness,
                  newValue: newBrightness,
                  hasHandler: !!onUpdateLightBrightness
                });
                if (onUpdateLightBrightness) {
                  onUpdateLightBrightness(newBrightness);
                } else {
                  console.warn("[DeviceControls] ⚠️ onUpdateLightBrightness 핸들러가 없음");
                }
              }}
              onMouseUp={(e) => {
                // 드래그 종료 시 이벤트 전파 방지 (카드 닫힘 방지)
                e.stopPropagation();
                // ✅ 드래그 종료 시점 핸들러 호출
                onBrightnessDragEnd?.();
              }}
              onTouchEnd={(e) => {
                // 모바일 터치 종료 시 이벤트 전파 방지
                e.stopPropagation();
                // ✅ 드래그 종료 시점 핸들러 호출
                onBrightnessDragEnd?.();
              }}
              className="w-full"
              style={{ accentColor: lightColor }}
            />
          </div>
        </div>
      );

    case "scent":
      return (
        <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
          <div>
            <label className="text-xs text-gray-600 mb-1 block">
              Scent Level: {scentLevel}/10
            </label>
            <input
              type="range"
              min={1}
              max={10}
              value={scentLevel ?? 5}
              onChange={(e) => {
                const newLevel = Number(e.target.value);
                console.log("[DeviceControls] 🌸 Scent Level 슬라이더 onChange (Scent):", {
                  oldValue: scentLevel,
                  newValue: newLevel,
                  hasHandler: !!onUpdateScentLevel
                });
                if (onUpdateScentLevel) {
                  onUpdateScentLevel(newLevel);
                } else {
                  console.warn("[DeviceControls] ⚠️ onUpdateScentLevel 핸들러가 없음");
                }
              }}
              onMouseUp={(e) => {
                e.stopPropagation();
                // ✅ 드래그 종료 시점 핸들러 호출
                onScentLevelDragEnd?.();
              }}
              onTouchEnd={(e) => {
                e.stopPropagation();
                // ✅ 드래그 종료 시점 핸들러 호출
                onScentLevelDragEnd?.();
              }}
              className="w-full"
              style={{ accentColor: lightColor || "#9CAF88" }}
            />
          </div>
        </div>
      );

    case "speaker":
      // 음량 조절 추가
      return (
        <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
          <div className="text-xs text-gray-600 mb-2">
            <div>Now Playing: {device.output.nowPlaying || "-"}</div>
          </div>
          <div>
            <label className="text-xs text-gray-600 mb-1 block">
              Volume: {volume !== undefined ? `${Math.round(volume)}%` : (device.output.volume ? `${device.output.volume}%` : "70%")}
            </label>
            <input
              type="range"
              min={0}
              max={100}
              value={volume ?? 70}
              onChange={(e) => {
                const newVolume = Number(e.target.value);
                console.log("[DeviceControls] 🔊 Volume 슬라이더 onChange (Speaker):", {
                  oldValue: volume,
                  newValue: newVolume,
                  hasHandler: !!onUpdateVolume
                });
                if (onUpdateVolume) {
                  onUpdateVolume(newVolume);
                } else {
                  console.warn("[DeviceControls] ⚠️ onUpdateVolume 핸들러가 없음");
                }
              }}
              onMouseDown={(e) => {
                e.stopPropagation();
                // ✅ Fix: 사용자 조작 시작 시점에 플래그 설정
                if (volumeIsUserChangingRef) {
                  volumeIsUserChangingRef.current = true;
                  console.log("[DeviceControls] 🔊 Volume 슬라이더 드래그 시작");
                }
              }}
              onTouchStart={(e) => {
                e.stopPropagation();
                // ✅ Fix: 모바일 터치 시작 시점에 플래그 설정
                if (volumeIsUserChangingRef) {
                  volumeIsUserChangingRef.current = true;
                  console.log("[DeviceControls] 🔊 Volume 슬라이더 터치 시작");
                }
              }}
              onMouseUp={(e) => {
                e.stopPropagation();
                // ✅ Fix: 사용자 조작 종료 시점에 플래그 해제
                if (volumeIsUserChangingRef) {
                  volumeIsUserChangingRef.current = false;
                  console.log("[DeviceControls] 🔊 Volume 슬라이더 드래그 종료");
                }
                // 드래그 종료 시점 핸들러 호출
                onVolumeDragEnd?.();
              }}
              onTouchEnd={(e) => {
                e.stopPropagation();
                // ✅ Fix: 모바일 터치 종료 시점에 플래그 해제
                if (volumeIsUserChangingRef) {
                  volumeIsUserChangingRef.current = false;
                  console.log("[DeviceControls] 🔊 Volume 슬라이더 터치 종료");
                }
                // 드래그 종료 시점 핸들러 호출
                onVolumeDragEnd?.();
              }}
              className="w-full"
              style={{ accentColor: lightColor || "#3B82F6" }}
            />
          </div>
        </div>
      );

    case "manager":
      // Manager는 모든 기능 통합 표시
      // 순서: 컬러 조정 → 음량 조정 → 밝기 조정 → 센트 레벨 조정
      return (
        <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
          {/* 1. 컬러 조정 */}
          <div>
            <label className="text-xs text-gray-600 mb-1 block">Light Color</label>
            <input
              type="color"
              value={lightColor}
              onChange={(e) => {
                const newColor = e.target.value;
                onUpdateLightColor?.(newColor);
              }}
              onClick={(e) => {
                e.stopPropagation(); // 컬러 피커 클릭 시 카드 닫힘 방지
              }}
              onFocus={(e) => {
                e.stopPropagation(); // 컬러 피커 포커스 시 카드 닫힘 방지
              }}
              className="w-full h-8 rounded cursor-pointer"
            />
          </div>
          {/* 2. 음량 조정 */}
          <div>
            <label className="text-xs text-gray-600 mb-1 block">
              Volume: {volume !== undefined ? `${Math.round(volume)}%` : (device.output.volume ? `${device.output.volume}%` : "70%")}
            </label>
            <input
              type="range"
              min={0}
              max={100}
              value={volume ?? 70}
              onChange={(e) => {
                const newVolume = Number(e.target.value);
                console.log("[DeviceControls] 🔊 Volume 슬라이더 onChange (Manager):", {
                  oldValue: volume,
                  newValue: newVolume,
                  hasHandler: !!onUpdateVolume
                });
                // ✅ Fix: onChange에서 onUpdateVolume 호출 (pendingVolumeRef 업데이트용)
                // DeviceCardExpanded의 onUpdateVolume은 pendingVolumeRef만 업데이트하고 즉시 상위로 전달하지 않음
                // 실제 상위 전달은 드래그 종료 시 onVolumeDragEnd에서 수행됨
                if (onUpdateVolume) {
                  onUpdateVolume(newVolume);
                }
              }}
              onMouseDown={(e) => {
                e.stopPropagation();
                // ✅ Fix: 사용자 조작 시작 시점에 플래그 설정
                if (volumeIsUserChangingRef) {
                  volumeIsUserChangingRef.current = true;
                  console.log("[DeviceControls] 🔊 Volume 슬라이더 드래그 시작 (Manager)");
                }
              }}
              onTouchStart={(e) => {
                e.stopPropagation();
                // ✅ Fix: 모바일 터치 시작 시점에 플래그 설정
                if (volumeIsUserChangingRef) {
                  volumeIsUserChangingRef.current = true;
                  console.log("[DeviceControls] 🔊 Volume 슬라이더 터치 시작 (Manager)");
                }
              }}
              onMouseUp={(e) => {
                e.stopPropagation();
                // ✅ Fix: 사용자 조작 종료 시점에 플래그 해제
                if (volumeIsUserChangingRef) {
                  volumeIsUserChangingRef.current = false;
                  console.log("[DeviceControls] 🔊 Volume 슬라이더 드래그 종료 (Manager)");
                }
                // 드래그 종료 시점 핸들러 호출
                onVolumeDragEnd?.();
              }}
              onTouchEnd={(e) => {
                e.stopPropagation();
                // ✅ Fix: 모바일 터치 종료 시점에 플래그 해제
                if (volumeIsUserChangingRef) {
                  volumeIsUserChangingRef.current = false;
                  console.log("[DeviceControls] 🔊 Volume 슬라이더 터치 종료 (Manager)");
                }
                // 드래그 종료 시점 핸들러 호출
                onVolumeDragEnd?.();
              }}
              className="w-full"
              style={{ accentColor: lightColor || "#3B82F6" }}
            />
          </div>
          {/* 3. 밝기 조정 */}
          <div>
            <label className="text-xs text-gray-600 mb-1 block">
              Brightness: {lightBrightness}%
            </label>
            <input
              type="range"
              min={0}
              max={100}
              value={lightBrightness ?? 50}
              onChange={(e) => {
                const newBrightness = Number(e.target.value);
                console.log("[DeviceControls] 🔆 Brightness 슬라이더 onChange (Manager):", {
                  oldValue: lightBrightness,
                  newValue: newBrightness,
                  hasHandler: !!onUpdateLightBrightness
                });
                if (onUpdateLightBrightness) {
                  onUpdateLightBrightness(newBrightness);
                } else {
                  console.warn("[DeviceControls] ⚠️ onUpdateLightBrightness 핸들러가 없음");
                }
              }}
              className="w-full"
              style={{ accentColor: lightColor }}
            />
          </div>
          {/* 4. 센트 레벨 조정 */}
          <div>
            <label className="text-xs text-gray-600 mb-1 block">
              Scent Level: {scentLevel}/10
            </label>
            <input
              type="range"
              min={1}
              max={10}
              value={scentLevel ?? 5}
              onChange={(e) => {
                const newLevel = Number(e.target.value);
                console.log("[DeviceControls] 🌸 Scent Level 슬라이더 onChange (Manager):", {
                  oldValue: scentLevel,
                  newValue: newLevel,
                  hasHandler: !!onUpdateScentLevel
                });
                if (onUpdateScentLevel) {
                  onUpdateScentLevel(newLevel);
                } else {
                  console.warn("[DeviceControls] ⚠️ onUpdateScentLevel 핸들러가 없음");
                }
              }}
              className="w-full"
              style={{ accentColor: lightColor || "#9CAF88" }}
            />
          </div>
        </div>
      );

    default:
      return null;
  }
}

