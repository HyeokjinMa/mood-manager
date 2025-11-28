// src/lib/sleep/index.ts
/**
 * [파일 역할]
 * - sleep(수면) 관련 모듈들을 한 곳에서 export 해주는 엔트리 파일입니다.
 * - 외부에서 sleep 관련 기능을 import할 때,
 *   개별 파일들을 직접 import하지 않아도 되도록 단일 진입점을 제공합니다.
 *
 * [내보내는 기능]
 * - calculateSleepScore: 0~100 수면 점수 계산
 * - detectSleepStage: Deep / Light / REM 분류
 * - sleep/utils.ts: clamp, normalize 등 전용 유틸리티
 */

export * from "./calculateSleepScore";
export * from "./detectSleepStage";
export * from "./utils";
