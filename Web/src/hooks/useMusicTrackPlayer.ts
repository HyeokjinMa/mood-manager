/**
 * 음악 트랙 재생 관리 훅
 * 
 * 세그먼트 내 1개 노래를 재생합니다.
 * 
 * 실제 HTML5 Audio를 사용한 오디오 재생
 */

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import type { MusicTrack, MoodStreamSegment } from "./useMoodStream/types";
import { MusicPlayer } from "@/lib/audio/musicPlayer";

interface UseMusicTrackPlayerProps {
  segment: MoodStreamSegment | null;
  playing: boolean;
  onSegmentEnd?: () => void; // 세그먼트 종료 시 호출
}

interface TrackProgress {
  progress: number; // 현재 트랙의 진행 시간 (밀리초)
}

export function useMusicTrackPlayer({
  segment,
  playing,
  onSegmentEnd,
}: UseMusicTrackPlayerProps) {
  // 세그먼트 내 음악 트랙 (1개만)
  const currentTrack: MusicTrack | null = useMemo(() => {
    if (!segment?.musicTracks || segment.musicTracks.length === 0) return null;
    return segment.musicTracks[0]; // 첫 번째 트랙만 사용
  }, [segment?.musicTracks]);

  const [trackProgress, setTrackProgress] = useState<TrackProgress>({
    progress: 0,
  });
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const musicPlayerRef = useRef<MusicPlayer | null>(null);
  const currentTrackSrcRef = useRef<string | null>(null);
  const isInitializedRef = useRef(false);

  /**
   * MusicPlayer 인스턴스 초기화 (한 번만)
   */
  useEffect(() => {
    if (typeof window === "undefined" || isInitializedRef.current) return;

    musicPlayerRef.current = new MusicPlayer();
    musicPlayerRef.current.init({
      volume: 0.7,
      fadeInDuration: 750, // 0.75초
      fadeOutDuration: 750, // 0.75초
    });
    isInitializedRef.current = true;

    return () => {
      musicPlayerRef.current?.dispose();
      musicPlayerRef.current = null;
      isInitializedRef.current = false;
    };
  }, []);

  /**
   * 세그먼트 전체 길이 계산 (1곡의 길이) - 실제 MP3 길이 사용
   */
  const segmentDuration = useMemo(() => {
    return currentTrack?.duration || 0;
  }, [currentTrack?.duration]);

  /**
   * 트랙의 실제 파일 URL 가져오기
   */
  const getTrackUrl = useCallback((track: MusicTrack): string => {
    return track.fileUrl;
  }, []);

  /**
   * 현재 트랙 재생
   * pause 후 재개 시 현재 위치에서 이어서 재생
   */
  const playCurrentTrack = useCallback(async () => {
    if (!currentTrack || !musicPlayerRef.current) return;

    const trackUrl = getTrackUrl(currentTrack);

    try {
      // 첫 번째 트랙이거나 이전 트랙과 다르면 새로 재생
      if (currentTrackSrcRef.current === null || currentTrackSrcRef.current !== trackUrl) {
        await musicPlayerRef.current.play(trackUrl, true);
        currentTrackSrcRef.current = trackUrl;
      } else {
        // 같은 트랙이면 재개만 수행 (현재 위치에서 이어서 재생)
        await musicPlayerRef.current.play(undefined, true);
      }
    } catch (error) {
      // 자동재생 실패는 조용히 처리 (사용자가 클릭하면 재생됨)
      if (error instanceof Error && error.name === "NotAllowedError") {
        return;
      }
      // 다른 에러는 조용히 처리
    }
  }, [currentTrack, getTrackUrl]);

  /**
   * 재생 시작 및 진행 시간 추적
   */
  const startPlayback = useCallback(async () => {
    // 세그먼트가 없거나 트랙이 없으면 재생하지 않음
    if (!segment || !currentTrack || !musicPlayerRef.current) return;

    // 이미 재생 중이면 중복 실행 방지
    if (intervalRef.current) return;

    // 재생 시도
    await playCurrentTrack();

    // 진행 시간 추적 시작
    intervalRef.current = setInterval(() => {
      if (!musicPlayerRef.current) return;

      const currentTime = musicPlayerRef.current.getCurrentTime() * 1000; // 밀리초로 변환
      
      // 세그먼트 종료 확인 (실제 MP3 길이 사용)
      if (segmentDuration > 0 && currentTime >= segmentDuration) {
        setTrackProgress({
          progress: segmentDuration,
        });
        
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        
        // 오디오 중지
        musicPlayerRef.current?.stop();
        currentTrackSrcRef.current = null;
        
        onSegmentEnd?.();
        return;
      }

      setTrackProgress({
        progress: currentTime,
      });
    }, 100); // 100ms마다 업데이트
  }, [segment, currentTrack, segmentDuration, onSegmentEnd, playCurrentTrack]);

  /**
   * 재생 일시정지
   */
  const pausePlayback = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    musicPlayerRef.current?.pause();
  }, []);

  /**
   * 세그먼트 변경 시 진행 상태 리셋 및 새 트랙 준비
   */
  useEffect(() => {
    if (!segment || !currentTrack) return;
    
    // 진행 시간 추적 중지
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    const trackUrl = getTrackUrl(currentTrack);
    const isNewTrack = currentTrackSrcRef.current !== trackUrl;

    // 새로운 트랙이면 이전 트랙 정리
    if (isNewTrack) {
      if (musicPlayerRef.current) {
        musicPlayerRef.current.stop();
      }
      currentTrackSrcRef.current = null;
      setTrackProgress({ progress: 0 });
    }

    // 재생 중이고 새로운 트랙이면 자동 재생 시도
    if (playing && isNewTrack) {
      const timeoutId = setTimeout(() => {
        startPlayback();
      }, 100);

      return () => {
        clearTimeout(timeoutId);
      };
    } else if (playing && !isNewTrack && !intervalRef.current) {
      // 같은 트랙이고 재생 중이면 재개
      startPlayback();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [segment?.timestamp, currentTrack?.fileUrl, playing]);

  /**
   * 재생 상태 변경 처리 (play/pause)
   */
  useEffect(() => {
    if (!segment || !currentTrack) return;
    
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
  }, [playing, segment, currentTrack, startPlayback, pausePlayback]);

  /**
   * 재생 위치 설정 (seek)
   */
  const seek = useCallback((time: number) => {
    if (!musicPlayerRef.current || !currentTrack) return;

    // 밀리초를 초로 변환
    const timeInSeconds = Math.min(time / 1000, segmentDuration / 1000);
    musicPlayerRef.current.seek(timeInSeconds);

    setTrackProgress({
      progress: time,
    });
  }, [currentTrack, segmentDuration]);

  /**
   * 현재 트랙의 남은 시간 계산
   */
  const currentTrackRemaining = currentTrack
    ? currentTrack.duration - trackProgress.progress
    : 0;

  /**
   * 크로스페이드 상태 확인
   * 페이드아웃 시작 시점: 트랙 종료 0.75초 전
   */
  const isFadingOut = currentTrack && segmentDuration > 0
    ? trackProgress.progress >= segmentDuration - (currentTrack.fadeOut || 750)
    : false;

  return {
    currentTrack,
    currentTrackIndex: 0, // 항상 0 (1곡만)
    progress: trackProgress.progress,
    totalProgress: trackProgress.progress, // 1곡이므로 progress와 동일
    segmentDuration,
    currentTrackRemaining,
    isFadingOut,
    isNextTrackFadingIn: false, // 1곡만 있으므로 항상 false
    goToNextTrack: () => {}, // 1곡만 있으므로 빈 함수
    goToPreviousTrack: () => {}, // 1곡만 있으므로 빈 함수
    seek,
    totalTracks: 1, // 항상 1
  };
}