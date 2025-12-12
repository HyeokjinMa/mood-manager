/**
 * Home Page
 * 
 * 페이지 레이아웃과 상태 관리만 담당
 * 모든 UI와 비즈니스 로직은 컴포넌트와 훅으로 분리
 * 레이아웃은 app/layout.tsx에서 375px 중앙정렬이 적용됨
 * DB에서 실제 디바이스 목록을 가져와서 표시
 */

"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
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
import type { Mood } from "@/types/mood";
import { useDevices } from "@/hooks/useDevices";
import { useMood } from "@/hooks/useMood";
import { useSurvey } from "@/hooks/useSurvey";
import { getInitialColdStartSegments } from "@/lib/mock/getInitialColdStartSegments";
import type { BackgroundParams } from "@/hooks/useBackgroundParams";
import { convertSegmentMoodToMood } from "./components/MoodDashboard/utils/moodStreamConverter";
import { useMoodStreamManager } from "@/hooks/useMoodStreamManager";
import { useDeviceState } from "@/hooks/useDeviceState";
import { hexToRgb } from "@/lib/utils/color";

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
  // ✅ Fix: 볼륨 조작 추적 ref (useMusicTrackPlayer의 isUserChangingRef와 동기화)
  const volumeIsUserChangingRef = useRef<boolean>(false);
  // Phase 8: 모달 상태 관리
  const [showMyPageModal, setShowMyPageModal] = useState(false);
  const [showMoodModal, setShowMoodModal] = useState(false);
  const [showInquiryModal, setShowInquiryModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showQnaModal, setShowQnaModal] = useState(false);
  
  // Phase 1 단순화: 무드스트림 관리 훅 사용
  const isAuthenticated = status === "authenticated";
  console.log("[HomePage] 🔍 인증 상태:", {
    status,
    isAuthenticated,
  });
  
  // 초기 세그먼트를 먼저 동기적으로 로드하여 currentMood 즉시 설정
  // 초기 세그먼트는 하드코딩되어 있어서 동기적으로 즉시 로드 가능
  const initialSegments = useMemo(() => {
    return getInitialColdStartSegments();
  }, []);
  
  // 첫 번째 초기 세그먼트에서 currentMood 즉시 설정
  const initialMood = useMemo((): Mood | null => {
    const firstSegment = initialSegments[0];
    if (firstSegment?.mood) {
      return convertSegmentMoodToMood(firstSegment.mood, null, firstSegment);
    }
    return null;
  }, [initialSegments]);
  
  // 디바이스 정보는 초기 세그먼트와 병렬로 로드
  // setDevices는 useMood에서 사용되므로 먼저 선언
  // useDevices는 segments와 currentSegmentIndex를 props로 받지만,
  // 내부 useEffect에서 segments 변경을 감지하여 자동 업데이트됨
  // currentBrightness는 나중에 계산되므로 useDevices 내부에서 처리
  const { devices, setDevices, addDevice } = useDevices(
    initialMood, // 초기 currentMood 전달 (Mood | null)
    initialSegments, // 초기 세그먼트 전달
    0 // 초기 인덱스
  );
  
  const { currentMood, setCurrentMood, handleScentChange, handleSongChange } =
    useMood(initialMood, setDevices);
  
  // 초기 세그먼트는 이미 로드되었으므로 useMoodStreamManager에 전달
  // LLM 생성은 백그라운드에서 진행되며, 초기 세그먼트 표시를 막지 않음
  const {
    moodStreamData,
    setMoodStreamData,
    handleRefreshRequest,
  } = useMoodStreamManager({
    isAuthenticated, // LLM 자동 생성에만 사용 (초기 세그먼트 로드와 무관)
    initialSegments, // 이미 로드된 초기 세그먼트 전달
    onInitialSegmentsLoaded: (firstSegment) => {
      // 이미 currentMood가 설정되었지만 일관성을 위해 유지
      if (firstSegment?.mood && !currentMood) {
        const convertedMood = convertSegmentMoodToMood(firstSegment.mood, null, firstSegment);
        setCurrentMood(convertedMood);
      }
    },
  });
  
  // useDevices는 내부적으로 useEffect로 segments 변경을 감지하므로 여기서는 전달만 하면 됨
  const { showSurvey, handleSurveyComplete, handleSurveySkip } = useSurvey();
  
  // Phase 2 단순화: 디바이스 상태 관리 훅 사용
  // ✅ Fix: devices와 setDevices 전달 (즉시 상태 업데이트를 위해)
  const { volume, setVolume, handleDeviceControlChange } = useDeviceState({
    currentMood,
    setCurrentMood,
    initialVolume: 70,
    devices, // ✅ Fix: 전달
    setDevices, // ✅ Fix: 전달
  });
  
  // Phase 6: currentMood가 변경되면 useDevices에 전달하기 위해
  // useDevices를 다시 호출하는 대신, useEffect로 segments와 currentSegmentIndex를 업데이트
  // 하지만 useDevices는 이미 segments와 currentSegmentIndex를 props로 받고 있으므로
  // 추가 작업이 필요 없음 (useDevices 내부 useEffect가 자동으로 반응함)
  
  // Phase 3: 현재 세그먼트 통합 데이터 제공 함수
  // currentMood를 사용하여 사용자가 변경한 값 반영
  const currentSegmentData = useMemo(() => {
    // 1. moodStreamData.segments가 있으면 우선 사용
    if (moodStreamData.segments && moodStreamData.segments.length > 0) {
      const segment = moodStreamData.segments[moodStreamData.currentIndex];
      if (segment) {
        // Mood 타입으로 변환
        const mood = convertSegmentMoodToMood(
          segment.mood,
          currentMood, // currentMood 전달하여 사용자 변경 값 반영
          segment
        );
        
        const segmentData = {
          segment,
          mood,
          backgroundParams: segment.backgroundParams,
          index: moodStreamData.currentIndex,
        };
        
        console.log("[HomePage] ✅ currentSegmentData 생성 (moodStreamData.segments):", {
          index: segmentData.index,
          moodName: segmentData.mood.name,
          moodColor: segmentData.mood.color,
          hasBackgroundParams: !!segmentData.backgroundParams,
          hasMusicTracks: !!segment.musicTracks?.length,
        });
        
        return segmentData;
      }
    }
    
    // 2. fallback: initialSegments 사용 (초기 로딩 시)
    if (initialSegments && initialSegments.length > 0) {
      const segment = initialSegments[0];
      if (segment?.mood) {
        const mood = convertSegmentMoodToMood(segment.mood, currentMood, segment);
        const segmentData = {
          segment,
          mood,
          backgroundParams: segment.backgroundParams,
          index: 0,
        };
        
        console.log("[HomePage] ✅ currentSegmentData 생성 (initialSegments fallback):", {
          index: segmentData.index,
          moodName: segmentData.mood.name,
          moodColor: segmentData.mood.color,
        });
        
        return segmentData;
      }
    }
    
    console.log("[HomePage] ⚠️ currentSegmentData: segments가 비어있음");
    return null;
  }, [moodStreamData.segments, moodStreamData.currentIndex, currentMood, initialSegments]); // initialSegments를 의존성에 추가

  // currentBrightness는 useDevices 내부에서 처리됨
  
  // Phase 3-1: localStorage에서 저장된 색상 복원 (초기 로드 시)
  useEffect(() => {
    if (!moodStreamData.segments || moodStreamData.segments.length === 0) return;
    
    try {
      const restoredSegments = moodStreamData.segments.map((segment, index) => {
        const storageKey = `mood-segment-${index}-color`;
        const savedColor = localStorage.getItem(storageKey);
        if (savedColor && segment.mood) {
          console.log(`[HomePage] 🔄 세그먼트 ${index} 색상 복원:`, savedColor);
          return {
            ...segment,
            mood: {
              ...segment.mood,
              color: savedColor,
              // lighting이 있으면 color 업데이트, 없으면 기존 구조 유지
              ...(segment.mood.lighting && {
                lighting: {
                  ...segment.mood.lighting,
                  color: savedColor,
                },
              }),
            },
          };
        }
        return segment;
      });
      
      // 복원된 색상이 있으면 세그먼트 업데이트
      const hasChanges = restoredSegments.some((seg, idx) => 
        seg.mood?.color !== moodStreamData.segments[idx]?.mood?.color
      );
      
      if (hasChanges) {
        setMoodStreamData(prev => ({ 
          ...prev, 
          segments: restoredSegments as typeof prev.segments 
        }));
      }
    } catch (error) {
      console.warn("[HomePage] Failed to restore colors from localStorage:", error);
    }
  }, [moodStreamData.segments.length]); // 세그먼트 개수만 추적하여 초기 로드 시 한 번만 실행

  // Phase 3: currentSegmentData 변경 시 currentMood 업데이트 (무한 루프 방지)
  const prevMoodIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (currentSegmentData?.mood) {
      // mood.id가 변경되었을 때만 업데이트하여 무한 루프 방지
      if (prevMoodIdRef.current !== currentSegmentData.mood.id) {
        prevMoodIdRef.current = currentSegmentData.mood.id;
        console.log("[HomePage] ✅ currentMood 업데이트 (currentSegmentData에서):", {
          id: currentSegmentData.mood.id,
          name: currentSegmentData.mood.name,
          color: currentSegmentData.mood.color,
        });
        setCurrentMood(currentSegmentData.mood);
      }
    } else {
      console.log("[HomePage] ⚠️ currentSegmentData.mood가 없음, currentMood 업데이트 스킵");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSegmentData?.mood?.id, setCurrentMood]);
  // 의도: mood.id만 추적하여 무한 루프 방지 (prevMoodIdRef로 id 변경 시에만 업데이트)
  
  // 전구 제어: currentMood 또는 currentSegmentData 변경 시 조명 정보를 저장 (라즈베리파이가 GET으로 가져감)
  // 세그먼트 변경 시 자동으로 light_power를 "on"으로 설정하고 light_info 전달
  // currentMood.color가 있으면 우선 사용 (사용자가 변경한 색상), 없으면 segment.mood.color에서 변환
  useEffect(() => {
    if (!currentSegmentData?.segment?.mood) {
      console.log("[HomePage] ⚠️ currentSegmentData.segment.mood가 없음, light_info 전달 스킵");
      return;
    }
    
    console.log("[HomePage] 🔍 세그먼트 변경 감지 → light_info 업데이트 시작", {
      segmentIndex: currentSegmentData.index,
      moodColor: currentSegmentData.segment.mood.color,
      currentMoodColor: currentMood?.color,
      brightness: currentSegmentData.backgroundParams?.lighting?.brightness,
    });
    
    // ✅ 세그먼트 변경 시 자동으로 light_power를 "on"으로 설정
    fetch("/api/light_power", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ power: "on" }),
    })
      .then((response) => {
        if (!response.ok) {
          console.log("[HomePage] ⚠️ light_power 설정 실패, light_info 전달 건너뜀");
          return null;
        }
        return response.json();
      })
      .then((powerData) => {
        console.log("[HomePage] ✅ light_power 자동 설정: on", powerData);
        
        // brightness와 temperature는 backgroundParams에서 가져오기
        const brightness = currentSegmentData.backgroundParams?.lighting?.brightness || 50; // 0-100 범위
        const temperature = currentSegmentData.backgroundParams?.lighting?.temperature;
        
        // 모든 값을 함께 전달 (라즈베리파이가 판단)
        const requestBody: {
          r?: number;
          g?: number;
          b?: number;
          colortemp?: number;
          brightness?: number;
        } = {};
        
        // Brightness 값이 있으면 추가
        if (brightness !== undefined) {
          requestBody.brightness = Math.round((brightness / 100) * 255); // 0-100 → 0-255 변환
        }
        
        // RGB 값 결정: currentMood.color 우선 (사용자 변경 값), 없으면 segment.mood.color에서 변환
        let rgb: number[] | null = null;
        if (currentMood?.color) {
          // currentMood.color (hex)를 RGB로 변환
          rgb = hexToRgb(currentMood.color);
          console.log("[HomePage] currentMood.color 사용 (사용자 변경 값):", currentMood.color, "→ RGB:", rgb);
        } else {
          // segment의 moodColor를 RGB로 변환 (스키마에서 lighting.rgb 제거됨)
          const segmentColor = currentSegmentData.segment.mood.color;
          if (segmentColor) {
            rgb = hexToRgb(segmentColor);
            console.log("[HomePage] segment.mood.color 사용 (원본 값):", segmentColor, "→ RGB:", rgb);
          } else {
            console.warn("[HomePage] ⚠️ 색상 값이 없음, RGB 변환 스킵");
          }
        }
        
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
        
        // ✅ API 호출: 전구 정보 업데이트 (메모리에 저장)
        console.log("[HomePage] ✅ 세그먼트 변경 → light_info 전달:", requestBody);
        return fetch("/api/light_info", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(requestBody),
        });
      })
      .then((response) => {
        if (response && response.ok) {
          console.log("[HomePage] ✅ light_info 업데이트 완료");
          return response.json();
        }
        return null;
      })
      .then((data) => {
        if (data) {
          console.log("[HomePage] ✅ light_info 응답:", data);
        }
      })
      .catch((error) => {
        console.error("[HomePage] ❌ light_info 업데이트 에러:", error);
      });
  }, [currentSegmentData, currentMood?.color]); // currentMood.color도 의존성에 추가

  // Phase 2 단순화: 디바이스 컨트롤 변경 로직은 useDeviceState 훅에서 처리
  
  // Phase 1 단순화: 무드스트림 생성 및 자동 생성 로직은 useMoodStreamManager 훅에서 처리

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

      {/* 디바이스 정보와 초기 세그먼트는 병렬로 로드 */}
      {/* 초기 세그먼트는 즉시 표시, 디바이스는 로드되는 대로 추가 */}
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
                
                // ✅ 색상 변경 시 localStorage에 저장 (웹앱 재시작 시 복원)
                if (updates.mood?.color) {
                  try {
                    const storageKey = `mood-segment-${prev.currentIndex}-color`;
                    localStorage.setItem(storageKey, updates.mood.color);
                    console.log(`[HomePage] 💾 세그먼트 ${prev.currentIndex} 색상 저장:`, updates.mood.color);
                  } catch (error) {
                    console.warn("[HomePage] Failed to save color to localStorage:", error);
                  }
                }
              }
              return {
                ...prev,
                segments: updatedSegments,
              };
            });
          }}
          // LLM 생성 중이어도 초기 세그먼트는 이미 표시되어 있으므로 UI를 막지 않음
          // isLoadingMoodStream은 스피너 표시용으로만 사용 (UI 블로킹 아님)
          isLoadingMoodStream={moodStreamData.isGeneratingNextStream} // isLoading 제거: 초기 세그먼트 로드는 즉시 완료
          // Phase 5: segments 배열 전달
          segments={moodStreamData.segments}
          // 새로고침 요청 핸들러: 현재 세그먼트부터 다시 생성
          onRefreshRequest={handleRefreshRequest}
          // 디바이스 컨트롤 변경 핸들러: 전구 API 업데이트
          onDeviceControlChange={handleDeviceControlChange}
          // 음량 전달 (오디오 플레이어에 즉시 반영)
          volume={volume}
          onVolumeChange={(newVolume) => {
            setVolume(newVolume);
            console.log(`[HomePage] 🔊 음량 변경 (MoodDashboard에서): ${newVolume}%`);
          }}
          // ✅ Fix: 볼륨 조작 추적 ref 전달 (MoodDashboard와 동기화)
          volumeIsUserChangingRef={volumeIsUserChangingRef}
        />

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
            // 현재 세그먼트의 brightness 정보를 포함하여 전달
            const brightness = currentSegmentData?.backgroundParams?.lighting?.brightness || 50;
            const deviceMood = currentMood ? {
              ...currentMood,
              brightness, // brightness 정보 추가
            } : null;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            addDevice(type, name, deviceMood as any);
            setShowAddModal(false);
          }}
        />
      )}

      {deviceToDelete && (
        <DeviceDeleteModal
          device={deviceToDelete}
          onConfirm={async () => {
            try {
              // API 호출로 DB에서 삭제
              const response = await fetch(`/api/devices/${deviceToDelete.id}`, {
                method: "DELETE",
                credentials: "include",
              });

              if (!response.ok) {
                const error = await response.json();
                console.error("[HomePage] 디바이스 삭제 실패:", error);
                // 에러 토스트 메시지 표시 (react-hot-toast 사용 시)
                // toast.error("디바이스 삭제에 실패했습니다.");
                alert("디바이스 삭제에 실패했습니다.");
                return;
              }

              // 성공 시 UI 업데이트
              const updatedDevices = devices.filter((d) => d.id !== deviceToDelete.id);
              setDevices(updatedDevices);
              setDeviceToDelete(null);
              setExpandedId(null); // 확장된 카드 닫기
              console.log("[HomePage] ✅ 디바이스 삭제 완료:", deviceToDelete.id);
            } catch (error) {
              console.error("[HomePage] 디바이스 삭제 에러:", error);
              alert("디바이스 삭제 중 오류가 발생했습니다.");
            }
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
