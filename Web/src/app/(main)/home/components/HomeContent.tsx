// ======================================================
// File: src/app/(main)/home/components/HomeContent.tsx
// ======================================================

/*
  [HomeContent 역할]
  
  - 홈 페이지의 메인 컨텐츠 영역
  - MoodDashboard와 DeviceGrid를 포함
  - 향 배경 효과 포함
*/

"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import React from "react";
import MoodDashboard from "./MoodDashboard/MoodDashboard";
import DeviceGrid from "./Device/DeviceGrid";
import ScentBackground from "@/components/ui/ScentBackground";
import { useMoodStream } from "@/hooks/useMoodStream";
import { useBackgroundParams } from "@/hooks/useBackgroundParams";
import { useDeviceSync } from "@/hooks/useDeviceSync";
import type { Device } from "@/types/device";
import type { Mood } from "@/types/mood";
import type { BackgroundParams } from "@/hooks/useBackgroundParams";
import { blendWithWhite } from "@/lib/utils";

interface MoodState {
  current: Mood;
  onChange: (mood: Mood) => void;
  onScentChange: (mood: Mood) => void;
  onSongChange: (mood: Mood) => void;
}

interface DeviceState {
  devices: Device[];
  setDevices: React.Dispatch<React.SetStateAction<Device[]>>;
  expandedId: string | null;
  setExpandedId: (id: string | null) => void;
  onOpenAddModal: () => void;
  onDeleteRequest: (device: Device) => void; // 삭제 요청 콜백
}

interface BackgroundState {
  params: BackgroundParams | null;
  onChange?: (params: BackgroundParams | null) => void;
}

interface HomeContentProps {
  moodState: MoodState;
  deviceState: DeviceState;
  backgroundState?: BackgroundState;
}

export default function HomeContent({
  moodState,
  deviceState,
  backgroundState,
}: HomeContentProps) {
  const { current: currentMood, onChange: onMoodChange, onScentChange, onSongChange } = moodState;
  const { devices, setDevices, expandedId, setExpandedId, onOpenAddModal, onDeleteRequest } = deviceState;
  const onBackgroundParamsChange = backgroundState?.onChange;
  // 무드스트림 관리
  const { 
    moodStream, 
    isLoading: isLoadingMoodStream,
    currentSegmentIndex,
  } = useMoodStream();
  
  // LLM 배경 파라미터 관리 (새로고침 시에만 호출)
  const [shouldFetchLLM, setShouldFetchLLM] = useState(false);
  const { 
    backgroundParams, 
    isLoading: isLoadingParams,
    allSegmentsParams,
    setBackgroundParams,
  } = useBackgroundParams(
    moodStream, 
    shouldFetchLLM,
    currentSegmentIndex
  );
  
  // OpenAI 호출 완료 후 플래그 리셋 및 상위로 전달
  useEffect(() => {
    if (shouldFetchLLM && !isLoadingParams && backgroundParams) {
      setShouldFetchLLM(false);
    }
    // backgroundParams 변경 시 상위로 전달
    if (backgroundParams && onBackgroundParamsChange) {
      onBackgroundParamsChange(backgroundParams);
    }
  }, [shouldFetchLLM, isLoadingParams, backgroundParams, onBackgroundParamsChange]);
  
  // LLM 결과 및 무드 변경을 디바이스에 반영
  useDeviceSync({
    setDevices,
    backgroundParams,
    currentMood,
  });
  
  // 현재 향 레벨 가져오기 (Manager 디바이스에서) - 파티클 밀도 조절용
  const currentScentLevel = useMemo(
    () => devices.find((d) => d.type === "manager")?.output?.scentLevel || 5,
    [devices]
  );

  // 무드 컬러(raw & pastel) - 메모이제이션
  const rawMoodColor = useMemo(() => {
    return backgroundParams?.moodColor || currentMood.color;
  }, [backgroundParams?.moodColor, currentMood.color]);

  // 새로고침 요청 핸들러 - 메모이제이션
  const handleRefreshRequest = useCallback(() => {
    setShouldFetchLLM(true);
  }, []);

  // DeviceGrid에 전달할 currentMood - 메모이제이션
  const deviceGridMood = useMemo(
    () => ({
      ...currentMood,
      color: backgroundParams?.moodColor || currentMood.color,
    }),
    [currentMood, backgroundParams?.moodColor]
  );
  
  // 무드스트림이 없으면 로딩 표시
  if (isLoadingMoodStream && !moodStream) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-gray-500">Loading mood stream...</p>
      </div>
    );
  }

  return (
    <>
      {/* 향 배경 효과 - 백그라운드 레이어 */}
      <ScentBackground
        scentType={currentMood.scent.type}
        // 파티클 컬러는 무드 컬러(raw)를 직접 사용하여 무드 변경 시 즉시 반영
        // 백그라운드에는 무드컬러의 파스텔톤을 사용하고,
        // 향 타입별 파스텔과 함께 섞여 보이도록 처리
        scentColor={rawMoodColor}
        intensity={currentScentLevel}
        backgroundIcon={backgroundParams?.backgroundIcon}
        backgroundWind={backgroundParams?.backgroundWind}
        animationSpeed={backgroundParams?.animationSpeed}
        iconOpacity={backgroundParams?.iconOpacity}
        backgroundColor={rawMoodColor}
      />

      <div className="pt-2 px-3 flex flex-col flex-1 overflow-hidden relative z-10">
        {/* 무드 대시보드 - 고정 */}
        <div className="flex-shrink-0 relative z-20">
          <MoodDashboard
            mood={currentMood}
            onMoodChange={onMoodChange}
            onScentChange={onScentChange}
            onSongChange={onSongChange}
            backgroundParams={backgroundParams}
            onRefreshRequest={handleRefreshRequest}
            allSegmentsParams={allSegmentsParams}
            setBackgroundParams={setBackgroundParams}
          />
        </div>

        {/* 디바이스 그리드 - 스크롤 가능 */}
        <div className="flex-1 overflow-y-auto mt-1 pb-20">
          <DeviceGrid
            devices={devices}
            expandedId={expandedId}
            setExpandedId={setExpandedId}
            setDevices={setDevices}
            openAddModal={onOpenAddModal}
            currentMood={deviceGridMood}
            onDeleteRequest={onDeleteRequest}
          />
        </div>
      </div>
    </>
  );
}

