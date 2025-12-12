/**
 * 무드스트림 관리 커스텀 훅
 * 
 * Phase 1 단순화: 세그먼트 관리 로직을 home/page.tsx에서 분리
 * Phase 3 개선: 자동 생성 로직 개선, 재시도 로직 추가, 병합 전략 개선
 * 
 * 책임:
 * - 초기 세그먼트 로드
 * - LLM 세그먼트 생성 및 병합
 * - 세그먼트 전환 관리
 * - 다음 스트림 생성 조건 체크
 */

import { useState, useCallback, useEffect } from "react";
import type { MoodStreamSegment } from "./useMoodStream/types";
import type { MoodStreamData } from "@/types/moodStream";
import { getLastSegmentEndTime } from "@/lib/utils/segmentUtils";

/**
 * Phase 3: 병합 전략 설정
 */
interface MergeStrategy {
  /** 초기 세그먼트 수 */
  initialCount: number;
  /** LLM 생성 세그먼트 수 */
  llmCount: number;
  /** 병합 시 유지할 LLM 세그먼트 수 (나머지 버림) */
  keepLlmCount: number;
}

const DEFAULT_MERGE_STRATEGY: MergeStrategy = {
  initialCount: 3,
  llmCount: 10, // LLM이 10개 생성
  keepLlmCount: 7, // 초기 3개 + LLM 앞 7개 = 총 10개 (마지막 3개 버림)
};

/**
 * Phase 3: 세그먼트 병합 (설정 가능한 전략 사용)
 * 
 * 초기 3세그먼트와 LLM 생성 10세그먼트를 병합
 * - 초기 3세그먼트: [0, 1, 2]
 * - LLM 생성 10세그먼트: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
 * - 앞 7개만 가져오기: [0, 1, 2, 3, 4, 5, 6]
 * - 마지막 3세그먼트 버림: [7, 8, 9] 제거
 * - 최종: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] (초기 3개 + LLM 7개 = 총 10개)
 */
function mergeSegments(
  initialSegments: MoodStreamSegment[],
  llmSegments: MoodStreamSegment[],
  strategy: MergeStrategy = DEFAULT_MERGE_STRATEGY
): MoodStreamSegment[] {
  // 초기 세그먼트가 strategy.initialCount와 일치하는지 확인
  if (initialSegments.length === strategy.initialCount) {
    // 초기 세그먼트 + LLM 앞 keepLlmCount개
    return [
      ...initialSegments,
      ...llmSegments.slice(0, strategy.keepLlmCount)
    ];
  }
  
  // 일반적인 경우: 그냥 추가
  return [...initialSegments, ...llmSegments];
}

/**
 * Phase 3: 재시도 설정
 */
interface RetryConfig {
  maxRetries: number;
  initialDelay: number; // ms
  maxDelay: number; // ms
  backoffMultiplier: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
};

/**
 * Phase 3: 지수 백오프를 사용한 재시도 로직
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<T> {
  let lastError: Error | null = null;
  let delay = config.initialDelay;
  
  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt < config.maxRetries) {
        console.log(
          `[useMoodStreamManager] Retry attempt ${attempt + 1}/${config.maxRetries} after ${delay}ms`
        );
        await new Promise(resolve => setTimeout(resolve, delay));
        delay = Math.min(delay * config.backoffMultiplier, config.maxDelay);
      }
    }
  }
  
  throw lastError || new Error("Max retries exceeded");
}

/**
 * Phase 3: 자동 생성 조건 체크
 * 
 * @param isFirstVisit - 로그인 후 최초 진입 여부 (초기 3세그먼트만 있을 때)
 * @param currentIndex - 현재 세그먼트 인덱스
 * @param totalSegments - 전체 세그먼트 수
 * @param isLoading - 로딩 중 여부
 * @param isGenerating - 생성 중 여부
 * @returns 자동 생성 필요 여부
 */
function shouldAutoGenerateStream(
  isFirstVisit: boolean,
  currentIndex: number,
  totalSegments: number,
  isLoading: boolean,
  isGenerating: boolean
): boolean {
  // 로딩 중이거나 생성 중이면 스킵
  if (isLoading || isGenerating) {
    return false;
  }
  
  // 로그인 후 최초 진입: 초기 3세그먼트만 있을 때
  if (isFirstVisit && totalSegments === DEFAULT_MERGE_STRATEGY.initialCount) {
    return true;
  }
  
  // 현재 세그먼트가 뒤에서 2번째 이내
  if (totalSegments > 0 && currentIndex >= totalSegments - 2) {
    return true;
  }
  
  return false;
}

/**
 * 다음 스트림 생성 조건 체크 (하위 호환성 유지)
 * 
 * 현재 세그먼트 인덱스가 (전체 세그먼트 수 - 2) 이상일 때
 * 예: 10개 세그먼트 중 8번째 이상일 때 다음 스트림 생성
 */
export function shouldGenerateNextStream(
  currentIndex: number,
  totalSegments: number
): boolean {
  // 뒤에서 2번째 이내
  return currentIndex >= totalSegments - 2;
}

interface UseMoodStreamManagerOptions {
  /** 인증 상태 */
  isAuthenticated: boolean;
  /** 초기 세그먼트 (이미 로드된 경우 전달, 없으면 자동 로드) */
  initialSegments?: MoodStreamSegment[];
  /** 초기 세그먼트 로드 완료 시 콜백 (currentMood 설정용) */
  onInitialSegmentsLoaded?: (firstSegment: MoodStreamSegment) => void;
}

interface UseMoodStreamManagerReturn {
  /** 무드스트림 데이터 */
  moodStreamData: MoodStreamData;
  /** 세그먼트 업데이트 */
  setMoodStreamData: React.Dispatch<React.SetStateAction<MoodStreamData>>;
  /** 초기 세그먼트 로드 */
  loadInitialSegments: () => Promise<void>;
  /** LLM 세그먼트 생성 및 병합 */
  generateAndMergeStream: (segmentCount?: number) => Promise<void>;
  /** 새로고침 요청 핸들러 */
  handleRefreshRequest: () => void;
  /** 다음 스트림 생성 조건 체크 및 자동 생성 */
  checkAndGenerateNextStream: () => void;
}

/**
 * 무드스트림 관리 훅
 */
export function useMoodStreamManager(
  options: UseMoodStreamManagerOptions
): UseMoodStreamManagerReturn {
  const { isAuthenticated, initialSegments: providedInitialSegments, onInitialSegmentsLoaded } = options;

  // 제공된 초기 세그먼트가 있으면 즉시 초기 상태에 반영
  const [moodStreamData, setMoodStreamData] = useState<MoodStreamData>(() => {
    if (providedInitialSegments && providedInitialSegments.length > 0) {
      console.log("[useMoodStreamManager] ✅ 제공된 초기 세그먼트로 초기 상태 설정:", {
        count: providedInitialSegments.length,
      });
      return {
        streamId: `stream-${Date.now()}`,
        segments: providedInitialSegments,
        currentIndex: 0,
        isLoading: false, // 초기 세그먼트가 있으면 로딩 완료
        isGeneratingNextStream: false,
      };
    }
    return {
      streamId: "",
      segments: [],
      currentIndex: 0,
      isLoading: true,
      isGeneratingNextStream: false,
    };
  });

  /**
   * 초기 세그먼트 로드
   * 
   * 로그인 후 최초 home 진입 시 크리스마스 컨셉 3세그먼트를 로드합니다.
   */
  const loadInitialSegments = useCallback(async () => {
    console.log("[useMoodStreamManager] loadInitialSegments 호출:", {
      isAuthenticated,
      segmentsLength: moodStreamData.segments.length,
      hasProvidedSegments: !!providedInitialSegments,
    });
    
    // 이미 초기 세그먼트가 제공된 경우 사용
    if (providedInitialSegments && providedInitialSegments.length > 0) {
      console.log("[useMoodStreamManager] ✅ 제공된 초기 세그먼트 사용:", {
        count: providedInitialSegments.length,
      });
      
      setMoodStreamData(prev => ({
        ...prev,
        streamId: `stream-${Date.now()}`,
        segments: providedInitialSegments,
        currentIndex: 0,
        isLoading: false,
      }));
      
      // 첫 번째 세그먼트 정보 공유 (currentMood 초기화)
      const firstSegment = providedInitialSegments[0];
      if (firstSegment?.mood && onInitialSegmentsLoaded) {
        console.log("[useMoodStreamManager] ✅ 제공된 초기 세그먼트에서 첫 번째 세그먼트 콜백 호출");
        onInitialSegmentsLoaded(firstSegment);
      }
      return;
    }
    
    // 제공된 초기 세그먼트가 없으면 자동 로드
    if (moodStreamData.segments.length > 0) {
      console.log("[useMoodStreamManager] ⚠️ 이미 세그먼트가 있음, 초기 세그먼트 로드 스킵");
      return;
    }

    console.log("[useMoodStreamManager] 🔄 초기 세그먼트 로드 시작 (isLoading: true)");
    setMoodStreamData(prev => ({ ...prev, isLoading: true }));

    try {
      // 타임아웃을 위한 AbortController 생성
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000); // 30초 타임아웃

      console.log("[useMoodStreamManager] 📤 /api/moods/carol-segments API 호출 시작");
      const response = await fetch("/api/moods/carol-segments", {
        credentials: "include",
        signal: controller.signal,
      });

      clearTimeout(timeout);
      console.log("[useMoodStreamManager] 📥 /api/moods/carol-segments API 응답:", {
        ok: response.ok,
        status: response.status,
        statusText: response.statusText,
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch carol segments: ${response.status} ${response.statusText}`);
      }

      let data;
      try {
        data = await response.json();
      } catch {
        throw new Error("Failed to parse carol segments JSON");
      }

      const carolSegments: MoodStreamSegment[] = data.segments || [];

      if (carolSegments.length === 0) {
        throw new Error("No carol segments found");
      }

      // 상태에 저장 (isLoading: false로 즉시 완료 처리)
      // 초기 세그먼트는 하드코딩되어 있어서 즉시 로드 가능
      // LLM 생성은 백그라운드에서 진행되며, 초기 세그먼트 표시를 막지 않음
      setMoodStreamData(prev => ({
        ...prev,
        streamId: `stream-${Date.now()}`,
        segments: carolSegments,
        currentIndex: 0,
        isLoading: false, // 즉시 완료: 초기 세그먼트는 하드코딩되어 있음
      }));

      // 첫 번째 세그먼트 정보 공유 (currentMood 초기화)
      // 이 콜백은 home/page.tsx에서 currentMood를 설정하는 데 사용됨
      const firstSegment = carolSegments[0];
      if (firstSegment?.mood && onInitialSegmentsLoaded) {
        console.log("[useMoodStreamManager] ✅ 초기 세그먼트 로드 완료, 첫 번째 세그먼트 콜백 호출:", {
          moodAlias: firstSegment.mood.name,
          color: firstSegment.mood.color,
          hasBackgroundParams: !!firstSegment.backgroundParams,
        });
        onInitialSegmentsLoaded(firstSegment);
      } else {
        console.warn("[useMoodStreamManager] ⚠️ 첫 번째 세그먼트 또는 콜백이 없음:", {
          hasFirstSegment: !!firstSegment,
          hasMood: !!firstSegment?.mood,
          hasCallback: !!onInitialSegmentsLoaded,
        });
      }
      
      // 초기 세그먼트 로드 후 자동으로 LLM 세그먼트 생성
      // (useEffect에서 처리하지만, 여기서 직접 호출하는 것이 더 명확함)
      // 하지만 useEffect에서 처리하는 것이 의존성 관리에 더 안전하므로 그대로 유지
    } catch (error) {
      console.error("[useMoodStreamManager] Failed to load initial segments:", error);
      setMoodStreamData(prev => ({ ...prev, isLoading: false }));
    }
  }, [isAuthenticated, moodStreamData.segments.length, providedInitialSegments, onInitialSegmentsLoaded]);

  /**
   * Phase 3: LLM 세그먼트 생성 및 병합 (재시도 로직 포함)
   * 
   * LLM을 통해 세그먼트를 생성하고, 초기 세그먼트와 병합합니다.
   * 마지막 3개 세그먼트는 버립니다.
   * 
   * @param segmentCount 생성할 세그먼트 수 (기본값: 7)
   * @param currentSegments 현재 세그먼트 배열 (새로고침 시 사용)
   */
  const generateAndMergeStream = useCallback(async (
    segmentCount: number = 7,
    currentSegments?: MoodStreamSegment[]
  ) => {
    if (moodStreamData.isGeneratingNextStream) {
      return; // 이미 생성 중이면 스킵
    }

    setMoodStreamData(prev => ({ ...prev, isGeneratingNextStream: true }));

    try {
      // currentSegments가 제공되면 사용, 없으면 현재 상태 사용
      const segmentsToUse = currentSegments || moodStreamData.segments;
      const nextStartTime = getLastSegmentEndTime(segmentsToUse);

      // Phase 3: 재시도 로직을 사용한 API 호출
      const newSegments = await retryWithBackoff(async () => {
        // 타임아웃을 위한 AbortController 생성
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 120000); // 120초 타임아웃

        try {
          const response = await fetch("/api/moods/current/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            signal: controller.signal,
            body: JSON.stringify({
              nextStartTime,
              segmentCount,
            }),
          });

          clearTimeout(timeout);

          if (!response.ok) {
            throw new Error(`Failed to generate mood stream: ${response.status} ${response.statusText}`);
          }

          let data;
          try {
            data = await response.json();
          } catch {
            throw new Error("Failed to parse response JSON");
          }

          const segments: MoodStreamSegment[] = data.moodStream || [];
          
          if (segments.length === 0) {
            throw new Error("No segments returned from API");
          }

          return segments;
        } catch (error) {
          clearTimeout(timeout);
          // AbortError인 경우 타임아웃 에러로 처리
          if (error instanceof Error && error.name === "AbortError") {
            throw new Error("Request timeout after 120 seconds");
          }
          throw error;
        }
      });

      // Phase 3: 세그먼트 병합 전략 적용 (설정 가능한 전략 사용)
      const hasInitialSegments = 
        segmentsToUse.length === DEFAULT_MERGE_STRATEGY.initialCount && 
        segmentsToUse[0]?.backgroundParams?.source === "initial";
      
      if (hasInitialSegments && segmentCount >= DEFAULT_MERGE_STRATEGY.keepLlmCount) {
        // 초기 3개 + LLM 앞 7개 = 총 10개 (마지막 3개 버림)
        // LLM이 10개를 생성하더라도 앞 keepLlmCount(7)개만 가져오기
        const mergedSegments = mergeSegments(segmentsToUse, newSegments, DEFAULT_MERGE_STRATEGY);
        console.log("[useMoodStreamManager] ✅ 초기 세그먼트 병합 완료:", {
          initialCount: segmentsToUse.length,
          llmGeneratedCount: newSegments.length,
          keptLlmCount: DEFAULT_MERGE_STRATEGY.keepLlmCount,
          finalCount: mergedSegments.length,
        });
        setMoodStreamData(prev => ({
          ...prev,
          segments: mergedSegments,
          isGeneratingNextStream: false,
        }));
      } else {
        // 일반적인 경우: 그냥 추가
        console.log("[useMoodStreamManager] ⚠️ 일반 추가 경로:", {
          hasInitialSegments,
          segmentCount,
          requiredSegmentCount: DEFAULT_MERGE_STRATEGY.keepLlmCount,
          segmentsToUseLength: segmentsToUse.length,
          newSegmentsLength: newSegments.length,
        });
        setMoodStreamData(prev => ({
          ...prev,
          segments: [...prev.segments, ...newSegments],
          isGeneratingNextStream: false,
        }));
      }
    } catch (error) {
      console.error("[useMoodStreamManager] Failed to generate mood stream after retries:", error);
      setMoodStreamData(prev => ({ ...prev, isGeneratingNextStream: false }));
      // 재시도 실패 시에도 사용자 경험을 위해 에러만 로그하고 상태만 업데이트
      // UI는 기존 세그먼트를 계속 사용할 수 있음
    }
  }, [moodStreamData.isGeneratingNextStream, moodStreamData.segments]);

  /**
   * 새로고침 요청 핸들러
   * 
   * 현재 세그먼트부터 다시 생성합니다.
   */
  const handleRefreshRequest = useCallback(() => {
    // 현재 세그먼트까지의 segments만 남기고 나머지 제거
    const currentSegments = moodStreamData.segments.slice(0, moodStreamData.currentIndex + 1);
    
    // segments 업데이트
    setMoodStreamData(prev => ({
      ...prev,
      segments: currentSegments,
    }));
    
    // 현재 세그먼트부터 10개 새로 생성
    generateAndMergeStream(10, currentSegments);
  }, [moodStreamData.segments, moodStreamData.currentIndex, generateAndMergeStream]);

  /**
   * 다음 스트림 생성 조건 체크 및 자동 생성
   */
  const checkAndGenerateNextStream = useCallback(() => {
    // 스트림이 로드되지 않았거나 생성 중이면 스킵
    if (moodStreamData.isLoading || moodStreamData.isGeneratingNextStream) {
      return;
    }

    // 세그먼트가 없으면 스킵
    if (!moodStreamData.segments || moodStreamData.segments.length === 0) {
      return;
    }

    // 뒤에서 2번째 이내인지 체크
    if (shouldGenerateNextStream(moodStreamData.currentIndex, moodStreamData.segments.length)) {
      // 다음 스트림 생성 (10개)
      generateAndMergeStream(10);
    }
  }, [
    moodStreamData.isLoading,
    moodStreamData.isGeneratingNextStream,
    moodStreamData.segments,
    moodStreamData.currentIndex,
    generateAndMergeStream,
  ]);

        /**
         * Phase 3: 통합된 useEffect - 초기 로드 및 자동 생성 로직
         * 
         * 기존 3개의 useEffect를 하나로 통합하여 로직 명확화
         * 
         * 중요: 초기 세그먼트는 인증 상태와 무관하게 즉시 로드
         * - 초기 세그먼트는 하드코딩된 값이므로 인증이 필요 없음
         * - 스켈레톤 UI를 피하기 위해 즉시 로드
         * - 초기 세그먼트 로드는 컴포넌트 마운트 시 즉시 실행 (의존성 배열 없음)
         */
        // 제공된 초기 세그먼트가 변경되면 즉시 반영
        useEffect(() => {
          if (providedInitialSegments && providedInitialSegments.length > 0) {
            // segments가 비어있거나 제공된 세그먼트와 다를 때만 업데이트
            setMoodStreamData(prev => {
              if (prev.segments.length === 0 || 
                  prev.segments[0]?.mood?.id !== providedInitialSegments[0]?.mood?.id) {
                console.log("[useMoodStreamManager] ✅ 제공된 초기 세그먼트 즉시 반영");
                return {
                  ...prev,
                  segments: providedInitialSegments,
                  currentIndex: 0,
                  isLoading: false,
                };
              }
              return prev;
            });
            
            // 콜백 호출 (첫 번째 세그먼트 정보 공유)
            const firstSegment = providedInitialSegments[0];
            if (firstSegment?.mood && onInitialSegmentsLoaded) {
              console.log("[useMoodStreamManager] ✅ 제공된 초기 세그먼트에서 첫 번째 세그먼트 콜백 호출");
              onInitialSegmentsLoaded(firstSegment);
            }
          } else if (moodStreamData.segments.length === 0 && !moodStreamData.isLoading) {
            // 제공된 세그먼트가 없고, 현재도 비어있으면 API로 로드
            console.log("[useMoodStreamManager] 🔄 초기 세그먼트 로드 시작 (API 호출)");
            loadInitialSegments();
          }
        }, [providedInitialSegments, onInitialSegmentsLoaded]); // providedInitialSegments가 변경되면 다시 실행
        
        // LLM 자동 생성은 인증 후에만 실행
        useEffect(() => {
          console.log("[useMoodStreamManager] useEffect 실행 (자동 생성):", {
            isAuthenticated,
            segmentsLength: moodStreamData.segments.length,
            isLoading: moodStreamData.isLoading,
          });
          
          // 인증되지 않은 경우 자동 생성은 스킵
          if (!isAuthenticated) {
            console.log("[useMoodStreamManager] ⚠️ 인증되지 않음, 자동 생성 스킵");
            return;
          }
          
          // 초기 세그먼트가 이미 로드되었는지 확인
          if (moodStreamData.segments.length === 0) {
            console.log("[useMoodStreamManager] ⚠️ 초기 세그먼트가 아직 로드되지 않음, 대기");
            return;
          }

    // 2. 자동 생성 조건 체크
    const isFirstVisit = 
      moodStreamData.segments.length === DEFAULT_MERGE_STRATEGY.initialCount &&
      moodStreamData.segments[0]?.backgroundParams?.source === "initial";
    
    if (
      shouldAutoGenerateStream(
        isFirstVisit,
        moodStreamData.currentIndex,
        moodStreamData.segments.length,
        moodStreamData.isLoading,
        moodStreamData.isGeneratingNextStream
      )
    ) {
      // 첫 방문이면 7개 생성 (초기 3개와 병합), 아니면 10개 생성
      const segmentCount = isFirstVisit 
        ? DEFAULT_MERGE_STRATEGY.llmCount 
        : 10;
      
      // 첫 방문이면 현재 세그먼트 전달 (병합을 위해)
      const segmentsToUse = isFirstVisit 
        ? moodStreamData.segments 
        : undefined;
      
      generateAndMergeStream(segmentCount, segmentsToUse);
    }
  }, [
    isAuthenticated,
    moodStreamData.segments.length,
    moodStreamData.currentIndex,
    moodStreamData.isLoading,
    moodStreamData.isGeneratingNextStream,
    loadInitialSegments,
    generateAndMergeStream,
  ]);

  return {
    moodStreamData,
    setMoodStreamData,
    loadInitialSegments,
    generateAndMergeStream,
    handleRefreshRequest,
    checkAndGenerateNextStream,
  };
}
