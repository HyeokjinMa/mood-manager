// src/lib/moodStream/scheduler.ts
/**
 * 무드스트림 스케줄러
 * 
 * 예약된 무드 세그먼트를 관리하고, 3개 이하가 되면 자동으로 재생성
 */

export interface ScheduledMoodSegment {
  id: string;
  timestamp: number;
  moodName: string;
  musicGenre: string;
  scentType: string;
  // LLM으로 생성된 정보
  moodAlias?: string;
  musicSelection?: string;
  moodColor?: string;
  lighting?: { rgb: [number, number, number]; brightness: number };
  backgroundIcon?: { name: string; category: string };
  // ...
}

class MoodStreamScheduler {
  private scheduledSegments: ScheduledMoodSegment[] = [];
  private minSegments = 3; // 최소 유지 개수
  private segmentCount = 10; // 한 번에 생성할 세그먼트 개수
  private isGenerating = false;

  /**
   * 예약된 세그먼트 가져오기
   */
  getScheduledSegments(): ScheduledMoodSegment[] {
    const now = Date.now();
    // 현재 시간 이후의 세그먼트만 반환
    return this.scheduledSegments.filter(seg => seg.timestamp > now);
  }

  /**
   * 현재 적용할 세그먼트 가져오기
   */
  getCurrentSegment(): ScheduledMoodSegment | null {
    const now = Date.now();
    const current = this.scheduledSegments.find(
      seg => seg.timestamp <= now && now < seg.timestamp + 3 * 60 * 1000
    );
    return current || null;
  }

  /**
   * 세그먼트 추가 (뒤로 붙음)
   */
  appendSegments(segments: ScheduledMoodSegment[]): void {
    // 기존 세그먼트와 병합 (중복 제거)
    const existingIds = new Set(this.scheduledSegments.map(s => s.id));
    const newSegments = segments.filter(s => !existingIds.has(s.id));
    
    this.scheduledSegments = [...this.scheduledSegments, ...newSegments]
      .sort((a, b) => a.timestamp - b.timestamp);
  }

  /**
   * 만료된 세그먼트 제거
   */
  removeExpiredSegments(): void {
    const now = Date.now();
    this.scheduledSegments = this.scheduledSegments.filter(
      seg => seg.timestamp + 3 * 60 * 1000 > now
    );
  }

  /**
   * 재생성 필요 여부 확인
   */
  shouldRegenerate(): boolean {
    this.removeExpiredSegments();
    const remaining = this.getScheduledSegments().length;
    return remaining <= this.minSegments && !this.isGenerating;
  }

  /**
   * 재생성 시작
   */
  startGeneration(): void {
    this.isGenerating = true;
  }

  /**
   * 재생성 완료
   */
  finishGeneration(): void {
    this.isGenerating = false;
  }

  /**
   * 다음 세그먼트 시작 시간 계산
   */
  getNextSegmentStartTime(): number {
    const lastSegment = this.scheduledSegments[this.scheduledSegments.length - 1];
    if (!lastSegment) {
      return Date.now();
    }
    // 마지막 세그먼트의 시작 시간 + 3분
    return lastSegment.timestamp + 3 * 60 * 1000;
  }
}

// 싱글톤 인스턴스
export const moodStreamScheduler = new MoodStreamScheduler();

