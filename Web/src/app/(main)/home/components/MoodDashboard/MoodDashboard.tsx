// ======================================================
// File: src/app/(main)/home/components/MoodDashboard/MoodDashboard.tsx
// ======================================================

/*
  [MoodDashboard 역할]

  - 화면 좌측 상단에 현재 무드명 표시
  - 중앙에는 원형 앨범 아트 + 음악 플레이 UI
  - 우측 상단에는 '새로고침(곡 재추천)' 버튼
  - 음악 progress bar + 컨트롤(뒤로가기/재생/멈춤/앞으로)
  - 아래에는 스프레이 아이콘 (향 변경)
  - 무드 지속 시간 표시 (간트 차트 스타일 진행 바)
  - 우측 상단에 하트 아이콘 (무드셋 저장)
  - 대시보드 전체 배경색은 moodColor에 opacity 50% 반영
*/

"use client";

import { useCallback } from "react";
import { MoodDashboardSkeleton } from "@/components/ui/Skeleton";
import type { Mood } from "@/types/mood";
import { useMoodDashboard } from "./hooks/useMoodDashboard";
import { useMoodStream } from "@/hooks/useMoodStream";
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
}: MoodDashboardProps) {
  // 무드스트림 관리
  const {
    moodStream,
    currentSegment,
    currentSegmentIndex,
    isLoading: isLoadingStream,
    refreshMoodStream,
    setCurrentSegmentIndex,
  } = useMoodStream();
  
  // 무드 대시보드 상태 및 핸들러
  const {
    isLoading,
    playing,
    setPlaying,
    progress,
    isSaved,
    setIsSaved,
    handleScentClick,
    handlePreviousSong,
    handleNextSong,
    handleRefreshClick,
    handleAlbumClick,
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
  const { baseColor, accentColor, displayAlias, llmSource } = useMoodColors({
    mood,
    backgroundParams,
  });

  // 하트 애니메이션
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

  // 새로고침 버튼 핸들러 래핑 - 메모이제이션
  const handleRefreshWithStream = useCallback(() => {
    refreshMoodStream(); // 무드스트림 재생성
    handleRefreshClick(); // 기존 로직 실행
    onRefreshRequest?.(); // HomeContent에 LLM 호출 요청
  }, [refreshMoodStream, handleRefreshClick, onRefreshRequest]);

  // 로딩 중 스켈레톤 표시
  if (isLoading || isLoadingStream) {
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
        className="rounded-xl px-3 mb-1 w-full backdrop-blur-sm border"
        style={{
          // 무드 컬러를 투명도 높게 카드 배경으로 사용 (뒤 파티클이 비치도록)
          backgroundColor: hexToRgba(baseColor, 0.25),
          borderColor: accentColor,
          paddingTop: "11px",
          paddingBottom: "8px",
        }}
        onDoubleClick={handleDashboardDoubleClick}
      >
      <MoodHeader
        mood={{
          ...mood,
          name: displayAlias, // LLM 추천 별명 사용
        }}
        isSaved={isSaved}
        // 저장/삭제 토글 핸들러 (인자 없이 호출)
        onSaveToggle={setIsSaved}
        onRefresh={handleRefreshWithStream} // 무드스트림 재생성 포함
        llmSource={llmSource}
        onPreferenceClick={handlePreferenceClick}
        preferenceCount={preferenceCount}
        maxReached={maxReached}
      />

      <ScentControl mood={mood} onScentClick={handleScentClick} moodColor={baseColor} />

      <AlbumSection 
        mood={mood} 
        onAlbumClick={handleAlbumClick}
        musicSelection={backgroundParams?.musicSelection}
      />

      <MusicControls
        mood={mood}
        progress={progress}
        playing={playing}
        onPlayToggle={() => setPlaying(!playing)}
        onPrevious={handlePreviousSong}
        onNext={handleNextSong}
      />

      <MoodDuration
        mood={mood}
        currentIndex={currentSegmentIndex}
        totalSegments={moodStream?.segments.length || 10}
        onSegmentSelect={handleSegmentSelect}
        moodColorCurrent={baseColor}
        moodColorPast={accentColor}
      />
    </div>
    </>
  );
}
