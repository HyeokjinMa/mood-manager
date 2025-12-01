/**
 * 목업 데이터 반환 헬퍼 함수
 * 중복 코드 제거를 위한 공통 함수
 */

import { getMockPreprocessingData, getMockMoodStream } from "@/lib/mock/mockData";
import type { CommonData } from "../types";

/**
 * 목업 데이터로 CommonData 반환
 */
export function getMockCommonData(): CommonData {
  const preprocessed = getMockPreprocessingData();
  const mockMoodStream = getMockMoodStream();
  return {
    preprocessed,
    moodStream: {
      currentMood: {
        ...mockMoodStream.currentMood,
        cluster: "0", // 기본값
      },
      moodStream: mockMoodStream.segments,
      userDataCount: mockMoodStream.userDataCount,
    },
  };
}

