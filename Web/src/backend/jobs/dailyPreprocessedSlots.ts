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
 * slotIndex (0~143)에 따라 시간대별 패턴을 적용하여 자연스러운 하루 변화를 시뮬레이션
 */
function getDefaultSlotValues(slotIndex: number): {
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
  // slotIndex를 0~1 범위로 정규화
  const t = slotIndex / 143;
  
  // 시간대 구분 (0~143 슬롯 = 00:00~23:50, 10분 간격)
  const hour = (slotIndex * 10) / 60; // 시간 (0~24)
  
  // === 스트레스 패턴 ===
  // 새벽(0~6시): 낮음, 오전(6~12시): 증가, 오후(12~18시): 높음, 저녁(18~24시): 감소
  const stressBase = 40 + 30 * Math.sin((hour - 6) * Math.PI / 12);
  const average_stress_index = Math.max(20, Math.min(80, stressBase));
  const recent_stress_index = average_stress_index + (Math.random() - 0.5) * 10; // 약간의 변동
  
  // === 수면 점수 ===
  // 새벽(0~6시): 높음(잠 잘 잤음), 오후(12~18시): 낮음(피로 누적)
  const sleepScore = 75 + 15 * Math.cos((hour - 12) * Math.PI / 12);
  const latest_sleep_score = Math.max(50, Math.min(95, sleepScore));
  
  // === 수면 시간 ===
  // 새벽에는 수면 시간이 길고, 오후에는 짧음
  const sleepDuration = 420 + 120 * Math.cos((hour - 12) * Math.PI / 12);
  const latest_sleep_duration = Math.max(300, Math.min(600, sleepDuration));
  
  // === 날씨 패턴 ===
  // 오전에 온도 상승, 오후에 최고점, 밤에 하강
  const temperature = 18 + 8 * Math.sin((hour - 6) * Math.PI / 12);
  const humidity = 40 + 20 * (1 - Math.abs(t - 0.5) * 2); // 오후에 습도 높음
  
  // === 감정 카운트 ===
  // 웃음: 오전~오후에 많고, 밤에 적음
  const laughter = Math.max(0, Math.floor(5 + 8 * Math.sin((hour - 6) * Math.PI / 12)));
  
  // 한숨: 오후~저녁에 많고, 새벽에 적음
  const sigh = Math.max(0, Math.floor(2 + 5 * Math.sin((hour - 12) * Math.PI / 12)));
  
  // 울음: 전체적으로 낮지만, 오후에 약간 증가
  const crying = Math.max(0, Math.floor(0.5 + 1.5 * Math.sin((hour - 12) * Math.PI / 12)));
  
  return {
    average_stress_index: Math.round(average_stress_index),
    recent_stress_index: Math.round(recent_stress_index),
    latest_sleep_score: Math.round(latest_sleep_score),
    latest_sleep_duration: Math.round(sleepDuration),
    temperature: Math.round(temperature * 10) / 10,
    humidity: Math.round(humidity),
    rainType: 0, // 맑음
    sky: 1, // 맑음
    laughter,
    sigh,
    crying,
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

  // 각 slotIndex마다 시간대별 패턴이 적용된 목업 값 생성
  const data = Array.from({ length: 144 }, (_, slotIndex) => ({
    userId,
    date: normalizedDate,
    slotIndex,
    ...getDefaultSlotValues(slotIndex),
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


