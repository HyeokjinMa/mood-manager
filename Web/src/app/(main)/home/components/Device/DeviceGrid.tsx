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

import { useState, useEffect } from "react";
import DeviceCardSmall from "./DeviceCardSmall";
import DeviceCardExpanded from "./DeviceCardExpanded";
import AddDeviceCard from "./AddDeviceCard";
import { DeviceCardSkeleton } from "@/components/ui/Skeleton";
import { createDeviceHandlers } from "./hooks/useDeviceHandlers";
import type { Device } from "@/types/device";
import type { Mood } from "@/types/mood";

export default function DeviceGrid({
  devices,
  expandedId,
  setExpandedId,
  setDevices,
  openAddModal,
  currentMood,
  onDeleteRequest,
}: {
  devices: Device[];
  expandedId: string | null;
  setExpandedId: (id: string | null) => void;
  setDevices: (fn: (prev: Device[]) => Device[]) => void;
  openAddModal: () => void;
  currentMood?: Mood; // 현재 무드 (AddDeviceCard에 전달)
  onDeleteRequest: (device: Device) => void; // 삭제 요청 콜백
}) {
  const [isLoading, setIsLoading] = useState(true);

  // 초기 로딩 시뮬레이션 (실제로는 API 호출 시 사용)
  useEffect(() => {
    // 목업: 초기 로딩 시뮬레이션
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  // 확장 카드가 있으면 그 카드를 먼저 앞으로 정렬
  const sortedDevices =
    expandedId === null
      ? devices
      : [
          ...devices.filter((d) => d.id === expandedId),
          ...devices.filter((d) => d.id !== expandedId),
        ];

  // 로딩 중 스켈레톤 표시
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3 mt-4">
        {[1, 2].map((i) => (
          <DeviceCardSkeleton key={i} />
        ))}
      </div>
    );
  }

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
                onTogglePower={handlers.handleTogglePower}
                onUpdateName={handlers.handleUpdateName}
                onUpdateLightColor={handlers.handleUpdateLightColor}
                onUpdateLightBrightness={handlers.handleUpdateLightBrightness}
                onUpdateScentLevel={handlers.handleUpdateScentLevel}
              />
            </div>
          );
        }

        return (
          <DeviceCardSmall
            key={device.id}
            device={device}
            currentMood={currentMood}
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
