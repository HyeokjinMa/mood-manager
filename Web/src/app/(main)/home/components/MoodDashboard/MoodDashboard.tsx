/**
 * MoodDashboard
 * 
 * 무드 대시보드 컴포넌트. 화면 좌측 상단에 현재 무드명 표시, 중앙에 원형 앨범 아트와 음악 플레이 UI 배치.
 * 우측 상단에 새로고침 버튼과 무드셋 저장 버튼 배치. 음악 progress bar와 컨트롤(뒤로가기/재생/멈춤/앞으로) 제공.
 * 아래에 스프레이 아이콘(향 변경)과 무드 지속 시간 표시(간트 차트 스타일 진행 바) 배치.
 * 대시보드 전체 배경색은 moodColor에 opacity 50% 반영.
 */

"use client";

import { useCallback, useRef, useState, useEffect, useMemo } from "react";
import { MoodDashboardSkeleton } from "@/components/ui/Skeleton";
import type { Mood } from "@/types/mood";
import { useMoodDashboard } from "./hooks/useMoodDashboard";
import { useMoodStreamContext } from "@/context/MoodStreamContext";
import { useMusicTrackPlayer } from "@/hooks/useMusicTrackPlayer";
import { useMoodColors } from "./hooks/useMoodColors";
import { useHeartAnimation } from "./hooks/useHeartAnimation";
import { useSegmentSelector } from "./hooks/useSegmentSelector";
import type { BackgroundParams } from "@/hooks/useBackgroundParams";
import { hexToRgba } from "@/lib/utils";
import { convertSegmentMoodToMood } from "./utils/moodStreamConverter";
import MoodHeader from "./components/MoodHeader";
import ScentControl from "./components/ScentControl";
import AlbumSection from "./components/AlbumSection";
import MusicControls from "./components/MusicControls";
import MoodDuration from "./components/MoodDuration";
import HeartAnimation from "./components/HeartAnimation";
import AlbumInfoModal from "./components/AlbumInfoModal";
import ScentInfoModal from "./components/ScentInfoModal";

interface MoodDashboardProps {
  mood: Mood;
  onMoodChange: (mood: Mood) => void;
  onScentChange: (mood: Mood) => void;
  onSongChange: (mood: Mood) => void;
  backgroundParams?: BackgroundParams | null;
  onRefreshRequest?: () => void;
  allSegmentsParams?: BackgroundParams[] | null;
  setBackgroundParams?: (params: BackgroundParams | null) => void;
  isLLMLoading?: boolean;
  onVolumeChange?: (volume: number) => void; // 0-100 범위
  externalVolume?: number; // 0-100 범위, 외부에서 전달받은 volume
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
  onVolumeChange,
  externalVolume,
}: MoodDashboardProps) {
  // 모달 상태 관리
  const [isAlbumModalOpen, setIsAlbumModalOpen] = useState(false);
  const [isScentModalOpen, setIsScentModalOpen] = useState(false);

  // 무드스트림 관리 (전역 Context에서 가져오기)
  const {
    moodStream,
    currentSegment,
    currentSegmentIndex,
    isLoading: isLoadingStream,
    refreshMoodStream,
    setCurrentSegmentIndex,
    switchToNextStream,
    nextStreamAvailable,
    isGeneratingNextStream,
  } = useMoodStreamContext();
  
  // 사용자 인터랙션 추적 (한 번 클릭하면 이후 자동재생 가능)
  const userInteractedRef = useRef(false);

  // 무드 대시보드 상태 및 핸들러 관리
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
    mood,
    onMoodChange,
    onScentChange,
    onSongChange,
    currentSegment,
  });

  // 색상 계산
  const { baseColor, accentColor, displayAlias } = useMoodColors({
    mood,
    backgroundParams,
  });

  // 하트 애니메이션 관리 (현재 세그먼트 전달)
  const { heartAnimation, handleDashboardClick, clearHeartAnimation } = useHeartAnimation();

  // 세그먼트 선택
  const { handleSegmentSelect } = useSegmentSelector({
    moodStream,
    currentMood: mood,
    setCurrentSegmentIndex,
    onMoodChange,
    allSegmentsParams,
    setBackgroundParams,
    // 전환 애니메이션은 V2 이후 재설계 예정이므로 현재는 사용하지 않음
    onTransitionTrigger: undefined,
  });

  // 음악 트랙 재생 관리 (3세그 구조)
  const {
    currentTrack,
    progress: trackProgress,
    totalProgress,
    segmentDuration,
    totalTracks,
    seek,
    volume,
    setVolume,
  } = useMusicTrackPlayer({
    segment: currentSegment,
    playing,
    onSegmentEnd: () => {
      // 세그먼트 종료 시 다음 세그먼트로 전환
      if (moodStream && currentSegmentIndex < moodStream.segments.length - 1) {
        const clampedTotal = 10; // 항상 10개 세그먼트로 표시
        const clampedIndex = currentSegmentIndex >= clampedTotal ? clampedTotal - 1 : currentSegmentIndex;
        
        // 10번 세그먼트(인덱스 9)가 끝나면 다음 스트림으로 전환 (인덱스 0으로 리셋)
        if (clampedIndex === 9 && moodStream.segments.length >= 10) {
          console.log("[MoodDashboard] 10번 세그먼트 종료, 다음 스트림으로 전환");
          // 다음 스트림이 생성되었는지 확인하고, 생성되었으면 인덱스 0으로 전환
          // useAutoGeneration에서 이미 다음 스트림을 생성했으므로 인덱스만 리셋
          handleSegmentSelect(0);
        } else {
          // 일반적인 경우: 다음 세그먼트로 전환
          const nextIndex = currentSegmentIndex + 1;
          handleSegmentSelect(nextIndex);
        }
      }
    },
  });

  // 외부에서 volume 변경 시 MusicPlayer에 반영 (0-100 → 0-1 변환)
  // 무한 루프 방지: ref를 사용하여 이전 값 추적
  const prevExternalVolumeRef = useRef<number | undefined>(undefined);
  useEffect(() => {
    if (externalVolume !== undefined && externalVolume !== prevExternalVolumeRef.current) {
      const volumeNormalized = externalVolume / 100; // 0-100 → 0-1
      const currentVolumePercent = Math.round(volume * 100);
      // 0.5% 이상 차이날 때만 업데이트
      if (Math.abs(externalVolume - currentVolumePercent) >= 0.5) {
        prevExternalVolumeRef.current = externalVolume;
        setVolume(volumeNormalized);
      }
    }
  }, [externalVolume, volume, setVolume]);

  // 음량 변경 시 상위 컴포넌트에 전달 (0-1 → 0-100 변환)
  // 무한 루프 방지: ref를 사용하여 이전 값 추적
  const prevVolumeRef = useRef<number | undefined>(undefined);
  useEffect(() => {
    if (onVolumeChange) {
      const volumePercent = Math.round(volume * 100);
      // externalVolume과 비교하여 실제로 변경되었을 때만 전달
      if (externalVolume === undefined || Math.abs(externalVolume - volumePercent) >= 0.5) {
        if (prevVolumeRef.current !== volumePercent) {
          prevVolumeRef.current = volumePercent;
          onVolumeChange(volumePercent);
        }
      }
    }
  }, [volume, onVolumeChange, externalVolume]);

  /**
   * 새로고침 버튼 스피너 상태 관리
   * - 스트림 다시 불러오는 동안(isLoadingStream)
   * - LLM 배경 파라미터 다시 만드는 동안(isLLMLoading)
   * - 다음 스트림 백그라운드 생성 중(isGeneratingNextStream)
   * 위 세 경우 중 하나라도 true면 스피너 표시
   */
  const isRefreshing =
    Boolean(isLLMLoading) ||
    Boolean(isGeneratingNextStream) ||
    Boolean(isLoadingStream);

  // 새로고침 버튼 핸들러 래핑 (메모이제이션)
  const handleRefreshWithStream = useCallback(() => {
    refreshMoodStream(); // 무드스트림 재생성
    handleRefreshClick(); // 기존 로직 실행
    onRefreshRequest?.(); // HomeContent에 LLM 호출 요청
  }, [refreshMoodStream, handleRefreshClick, onRefreshRequest]);

  /**
   * 로딩 중 스켈레톤 표시
   * - 초기 콜드스타트 단계에서만 스켈레톤 표시
   * - 이후 새로고침/다음 스트림 생성 중에는 직전 무드 유지
   */
  if (isLoading || (isLoadingStream && !moodStream)) {
    return <MoodDashboardSkeleton />;
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
        mood={{
          ...mood,
          name: displayAlias, // LLM 추천 별명 사용
        }}
        isSaved={isSaved}
        onSaveToggle={setIsSaved}
        onRefresh={handleRefreshWithStream}
        isRefreshing={isRefreshing}
        onPreferenceClick={handlePreferenceClick}
        preferenceCount={preferenceCount}
        maxReached={maxReached}
      />

      {/* 향/앨범 정보 모달 */}
      <ScentControl 
        mood={currentSegment ? convertSegmentMoodToMood(currentSegment.mood, mood, currentSegment) : mood} 
        onScentClick={() => setIsScentModalOpen(true)} 
        moodColor={baseColor} 
      />

      <AlbumSection 
        mood={mood}
        onAlbumClick={() => setIsAlbumModalOpen(true)}
        musicSelection={currentTrack?.title || backgroundParams?.musicSelection}
        albumImageUrl={currentTrack?.albumImageUrl}
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
        scentType={mood.scent.type}
        scentName={mood.scent.name}
      />

      <MusicControls
        mood={mood}
        progress={trackProgress}
        totalProgress={totalProgress}
        segmentDuration={segmentDuration}
        currentTrack={currentTrack}
        currentTrackIndex={0}
        totalTracks={totalTracks}
        playing={playing}
        onPlayToggle={() => {
          userInteractedRef.current = true; // 사용자 인터랙션 기록
          setPlaying(!playing);
        }}
        onPrevious={() => {
          // V1: 트랙 이동 대신 세그먼트 이동으로 단순화
          if (!moodStream) return;
          const prevIndex = Math.max(0, currentSegmentIndex - 1);
          handleSegmentSelect(prevIndex);
        }}
        onNext={() => {
          // V1: 트랙 이동 대신 세그먼트 이동으로 단순화
          if (!moodStream) return;
          const lastIndex = moodStream.segments.length - 1;
          const nextIndex = Math.min(lastIndex, currentSegmentIndex + 1);
          handleSegmentSelect(nextIndex);
        }}
        onSeek={seek}
      />

      <MoodDuration
        mood={mood}
        currentIndex={currentSegmentIndex}
        /**
         * V1: 1 스트림 = 항상 10 세그먼트로 인식되도록 고정
         * 실제 segments 개수가 3개뿐이어도, 사용자는 항상 10칸을 하나의 스트림으로 인식
         */
        totalSegments={10}
        onSegmentSelect={handleSegmentSelect}
        moodColorCurrent={baseColor}
        moodColorPast={accentColor}
        nextStreamAvailable={nextStreamAvailable || moodStream?.nextStreamAvailable}
        onNextStreamSelect={switchToNextStream}
        totalSegmentsIncludingNext={
          nextStreamAvailable && moodStream
            ? moodStream.segments.length + 10 // 현재 세그먼트 + 다음 스트림의 10개 세그먼트
            : undefined
        }
        availableSegmentsCount={moodStream?.segments?.length} // 실제 사용 가능한 세그먼트 개수 전달
      />
    </div>
    </>
  );
}
