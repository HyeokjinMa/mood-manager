/**
 * 가중치 정규화 유틸리티
 * 
 * 모든 가중치를 합산하여 분모로 사용, 소수점으로 정규화 (합 = 1)
 */

/**
 * 가중치 배열을 정규화 (합이 1이 되도록)
 * @param weights 가중치 배열
 * @returns 정규화된 가중치 배열 (합 = 1)
 */
export function normalizeWeights(weights: number[]): number[] {
  if (weights.length === 0) {
    return [];
  }

  const sum = weights.reduce((a, b) => a + b, 0);
  
  // 합이 0이면 균등 분배
  if (sum === 0) {
    return weights.map(() => 1 / weights.length);
  }

  // 정규화 (각 값을 합으로 나눔)
  return weights.map(w => w / sum);
}

/**
 * 가중치 맵을 정규화 (키는 유지, 값만 정규화)
 * @param weightMap { [key: string]: number } 형태의 가중치 맵
 * @returns 정규화된 가중치 맵 (합 = 1)
 */
export function normalizeWeightMap<T extends string>(
  weightMap: Record<T, number>
): Record<T, number> {
  const keys = Object.keys(weightMap) as T[];
  const weights = keys.map(key => weightMap[key]);
  const normalized = normalizeWeights(weights);

  const result = {} as Record<T, number>;
  keys.forEach((key, index) => {
    result[key] = normalized[index];
  });

  return result;
}

/**
 * 정규화된 가중치를 문자열로 포맷팅 (LLM 프롬프트용)
 * @param weightMap 정규화된 가중치 맵
 * @returns 포맷팅된 문자열
 */
export function formatWeightsForLLM(weightMap: Record<string, number>): string {
  // 가중치가 높은 순으로 정렬
  const sorted = Object.entries(weightMap)
    .sort(([, a], [, b]) => b - a)
    .map(([key, weight]) => `  - ${key}: ${(weight * 100).toFixed(1)}%`)
    .join('\n');

  return sorted || '  (선호도 정보 없음)';
}

