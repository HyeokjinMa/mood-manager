/**
 * MoodDashboard
 * 
 * 무드 대시보드 컴포넌트. 화면 좌측 상단에 현재 무드명 표시, 중앙에 원형 앨범 아트와 음악 플레이 UI 배치.
 * 우측 상단에 새로고침 버튼과 무드셋 저장 버튼 배치. 음악 progress bar와 컨트롤(뒤로가기/재생/멈춤/앞으로) 제공.
 * 아래에 스프레이 아이콘(향 변경)과 무드 지속 시간 표시(간트 차트 스타일 진행 바) 배치.
 * 대시보드 전체 배경색은 moodColor에 opacity 50% 반영.
 */

"use client";

import { useCallback, useRef, useState, useEffect } from "react";
import { MoodDashboardSkeleton } from "@/components/ui/Skeleton";
import type { Mood } from "@/types/mood";
import { AlertCircle } from "lucide-react";
import { useMoodDashboard } from "./hooks/useMoodDashboard";
import { useMusicTrackPlayer } from "@/hooks/useMusicTrackPlayer";
import { useMoodColors } from "./hooks/useMoodColors";
import { useHeartAnimation } from "./hooks/useHeartAnimation";
import { useSegmentSelector } from "./hooks/useSegmentSelector";
import type { BackgroundParams } from "@/hooks/useBackgroundParams";
import type { MoodStreamSegment } from "@/hooks/useMoodStream/types";
import type { CurrentSegmentData } from "@/types/moodStream";
import { hexToRgba } from "@/lib/utils";
import MoodHeader from "./components/MoodHeader";
import ScentControl from "./components/ScentControl";
import AlbumSection from "./components/AlbumSection";
import MusicControls from "./components/MusicControls";
import MoodDuration from "./components/MoodDuration";
import HeartAnimation from "./components/HeartAnimation";
import AlbumInfoModal from "./components/AlbumInfoModal";
import ScentInfoModal from "./components/ScentInfoModal";

interface MoodDashboardProps {
  mood: Mood | null | undefined; // null/undefined 허용: 초기 세그먼트 로드 전에는 null일 수 있음
  onMoodChange: (mood: Mood) => void;
  onScentChange: (mood: Mood) => void;
  onSongChange: (mood: Mood) => void;
  backgroundParams?: BackgroundParams | null;
  onRefreshRequest?: () => void;
  allSegmentsParams?: BackgroundParams[] | null;
  setBackgroundParams?: (params: BackgroundParams | null) => void;
  isLLMLoading?: boolean;
  // ✅ Fix: volume과 onVolumeChange만 props로 받음 (단일 진실 공급원: HomePage의 useDeviceState)
  volume?: number; // 0-100 범위, HomePage의 useDeviceState volume
  onVolumeChange?: (volume: number) => void; // 0-100 범위, HomePage의 setVolume
  // Phase 5: currentSegmentData를 props로 받기
  currentSegmentData: CurrentSegmentData | null;
  onSegmentIndexChange?: (index: number) => void; // 세그먼트 인덱스 변경 콜백
  segments?: MoodStreamSegment[]; // 전체 세그먼트 배열 (세그먼트 선택용)
  isLoadingMoodStream?: boolean; // 무드스트림 로딩 상태
  // ✅ Fix: 볼륨 조작 추적 ref (DeviceControls에서 사용)
  volumeIsUserChangingRef?: React.MutableRefObject<boolean>;
}

export default function MoodDashboard({
  mood,
  onMoodChange,
  onScentChange,
  onSongChange,
  backgroundParams,
  onRefreshRequest,
  allSegmentsParams,
  setBackgroundParams,
  isLLMLoading,
  volume: externalVolume, // ✅ Fix: externalVolume 제거, volume prop 사용 (0-100 범위)
  onVolumeChange, // ✅ Fix: HomePage의 setVolume을 호출하는 핸들러
  currentSegmentData,
  onSegmentIndexChange,
  segments = [],
  isLoadingMoodStream = false,
  volumeIsUserChangingRef, // ✅ Fix: DeviceControls에서 사용할 ref
}: MoodDashboardProps) {
  // 모달 상태 관리
  const [isAlbumModalOpen, setIsAlbumModalOpen] = useState(false);
  const [isScentModalOpen, setIsScentModalOpen] = useState(false);

  // Phase 5: Context 접근 제거, props로 받은 currentSegmentData 사용
  const currentSegment = currentSegmentData?.segment || null;
  const currentSegmentIndex = currentSegmentData?.index ?? 0;
  const backgroundParamsFromSegment = currentSegmentData?.backgroundParams || backgroundParams;
  
  // effectiveSegment: currentSegment가 null일 때 currentSegmentData에서 직접 가져오기
  const effectiveSegment = currentSegment || currentSegmentData?.segment || null;
  
  // 사용자 인터랙션 추적 (한 번 클릭하면 이후 자동재생 가능)
  // React Hooks 규칙: 모든 hooks는 조건부 렌더링 전에 호출해야 함
  const userInteractedRef = useRef(false);

  // 무드 대시보드 상태 및 핸들러 관리
  // mood가 null이어도 hooks는 호출해야 함 (React Hooks 규칙)
  const {
    isLoading,
    playing,
    setPlaying,
    isSaved,
    setIsSaved,
    handleRefreshClick,
    handlePreferenceClick,
    preferenceCount,
    maxReached,
  } = useMoodDashboard({
    mood: mood, // null일 수 있음 (훅 내부에서 처리)
    onMoodChange,
    onScentChange,
    onSongChange,
    currentSegment,
  });

  // 색상 계산 (mood가 없으면 currentSegmentData?.mood 사용)
  const effectiveMood = mood || currentSegmentData?.mood;
  const { baseColor, accentColor, displayAlias } = useMoodColors({
    mood: effectiveMood,
    backgroundParams,
  });
  
  // 프로그레스 바 색상: 컬러피커로 변경된 색상이 있으면 우선 사용
  const progressBarColor = effectiveMood?.color || backgroundParams?.moodColor || baseColor;

  // 하트 애니메이션 관리 (현재 세그먼트 전달)
  const { heartAnimation, handleDashboardClick, clearHeartAnimation } = useHeartAnimation();

  // Phase 5: 세그먼트 선택 - segments와 onSegmentIndexChange 사용
  // mood가 null이어도 hooks는 호출해야 함 (React Hooks 규칙)
  const moodStreamForSelector = segments.length > 0 && mood ? {
    streamId: `stream-${Date.now()}`,
    currentMood: segments[0]?.mood || mood,
    segments: segments,
    createdAt: Date.now(),
    userDataCount: 0,
  } : null;
  
  // useSegmentSelector에 전달할 currentMood (null이면 기본값 제공)
  const segmentSelectorMood: Mood = effectiveMood || {
    id: "default",
    name: "Loading...",
    color: "#E6F3FF",
    song: { title: "", duration: 0 },
    scent: { type: "Musk" as const, name: "Default", color: "#9CAF88" },
  };
  
  const { handleSegmentSelect } = useSegmentSelector({
    moodStream: moodStreamForSelector,
    currentMood: segmentSelectorMood,
    setCurrentSegmentIndex: (index: number) => {
      onSegmentIndexChange?.(index);
    },
    onMoodChange,
    allSegmentsParams,
    setBackgroundParams,
    // 전환 애니메이션은 V2 이후 재설계 예정이므로 현재는 사용하지 않음
    onTransitionTrigger: undefined,
  });
  
  // 범위를 벗어난 세그먼트 선택 시 알림 표시
  const [showWaitingMessage, setShowWaitingMessage] = useState(false);
  const handleSegmentSelectOutOfRange = useCallback(() => {
    setShowWaitingMessage(true);
    // 3초 후 자동으로 알림 숨김
    setTimeout(() => {
      setShowWaitingMessage(false);
    }, 3000);
  }, []);

  // ✅ Fix: useMusicTrackPlayer에 HomePage의 volume과 setVolume 전달 (단일 진실 공급원)
  // externalVolume이 undefined일 경우 기본값 사용 (초기 로드 시)
  const currentVolume = externalVolume ?? 70; // 기본값 70 (0-100 범위)
  
  const {
    currentTrack,
    progress: trackProgress,
    totalProgress,
    segmentDuration,
    totalTracks,
    seek,
    volume, // ✅ Fix: useMusicTrackPlayer에서 반환된 volume (props로 전달한 값, 0-100 범위)
    setVolume, // ✅ Fix: useMusicTrackPlayer에서 반환된 setVolume (handleSetVolume 래퍼, 0-1 범위를 받아 0-100으로 변환)
  } = useMusicTrackPlayer({
    segment: effectiveSegment,
    playing,
    onSegmentEnd: () => {
      // Phase 5: 세그먼트 종료 시 다음 세그먼트로 전환
      if (segments.length > 0 && currentSegmentIndex < segments.length - 1) {
        const clampedTotal = 10; // 항상 10개 세그먼트로 표시
        const clampedIndex = currentSegmentIndex >= clampedTotal ? clampedTotal - 1 : currentSegmentIndex;
        
        // 10번 세그먼트(인덱스 9)가 끝나면 다음 스트림으로 전환 (인덱스 0으로 리셋)
        if (clampedIndex === 9 && segments.length >= 10) {
          console.log("[MoodDashboard] 10번 세그먼트 종료, 다음 스트림으로 전환");
          // 다음 스트림이 생성되었는지 확인하고, 생성되었으면 인덱스 0으로 전환
          handleSegmentSelect(0);
        } else {
          // 일반적인 경우: 다음 세그먼트로 전환
          const nextIndex = currentSegmentIndex + 1;
          handleSegmentSelect(nextIndex);
        }
      }
    },
    // ✅ Fix: HomePage의 volume과 setVolume 전달 (단일 진실 공급원)
    volume: currentVolume, // 0-100 범위
    setVolume: onVolumeChange || (() => {}), // HomePage의 setVolume (0-100 범위를 기대)
  });

  // ✅ Fix: 모든 양방향 동기화 useEffect 제거
  // 이제 useMusicTrackPlayer가 props로 받은 volume을 직접 사용하므로 동기화 로직이 필요 없음
  // HomePage의 volume 상태가 유일한 진실 공급원이므로, useMusicTrackPlayer는 이를 props로 받아 사용만 함

  /**
   * Phase 5: 새로고침 버튼 스피너 상태 관리
   * - 스트림 다시 불러오는 동안(isLoadingMoodStream)
   * - LLM 배경 파라미터 다시 만드는 동안(isLLMLoading)
   * 위 두 경우 중 하나라도 true면 스피너 표시
   */
  const isRefreshing =
    Boolean(isLLMLoading) ||
    Boolean(isLoadingMoodStream);

  // Phase 5: 새로고침 버튼 핸들러 래핑 (메모이제이션)
  const handleRefreshWithStream = useCallback(() => {
    handleRefreshClick(); // 기존 로직 실행
    onRefreshRequest?.(); // HomeContent에 LLM 호출 요청
  }, [handleRefreshClick, onRefreshRequest]);

  // mood가 null이면 스켈레톤 표시 (초기 세그먼트 로드 전)
  // 모든 hooks 호출 후에 조건부 렌더링 (React Hooks 규칙 준수)
  if (!mood) {
    return <MoodDashboardSkeleton />;
  }
  
  // 세그먼트가 없을 때만 에러 메시지 표시 (스켈레톤 대신)
  if (!currentSegment && (!segments || segments.length === 0)) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-gray-500">세그먼트를 불러오는 중...</p>
      </div>
    );
  }

  return (
    <>
      {heartAnimation && (
        <HeartAnimation
          x={heartAnimation.x}
          y={heartAnimation.y}
          onComplete={clearHeartAnimation}
        />
      )}
      <div
        className="rounded-xl px-3 mb-1 w-full backdrop-blur-sm border transition-all duration-700 ease-in-out"
        style={{
          // 무드 컬러 투명도 높게 카드 배경 사용 (뒤 파티클 비치도록)
          backgroundColor: hexToRgba(baseColor, 0.25),
          borderColor: accentColor,
          paddingTop: "11px",
          paddingBottom: "8px",
          // 세그먼트 전환 시 부드러운 페이드 효과
          opacity: isLoading ? 0.5 : 1,
          transform: isLoading ? "scale(0.98)" : "scale(1)",
        }}
        onClick={(e) => handleDashboardClick(e, currentSegment)}
        key={`dashboard-${currentSegmentIndex}`}
      >
      <MoodHeader
        mood={effectiveMood || {
          id: "default",
          name: displayAlias || "Loading...",
          color: baseColor || "#E6F3FF",
          song: { title: "", duration: 0 },
          scent: { type: "Musk" as const, name: "Default", color: "#9CAF88" },
        }}
        isSaved={isSaved}
        onSaveToggle={setIsSaved}
        onRefresh={handleRefreshWithStream}
        isRefreshing={isRefreshing}
        onPreferenceClick={handlePreferenceClick}
        preferenceCount={preferenceCount}
        maxReached={maxReached}
      />

      {/* Phase 5: 향/앨범 정보 모달 */}
      {/* mood가 없으면 렌더링하지 않음 (로딩 중) */}
      {effectiveMood && (
        <>
          <ScentControl 
            mood={effectiveMood as Mood} 
            onScentClick={() => setIsScentModalOpen(true)} 
            moodColor={baseColor} 
          />

          {/* albumImageUrl fallback: currentTrack → effectiveSegment.musicTracks */}
          <AlbumSection 
            mood={effectiveMood as Mood}
            onAlbumClick={() => setIsAlbumModalOpen(true)}
            musicSelection={currentTrack?.title || backgroundParamsFromSegment?.musicSelection || backgroundParams?.musicSelection}
            albumImageUrl={currentTrack?.albumImageUrl || effectiveSegment?.musicTracks?.[0]?.albumImageUrl}
          />

          {/* 모달 컴포넌트 */}
          <AlbumInfoModal
            isOpen={isAlbumModalOpen}
            onClose={() => setIsAlbumModalOpen(false)}
            track={currentTrack}
          />

          <ScentInfoModal
            isOpen={isScentModalOpen}
            onClose={() => setIsScentModalOpen(false)}
            scentType={effectiveMood.scent?.type || "Musk"}
            scentName={effectiveMood.scent?.name || ""}
          />

          <MusicControls
            mood={effectiveMood as Mood}
            totalProgress={totalProgress}
            segmentDuration={segmentDuration}
            currentTrack={currentTrack}
            playing={playing}
            moodColor={progressBarColor} // 무드 컬러 전달 (scent 아이콘과 동일, 컬러피커 변경 시 즉시 반영)
            onPlayToggle={() => {
              userInteractedRef.current = true; // 사용자 인터랙션 기록
              setPlaying(!playing);
            }}
            onPrevious={() => {
              // Phase 5: 트랙 이동 대신 세그먼트 이동으로 단순화
              if (segments.length === 0) return;
              const prevIndex = Math.max(0, currentSegmentIndex - 1);
              handleSegmentSelect(prevIndex);
            }}
            onNext={() => {
              // Phase 5: 트랙 이동 대신 세그먼트 이동으로 단순화
              if (segments.length === 0) return;
              const lastIndex = segments.length - 1;
              const nextIndex = Math.min(lastIndex, currentSegmentIndex + 1);
              handleSegmentSelect(nextIndex);
            }}
            onSeek={seek}
          />
        </>
      )}

      {effectiveMood && (
        <MoodDuration
          mood={effectiveMood as Mood}
          currentIndex={currentSegmentIndex}
          /**
           * V1: 1 스트림 = 항상 10 세그먼트로 인식되도록 고정
           * 실제 segments 개수가 3개뿐이어도, 사용자는 항상 10칸을 하나의 스트림으로 인식
           */
          totalSegments={10}
          onSegmentSelect={handleSegmentSelect}
          moodColorCurrent={baseColor}
          moodColorPast={accentColor}
          // Phase 5: nextStreamAvailable과 switchToNextStream은 나중에 구현
          nextStreamAvailable={false}
          onNextStreamSelect={() => {}}
          totalSegmentsIncludingNext={undefined}
          availableSegmentsCount={segments.length} // 실제 사용 가능한 세그먼트 개수 전달
          onSegmentSelectOutOfRange={handleSegmentSelectOutOfRange}
        />
      )}
      </div>
      
      {/* 범위를 벗어난 세그먼트 선택 시 알림 메시지 */}
      {showWaitingMessage && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 animate-fade-in">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-2 shadow-lg flex items-center gap-2">
            <AlertCircle className="text-yellow-600" size={18} />
            <span className="text-sm text-yellow-800">
              세그먼트 생성 중입니다. 잠시만 기다려주세요.
            </span>
          </div>
        </div>
      )}
    </>
  );
}
