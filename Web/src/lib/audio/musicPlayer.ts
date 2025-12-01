/**
 * 실제 오디오 재생 관리 유틸리티
 * 
 * HTMLAudioElement를 사용한 실제 오디오 재생
 */

export interface AudioPlayerConfig {
  src?: string; // 오디오 파일 URL (추후 구현)
  volume?: number; // 볼륨 (0-1)
  fadeInDuration?: number; // 페이드인 시간 (밀리초)
  fadeOutDuration?: number; // 페이드아웃 시간 (밀리초)
}

export class MusicPlayer {
  private audioElement: HTMLAudioElement | null = null;
  private volume: number = 0.7;
  private fadeInDuration: number = 2000;
  private fadeOutDuration: number = 2000;

  /**
   * 오디오 초기화
   */
  init(config?: AudioPlayerConfig) {
    if (typeof window === "undefined") return;

    this.volume = config?.volume ?? 0.7;
    this.fadeInDuration = config?.fadeInDuration ?? 2000;
    this.fadeOutDuration = config?.fadeOutDuration ?? 2000;

    // 오디오 엘리먼트 생성 (추후 실제 오디오 파일 재생 시 사용)
    // this.audioElement = new Audio(config?.src);
    // this.audioElement.volume = this.volume;
  }

  /**
   * 재생 시작 (페이드인 포함)
   */
  async play(src?: string) {
    if (typeof window === "undefined") return;

    // TODO: 실제 오디오 파일 재생 로직
    // 현재는 시뮬레이션
    console.log("[MusicPlayer] Play:", src || "simulated audio");
  }

  /**
   * 재생 일시정지
   */
  pause() {
    if (this.audioElement) {
      this.audioElement.pause();
    }
  }

  /**
   * 재생 중지 (페이드아웃 포함)
   */
  async stop() {
    if (!this.audioElement) return;

    // TODO: 페이드아웃 로직
    this.audioElement.pause();
    this.audioElement.currentTime = 0;
  }

  /**
   * 볼륨 설정
   */
  setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume));
    if (this.audioElement) {
      this.audioElement.volume = this.volume;
    }
  }

  /**
   * 크로스페이드 (다음 트랙으로 전환)
   */
  async crossfade(nextSrc: string) {
    // TODO: 현재 트랙 페이드아웃 + 다음 트랙 페이드인
    console.log("[MusicPlayer] Crossfade to:", nextSrc);
  }

  /**
   * 정리
   */
  dispose() {
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement = null;
    }
  }
}

