/**
 * 음악 트랙 재생 관리 훅
 * 
 * 세그먼트 내 3개 노래를 순차적으로 재생하고,
 * 크로스페이드 전환을 처리합니다.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import type { MusicTrack, MoodStreamSegment } from "./useMoodStream/types";

interface UseMusicTrackPlayerProps {
  segment: MoodStreamSegment | null;
  playing: boolean;
  onSegmentEnd?: () => void; // 세그먼트 종료 시 호출
}

interface TrackProgress {
  currentTrackIndex: number; // 현재 재생 중인 트랙 인덱스 (0-2)
  progress: number; // 현재 트랙의 진행 시간 (밀리초)
  totalProgress: number; // 세그먼트 전체 진행 시간 (밀리초)
}

export function useMusicTrackPlayer({
  segment,
  playing,
  onSegmentEnd,
}: UseMusicTrackPlayerProps) {
  // 세그먼트 내 음악 트랙 배열을 안전하게 래핑
  const segmentTracks: MusicTrack[] = segment?.musicTracks ?? [];

  const [trackProgress, setTrackProgress] = useState<TrackProgress>({
    currentTrackIndex: 0,
    progress: 0,
    totalProgress: 0,
  });
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedProgressRef = useRef<number>(0);

  /**
   * 현재 재생 중인 트랙 가져오기
   */
  const currentTrack =
    segmentTracks[trackProgress.currentTrackIndex] || null;

  /**
   * 세그먼트 전체 길이 계산
   */
  const segmentDuration = segmentTracks.length
    ? segmentTracks.reduce((sum, track) => sum + track.duration, 0)
    : 0;

  /**
   * 재생 시작
   */
  const startPlayback = useCallback(() => {
    // 세그먼트가 없거나 트랙이 없으면 재생하지 않음
    if (!segment || !playing || segmentTracks.length === 0) return;

    const now = Date.now();
    startTimeRef.current = now - pausedProgressRef.current;

    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      
      // 현재 트랙의 진행 시간 계산
      let currentTrackProgress = 0;
      let currentTrackIndex = 0;
      let accumulatedTime = 0;

      for (let i = 0; i < segmentTracks.length; i++) {
        const track = segmentTracks[i];
        const trackEndTime = accumulatedTime + track.duration;

        if (elapsed < trackEndTime) {
          currentTrackIndex = i;
          currentTrackProgress = elapsed - accumulatedTime;
          break;
        }

        accumulatedTime = trackEndTime;
      }

      // 세그먼트 종료 확인
      if (elapsed >= segmentDuration) {
        setTrackProgress({
          currentTrackIndex: Math.max(segmentTracks.length - 1, 0),
          progress:
            segmentTracks.length > 0
              ? segmentTracks[segmentTracks.length - 1].duration
              : 0,
          totalProgress: segmentDuration,
        });
        
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        
        onSegmentEnd?.();
        return;
      }

      setTrackProgress({
        currentTrackIndex,
        progress: currentTrackProgress,
        totalProgress: elapsed,
      });
    }, 100); // 100ms마다 업데이트
  }, [segment, playing, segmentDuration, onSegmentEnd]);

  /**
   * 재생 일시정지
   */
  const pausePlayback = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    pausedProgressRef.current = trackProgress.totalProgress;
  }, [trackProgress.totalProgress]);

  /**
   * 재생 상태 변경 처리
   */
  useEffect(() => {
    if (playing) {
      startPlayback();
    } else {
      pausePlayback();
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [playing, startPlayback, pausePlayback]);

  /**
   * 세그먼트 변경 시 진행 상태 리셋
   */
  useEffect(() => {
    setTrackProgress({
      currentTrackIndex: 0,
      progress: 0,
      totalProgress: 0,
    });
    pausedProgressRef.current = 0;
    startTimeRef.current = 0;
  }, [segment?.timestamp]);

  /**
   * 다음 트랙으로 이동
   */
  const goToNextTrack = useCallback(() => {
    if (!segment || segmentTracks.length === 0) return;

    const nextIndex = trackProgress.currentTrackIndex + 1;
    if (nextIndex < segmentTracks.length) {
      // 다음 트랙의 시작 시점으로 이동
      const newProgress = segmentTracks
        .slice(0, nextIndex)
        .reduce((sum, track) => sum + track.duration, 0);
      
      pausedProgressRef.current = newProgress;
      startTimeRef.current = Date.now() - newProgress;
      
      setTrackProgress({
        currentTrackIndex: nextIndex,
        progress: 0,
        totalProgress: newProgress,
      });
    } else {
      // 마지막 트랙이면 세그먼트 종료
      onSegmentEnd?.();
    }
  }, [segment, trackProgress.currentTrackIndex, onSegmentEnd]);

  /**
   * 이전 트랙으로 이동
   */
  const goToPreviousTrack = useCallback(() => {
    if (!segment || segmentTracks.length === 0) return;

    const prevIndex = trackProgress.currentTrackIndex - 1;
    if (prevIndex >= 0) {
      // 이전 트랙의 시작 시점으로 이동
      const newProgress = segmentTracks
        .slice(0, prevIndex)
        .reduce((sum, track) => sum + track.duration, 0);
      
      pausedProgressRef.current = newProgress;
      startTimeRef.current = Date.now() - newProgress;
      
      setTrackProgress({
        currentTrackIndex: prevIndex,
        progress: 0,
        totalProgress: newProgress,
      });
    } else {
      // 첫 번째 트랙이면 세그먼트 시작으로 이동
      pausedProgressRef.current = 0;
      startTimeRef.current = Date.now();
      
      setTrackProgress({
        currentTrackIndex: 0,
        progress: 0,
        totalProgress: 0,
      });
    }
  }, [segment, trackProgress.currentTrackIndex]);

  /**
   * 현재 트랙의 남은 시간 계산
   */
  const currentTrackRemaining = currentTrack
    ? currentTrack.duration - trackProgress.progress
    : 0;

  /**
   * 크로스페이드 상태 확인
   * 페이드아웃 시작 시점: 트랙 종료 2초 전
   */
  const isFadingOut = currentTrack
    ? trackProgress.progress >= currentTrack.duration - (currentTrack.fadeOut || 2000)
    : false;

  /**
   * 다음 트랙 페이드인 시작 시점 확인
   */
  const isNextTrackFadingIn = currentTrack && trackProgress.currentTrackIndex < segmentTracks.length - 1
    ? trackProgress.progress >= currentTrack.duration - (currentTrack.fadeOut || 2000)
    : false;

  return {
    currentTrack,
    currentTrackIndex: trackProgress.currentTrackIndex,
    progress: trackProgress.progress,
    totalProgress: trackProgress.totalProgress,
    segmentDuration,
    currentTrackRemaining,
    isFadingOut,
    isNextTrackFadingIn,
    goToNextTrack,
    goToPreviousTrack,
    totalTracks: segmentTracks.length,
  };
}

