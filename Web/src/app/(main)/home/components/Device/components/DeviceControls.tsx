// ======================================================
// File: src/app/(main)/home/components/Device/components/DeviceControls.tsx
// ======================================================

import { ChevronRight } from "lucide-react";
import type { Device } from "@/types/device";
import type { Mood } from "@/types/mood";

interface DeviceControlsProps {
  device: Device;
  currentMood?: Mood;
  lightColor: string;
  lightBrightness: number;
  scentLevel: number;
  onUpdateLightColor?: (color: string) => void;
  onUpdateLightBrightness?: (brightness: number) => void;
  onUpdateScentLevel?: (level: number) => void;
}

export default function DeviceControls({
  device,
  currentMood,
  lightColor,
  lightBrightness,
  scentLevel,
  onUpdateLightColor,
  onUpdateLightBrightness,
  onUpdateScentLevel,
}: DeviceControlsProps) {
  if (!device.power) return null;

  switch (device.type) {
    case "light":
      return (
        <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
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
              style={{ accentColor: currentMood?.color || "#FFD700" }}
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
              style={{ accentColor: currentMood?.color || "#9CAF88" }}
            />
          </div>
        </div>
      );

    case "speaker":
      // 음악은 대시보드에서만 통제, 디바이스 카드에서는 정보만 표시
      return (
        <div className="text-xs text-gray-600">
          <div>Current: {device.output.nowPlaying || "-"}</div>
          <div className="mt-1 flex items-center gap-1 text-gray-500">
            <span>Next song</span>
            <ChevronRight size={12} />
          </div>
        </div>
      );

    case "manager":
      // Manager는 모든 기능 통합 표시
      return (
        <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
          {/* 조명 컨트롤 */}
          <div>
            <label className="text-xs text-gray-600 mb-1 block">Light Color</label>
            <input
              type="color"
              value={lightColor}
              onChange={(e) => {
                const newColor = e.target.value;
                onUpdateLightColor?.(newColor);
              }}
              className="w-full h-8 rounded cursor-pointer"
            />
          </div>
          <div>
            <label className="text-xs text-gray-600 mb-1 block">
              Light Brightness: {lightBrightness}%
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
          {/* 향 컨트롤 */}
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
              style={{ accentColor: currentMood?.color || "#9CAF88" }}
            />
          </div>
          {/* 음악 정보 */}
          <div className="text-xs text-gray-600 pt-2 border-t border-gray-200">
            <div>Current: {device.output.nowPlaying || "-"}</div>
            <div className="mt-1 flex items-center gap-1 text-gray-500">
              <span>Next song</span>
              <ChevronRight size={12} />
            </div>
          </div>
        </div>
      );

    default:
      return null;
  }
}

