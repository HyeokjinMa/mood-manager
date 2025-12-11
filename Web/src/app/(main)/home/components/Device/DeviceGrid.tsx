// ======================================================
// File: src/app/(main)/home/components/Device/DeviceGrid.tsx
// ======================================================

/*
  [DeviceGrid 역할 정리]

  - 2×N 카드 그리드
  - expandedId가 있으면 그 카드만 col-span-2로 확장
  - 확장 중인 카드가 가장 상단에 오도록 정렬
  - 나머지 small card들은 자동 재배치
  - + 버튼은 항상 맨 마지막에 위치
  - openAddModal() 호출 시 DeviceAddModal 오픈
*/

"use client";

import DeviceCardSmall from "./DeviceCardSmall";
import DeviceCardExpanded from "./DeviceCardExpanded";
import AddDeviceCard from "./AddDeviceCard";
import { createDeviceHandlers } from "./hooks/useDeviceHandlers";
import type { Device } from "@/types/device";
import type { Mood } from "@/types/mood";
import type { MoodStreamSegment } from "@/hooks/useMoodStream/types";

export default function DeviceGrid({
  devices,
  expandedId,
  setExpandedId,
  setDevices,
  openAddModal,
  currentMood,
  onDeleteRequest,
  isLoading = false,
  volume,
  onUpdateVolume,
  onDeviceControlChange,
  onUpdateCurrentSegment,
  currentSegment,
}: {
  devices: Device[];
  expandedId: string | null;
  setExpandedId: (id: string | null) => void;
  setDevices: (fn: (prev: Device[]) => Device[]) => void;
  openAddModal: () => void;
  currentMood?: Mood; // 현재 무드 (AddDeviceCard에 전달)
  onDeleteRequest: (device: Device) => void; // 삭제 요청 콜백
  isLoading?: boolean; // 디바이스 데이터 로딩 상태
  volume?: number; // 0-100 범위
  onUpdateVolume?: (volume: number) => void; // 0-100 범위
  onDeviceControlChange?: (changes: { color?: string; brightness?: number; scentLevel?: number; volume?: number }) => void; // 디바이스 컨트롤 변경 콜백
  onUpdateCurrentSegment?: (updates: Partial<MoodStreamSegment>) => void; // 현재 세그먼트 업데이트 콜백
  currentSegment?: MoodStreamSegment | null; // 현재 세그먼트 데이터
}) {

  // 확장 카드가 있으면 그 카드를 먼저 앞으로 정렬
  const sortedDevices =
    expandedId === null
      ? devices
      : [
          ...devices.filter((d) => d.id === expandedId),
          ...devices.filter((d) => d.id !== expandedId),
        ];

  return (
    <div className="grid grid-cols-2 gap-3 mt-4">
      {sortedDevices.map((device) => {
        const isExpanded = expandedId === device.id;

        if (isExpanded) {
          const handlers = createDeviceHandlers({ device, setDevices });
          
          return (
            <div key={device.id} className="col-span-2 animate-grow">
              <DeviceCardExpanded
                device={device}
                currentMood={currentMood}
                onClose={() => setExpandedId(null)}
                onDelete={() => onDeleteRequest(device)}
                onTogglePower={() => handlers.handleTogglePower()}
                onUpdateName={(name) => handlers.handleUpdateName(name)}
                volume={volume}
                onUpdateVolume={(newVolume) => {
                  // 0-100 범위를 0-1로 변환하여 MusicPlayer에 전달
                  onUpdateVolume?.(newVolume);
                  onDeviceControlChange?.({ volume: newVolume });
                }}
                onDeviceUpdate={(updatedDevice) => {
                  // 디바이스 업데이트 시 상태 반영 (페이지 리로드 없이)
                  setDevices((prev) =>
                    prev.map((d) => (d.id === updatedDevice.id ? updatedDevice : d))
                  );
                }}
                onDeviceControlChange={onDeviceControlChange}
                onUpdateCurrentSegment={onUpdateCurrentSegment}
                currentSegment={currentSegment}
              />
            </div>
          );
        }

        return (
          <DeviceCardSmall
            key={device.id}
            device={device}
            currentMood={currentMood}
            isLoading={isLoading}
            onClick={() => {
              if (expandedId === device.id) setExpandedId(null);
              else setExpandedId(device.id);
            }}
          />
        );
      })}

      {/* + 버튼 */}
      <AddDeviceCard onAdd={openAddModal} currentMood={currentMood} />
    </div>
  );
}
