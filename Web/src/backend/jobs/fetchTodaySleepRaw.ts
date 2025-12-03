// src/backend/jobs/fetchTodaySleepRaw.ts
/**
 * 오늘 수면 점수를 계산하기 위해 Firestore에서
 * "어제 밤 ~ 오늘 아침" 구간의 raw_periodic 데이터를 가져오는 모듈.
 *
 * [로직]
 * - 수면은 보통 22시~10시 사이 발생한다고 가정
 * - 오늘 날짜 기준:
 *      어제 22:00 (start)
 *      오늘 10:00 (end)
 *
 * [주의]
 * - 이 범위는 기본값이며, 나중에 사용자별 취침 패턴에 맞춰 조정 가능
 */

import { db } from "@/lib/firebase/client";
import { collection, query, where, getDocs } from "firebase/firestore";
import type { PeriodicRaw } from "@/lib/types/periodic";

export async function fetchTodaySleepRaw(userId: string): Promise<PeriodicRaw[]> {
  // Firebase가 비활성화된 환경에서는 빈 배열 반환 (수면 점수는 기본값으로 대체)
  if (!db) {
    console.warn("[fetchTodaySleepRaw] Firestore db 가 없어, 빈 데이터로 반환합니다.");
    return [];
  }

  const now = new Date();

  // 오늘 10시
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 10, 0, 0);
  // 어제 22시
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 22, 0, 0);

  const col = collection(db, "users", userId, "raw_periodic");
  const q = query(
    col,
    where("timestamp", ">=", start.getTime()),
    where("timestamp", "<=", end.getTime())
  );

  const snap = await getDocs(q);
  const data: PeriodicRaw[] = [];

  snap.forEach((doc) => {
    data.push({ ...(doc.data() as PeriodicRaw), id: doc.id });
  });

  return data;
}
