/**
 * 감정 카운터 저장소
 * 
 * ML 서버에서 받은 감정 이벤트를 누적하고,
 * 무드스트림 생성 시 전송 후 클렌징
 */

interface EmotionCounts {
  laughter: number;
  sigh: number;
  crying: number;
  lastResetTime: number; // 마지막 클렌징 시간
}

// 메모리 기반 저장소 (프로덕션에서는 Redis 권장)
const emotionCountStore = new Map<string, EmotionCounts>();

/**
 * 사용자별 감정 카운터 초기화
 */
export function initializeEmotionCounts(userId: string): void {
  if (!emotionCountStore.has(userId)) {
    emotionCountStore.set(userId, {
      laughter: 0,
      sigh: 0,
      crying: 0,
      lastResetTime: Date.now(),
    });
  }
}

/**
 * ML 서버에서 받은 감정 이벤트 추가 (누적)
 */
export function addEmotionCounts(
  userId: string,
  counts: {
    laughter?: number;
    sigh?: number;
    crying?: number;
  }
): void {
  initializeEmotionCounts(userId);
  
  const current = emotionCountStore.get(userId)!;
  current.laughter += counts.laughter || 0;
  current.sigh += counts.sigh || 0;
  current.crying += counts.crying || 0;
  
  emotionCountStore.set(userId, current);
}

/**
 * 현재 누적된 감정 카운터 조회
 */
export function getEmotionCounts(userId: string): EmotionCounts {
  initializeEmotionCounts(userId);
  return emotionCountStore.get(userId)!;
}

/**
 * 감정 카운터 전송 후 클렌징 (0으로 초기화)
 */
export function resetEmotionCounts(userId: string): void {
  const current = emotionCountStore.get(userId);
  if (current) {
    emotionCountStore.set(userId, {
      laughter: 0,
      sigh: 0,
      crying: 0,
      lastResetTime: Date.now(),
    });
  }
}

/**
 * 감정 카운터 조회 후 클렌징 (원자적 연산)
 */
export function getAndResetEmotionCounts(userId: string): EmotionCounts {
  initializeEmotionCounts(userId);
  const current = emotionCountStore.get(userId)!;
  
  // 원자적으로 클렌징 (별도 함수 호출 대신 직접 처리)
  emotionCountStore.set(userId, {
    laughter: 0,
    sigh: 0,
    crying: 0,
    lastResetTime: Date.now(),
  });
  
  return current;
}

/**
 * 축적 기간 계산 (초)
 */
export function getAccumulationDuration(userId: string): number {
  const current = emotionCountStore.get(userId);
  if (!current) {
    return 0;
  }
  return Math.floor((Date.now() - current.lastResetTime) / 1000);
}

