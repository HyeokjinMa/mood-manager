// src/backend/jobs/dailyPreprocessedSlots.ts
/**
 * DailyPreprocessedSlot 유틸리티
 *
 * - 10분 단위 144 슬롯(전처리된 지표)을 DB에 저장/초기화/갱신하기 위한 헬퍼들
 *
 * [역할]
 * - 신규 유저 또는 특정 날짜에 대해 0~143 슬롯을 목업/중립 값으로 채우는 초기화
 * - 이후 전처리 결과(PreprocessedData)를 받아 특정 slotIndex를 실제 값으로 덮어쓰기
 */

import { prisma } from "@/lib/prisma";

// EmotionPredictionProvider.ts 의 PreprocessedData 와 호환되는 최소 타입 정의
export interface PreprocessedSummary {
  average_stress_index: number;
  recent_stress_index: number;
  latest_sleep_score: number;
  latest_sleep_duration: number;
  weather: {
    temperature: number;
    humidity: number;
    rainType: number;
    sky: number;
  };
  emotionCounts?: {
    laughter: number;
    sigh: number;
    crying: number;
  };
}

/**
 * 날짜를 자정 기준으로 정규화 (시간/분/초/밀리초 0)
 */
function normalizeDateToMidnight(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
}

/**
 * 144개 슬롯에 사용할 기본 목업/중립 값
 */
function getDefaultSlotValues(): {
  average_stress_index: number;
  recent_stress_index: number;
  latest_sleep_score: number;
  latest_sleep_duration: number;
  temperature: number;
  humidity: number;
  rainType: number;
  sky: number;
  laughter: number;
  sigh: number;
  crying: number;
} {
  return {
    average_stress_index: 50,
    recent_stress_index: 50,
    latest_sleep_score: 70,
    latest_sleep_duration: 480, // 8시간 (분 단위)
    temperature: 22,
    humidity: 50,
    rainType: 0,
    sky: 1,
    laughter: 0,
    sigh: 0,
    crying: 0,
  };
}

/**
 * 특정 유저/날짜에 대해 0~143 DailyPreprocessedSlot 을 모두 생성 (이미 있으면 건너뜀)
 */
export async function ensureDailySlotsForUser(userId: string, date: Date): Promise<void> {
  const normalizedDate = normalizeDateToMidnight(date);

  const existingCount = await prisma.dailyPreprocessedSlot.count({
    where: { userId, date: normalizedDate },
  });

  if (existingCount >= 144) {
    // 이미 144개 슬롯이 모두 존재하면 아무것도 하지 않음
    return;
  }

  const defaults = getDefaultSlotValues();
  const data = Array.from({ length: 144 }, (_, slotIndex) => ({
    userId,
    date: normalizedDate,
    slotIndex,
    ...defaults,
  }));

  await prisma.dailyPreprocessedSlot.createMany({
    data,
    skipDuplicates: true,
  });
}

/**
 * 전처리 결과를 사용하여 특정 slotIndex 를 실제 값으로 덮어쓰기
 *
 * - 예: 하루가 지날 때마다 slotIndex 0부터 순차적으로 채우는 배치/잡에서 사용
 */
export async function updateDailySlotWithPreprocessed(
  userId: string,
  date: Date,
  slotIndex: number,
  preprocessed: PreprocessedSummary
): Promise<void> {
  const normalizedDate = normalizeDateToMidnight(date);

  const counts = preprocessed.emotionCounts || {
    laughter: 0,
    sigh: 0,
    crying: 0,
  };

  await prisma.dailyPreprocessedSlot.upsert({
    where: {
      userId_date_slotIndex: {
        userId,
        date: normalizedDate,
        slotIndex,
      },
    },
    create: {
      userId,
      date: normalizedDate,
      slotIndex,
      average_stress_index: preprocessed.average_stress_index,
      recent_stress_index: preprocessed.recent_stress_index,
      latest_sleep_score: preprocessed.latest_sleep_score,
      latest_sleep_duration: preprocessed.latest_sleep_duration,
      temperature: preprocessed.weather.temperature,
      humidity: preprocessed.weather.humidity,
      rainType: preprocessed.weather.rainType,
      sky: preprocessed.weather.sky,
      laughter: counts.laughter,
      sigh: counts.sigh,
      crying: counts.crying,
    },
    update: {
      average_stress_index: preprocessed.average_stress_index,
      recent_stress_index: preprocessed.recent_stress_index,
      latest_sleep_score: preprocessed.latest_sleep_score,
      latest_sleep_duration: preprocessed.latest_sleep_duration,
      temperature: preprocessed.weather.temperature,
      humidity: preprocessed.weather.humidity,
      rainType: preprocessed.weather.rainType,
      sky: preprocessed.weather.sky,
      laughter: counts.laughter,
      sigh: counts.sigh,
      crying: counts.crying,
    },
  });
}


