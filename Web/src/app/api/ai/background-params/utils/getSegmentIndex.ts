/**
 * 세그먼트 인덱스 조회 유틸리티
 */

interface GetSegmentIndexParams {
  segmentIndexFromBody?: number;
  segment: {
    timestamp: number;
    duration: number;
  };
  moodStream: {
    moodStream?: Array<{
      timestamp: number;
      duration: number;
    }>;
  };
}

/**
 * 세그먼트 인덱스 조회
 * body에서 직접 받거나, moodStream에서 찾기
 */
export function getSegmentIndex({
  segmentIndexFromBody,
  segment,
  moodStream,
}: GetSegmentIndexParams): number {
  if (segmentIndexFromBody !== undefined) {
    return segmentIndexFromBody;
  }

  const index = moodStream.moodStream?.findIndex(
    (s) => s.timestamp === segment.timestamp && s.duration === segment.duration
  );

  return index ?? -1;
}

