/**
 * 세그먼트 관련 유틸리티 함수
 */

import type { MoodStreamSegment } from "@/hooks/useMoodStream/types";

/**
 * 세그먼트들의 timestamp를 순차적으로 계산
 * 
 * @param baseTimestamp - 시작 timestamp (밀리초)
 * @param segments - timestamp가 없는 세그먼트 배열
 * @param intervalMinutes - 세그먼트 간 간격 (분, 기본값: 10분)
 * @returns timestamp가 설정된 세그먼트 배열
 */
export function calculateSegmentTimestamps(
  baseTimestamp: number,
  segments: MoodStreamSegment[],
  intervalMinutes: number = 10
): MoodStreamSegment[] {
  return segments.map((seg, idx) => ({
    ...seg,
    timestamp: baseTimestamp + (idx * intervalMinutes * 60 * 1000),
  }));
}

/**
 * 마지막 세그먼트의 종료 시점 계산
 * 
 * @param segments - 세그먼트 배열
 * @returns 마지막 세그먼트의 종료 시점 (timestamp + duration)
 */
export function getLastSegmentEndTime(segments: MoodStreamSegment[]): number {
  if (segments.length === 0) {
    return Date.now();
  }
  
  const lastSegment = segments[segments.length - 1];
  return lastSegment.timestamp + lastSegment.duration;
}

/**
 * 세그먼트들을 연속된 timestamp로 연결
 * 
 * @param baseTimestamp - 시작 timestamp
 * @param segments - 연결할 세그먼트 배열
 * @returns timestamp가 순차적으로 설정된 세그먼트 배열
 */
export function chainSegments(
  baseTimestamp: number,
  segments: MoodStreamSegment[]
): MoodStreamSegment[] {
  let currentTimestamp = baseTimestamp;
  
  return segments.map((seg) => {
    const result = {
      ...seg,
      timestamp: currentTimestamp,
    };
    currentTimestamp += seg.duration;
    return result;
  });
}

