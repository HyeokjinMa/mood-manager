// src/backend/jobs/fetchTodayPeriodicRaw.ts
/**
 * [EDIT] 새로 생성된 파일
 * 오늘 날짜의 모든 raw_periodic 데이터를 가져오는 모듈.
 * 
 * preprocessing API가 오늘 날짜의 모든 데이터를 조회하여
 * 평균 스트레스 지수 등을 계산하기 위해 필요함
 *
 * [로직]
 * - 오늘 00:00:00 ~ 23:59:59.999 구간의 모든 raw_periodic 데이터를 가져옴
 * - preprocessing API에서 사용
 */

import { db } from "@/lib/firebase/client";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import type { PeriodicRaw } from "@/lib/types/periodic";

export async function fetchTodayPeriodicRaw(userId: string): Promise<PeriodicRaw[]> {
  // Firebase가 비활성화된 환경에서는 빈 배열 반환 (preprocessing에서 목업으로 대체)
  if (!db) {
    console.warn("[fetchTodayPeriodicRaw] Firestore db 가 없어, 빈 데이터로 반환합니다.");
    return [];
  }

  const now = new Date();

  // 오늘 00:00:00
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  // 오늘 23:59:59.999
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  const col = collection(db, "users", userId, "raw_periodic");
  const q = query(
    col,
    where("timestamp", ">=", start.getTime()),
    where("timestamp", "<=", end.getTime()),
    orderBy("timestamp", "desc") // 최신 데이터가 먼저 오도록 정렬
  );

  const snap = await getDocs(q);
  const data: PeriodicRaw[] = [];

  snap.forEach((doc) => {
    data.push({ ...(doc.data() as PeriodicRaw), id: doc.id });
  });

  return data;
}

