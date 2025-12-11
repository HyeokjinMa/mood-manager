// src/lib/cache/llmCache.ts
/**
 * LLM 응답 캐싱
 * 
 * 같은 입력에 대해 캐시된 응답 반환하여 비용 절감
 */

import type { BackgroundParamsResponse } from "@/types/llm";

interface CacheEntry {
  response: BackgroundParamsResponse;
  timestamp: number;
  expiresAt: number;
}

// 메모리 캐시 (간단한 구현)
// 프로덕션에서는 Redis 등 사용 권장
const cache = new Map<string, CacheEntry>();

// 캐시 TTL: 1시간 (같은 무드/조건에서 1시간 동안 캐시 사용)
const CACHE_TTL = 60 * 60 * 1000; // 1시간

/**
 * 캐시 키 생성
 * 
 * 다양성을 위해 세그먼트 인덱스도 포함하여 같은 무드라도 다른 세그먼트에서는 다른 응답 생성
 */
function generateCacheKey(input: {
  moodName: string;
  musicGenre: string;
  scentType: string;
  timeOfDay: number;
  season: string;
  stressIndex: number; // 범위로 그룹화
  segmentIndex?: number; // 세그먼트 인덱스 (다양성 확보)
}): string {
  // 스트레스 지수를 범위로 그룹화 (0-20, 21-40, 41-60, 61-80, 81-100)
  const stressRange = Math.floor(input.stressIndex / 20) * 20;
  
  // 세그먼트 인덱스가 있으면 포함 (같은 무드라도 세그먼트마다 다른 응답)
  const segmentPart = input.segmentIndex !== undefined ? `-seg${input.segmentIndex}` : "";
  
  return `${input.moodName}-${input.musicGenre}-${input.scentType}-${input.timeOfDay}-${input.season}-${stressRange}${segmentPart}`;
}

/**
 * 캐시에서 응답 가져오기
 */
export function getCachedResponse(
  input: Parameters<typeof generateCacheKey>[0]
): BackgroundParamsResponse | null {
  const key = generateCacheKey(input);
  const entry = cache.get(key);
  
  if (!entry) {
    return null;
  }
  
  // 만료 확인
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  
  return entry.response;
}

/**
 * 캐시에 응답 저장
 */
export function setCachedResponse(
  input: Parameters<typeof generateCacheKey>[0] & { mode?: string },
  response: BackgroundParamsResponse
): void {
  // mode 필드가 있으면 제거 (캐시 키에는 포함하지 않음)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { mode, ...cacheInput } = input;
  const key = generateCacheKey(cacheInput);
  const now = Date.now();
  
  cache.set(key, {
    response,
    timestamp: now,
    expiresAt: now + CACHE_TTL,
  });
  
  // 캐시 크기 제한 (최대 100개)
  if (cache.size > 100) {
    const oldestKey = Array.from(cache.entries())
      .sort((a, b) => a[1].timestamp - b[1].timestamp)[0][0];
    cache.delete(oldestKey);
  }
}

/**
 * 캐시 초기화 (테스트용)
 */
export function clearCache(): void {
  cache.clear();
}

