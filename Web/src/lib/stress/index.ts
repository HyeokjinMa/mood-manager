// src/lib/stress/index.ts
/**
 * [파일 역할]
 * - 스트레스 계산 모듈들을 한 곳에서 export하는 엔트리 파일입니다.
 * - 외부에서 stress 관련 기능을 import할 때,
 *   단일 진입점으로 제공하여 코드 가독성과 유지보수성을 높입니다.
 *
 * [내보내는 기능]
 * - calculateStressIndex: 0~100 스트레스 점수 계산
 * - stress/utils.ts: clamp, normalize 등 스트레스 정규화 유틸
 */

export * from "./calculateStressIndex";
export * from "./utils";
