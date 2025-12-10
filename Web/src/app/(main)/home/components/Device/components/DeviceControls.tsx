// ======================================================
// File: src/app/(main)/home/components/Device/components/DeviceControls.tsx
// ======================================================

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
}

export default function DeviceControls({
  device,
  currentMood,
  lightColor,
  lightBrightness,
  scentLevel,
  volume,
  onUpdateLightColor,
  onUpdateLightBrightness,
  onUpdateScentLevel,
  onUpdateVolume,
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
              value={lightBrightness}
              onChange={(e) => {
                const newBrightness = Number(e.target.value);
                onUpdateLightBrightness?.(newBrightness);
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
              value={scentLevel}
              onChange={(e) => {
                const newLevel = Number(e.target.value);
                onUpdateScentLevel?.(newLevel);
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
                onUpdateVolume?.(newVolume);
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
                onUpdateVolume?.(newVolume);
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
              value={lightBrightness}
              onChange={(e) => {
                const newBrightness = Number(e.target.value);
                onUpdateLightBrightness?.(newBrightness);
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
              value={scentLevel}
              onChange={(e) => {
                const newLevel = Number(e.target.value);
                onUpdateScentLevel?.(newLevel);
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

