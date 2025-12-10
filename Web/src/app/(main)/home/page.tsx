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
import { ADMIN_EMAIL } from "@/lib/auth/mockMode";
import TopNav from "@/components/navigation/TopNav";
import BottomNav from "@/components/navigation/BottomNav";
import MyPageModal from "./components/modals/MyPageModal";
import MyPageInquiryModal from "./components/modals/MyPageInquiryModal";
import MyPagePrivacyModal from "./components/modals/MyPagePrivacyModal";
import MyPageQnaModal from "./components/modals/MyPageQnaModal";
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
  const { status, data: session } = useSession();
  const redirectingRef = useRef(false); // 리다이렉트 중복 방지
  const lastStatusRef = useRef<string | null>(null); // 이전 상태 추적
  
  // 관리자 모드 확인 (사용자 ID 기반으로만 확인, 이메일만으로는 판단하지 않음)
  const isAdminMode = (session?.user as { id?: string })?.id === "admin-mock-user-id";

  /**
   * 세션 체크: 로그인되지 않은 경우 로그인 페이지로 리다이렉트
   * 상태가 변하지 않았으면 무시 (불필요한 리렌더링 방지)
   * loading 상태에서는 리다이렉트하지 않음 (시크릿 모드 세션 불안정 대응)
   * 약간의 딜레이를 추가하여 세션 상태가 안정화될 시간을 줌
   * 
   * 시크릿 모드 대응: loading 상태가 너무 오래 지속되면 타임아웃 처리
   */
  useEffect(() => {
    if (lastStatusRef.current === status) {
      return;
    }
    lastStatusRef.current = status;

    // loading 상태 타임아웃 처리 (5초 후 강제 체크)
    if (status === "loading") {
      redirectingRef.current = false;
      const timeout = setTimeout(() => {
        // 5초 후에도 loading이면 unauthenticated로 간주하고 로그인 페이지로 이동
        console.log("[HomePage] 세션 로딩 타임아웃, 로그인 페이지로 이동");
        if (!redirectingRef.current) {
          redirectingRef.current = true;
          router.replace("/login");
        }
      }, 5000);
      
      return () => {
        clearTimeout(timeout);
      };
    }

    if (status === "unauthenticated" && !redirectingRef.current) {
      redirectingRef.current = true;
      console.log("[HomePage] 인증되지 않음, 로그인 페이지로 리다이렉트");
      const timer = setTimeout(() => {
        router.replace("/login");
      }, 300);
      
      return () => {
        clearTimeout(timer);
      };
    }
    
    if (status === "authenticated") {
      redirectingRef.current = false;
      console.log("[HomePage] 인증됨, 세션 유지");
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
  const [showInquiryModal, setShowInquiryModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showQnaModal, setShowQnaModal] = useState(false);
  
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
  // currentMood를 사용하여 사용자가 변경한 값 반영
  const currentSegmentData = useMemo(() => {
    if (!moodStreamData.segments || moodStreamData.segments.length === 0) {
      return null;
    }
    
    const segment = moodStreamData.segments[moodStreamData.currentIndex];
    if (!segment) return null;
    
    // Mood 타입으로 변환
    // currentMood가 있으면 사용자 변경 값 반영, 없으면 세그먼트 기본값 사용
    const mood = convertSegmentMoodToMood(
      segment.mood,
      currentMood, // currentMood 전달하여 사용자 변경 값 반영
      segment
    );
    
    return {
      segment,
      mood,
      backgroundParams: segment.backgroundParams,
      index: moodStreamData.currentIndex,
    };
  }, [moodStreamData.segments, moodStreamData.currentIndex, currentMood]); // currentMood를 의존성에 추가
  
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
  
  // 전구 제어: currentSegmentData 변경 시 조명 정보를 저장 (라즈베리파이가 GET으로 가져감)
  // 라즈베리파이가 RGB/colortemp 판단을 하므로 모든 값을 함께 전달
  useEffect(() => {
    if (!currentSegmentData?.segment?.mood?.lighting) {
      return;
    }
    
    const lighting = currentSegmentData.segment.mood.lighting;
    const rgb = lighting.rgb;
    // brightness와 temperature는 backgroundParams에서 가져오기
    const brightness = currentSegmentData.backgroundParams?.lighting?.brightness || 50; // 0-100 범위
    const temperature = currentSegmentData.backgroundParams?.lighting?.temperature;
    
    // 모든 값을 함께 전달 (라즈베리파이가 판단)
    const requestBody: {
      r?: number;
      g?: number;
      b?: number;
      colortemp?: number;
      brightness: number;
    } = {
      brightness: Math.round((brightness / 100) * 255), // 0-100 → 0-255 변환
    };
    
    // RGB 값이 있으면 추가
    if (rgb && rgb.length === 3 && rgb[0] !== null && rgb[1] !== null && rgb[2] !== null) {
      requestBody.r = Math.round(rgb[0]);
      requestBody.g = Math.round(rgb[1]);
      requestBody.b = Math.round(rgb[2]);
    }
    
    // Color Temperature 값이 있으면 추가
    if (temperature) {
      requestBody.colortemp = Math.round(temperature);
    }
    
    // API 호출: 상태 저장 (라즈베리파이가 GET으로 가져감)
    fetch("/api/light/control", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(requestBody),
    }).catch((error) => {
      console.error("[HomePage] Failed to update light control:", error);
    });
  }, [currentSegmentData]);
  
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
        // 초기 세그먼트가 로드되면 즉시 currentMood를 설정하여 디바이스 카드에 바로 반영
        const firstSegment = carolSegments[0];
        if (firstSegment?.mood) {
          const convertedMood = convertSegmentMoodToMood(firstSegment.mood, null, firstSegment);
          setCurrentMood(convertedMood);
        }
        
        // 4. 관리자 모드가 아닐 때만 무드스트림 생성 호출 (7개 세그먼트)
        // 관리자 모드는 generateMoodStream 내부에서 목업 데이터로 즉시 반환됨
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
              
              // 인덱스 범위 체크: segments 배열 크기를 초과하지 않도록
              // 초기 3세그먼트만 있을 때는 인덱스 0, 1, 2만 접근 가능
              const maxIndex = prev.segments.length > 0 ? prev.segments.length - 1 : 0;
              const clampedIndex = Math.max(0, Math.min(index, maxIndex));
              
              // 클램핑된 인덱스가 현재 인덱스와 같으면 변경하지 않음
              if (prev.currentIndex === clampedIndex) return prev;
              
              return { ...prev, currentIndex: clampedIndex };
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
          onQnaClick={() => {
            setShowMyPageModal(false);
            setShowQnaModal(true);
          }}
          onInquiryClick={() => {
            setShowMyPageModal(false);
            setShowInquiryModal(true);
          }}
          onPrivacyClick={() => {
            setShowMyPageModal(false);
            setShowPrivacyModal(true);
          }}
        />
      )}

      <MyPageInquiryModal
        isOpen={showInquiryModal}
        onClose={() => {
          setShowInquiryModal(false);
          setShowMyPageModal(true);
        }}
      />

      <MyPagePrivacyModal
        isOpen={showPrivacyModal}
        onClose={() => {
          setShowPrivacyModal(false);
          setShowMyPageModal(true);
        }}
      />

      <MyPageQnaModal
        isOpen={showQnaModal}
        onClose={() => {
          setShowQnaModal(false);
          setShowMyPageModal(true);
        }}
      />

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
