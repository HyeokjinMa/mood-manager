// src/backend/cache/periodicCache.ts
/**
 * [파일 역할]
 * - Firestore → Listener → 전처리(preprocess) 결과를 저장하는
 *   “서버 메모리 기반 캐시” 파일입니다.
 *
 * [이 파일이 왜 필요한가?]
 * 1) Next.js의 Route Handler(`/api/preprocessing`)가
 *    매번 Firestore를 읽지 않도록 하기 위함  
 *    → 비용 절감, 속도 향상, 안정성 증가
 *
 * 2) Listener가 raw_periodic 실시간 스트림(onSnapshot)에서
 *    새 데이터를 받는 즉시 전처리를 실행하므로,
 *    최신 전처리 결과를 서버 메모리에서 즉시 접근 가능해야 함.
 *
 * 3) OpenAI 모델 호출 시도  
 *    → sleep_score, stress_score를 바로 가져오기 위한 구조.
 *
 *
 * [이 파일과 연결되는 주요 파일들]
 *
 * 1. backend/listener/periodicListener.ts
 *    - raw_periodic 컬렉션을 실시간 구독
 *    - 새 raw 데이터 수신 시 → preprocessPeriodic(job) 호출
 *    - job에서 계산된 score를 여기 캐시에 저장(setProcessedMetrics)
 *
 * 2. backend/jobs/preprocessPeriodic.ts
 *    - sleep_score, stress_score 계산
 *    - setProcessedMetrics() 호출해서 캐시에 저장
 *
 * 3. app/api/preprocessing/route.ts
 *    - UI 또는 서버 로직이 호출
 *    - getProcessedMetrics()로 캐시된 최신 score 반환
 *
 *
 * [데이터 저장 형태]
 * {
 *   sleep_score: number,
 *   stress_score: number,
 *   updated_at: number (timestamp)
 * }
 *
 *
 * [주의사항]
 * - 이 캐시는 서버 메모리에 저장되므로 Next.js 서버가 재시작되면 초기화됩니다.
 * - Vercel 같은 Serverless 환경에서는 이 방식이 동작하지 않습니다.
 *   (현재 구조는 로컬 서버 / Node 서버 항상 실행 기반)
 */

export interface ProcessedMetrics {
  sleep_score: number;
  stress_score: number;
  updated_at: number;
}

/**
 * 실제 캐시 저장소 (서버 메모리)
 * - 서버 프로세스가 살아있을 동안 유지됨
 */
let processedCache: ProcessedMetrics | null = null;

/**
 * 전처리된 값을 캐시에 저장합니다.
 * @param sleep_score number (0~100)
 * @param stress_score number (0~100)
 */
export function setProcessedMetrics(sleep_score: number, stress_score: number) {
  processedCache = {
    sleep_score,
    stress_score,
    updated_at: Date.now(), // 캐시 갱신 시각
  };
}

/**
 * 최신 전처리 결과를 반환합니다.
 * - 값이 없으면 null 반환
 */
export function getProcessedMetrics(): ProcessedMetrics | null {
  return processedCache;
}

/**
 * 캐시 리셋 (디버깅/테스트용)
 */
export function clearProcessedMetrics() {
  processedCache = null;
}
