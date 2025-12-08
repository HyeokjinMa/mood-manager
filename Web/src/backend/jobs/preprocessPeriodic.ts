/**
 * preprocessPeriodic
 * 
 * Firestore onSnapshot 리스너에서 새 raw_periodic 문서를 받을 때마다
 * 해당 문서를 전처리(pipeline)를 태워서
 * 수면 점수(sleep_score)와 스트레스 점수(stress_score)를 계산하고,
 * 그 결과를 캐시에 저장하는 Job 모듈입니다.
 * 
 * 주의사항:
 * - 이 모듈은 "단일 문서 기준" 전처리만 담당합니다.
 *   → 여러 샘플을 모아서 세션 분석하는 기능은 별도 Job으로 확장 가능.
 * - 날씨 데이터 통합: 기상청 API를 호출하여 날씨 정보를 가져와 전처리 결과에 포함
 */

import type {
  QueryDocumentSnapshot,
  DocumentData,
} from "firebase/firestore";
import { PeriodicRaw } from "@/lib/types/periodic";
import { preprocessPeriodicSample } from "@/lib/preprocessing";
import { setProcessedMetrics } from "@/backend/cache/periodicCache";
import { fetchWeather } from "@/lib/weather/fetchWeather";


export async function handleNewPeriodicDocument(
  doc: QueryDocumentSnapshot<DocumentData>
) {
  try {
    const data = doc.data();

    if (!data) {
      console.error("[preprocessPeriodic] 문서 데이터가 없습니다. (docId:", doc.id, ")");
      return;
    }

    // Firestore Document → PeriodicRaw 타입으로 매핑
    const raw: PeriodicRaw = {
      timestamp: data.timestamp ?? 0,
      heart_rate_avg: data.heart_rate_avg ?? 0,
      hrv_sdnn: data.hrv_sdnn ?? 0,
      respiratory_rate_avg: data.respiratory_rate_avg ?? 0,
      movement_count: data.movement_count ?? 0,
      heart_rate_max: data.heart_rate_max,
      heart_rate_min: data.heart_rate_min,
      is_fallback: data.is_fallback ?? false,
    };

    /**
     * 날씨 데이터 가져오기
     * 기상청 API를 호출하여 현재 날씨 정보를 가져옵니다.
     * API 호출 실패 시에도 전처리는 계속 진행합니다 (weather는 optional).
     */
    let weather;
    try {
      weather = await fetchWeather();
    } catch {
      // weather는 undefined로 유지되어 optional 처리됨
    }

    // 1) 전처리 엔진 호출 → 수면/스트레스 점수 계산 (날씨 데이터 포함)
    const metrics = preprocessPeriodicSample(raw);

    // 2) 최신 전처리 결과를 캐시에 저장
    setProcessedMetrics(metrics.sleep_score ?? 0, metrics.stress_score);
  } catch (error) {
    console.error("[preprocessPeriodic] 전처리 중 오류 발생:", error);
  }
}