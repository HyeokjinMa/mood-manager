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
  // ✅ Fix: HomePage로부터 받은 volume과 setVolume (0-100 범위)
  volume: number; // 0-100 범위, HomePage의 useDeviceState volume
  setVolume: (v: number) => void; // HomePage의 setVolume (0-100 범위를 기대)
}

interface TrackProgress {
  progress: number; // 현재 트랙의 진행 시간 (밀리초)
}

export function useMusicTrackPlayer({
  segment,
  playing,
  onSegmentEnd,
  volume, // ✅ Fix: props로 받은 volume (0-100 범위)
  setVolume, // ✅ Fix: props로 받은 setVolume (0-100 범위를 기대)
}: UseMusicTrackPlayerProps) {
  // 세그먼트 내 음악 트랙 (1개만)
  const currentTrack: MusicTrack | null = useMemo(() => {
    if (!segment?.musicTracks || segment.musicTracks.length === 0) return null;
    return segment.musicTracks[0]; // 첫 번째 트랙만 사용
  }, [segment?.musicTracks]);

  const [trackProgress, setTrackProgress] = useState<TrackProgress>({
    progress: 0,
  });
  
  // ✅ Fix: 내부 volume 상태 제거 - props로 받은 volume 사용
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const musicPlayerRef = useRef<MusicPlayer | null>(null);
  const currentTrackSrcRef = useRef<string | null>(null);
  const isInitializedRef = useRef(false);
  // ✅ Fix: onSegmentEnd를 ref로 감싸서 useEffect 의존성에서 제거 (안정화)
  const onSegmentEndRef = useRef(onSegmentEnd);
  
  // onSegmentEnd가 변경될 때마다 ref 업데이트
  useEffect(() => {
    onSegmentEndRef.current = onSegmentEnd;
  }, [onSegmentEnd]);

  /**
   * MusicPlayer 인스턴스 초기화 (한 번만)
   * ✅ Fix: volume을 의존성에서 제거하여 볼륨 변경 시 재초기화되지 않도록 함
   */
  useEffect(() => {
    if (typeof window === "undefined" || isInitializedRef.current) return;

    musicPlayerRef.current = new MusicPlayer();
    // 초기 볼륨 설정: localStorage에서 가져오거나 기본값 사용 (0.7 = 70%)
    let initialVolumeNormalized = 0.7;
    try {
      const savedVolume = localStorage.getItem("mood-manager:music-volume");
      if (savedVolume) {
        initialVolumeNormalized = parseFloat(savedVolume);
        if (isNaN(initialVolumeNormalized) || initialVolumeNormalized < 0 || initialVolumeNormalized > 1) {
          initialVolumeNormalized = 0.7;
        }
      }
    } catch (error) {
      console.warn("[useMusicTrackPlayer] Failed to load volume from localStorage:", error);
    }
    
    musicPlayerRef.current.init({
      volume: initialVolumeNormalized,
      fadeInDuration: 750, // 0.75초
      fadeOutDuration: 750, // 0.75초
    });
    isInitializedRef.current = true;

    return () => {
      musicPlayerRef.current?.dispose();
      musicPlayerRef.current = null;
      isInitializedRef.current = false;
    };
  }, []); // ✅ Fix: 빈 배열로 1회 실행 보장 (volume 변경 시 재초기화 방지)

  /**
   * 음량 설정 함수 (UI 컴포넌트에서 호출 시 사용)
   * ✅ Fix: 내부 상태 대신 props로 받은 setVolume (HomePage의 setVolume) 호출
   */
  const handleSetVolume = useCallback((newVolume: number) => {
    // newVolume은 0-1 범위로 들어옴
    const clampedVolume = Math.max(0, Math.min(1, newVolume));
    
    // ✅ Fix: HomePage의 setVolume은 0-100 범위를 기대하므로 변환하여 전달
    // props에서 받은 setVolume 사용
    setVolume(Math.round(clampedVolume * 100));
    
    // localStorage에 저장 (0-1 범위로 저장)
    try {
      localStorage.setItem("mood-manager:music-volume", clampedVolume.toString());
    } catch (error) {
      console.warn("[useMusicTrackPlayer] Failed to save volume to localStorage:", error);
    }
  }, [setVolume]); // ✅ props의 setVolume을 의존성에 포함

  /**
   * 음량 변경 시 MusicPlayer에 반영 (HomePage의 상태 추적)
   * ✅ Fix: props volume (0-100)을 0-1 범위로 변환하여 MusicPlayer에 전달
   */
  useEffect(() => {
    if (musicPlayerRef.current) {
      const volumeNormalized = volume / 100; // 0-100 → 0-1
      musicPlayerRef.current.setVolume(volumeNormalized);
    }
  }, [volume]); // ✅ Fix: props volume 추적

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
   * 재생 시작 (setInterval은 useEffect에서 관리)
   */
  const startPlayback = useCallback(async () => {
    // 세그먼트가 없거나 트랙이 없으면 재생하지 않음
    if (!segment || !currentTrack || !musicPlayerRef.current) return;

    // 오디오 종료 이벤트 리스너 설정
    musicPlayerRef.current.setOnEnded(() => {
      console.log("[useMusicTrackPlayer] Audio ended, triggering segment end");
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      // ✅ 함수형 업데이트 사용
      setTrackProgress((prev) => {
        if (prev.progress >= segmentDuration) return prev;
        return { progress: segmentDuration };
      });
      currentTrackSrcRef.current = null;
      // ✅ ref를 통해 호출 (의존성 배열에서 제거)
      onSegmentEndRef.current?.();
    });

    // ✅ Fix: timeupdate 이벤트 리스너 설정 (오디오의 currentTime이 변경될 때마다 자동 호출)
    musicPlayerRef.current.setOnTimeUpdate((currentTimeSeconds: number) => {
      const currentTime = currentTimeSeconds * 1000; // 밀리초로 변환
      
      // 세그먼트 종료 확인
      if (segmentDuration > 0 && currentTime >= segmentDuration) {
        setTrackProgress((prev) => {
          if (prev.progress >= segmentDuration) return prev;
          return { progress: segmentDuration };
        });
        return;
      }
      
      // 진행 시간 업데이트
      setTrackProgress((prev) => {
        if (prev.progress === currentTime) {
          return prev; // 값이 같으면 업데이트하지 않음
        }
        console.log("[useMusicTrackPlayer] ✅ timeupdate 이벤트로 진행 바 업데이트:", {
          prev: Math.round(prev.progress),
          current: Math.round(currentTime),
        });
        return { progress: currentTime };
      });
    });

    // 재생 시도만 수행 (setInterval은 useEffect에서 관리)
    await playCurrentTrack();
  }, [segment, currentTrack, segmentDuration, playCurrentTrack]); // ✅ onSegmentEnd 제거

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
   * ✅ Fix: 진행 시간 추적을 위한 별도의 useEffect (startPlayback에서 분리)
   * playing 상태와 재생 중일 때만 interval 실행
   */
  useEffect(() => {
    console.log("[useMusicTrackPlayer] 진행 바 추적 useEffect 실행:", {
      playing,
      hasSegment: !!segment,
      hasCurrentTrack: !!currentTrack,
      hasMusicPlayer: !!musicPlayerRef.current,
      hasInterval: !!intervalRef.current,
    });

    if (!playing || !segment || !currentTrack || !musicPlayerRef.current) {
      // 재생 중이 아니면 interval 정리
      if (intervalRef.current) {
        console.log("[useMusicTrackPlayer] 진행 바 추적 중지 (조건 불만족)");
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // 이미 interval이 있으면 중복 생성 방지
    if (intervalRef.current) {
      console.log("[useMusicTrackPlayer] 진행 바 추적 interval 이미 실행 중");
      return;
    }

    console.log("[useMusicTrackPlayer] 진행 바 추적 interval 시작");

    // 진행 시간 추적 시작 (백업용, ended 이벤트가 실패할 경우 대비)
    intervalRef.current = setInterval(() => {
      // ✅ Fix: ref를 통한 최신 musicPlayerRef 참조 보장
      const player = musicPlayerRef.current;
      if (!player) {
        console.warn("[useMusicTrackPlayer] interval: musicPlayerRef.current가 null");
        return;
      }

      try {
        // 실제 재생 상태 확인
        const isActuallyPlaying = player.isPlaying?.() ?? false;
        const currentTimeSeconds = player.getCurrentTime();
        const duration = player.getDuration?.() ?? 0;
        
        // ✅ Fix: NaN이나 유효하지 않은 값 체크
        if (isNaN(currentTimeSeconds) || !isFinite(currentTimeSeconds)) {
          console.warn("[useMusicTrackPlayer] ⚠️ currentTime이 유효하지 않음:", currentTimeSeconds);
          return;
        }
        
        const currentTime = currentTimeSeconds * 1000; // 밀리초로 변환
        
        // ✅ Fix: currentTime이 음수이거나 유효하지 않으면 무시
        if (currentTime < 0) {
          return;
        }
        
        // 디버깅: 매번 로그 출력 (문제 진단용)
        console.log("[useMusicTrackPlayer] interval 실행:", {
          currentTime: Math.round(currentTime),
          currentTimeSeconds,
          segmentDuration,
          duration,
          isActuallyPlaying,
          hasAudioElement: !!player.getCurrentSrc(),
        });
        
        // 재생 중이 아닌데 interval이 실행 중이면 경고
        if (!isActuallyPlaying && currentTime === 0) {
          console.warn("[useMusicTrackPlayer] ⚠️ 오디오가 재생 중이 아닌데 interval이 실행됨");
        }
        
        // 세그먼트 종료 확인 (실제 MP3 길이 사용)
        // ended 이벤트가 먼저 발생하지만, 백업으로 체크
        if (segmentDuration > 0 && currentTime >= segmentDuration) {
          // ✅ 함수형 업데이트 사용하여 무한 루프 방지
          setTrackProgress((prev) => {
            // 이미 최대값에 도달했으면 업데이트하지 않음
            if (prev.progress >= segmentDuration) {
              return prev;
            }
            return { progress: segmentDuration };
          });
          
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          
          // 오디오 중지
          player.stop();
          currentTrackSrcRef.current = null;
          
          // ✅ ref를 통해 호출 (의존성 배열에서 제거)
          onSegmentEndRef.current?.();
          return;
        }

        // ✅ Fix: 함수형 업데이트 사용하여 무한 루프 방지
        // ✅ Fix: 차이 무시 조건 완전 제거 - 항상 업데이트 (currentTime이 증가하면 무조건 반영)
        setTrackProgress((prev) => {
          // currentTime이 증가했거나, 이전 값과 다르면 업데이트
          if (prev.progress === currentTime) {
            // 값이 같으면 업데이트하지 않음 (불필요한 리렌더링 방지)
            return prev;
          }
          
          console.log("[useMusicTrackPlayer] ✅ 진행 바 상태 업데이트:", {
            prev: Math.round(prev.progress),
            current: Math.round(currentTime),
            diff: Math.round(currentTime - prev.progress),
          });
          
          return { progress: currentTime };
        });
      } catch (error) {
        console.error("[useMusicTrackPlayer] interval에서 오류 발생:", error);
        // 오류 발생 시 interval 정리하지 않음 (일시적 오류일 수 있음)
      }
    }, 100); // 100ms마다 업데이트

    // ✅ 필수: cleanup 함수 반환으로 무한 타이머 생성 방지
    return () => {
      console.log("[useMusicTrackPlayer] 진행 바 추적 cleanup 실행");
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [playing, segment, currentTrack, segmentDuration]); // ✅ onSegmentEnd 제거 (ref로 처리)

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

    // 새로운 트랙이면 크로스페이드로 전환
    if (isNewTrack) {
      const previousSrc = currentTrackSrcRef.current;
      currentTrackSrcRef.current = null;
      setTrackProgress({ progress: 0 });
      
      // 재생 중이고 새로운 트랙이면 크로스페이드로 전환
      if (playing && previousSrc && musicPlayerRef.current) {
        // 크로스페이드로 부드럽게 전환
        musicPlayerRef.current.crossfade(trackUrl).catch((error) => {
          console.error("[useMusicTrackPlayer] Crossfade 실패, 일반 재생으로 fallback:", error);
          // 크로스페이드 실패 시 일반 재생으로 fallback
          if (musicPlayerRef.current) {
            musicPlayerRef.current.stop();
            setTimeout(() => {
              startPlayback();
            }, 100);
          }
        });
        currentTrackSrcRef.current = trackUrl;
        return;
      } else if (playing) {
        // 이전 트랙이 없으면 일반 재생
        const timeoutId = setTimeout(() => {
          startPlayback();
        }, 100);
        return () => {
          clearTimeout(timeoutId);
        };
      }
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
    volume, // ✅ Fix: props volume 반환 (0-100 범위)
    setVolume: handleSetVolume, // ✅ Fix: 래핑된 핸들러 반환 (0-1 범위를 받아 0-100으로 변환하여 HomePage에 전달)
    // ✅ Fix: isUserChangingRef 제거 (더 이상 필요 없음)
  };
}