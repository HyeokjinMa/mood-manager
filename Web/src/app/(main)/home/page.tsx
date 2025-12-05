// ======================================================
// File: src/app/(main)/home/page.tsx
// ======================================================

/*
  [Home Page 역할]

  - 페이지 레이아웃과 상태 관리만 담당
  - 모든 UI와 비즈니스 로직은 컴포넌트와 훅으로 분리
  - 레이아웃은 app/layout.tsx에서 375px 중앙정렬이 적용됨
  - DB에서 실제 디바이스 목록을 가져와서 표시
*/

"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import TopNav from "@/components/navigation/TopNav";
import BottomNav from "@/components/navigation/BottomNav";
import HomeContent from "./components/HomeContent";
import DeviceAddModal from "./components/Device/DeviceAddModal";
import DeviceDeleteModal from "./components/Device/DeviceDeleteModal";
import SurveyOverlay from "./components/SurveyOverlay/SurveyOverlay";
import type { Device } from "@/types/device";
import { MOODS } from "@/types/mood";
import { useDevices } from "@/hooks/useDevices";
import { useMood } from "@/hooks/useMood";
import { useSurvey } from "@/hooks/useSurvey";
import type { BackgroundParams } from "@/hooks/useBackgroundParams";

export default function HomePage() {
  const router = useRouter();
  const { status } = useSession();
  const redirectingRef = useRef(false); // 리다이렉트 중복 방지
  const lastStatusRef = useRef<string | null>(null); // 이전 상태 추적

  // 세션 체크: 로그인되지 않은 경우 로그인 페이지로 리다이렉트
  useEffect(() => {
    // 상태가 변하지 않았으면 무시 (불필요한 리렌더링 방지)
    if (lastStatusRef.current === status) {
      return;
    }
    lastStatusRef.current = status;

    // loading 상태에서는 리다이렉트하지 않음 (시크릿 모드 세션 불안정 대응)
    if (status === "loading") {
      redirectingRef.current = false;
      return;
    }

    if (status === "unauthenticated" && !redirectingRef.current) {
      redirectingRef.current = true;
      // 약간의 딜레이를 추가하여 세션 상태가 안정화될 시간을 줌
      const timer = setTimeout(() => {
        router.replace("/login");
      }, 300);
      
      return () => {
        clearTimeout(timer);
      };
    }
    
    // authenticated 상태로 돌아오면 플래그 리셋
    if (status === "authenticated") {
      redirectingRef.current = false;
    }
  }, [status, router]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [deviceToDelete, setDeviceToDelete] = useState<Device | null>(null);
  const [backgroundParams, setBackgroundParams] = useState<BackgroundParams | null>(null);

  // 초기 무드 설정 - 실제 moodStream에서 가져오므로 null로 시작
  // HomeContent에서 moodStream이 로드되면 첫 번째 세그먼트로 초기화됨
  const initialMood = null;

  // 커스텀 훅 사용
  const { devices, setDevices, addDevice, isLoading } = useDevices(null);
  const { currentMood, setCurrentMood, handleScentChange, handleSongChange } =
    useMood(null, setDevices);
  const { showSurvey, handleSurveyComplete, handleSurveySkip } = useSurvey();

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
        />
      )}

      <BottomNav 
        currentMood={currentMood} 
        moodColor={backgroundParams?.moodColor}
      />

      {showAddModal && (
        <DeviceAddModal
          onClose={() => setShowAddModal(false)}
          onConfirm={(type: Device["type"], name?: string) => {
            addDevice(type, name);
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
    </div>
  );
}
