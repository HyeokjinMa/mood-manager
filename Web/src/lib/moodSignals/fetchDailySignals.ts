// src/lib/moodSignals/fetchDailySignals.ts
/**
 * ML 서버에서 기록된 한숨/웃음 데이터를
 * 오늘 날짜 기준으로 집계해서 반환하는 함수
 */

export async function fetchDailySignals(_userId: string) {
    // TODO: Firestore or PostgreSQL 기반으로 일별 기록 조회
    // 지금은 Mock 형태로 제공
    return {
      laugh_count: 2,
      sigh_count: 1,
    };
  }
  