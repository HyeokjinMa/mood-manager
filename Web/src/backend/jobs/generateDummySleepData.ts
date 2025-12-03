// src/backend/jobs/generateDummySleepData.ts
/**
 * [파일 역할]
 * - 어제 22:00 ~ 오늘 08:00 동안의 수면 구간 가정 더미 데이터를 자동 생성하여
 *   Firestore(users/{user}/raw_periodic)에 삽입하는 테스트용 데이터 생성기입니다.
 *
 * [목적]
 * - 수면 세션 검출(detectSleepSessions)
 * - 하루 수면 점수 계산(calculateDailySleepScore)
 *   위 기능들이 실데이터 없이도 정상 동작하는지 테스트하기 위함.
 */

import { db } from "@/lib/firebase/client";
import { collection, addDoc } from "firebase/firestore";

interface DummyOptions {
  userId: string;
  intervalMinutes?: number; // 수집 주기 (기본 10분)
}

export async function generateDummySleepData({
  userId,
  intervalMinutes = 10,
}: DummyOptions) {
  // Firebase가 비활성화된 환경에서는 아무 작업도 하지 않음
  if (!db) {
    console.warn("[generateDummySleepData] Firestore db 가 없어, 더미 데이터를 생성하지 않습니다.");
    return 0;
  }

  const now = new Date();

  // 수면 구간 시간대: 어제 22:00 ~ 오늘 08:00
  const start = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() - 1,
    22,
    0,
    0
  );
  const end = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    8,
    0,
    0
  );

  const intervalMs = intervalMinutes * 60 * 1000;

  const col = collection(db, "users", userId, "raw_periodic");

  const docs: Record<string, unknown>[] = [];
  let t = start.getTime();

  while (t <= end.getTime()) {
    // 시간대별로 조금 현실적으로 값 변화 주기
    const hour = new Date(t).getHours();

    // Deep Sleep (01:00 ~ 03:00)
    const isDeep =
      hour >= 1 && hour < 3;

    // REM (04:00 ~ 05:00)
    const isREM =
      hour >= 4 && hour < 5;

    const heart_rate_avg = isDeep
      ? 48 + Math.floor(Math.random() * 4)
      : isREM
      ? 58 + Math.floor(Math.random() * 6)
      : 52 + Math.floor(Math.random() * 8);

    const heart_rate_min = isDeep
      ? 45 + Math.floor(Math.random() * 3)
      : 50 + Math.floor(Math.random() * 5);

    const hrv_sdnn = isDeep
      ? 50 + Math.floor(Math.random() * 20)
      : isREM
      ? 40 + Math.floor(Math.random() * 15)
      : 30 + Math.floor(Math.random() * 20);

    const respiratory_rate_avg = isREM
      ? 18 + Math.random() * 2
      : 15 + Math.random() * 2;

    const movement_count = isDeep
      ? 0
      : isREM
      ? 1
      : Math.floor(Math.random() * 4);

    docs.push({
      timestamp: t,
      heart_rate_avg,
      heart_rate_min,
      hrv_sdnn,
      respiratory_rate_avg,
      movement_count,
    });

    t += intervalMs;
  }

  // Firestore에 저장
  for (const d of docs) {
    await addDoc(col, d);
  }

  return docs.length;
}
