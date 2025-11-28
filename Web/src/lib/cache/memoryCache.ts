// src/lib/cache/memoryCache.ts
/**
 * [파일 역할]
 * - 서버 메모리에 간단한 캐시를 저장하기 위한 파일입니다.
 * - 수면 점수 / 스트레스 점수뿐 아니라
 *   추후 다양한 전처리 결과를 캐싱할 때 재사용할 수 있는 범용 캐시 모듈입니다.
 *
 * [사용되는 위치]
 * 1) backend/cache/periodicCache.ts → sleep/stress 점수 저장용
 *
 * [주의사항]
 * - 서버 메모리에 저장되므로 Next.js 서버가 재시작되면 캐시 사라짐
 * - Vercel(서버리스)에서는 적합하지 않음 → Redis 업그레이드 필요
 */

export class MemoryCache<T> {
  private store: Record<string, T> = {};

  /** 캐시에 값 저장 */
  set(key: string, value: T) {
    this.store[key] = value;
  }

  /** 캐시에서 값 가져오기 */
  get(key: string): T | null {
    return this.store[key] ?? null;
  }

  /** 값 삭제 */
  delete(key: string) {
    delete this.store[key];
  }

  /** 전체 캐시 초기화 */
  clear() {
    this.store = {};
  }
}