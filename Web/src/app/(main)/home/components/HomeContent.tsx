/**
 * HomeContent
 * 
 * 홈 페이지의 메인 컨텐츠 영역
 * MoodDashboard와 DeviceGrid를 포함
 * 향 배경 효과 포함
 */

"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import React from "react";
import MoodDashboard from "./MoodDashboard/MoodDashboard";
import DeviceGrid from "./Device/DeviceGrid";
import ScentBackground from "@/components/ui/ScentBackground";
import { MoodDashboardSkeleton } from "@/components/ui/Skeleton";
import { useDeviceSync } from "@/hooks/useDeviceSync";
import { detectCurrentEvent } from "@/lib/events/detectEvents";
import { useDevicePreferences } from "@/hooks/useDevicePreferences";
import type { Device } from "@/types/device";
import type { Mood } from "@/types/mood";
import type { BackgroundParams } from "@/hooks/useBackgroundParams";
import type { MoodStreamSegment } from "@/hooks/useMoodStream/types";
import type { CurrentSegmentData } from "@/types/moodStream";

interface MoodState {
  current: Mood | null;
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
  onMoodColorChange?: (color: string) => void; // 홈 컬러 변경 콜백
  // Phase 4: currentSegmentData를 props로 받기
  currentSegmentData: CurrentSegmentData | null;
  onSegmentIndexChange?: (index: number) => void; // 세그먼트 인덱스 변경 콜백
  onUpdateCurrentSegment?: (updates: Partial<MoodStreamSegment>) => void; // 현재 세그먼트 업데이트 콜백
  isLoadingMoodStream?: boolean; // 무드스트림 로딩 상태
  // Phase 5: segments 배열 전달
  segments?: MoodStreamSegment[]; // 전체 세그먼트 배열
  // 새로고침 요청 콜백
  onRefreshRequest?: () => void;
}

export default function HomeContent({
  moodState,
  deviceState,
  backgroundState,
  onMoodColorChange,
  currentSegmentData,
  onSegmentIndexChange,
  onUpdateCurrentSegment,
  isLoadingMoodStream = false,
  segments = [],
  onRefreshRequest,
}: HomeContentProps) {
  const { current: currentMood, onChange: onMoodChange, onScentChange, onSongChange } = moodState;
  const { devices, setDevices, expandedId, setExpandedId, onOpenAddModal, onDeleteRequest } = deviceState;
  const onBackgroundParamsChange = backgroundState?.onChange;
  
  // Phase 4: Context 접근 제거, props로 받은 currentSegmentData 사용
  const currentSegment = currentSegmentData?.segment;
  const backgroundParams: BackgroundParams | null = currentSegmentData?.backgroundParams || null;
  const segmentIndex = currentSegmentData?.index ?? 0;

  // Phase 4: useBackgroundParams 제거, currentSegmentData에서 backgroundParams 사용
  // backgroundParams는 이미 currentSegmentData에 포함되어 있음
  
  // backgroundParams 변경 시 상위로 전달
  useEffect(() => {
    if (backgroundParams && onBackgroundParamsChange) {
      onBackgroundParamsChange(backgroundParams);
    }
  }, [backgroundParams, onBackgroundParamsChange]);
  
  // Phase 4: 새로고침 요청 핸들러
  const handleRefreshRequest = useCallback(() => {
    if (onRefreshRequest) {
      onRefreshRequest();
    }
  }, [onRefreshRequest]);
  
  // 저장된 디바이스 설정 불러오기
  const { loadPreferences } = useDevicePreferences();

  // 음량 상태 관리 (0-100 범위)
  // 기본값 70%, 저장된 설정은 useEffect에서 불러옴
  const [volume, setVolume] = useState<number>(70);

  // 저장된 설정 불러오기 (앱 시작 시)
  useEffect(() => {
    const loadSavedSettings = async () => {
      const saved = await loadPreferences();
      if (saved) {
        if (saved.volume !== undefined) {
          setVolume(saved.volume);
        }
        // TODO: brightness, color, scentType, scentLevel도 적용
        // (디바이스별로 다르게 적용해야 할 수 있음)
      }
    };
    loadSavedSettings();
  }, [loadPreferences]);

  // LLM 결과 및 무드 변경을 디바이스에 반영
  useDeviceSync({
    setDevices,
    backgroundParams,
    currentMood,
    volume,
  });
  
  // Phase 4: currentSegmentData에서 이미 mood가 변환되어 있으므로 이 useEffect 제거
  // currentMood는 home/page.tsx에서 currentSegmentData 변경 시 자동 업데이트됨
  
  /**
   * 모든 hooks는 early return 전에 호출해야 함 (React Hooks 규칙)
   * 현재 향 레벨 가져오기 (Manager 디바이스에서) - 파티클 밀도 조절용
   */
  const currentScentLevel = useMemo(
    () => devices.find((d) => d.type === "manager")?.output?.scentLevel || 5,
    [devices]
  );

  // 현재 이벤트 감지 (크리스마스, 신년 등)
  const currentEvent = useMemo(() => detectCurrentEvent(), []);

  // Phase 4: 무드 컬러(raw & pastel) - currentSegmentData 사용
  // currentMood의 color를 최우선으로 사용하여 사용자 변경 값 즉시 반영
  const rawMoodColor = useMemo(() => {
    // currentMood가 있으면 최우선 사용 (사용자가 변경한 값)
    if (currentMood?.color) {
      return currentMood.color;
    }
    
    // backgroundParams가 있으면 사용 (LLM 생성된 컬러)
    if (backgroundParams?.moodColor) {
      return backgroundParams.moodColor;
    }
    
    // currentSegment의 컬러 사용
    if (currentSegment?.mood?.color) {
      return currentSegment.mood.color;
    }
    if (currentSegment?.mood?.lighting?.color) {
      return currentSegment.mood.lighting.color;
    }
    
    // 기본값
    return "#E6F3FF";
  }, [currentMood?.color, backgroundParams?.moodColor, currentSegment]);

  // rawMoodColor 변경 시 상위 컴포넌트에 전달
  useEffect(() => {
    if (onMoodColorChange) {
      onMoodColorChange(rawMoodColor);
    }
  }, [rawMoodColor, onMoodColorChange]);

  // Phase 4: deviceGridMood 제거, currentSegmentData.mood 사용
  const deviceGridMood = useMemo(() => {
    if (currentSegmentData?.mood) {
      // backgroundParams가 있고 인덱스가 3 이상이면 backgroundParams.moodColor 사용
      const useBackgroundColor = backgroundParams?.moodColor && segmentIndex >= 3;
      return {
        ...currentSegmentData.mood,
        color: useBackgroundColor ? backgroundParams.moodColor : currentSegmentData.mood.color,
      };
    }
    
    // currentMood가 있으면 사용
    if (currentMood) {
      return {
        ...currentMood,
        color: backgroundParams?.moodColor || currentMood.color || "#E6F3FF",
      };
    }
    
    // 기본값
    return {
      id: "default",
      name: "Unknown Mood",
      color: "#E6F3FF",
      song: { title: "Unknown Song", duration: 180 },
      scent: { type: "Musk" as const, name: "Default", color: "#9CAF88" },
    };
  }, [currentSegmentData?.mood, backgroundParams?.moodColor, currentMood, segmentIndex]);
  
  /**
   * Phase 4: 무드스트림이 없거나 currentMood가 없으면 스켈레톤 UI 표시 (early return)
   * 모든 hooks 호출 후에 체크
   * 
   * 개선: 초기 세그먼트가 있으면 스켈레톤 숨김 (isLoadingMoodStream만 체크하지 않음)
   */
  // 초기 로딩 중이고 세그먼트가 없을 때만 스켈레톤 표시
  const isInitialLoading = isLoadingMoodStream && (!segments || segments.length === 0);
  // 세그먼트가 있지만 현재 인덱스가 범위를 벗어났을 때는 알림 표시 (스켈레톤 대신)
  // isIndexOutOfRange는 MoodDashboard에서 처리하므로 여기서는 사용하지 않음
  
  // 초기 로딩 중이거나 currentMood와 currentSegmentData가 모두 없을 때만 스켈레톤 표시
  // 인덱스가 범위를 벗어났을 때는 스켈레톤 대신 알림을 표시하고 현재 세그먼트 정보는 유지
  if (isInitialLoading || (!currentMood && !currentSegmentData)) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <MoodDashboardSkeleton />
      </div>
    );
  }

  return (
    <>
      {/* 향 배경 효과 - 백그라운드 레이어 */}
      <ScentBackground
        scentType={currentMood?.scent?.type || "Musk"}
        /**
         * 파티클 컬러는 무드 컬러(raw)를 직접 사용하여 무드 변경 시 즉시 반영
         * 백그라운드에는 무드컬러의 파스텔톤을 사용하고,
         * 향 타입별 파스텔과 함께 섞여 보이도록 처리
         */
        scentColor={rawMoodColor}
        intensity={currentScentLevel}
        backgroundIcon={backgroundParams?.backgroundIcon}
        backgroundWind={backgroundParams?.backgroundWind}
        animationSpeed={backgroundParams?.animationSpeed}
        iconOpacity={backgroundParams?.iconOpacity}
        backgroundColor={rawMoodColor}
        event={currentEvent} // 이벤트 정보 전달 (크리스마스, 신년 등)
      />

      <div className="pt-2 px-3 flex flex-col flex-1 overflow-hidden relative z-10">
        {/* 무드 대시보드 - 고정 */}
        <div className="flex-shrink-0 relative z-20">
          <MoodDashboard
            onVolumeChange={(newVolume) => {
              setVolume(newVolume);
            }}
            externalVolume={volume}
            mood={currentMood!}
            onMoodChange={onMoodChange}
            onScentChange={onScentChange}
            onSongChange={onSongChange}
            backgroundParams={backgroundParams}
            onRefreshRequest={handleRefreshRequest}
            allSegmentsParams={null} // Phase 4: 나중에 구현
            setBackgroundParams={() => {}} // Phase 4: 나중에 구현
            isLLMLoading={isLoadingMoodStream} // 무드스트림 생성 중일 때 스피너 표시
            // Phase 5: currentSegmentData 전달
            currentSegmentData={currentSegmentData}
            onSegmentIndexChange={onSegmentIndexChange}
            segments={segments}
            isLoadingMoodStream={isLoadingMoodStream}
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
            isLoading={isLoadingMoodStream}
            volume={volume}
            onUpdateVolume={(newVolume) => {
              setVolume(newVolume);
            }}
            onUpdateCurrentSegment={onUpdateCurrentSegment}
            currentSegment={currentSegment}
            onDeviceControlChange={(changes) => {
              // 디바이스 컨트롤 변경 시 currentMood 업데이트하여 모든 컴포넌트에 즉각 반영
              if (currentMood) {
                const updatedMood = { ...currentMood };
                let shouldUpdate = false;
                
                // 무드 컬러 변경 (Manager나 Light의 color 변경)
                if (changes.color && changes.color !== currentMood.color) {
                  updatedMood.color = changes.color;
                  shouldUpdate = true;
                }
                
                // currentMood 업데이트하여 모든 컴포넌트에 즉각 반영
                if (shouldUpdate && changes.color) {
                  onMoodChange(updatedMood);
                  
                  // Phase 4: 현재 세그먼트의 mood도 업데이트하여 스트림 재생성 없이 반영
                  if (currentSegment && onUpdateCurrentSegment) {
                    onUpdateCurrentSegment({
                      mood: {
                        ...currentSegment.mood,
                        color: changes.color,
                        lighting: {
                          ...currentSegment.mood.lighting,
                          color: changes.color,
                        },
                      },
                    });
                  }
                }
              }
              
              // 디바이스 output을 직접 업데이트하여 다른 디바이스 카드에 즉시 반영
              setDevices((prev) =>
                prev.map((d) => {
                  if (changes.color && (d.type === "manager" || d.type === "light")) {
                    return {
                      ...d,
                      output: {
                        ...d.output,
                        color: changes.color,
                      },
                    };
                  }
                  if (changes.brightness !== undefined && (d.type === "manager" || d.type === "light")) {
                    return {
                      ...d,
                      output: {
                        ...d.output,
                        brightness: changes.brightness,
                      },
                    };
                  }
                  if (changes.scentLevel !== undefined && (d.type === "manager" || d.type === "scent")) {
                    return {
                      ...d,
                      output: {
                        ...d.output,
                        scentLevel: changes.scentLevel,
                      },
                    };
                  }
                  if (changes.volume !== undefined && (d.type === "manager" || d.type === "speaker")) {
                    return {
                      ...d,
                      output: {
                        ...d.output,
                        volume: changes.volume,
                      },
                    };
                  }
                  return d;
                })
              );
            }}
          />
        </div>
      </div>
    </>
  );
}

