/**
 * Home Page
 * 
 * 페이지 레이아웃과 상태 관리만 담당
 * 모든 UI와 비즈니스 로직은 컴포넌트와 훅으로 분리
 * 레이아웃은 app/layout.tsx에서 375px 중앙정렬이 적용됨
 * DB에서 실제 디바이스 목록을 가져와서 표시
 */

"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import TopNav from "@/components/navigation/TopNav";
import BottomNav from "@/components/navigation/BottomNav";
import MyPageModal from "./components/modals/MyPageModal";
import MoodModal from "./components/modals/MoodModal";
import HomeContent from "./components/HomeContent";
import DeviceAddModal from "./components/Device/DeviceAddModal";
import DeviceDeleteModal from "./components/Device/DeviceDeleteModal";
import SurveyOverlay from "./components/SurveyOverlay/SurveyOverlay";
import type { Device } from "@/types/device";
import { useDevices } from "@/hooks/useDevices";
import { useMood } from "@/hooks/useMood";
import { useSurvey } from "@/hooks/useSurvey";
import type { BackgroundParams } from "@/hooks/useBackgroundParams";
import type { MoodStreamSegment } from "@/hooks/useMoodStream/types";
import type { Mood } from "@/types/mood";
import type { MoodStreamData, CurrentSegmentData } from "@/types/moodStream";
import { convertSegmentMoodToMood } from "./components/MoodDashboard/utils/moodStreamConverter";
import { getLastSegmentEndTime } from "@/lib/utils/segmentUtils";

export default function HomePage() {
  const router = useRouter();
  const { status } = useSession();
  const redirectingRef = useRef(false); // 리다이렉트 중복 방지
  const lastStatusRef = useRef<string | null>(null); // 이전 상태 추적

  /**
   * 세션 체크: 로그인되지 않은 경우 로그인 페이지로 리다이렉트
   * 상태가 변하지 않았으면 무시 (불필요한 리렌더링 방지)
   * loading 상태에서는 리다이렉트하지 않음 (시크릿 모드 세션 불안정 대응)
   * 약간의 딜레이를 추가하여 세션 상태가 안정화될 시간을 줌
   */
  useEffect(() => {
    if (lastStatusRef.current === status) {
      return;
    }
    lastStatusRef.current = status;

    if (status === "loading") {
      redirectingRef.current = false;
      return;
    }

    if (status === "unauthenticated" && !redirectingRef.current) {
      redirectingRef.current = true;
      const timer = setTimeout(() => {
        router.replace("/login");
      }, 300);
      
      return () => {
        clearTimeout(timer);
      };
    }
    
    if (status === "authenticated") {
      redirectingRef.current = false;
    }
  }, [status, router]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [deviceToDelete, setDeviceToDelete] = useState<Device | null>(null);
  const [backgroundParams, setBackgroundParams] = useState<BackgroundParams | null>(null);
  const [homeMoodColor, setHomeMoodColor] = useState<string | undefined>(undefined); // 홈 컬러 상태
  // Phase 8: 모달 상태 관리
  const [showMyPageModal, setShowMyPageModal] = useState(false);
  const [showMoodModal, setShowMoodModal] = useState(false);
  
  // Phase 2: 무드스트림 데이터 상태 관리 (home/page.tsx로 이동)
  const [moodStreamData, setMoodStreamData] = useState<MoodStreamData>({
    streamId: "",
    segments: [],
    currentIndex: 0,
    isLoading: true,
    isGeneratingNextStream: false,
  });

  // 커스텀 훅 사용
  // Phase 6: useDevices를 먼저 호출하여 setDevices를 얻고, useMood에서 사용
  // currentMood는 초기값 null로 시작하고, 나중에 업데이트됨
  const { devices, setDevices, addDevice, isLoading } = useDevices(
    null, // 초기값은 null, 나중에 currentMood가 설정되면 업데이트됨
    moodStreamData.segments,
    moodStreamData.currentIndex
  );
  
  const { currentMood, setCurrentMood, handleScentChange, handleSongChange } =
    useMood(null, setDevices);
  const { showSurvey, handleSurveyComplete, handleSurveySkip } = useSurvey();
  
  // Phase 6: currentMood가 변경되면 useDevices에 전달하기 위해
  // useDevices를 다시 호출하는 대신, useEffect로 segments와 currentSegmentIndex를 업데이트
  // 하지만 useDevices는 이미 segments와 currentSegmentIndex를 props로 받고 있으므로
  // 추가 작업이 필요 없음 (useDevices 내부 useEffect가 자동으로 반응함)
  
  // Phase 3: 현재 세그먼트 통합 데이터 제공 함수
  // currentMood를 의존성에서 제거하여 무한 루프 방지
  const currentSegmentData = useMemo(() => {
    if (!moodStreamData.segments || moodStreamData.segments.length === 0) {
      return null;
    }
    
    const segment = moodStreamData.segments[moodStreamData.currentIndex];
    if (!segment) return null;
    
    // Mood 타입으로 변환 (currentMood는 변환에만 사용, 의존성 제외)
    const mood = convertSegmentMoodToMood(
      segment.mood,
      null, // currentMood를 null로 전달하여 무한 루프 방지
      segment
    );
    
    return {
      segment,
      mood,
      backgroundParams: segment.backgroundParams,
      index: moodStreamData.currentIndex,
    };
  }, [moodStreamData.segments, moodStreamData.currentIndex]);
  
  // Phase 3: currentSegmentData 변경 시 currentMood 업데이트 (무한 루프 방지)
  const prevMoodIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (currentSegmentData?.mood) {
      // mood.id가 변경되었을 때만 업데이트하여 무한 루프 방지
      if (prevMoodIdRef.current !== currentSegmentData.mood.id) {
        prevMoodIdRef.current = currentSegmentData.mood.id;
        setCurrentMood(currentSegmentData.mood);
      }
    }
  }, [currentSegmentData?.mood?.id, setCurrentMood]);
  
  // Phase 2: 무드스트림 생성 함수
  const generateMoodStream = useCallback(async (segmentCount: number = 7, currentSegments?: MoodStreamSegment[]) => {
    // 현재 segments를 파라미터로 받거나 상태에서 가져오기
    const segmentsToUse = currentSegments || moodStreamData.segments;
    
    if (moodStreamData.isGeneratingNextStream) {
      return; // 이미 생성 중이면 스킵
    }
    
    setMoodStreamData(prev => ({ ...prev, isGeneratingNextStream: true }));
    
    try {
      const nextStartTime = getLastSegmentEndTime(segmentsToUse);
      
      const response = await fetch("/api/moods/current/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          nextStartTime,
          segmentCount,
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to generate mood stream");
      }
      
      const data = await response.json();
      const newSegments: MoodStreamSegment[] = data.moodStream || [];
      
      // 기존 세그먼트에 추가
      setMoodStreamData(prev => ({
        ...prev,
        segments: [...prev.segments, ...newSegments],
        isGeneratingNextStream: false,
      }));
    } catch (error) {
      console.error("[HomePage] Failed to generate mood stream:", error);
      setMoodStreamData(prev => ({ ...prev, isGeneratingNextStream: false }));
    }
  }, [moodStreamData.segments, moodStreamData.isGeneratingNextStream]);
  
  // 새로고침 요청 핸들러: 현재 세그먼트부터 다시 생성
  const handleRefreshRequest = useCallback(() => {
    // 현재 세그먼트부터 10개 새로 생성
    const currentSegments = moodStreamData.segments.slice(0, moodStreamData.currentIndex + 1);
    generateMoodStream(10, currentSegments);
  }, [moodStreamData.segments, moodStreamData.currentIndex, generateMoodStream]);
  
  // Phase 2: 콜드스타트 로직 - 초기 3세그먼트 로드 → 즉시 실행 → 값 공유 → 무드스트림 생성 호출
  useEffect(() => {
    const loadInitialSegments = async () => {
      if (status !== "authenticated" || moodStreamData.segments.length > 0) {
        return; // 이미 로드되었거나 인증되지 않은 경우 스킵
      }
      
      setMoodStreamData(prev => ({ ...prev, isLoading: true }));
      
      try {
        // 1. 초기 3개 캐롤 세그먼트 가져오기
        const response = await fetch("/api/moods/carol-segments", {
          credentials: "include",
        });
        
        if (!response.ok) {
          throw new Error("Failed to fetch carol segments");
        }
        
        const data = await response.json();
        const carolSegments: MoodStreamSegment[] = data.segments || [];
        
        if (carolSegments.length === 0) {
          throw new Error("No carol segments found");
        }
        
        // 2. 상태에 저장
        setMoodStreamData(prev => ({
          ...prev,
          streamId: `stream-${Date.now()}`,
          segments: carolSegments,
          currentIndex: 0,
          isLoading: false,
        }));
        
        // 3. 즉시 첫 번째 세그먼트 정보 공유 (currentMood 초기화)
        const firstSegment = carolSegments[0];
        if (firstSegment?.mood) {
          const convertedMood = convertSegmentMoodToMood(firstSegment.mood, null, firstSegment);
          setCurrentMood(convertedMood);
        }
        
        // 4. 바로 무드스트림 생성 호출 (7개 세그먼트)
        // segments를 직접 전달하여 최신 상태 사용
        generateMoodStream(7, carolSegments);
      } catch (error) {
        console.error("[HomePage] Failed to load initial segments:", error);
        setMoodStreamData(prev => ({ ...prev, isLoading: false }));
      }
    };
    
    loadInitialSegments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]); // status가 authenticated가 되면 실행
  
  // Phase 2: 자동 생성 로직 - 8, 9, 10번째 세그먼트 도달 시 다음 스트림 자동 생성
  useEffect(() => {
    // 스트림이 로드되지 않았거나 생성 중이면 스킵
    if (moodStreamData.isLoading || moodStreamData.isGeneratingNextStream) {
      return;
    }
    
    // 세그먼트가 없으면 스킵
    if (!moodStreamData.segments || moodStreamData.segments.length === 0) {
      return;
    }
    
    const clampedTotal = 10;
    const clampedIndex = moodStreamData.currentIndex >= clampedTotal 
      ? clampedTotal - 1 
      : moodStreamData.currentIndex;
    const remainingFromClamped = clampedTotal - clampedIndex - 1;
    
    // 8, 9, 10번째 세그먼트일 때 다음 스트림(10개) 생성
    if (moodStreamData.segments.length >= 10 && 
        remainingFromClamped > 0 && 
        remainingFromClamped <= 3 &&
        !moodStreamData.isGeneratingNextStream) {
      generateMoodStream(10);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moodStreamData.currentIndex, moodStreamData.segments.length, moodStreamData.isGeneratingNextStream, moodStreamData.isLoading]);

  // 로딩 중이거나 인증되지 않은 경우 로딩 화면 표시
  if (status === "loading") {
    return (
      <div className="flex flex-col h-screen overflow-hidden relative items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="flex flex-col h-screen overflow-hidden relative items-center justify-center">
        <p className="text-red-500">Authentication required. Redirecting to login...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden relative">
      <TopNav />

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-500">Loading devices...</p>
        </div>
      ) : (
        <HomeContent
          moodState={{
            current: currentMood,
            onChange: setCurrentMood,
            onScentChange: handleScentChange,
            onSongChange: handleSongChange,
          }}
          deviceState={{
            devices,
            setDevices,
            expandedId,
            setExpandedId,
            onOpenAddModal: () => setShowAddModal(true),
            onDeleteRequest: (device: Device) => setDeviceToDelete(device),
          }}
          backgroundState={{
            params: backgroundParams,
            onChange: setBackgroundParams,
          }}
          onMoodColorChange={setHomeMoodColor}
          // Phase 4: currentSegmentData 전달
          currentSegmentData={currentSegmentData}
          onSegmentIndexChange={(index: number) => {
            setMoodStreamData(prev => {
              // 실제로 인덱스가 변경되었을 때만 업데이트하여 무한 루프 방지
              if (prev.currentIndex === index) return prev;
              return { ...prev, currentIndex: index };
            });
          }}
          onUpdateCurrentSegment={(updates) => {
            // 현재 세그먼트 업데이트
            setMoodStreamData(prev => {
              if (!prev.segments || prev.segments.length === 0) return prev;
              const updatedSegments = [...prev.segments];
              const currentSegment = updatedSegments[prev.currentIndex];
              if (currentSegment) {
                updatedSegments[prev.currentIndex] = {
                  ...currentSegment,
                  ...updates,
                };
              }
              return {
                ...prev,
                segments: updatedSegments,
              };
            });
          }}
          isLoadingMoodStream={moodStreamData.isLoading || moodStreamData.isGeneratingNextStream}
          // Phase 5: segments 배열 전달
          segments={moodStreamData.segments}
          // 새로고침 요청 핸들러: 현재 세그먼트부터 다시 생성
          onRefreshRequest={handleRefreshRequest}
        />
      )}

        <BottomNav 
          currentMood={currentMood || undefined}
          moodColor={homeMoodColor || backgroundParams?.moodColor}
          onMyPageClick={() => setShowMyPageModal(true)}
          onMoodClick={() => setShowMoodModal(true)}
        />

      {showAddModal && (
        <DeviceAddModal
          onClose={() => setShowAddModal(false)}
          onConfirm={(type: Device["type"], name?: string) => {
            addDevice(type, name, currentMood);
            setShowAddModal(false);
          }}
        />
      )}

      {deviceToDelete && (
        <DeviceDeleteModal
          device={deviceToDelete}
          onConfirm={() => {
            const updatedDevices = devices.filter((d) => d.id !== deviceToDelete.id);
            setDevices(updatedDevices);
            setDeviceToDelete(null);
            setExpandedId(null); // 확장된 카드 닫기
          }}
          onCancel={() => setDeviceToDelete(null)}
        />
      )}

      {showSurvey && (
        <SurveyOverlay
          onComplete={handleSurveyComplete}
          onSkip={handleSurveySkip}
        />
      )}

      {/* Phase 8: 모달 컴포넌트 */}
      {showMyPageModal && (
        <MyPageModal 
          isOpen={showMyPageModal} 
          onClose={() => setShowMyPageModal(false)} 
        />
      )}

      {showMoodModal && (
        <MoodModal 
          isOpen={showMoodModal} 
          onClose={() => setShowMoodModal(false)}
          onApplyMood={() => {
            // 무드 적용 후 리프레시 (필요시)
            // window.location.reload();
          }}
        />
      )}
    </div>
  );
}
