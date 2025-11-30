// src/lib/moodSignals/fetchDailySignals.ts
/**
 * ML 서버에서 기록된 한숨/웃음/부정 감정 데이터를
 * 오늘 날짜 기준으로 집계해서 반환하는 함수
 */

import { getEmotionCounts } from "@/lib/ml/emotionCache";

export async function fetchDailySignals(userId: string) {
  // emotionCache에서 오늘 날짜 기준 카운트 조회
  const counts = getEmotionCounts(userId);

  return {
    laugh_count: counts.laughter_count,
    sigh_count: counts.sigh_count,
    negative_count: counts.negative_count,
  };
}
  