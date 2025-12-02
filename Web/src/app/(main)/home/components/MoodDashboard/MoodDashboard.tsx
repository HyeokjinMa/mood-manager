// ======================================================
// File: src/app/(main)/home/components/MoodDashboard/MoodDashboard.tsx
// ======================================================

/*
  [MoodDashboard 역할]

  무드 대시보드 컴포넌트를 제공한다. 화면 좌측 상단에 현재 무드명을 표시하고, 중앙에는 원형 앨범 아트와 음악 플레이 UI를 배치한다.
  우측 상단에는 새로고침 버튼과 무드셋 저장 버튼을 배치한다. 음악 progress bar와 컨트롤(뒤로가기/재생/멈춤/앞으로)을 제공한다.
  아래에는 스프레이 아이콘(향 변경)과 무드 지속 시간 표시(간트 차트 스타일 진행 바)를 배치한다.
  대시보드 전체 배경색은 moodColor에 opacity 50%를 반영한다.
*/

"use client";

import { useCallback } from "react";
import { MoodDashboardSkeleton } from "@/components/ui/Skeleton";
import type { Mood } from "@/types/mood";
import { useMoodDashboard } from "./hooks/useMoodDashboard";
import { useMoodStream } from "@/hooks/useMoodStream";
import { useMusicTrackPlayer } from "@/hooks/useMusicTrackPlayer";
import { useMoodColors } from "./hooks/useMoodColors";
import { useHeartAnimation } from "./hooks/useHeartAnimation";
import { useSegmentSelector } from "./hooks/useSegmentSelector";
import type { BackgroundParams } from "@/hooks/useBackgroundParams";
import { hexToRgba } from "@/lib/utils";
import MoodHeader from "./components/MoodHeader";
import ScentControl from "./components/ScentControl";
import AlbumSection from "./components/AlbumSection";
import MusicControls from "./components/MusicControls";
import MoodDuration from "./components/MoodDuration";
import HeartAnimation from "./components/HeartAnimation";

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
}: MoodDashboardProps) {
  // 무드스트림을 관리한다
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
  } = useMoodStream();
  
  // 무드 대시보드 상태 및 핸들러를 관리한다
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

  // 색상을 계산한다
  const { baseColor, accentColor, displayAlias, llmSource } = useMoodColors({
    mood,
    backgroundParams,
  });

  // 하트 애니메이션을 관리한다 (현재 세그먼트를 전달)
  const { heartAnimation, handleDashboardDoubleClick, clearHeartAnimation } = useHeartAnimation();

  // 세그먼트 선택
  const { handleSegmentSelect } = useSegmentSelector({
    moodStream,
    currentMood: mood,
    setCurrentSegmentIndex,
    onMoodChange,
    allSegmentsParams,
    setBackgroundParams,
  });

  // 음악 트랙 재생 관리 (3세그 구조)
  const {
    currentTrack,
    progress: trackProgress,
    totalProgress,
    segmentDuration,
    totalTracks,
  } = useMusicTrackPlayer({
    segment: currentSegment,
    playing,
    onSegmentEnd: () => {
      // 세그먼트 종료 시 다음 세그먼트로 전환한다
      if (moodStream && currentSegmentIndex < moodStream.segments.length - 1) {
        const nextIndex = currentSegmentIndex + 1;
        handleSegmentSelect(nextIndex);
      }
    },
  });

  // 새로고침 버튼 스피너 상태를 관리한다
  // - 스트림을 다시 불러오는 동안(isLoadingStream)
  // - LLM 배경 파라미터를 다시 만드는 동안(isLLMLoading)
  // - 다음 스트림을 백그라운드에서 생성하는 동안(isGeneratingNextStream)
  // 위 세 경우 중 하나라도 true면 스피너를 돌린다
  const isRefreshing =
    Boolean(isLLMLoading) ||
    Boolean(isGeneratingNextStream) ||
    Boolean(isLoadingStream);

  // 새로고침 버튼 핸들러를 래핑한다 (메모이제이션)
  const handleRefreshWithStream = useCallback(() => {
    refreshMoodStream(); // 무드스트림을 재생성한다
    handleRefreshClick(); // 기존 로직을 실행한다
    onRefreshRequest?.(); // HomeContent에 LLM 호출을 요청한다
  }, [refreshMoodStream, handleRefreshClick, onRefreshRequest]);

  // 로딩 중 스켈레톤을 표시한다
  // - 초기 콜드스타트 단계에서만 스켈레톤을 보여주고,
  // - 이후 새로고침/다음 스트림 생성 중에는 직전 무드를 그대로 유지한다
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
        className="rounded-xl px-3 mb-1 w-full backdrop-blur-sm border transition-all duration-500 ease-in-out"
        style={{
          // 무드 컬러를 투명도 높게 카드 배경으로 사용한다 (뒤 파티클이 비치도록)
          backgroundColor: hexToRgba(baseColor, 0.25),
          borderColor: accentColor,
          paddingTop: "11px",
          paddingBottom: "8px",
        }}
        onDoubleClick={(e) => handleDashboardDoubleClick(e, currentSegment)}
        key={`dashboard-${currentSegmentIndex}`}
      >
      <MoodHeader
        mood={{
          ...mood,
          name: displayAlias, // LLM 추천 별명을 사용한다
        }}
        isSaved={isSaved}
        // 저장/삭제 토글 핸들러를 호출한다 (인자 없이)
        onSaveToggle={setIsSaved}
        onRefresh={handleRefreshWithStream} // 무드스트림 재생성을 포함한다
        llmSource={llmSource}
        // 새로고침/스트림 생성 관련 작업이 진행되는 동안 스피너를 표시한다
        isRefreshing={isRefreshing}
        onPreferenceClick={handlePreferenceClick}
        preferenceCount={preferenceCount}
        maxReached={maxReached}
      />

      {/* V1: 향/앨범 개별 새로고침 기능은 제거하고, UI만 유지한다 (클릭 시 동작 없음) */}
      <ScentControl mood={mood} onScentClick={() => {}} moodColor={baseColor} />

      <AlbumSection 
        mood={mood}
        onAlbumClick={() => {}}
        musicSelection={backgroundParams?.musicSelection}
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
        onPlayToggle={() => setPlaying(!playing)}
        onPrevious={() => {
          // V1: 트랙 이동 대신 세그먼트 이동으로 단순화한다
          if (!moodStream) return;
          const prevIndex = Math.max(0, currentSegmentIndex - 1);
          handleSegmentSelect(prevIndex);
        }}
        onNext={() => {
          // V1: 트랙 이동 대신 세그먼트 이동으로 단순화한다
          if (!moodStream) return;
          const lastIndex = moodStream.segments.length - 1;
          const nextIndex = Math.min(lastIndex, currentSegmentIndex + 1);
          handleSegmentSelect(nextIndex);
        }}
      />

      <MoodDuration
        mood={mood}
        currentIndex={currentSegmentIndex}
        // V1: 1 스트림 = 항상 10 세그먼트로 인식되도록 고정한다
        // 실제 segments 개수가 3개뿐이어도, 사용자는 항상 10칸을 하나의 스트림으로 보게 된다
        totalSegments={10}
        onSegmentSelect={handleSegmentSelect}
        moodColorCurrent={baseColor}
        moodColorPast={accentColor}
        nextStreamAvailable={nextStreamAvailable || moodStream?.nextStreamAvailable}
        onNextStreamSelect={switchToNextStream}
        totalSegmentsIncludingNext={
          nextStreamAvailable && moodStream
            ? moodStream.segments.length + 3 // 현재 세그먼트 + 다음 스트림의 3개 세그먼트
            : undefined
        }
      />
    </div>
    </>
  );
}
