/**
 * 실제 오디오 재생 관리 유틸리티
 * 
 * HTMLAudioElement를 사용한 실제 오디오 재생
 * - 페이드인/아웃 (0.75초)
 * - 크로스페이드 (트랙 전환)
 * - 볼륨 제어
 * - 재생 위치 제어 (seek)
 */

export interface AudioPlayerConfig {
  src?: string; // 오디오 파일 URL
  volume?: number; // 볼륨 (0-1)
  fadeInDuration?: number; // 페이드인 시간 (밀리초, 기본값: 750)
  fadeOutDuration?: number; // 페이드아웃 시간 (밀리초, 기본값: 750)
}

export class MusicPlayer {
  private audioElement: HTMLAudioElement | null = null;
  private volume: number = 0.7;
  private fadeInDuration: number = 750; // 0.75초
  private fadeOutDuration: number = 750; // 0.75초
  private fadeInterval: NodeJS.Timeout | null = null;
  private isFadingOut: boolean = false;
  private isFadingIn: boolean = false;
  private targetVolume: number = 0.7;

  /**
   * 오디오 초기화
   */
  init(config?: AudioPlayerConfig) {
    if (typeof window === "undefined") return;

    this.volume = config?.volume ?? 0.7;
    this.targetVolume = this.volume;
    this.fadeInDuration = config?.fadeInDuration ?? 750;
    this.fadeOutDuration = config?.fadeOutDuration ?? 750;

    // 기존 오디오 엘리먼트 정리
    this.dispose();

    // 새 오디오 엘리먼트 생성
    if (config?.src) {
      this.audioElement = new Audio(config.src);
      this.audioElement.volume = 0; // 초기 볼륨 0 (페이드인 시작)
      this.setupEventListeners();
    }
  }

  /**
   * 이벤트 리스너 설정
   */
  private setupEventListeners() {
    if (!this.audioElement) return;

    // 에러 처리
    this.audioElement.addEventListener("error", (e) => {
      const error = this.audioElement?.error;
      if (error) {
        console.error("[MusicPlayer] Audio error:", {
          code: error.code,
          message: error.message,
          src: this.audioElement?.src,
        });
      } else {
        console.error("[MusicPlayer] Audio error:", e);
      }
    });

    // 로드 완료
    this.audioElement.addEventListener("loadeddata", () => {
      console.log("[MusicPlayer] Audio loaded:", this.audioElement?.src);
    });
  }

  /**
   * 재생 시작 (페이드인 포함)
   * pause 후 재개 시 현재 위치에서 이어서 재생
   * src가 없으면 재개만 수행 (현재 위치에서)
   */
  async play(src?: string, userInteracted: boolean = false): Promise<void> {
    if (typeof window === "undefined") return;

    // src가 제공되고, 현재 소스와 다르면 새 오디오 엘리먼트 생성
    if (src) {
      const currentSrc = this.audioElement?.src || '';
      const newSrc = new URL(src, window.location.origin).href;
      
      // 같은 소스가 아니면 새로 생성
      if (currentSrc !== newSrc) {
        this.dispose();
        this.audioElement = new Audio(src);
        this.audioElement.volume = 0; // 초기 볼륨 0
        this.setupEventListeners();
      }
      // 같은 소스면 기존 엘리먼트 재사용 (pause 후 재개 시 현재 위치에서 이어서 재생)
    }

    if (!this.audioElement) return;

    // src가 없으면 재개만 수행 (현재 위치에서 이어서 재생)
    if (!src) {
      if (this.audioElement.paused) {
        try {
          await this.audioElement.play();
          if (this.audioElement.volume < this.targetVolume) {
            this.fadeIn();
          }
        } catch (error) {
          // NotAllowedError는 조용히 처리
          if (error instanceof Error && error.name === "NotAllowedError") {
            return;
          }
          throw error;
        }
      }
      return;
    }

    // 자동재생 강제 시도 (브라우저 정책 우회)
    // userInteracted가 false여도 시도 (실패하면 조용히 처리)
    try {
      if (this.audioElement.paused) {
        await this.audioElement.play();
        if (this.audioElement.volume < this.targetVolume) {
          this.fadeIn();
        }
      } else {
        if (this.audioElement.volume < this.targetVolume) {
          this.fadeIn();
        }
      }
    } catch (error) {
      // 브라우저 자동 재생 정책 위반은 조용히 처리 (사용자에게는 표시 안 함)
      if (error instanceof Error) {
        // NotAllowedError는 사용자 인터랙션 필요 에러이므로 조용히 처리
        if (error.name === "NotAllowedError" || error.message.includes("user didn't interact")) {
          return;
        }
        // AbortError는 dispose() 후 play() 호출 시 발생할 수 있으므로 조용히 처리
        if (error.name === "AbortError" || error.message.includes("aborted")) {
          return;
        }
        // 다른 에러는 로깅 (디버깅용)
        // console.error(`[MusicPlayer] 재생 실패: ${error.message}`);
      }
    }
  }

  /**
   * 재생 일시정지
   */
  pause() {
    if (this.audioElement && !this.audioElement.paused) {
      this.audioElement.pause();
      this.stopFade();
    }
  }

  /**
   * 재생 중지 (페이드아웃 포함)
   */
  async stop(): Promise<void> {
    if (!this.audioElement) return;

    // 페이드아웃 후 중지
    await this.fadeOut();
    
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.currentTime = 0;
    }
  }

  /**
   * 페이드인
   */
  private fadeIn() {
    if (!this.audioElement || this.isFadingIn) return;

    this.stopFade();
    this.isFadingIn = true;
    this.isFadingOut = false;

    const startVolume = this.audioElement.volume;
    const targetVolume = this.targetVolume;
    const duration = this.fadeInDuration;
    const startTime = Date.now();

    const fade = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      if (this.audioElement) {
        this.audioElement.volume = startVolume + (targetVolume - startVolume) * progress;

        if (progress < 1) {
          this.fadeInterval = setTimeout(fade, 16); // ~60fps
        } else {
          this.isFadingIn = false;
        }
      }
    };

    fade();
  }

  /**
   * 페이드아웃
   */
  private fadeOut(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.audioElement || this.isFadingOut) {
        resolve();
        return;
      }

      this.stopFade();
      this.isFadingOut = true;
      this.isFadingIn = false;

      const startVolume = this.audioElement.volume;
      const duration = this.fadeOutDuration;
      const startTime = Date.now();

      const fade = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        if (this.audioElement) {
          this.audioElement.volume = startVolume * (1 - progress);

          if (progress < 1) {
            this.fadeInterval = setTimeout(fade, 16); // ~60fps
          } else {
            this.isFadingOut = false;
            resolve();
          }
        } else {
          resolve();
        }
      };

      fade();
    });
  }

  /**
   * 페이드 중지
   */
  private stopFade() {
    if (this.fadeInterval) {
      clearTimeout(this.fadeInterval);
      this.fadeInterval = null;
    }
    this.isFadingIn = false;
    this.isFadingOut = false;
  }

  /**
   * 볼륨 설정
   */
  setVolume(volume: number) {
    this.targetVolume = Math.max(0, Math.min(1, volume));
    if (this.audioElement && !this.isFadingIn && !this.isFadingOut) {
      this.audioElement.volume = this.targetVolume;
    }
  }

  /**
   * 현재 볼륨 가져오기
   */
  getVolume(): number {
    return this.audioElement?.volume ?? this.targetVolume;
  }

  /**
   * 크로스페이드 (다음 트랙으로 전환)
   * 현재 트랙 페이드아웃 + 다음 트랙 페이드인
   */
  async crossfade(nextSrc: string): Promise<void> {
    if (typeof window === "undefined") return;

    // 현재 트랙 페이드아웃
    await this.fadeOut();

    // 다음 트랙으로 전환
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.currentTime = 0;
    }

    // 새 오디오 엘리먼트 생성
    this.audioElement = new Audio(nextSrc);
    this.audioElement.volume = 0; // 초기 볼륨 0
    this.setupEventListeners();

    try {
      // 재생 시작
      await this.audioElement.play();
      
      // 페이드인 시작
      this.fadeIn();
    } catch (error) {
      if (error instanceof Error) {
        console.error(`[MusicPlayer] Crossfade 실패: ${error.message}`);
      }
    }
  }

  /**
   * 재생 위치 설정 (seek)
   */
  seek(time: number) {
    if (this.audioElement && !isNaN(time)) {
      this.audioElement.currentTime = Math.max(0, Math.min(time, this.audioElement.duration || 0));
    }
  }

  /**
   * 현재 재생 위치 가져오기
   */
  getCurrentTime(): number {
    return this.audioElement?.currentTime ?? 0;
  }

  /**
   * 총 재생 시간 가져오기
   */
  getDuration(): number {
    return this.audioElement?.duration ?? 0;
  }

  /**
   * 재생 중인지 확인
   */
  isPlaying(): boolean {
    return this.audioElement ? !this.audioElement.paused : false;
  }

  /**
   * 현재 재생 중인 소스 URL
   */
  getCurrentSrc(): string | null {
    return this.audioElement?.src ?? null;
  }

  /**
   * 정리
   */
  dispose() {
    this.stopFade();
    
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.src = "";
      this.audioElement = null;
    }
  }
}
