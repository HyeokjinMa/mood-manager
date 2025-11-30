// src/lib/ml/emotionCache.ts
/**
 * [파일 역할]
 * - ML 서버에서 받은 감정 신호(laughter, sigh, negative)를 캐싱
 * - 자정(00시) 기준으로 카운트 초기화
 *
 * [사용되는 위치]
 * - /api/ml/emotion: ML 결과 수신 시 카운트 증가
 * - /api/preprocessing: 감정 신호 조회
 *
 * [주의사항]
 * - 메모리 기반 캐시로 서버 재시작 시 초기화됨
 * - 00시 기준으로 자동 초기화
 */

interface EmotionCache {
  date: string; // YYYY-MM-DD 형식
  laughter_count: number;
  sigh_count: number;
  negative_count: number;
}

// 사용자별 캐시 저장소
const userEmotionCache = new Map<string, EmotionCache>();

/**
 * 오늘 날짜를 YYYY-MM-DD 형식으로 반환
 */
function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * 사용자의 감정 카운트 조회
 * - 날짜가 바뀌었으면 자동 초기화
 */
export function getEmotionCounts(userId: string): {
  laughter_count: number;
  sigh_count: number;
  negative_count: number;
} {
  const today = getTodayDateString();
  const cache = userEmotionCache.get(userId);

  // 캐시가 없거나 날짜가 다르면 초기화
  if (!cache || cache.date !== today) {
    const newCache: EmotionCache = {
      date: today,
      laughter_count: 0,
      sigh_count: 0,
      negative_count: 0,
    };
    userEmotionCache.set(userId, newCache);
    return {
      laughter_count: 0,
      sigh_count: 0,
      negative_count: 0,
    };
  }

  return {
    laughter_count: cache.laughter_count,
    sigh_count: cache.sigh_count,
    negative_count: cache.negative_count,
  };
}

/**
 * ML 결과에 따라 카운트 증가
 * @param userId 사용자 ID
 * @param result "Laughter" | "Sigh" | "Negative"
 * @param confidence 신뢰도
 */
export function incrementEmotionCount(
  userId: string,
  result: "Laughter" | "Sigh" | "Negative",
  confidence: number
): void {
  const today = getTodayDateString();
  let cache = userEmotionCache.get(userId);

  // 신뢰도가 70 미만이면 무시
  if (confidence < 70) {
    console.log(
      `[Emotion Cache] ${userId} - ${result} ignored (confidence: ${confidence})`
    );
    return;
  }

  // 캐시가 없거나 날짜가 다르면 초기화
  if (!cache || cache.date !== today) {
    cache = {
      date: today,
      laughter_count: 0,
      sigh_count: 0,
      negative_count: 0,
    };
    userEmotionCache.set(userId, cache);
  }

  // 결과에 따라 카운트 증가
  switch (result) {
    case "Laughter":
      cache.laughter_count++;
      break;
    case "Sigh":
      cache.sigh_count++;
      break;
    case "Negative":
      cache.negative_count++;
      break;
  }

  console.log(
    `[Emotion Cache] ${userId} - ${result} → Laughter: ${cache.laughter_count}, Sigh: ${cache.sigh_count}, Negative: ${cache.negative_count}`
  );
}
