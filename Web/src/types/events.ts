/**
 * 이벤트 관련 타입 정의
 * 
 * Phase 2 리팩토링: lib/events 내부의 타입을 통합
 */

/**
 * 아이콘 키 타입
 * (src/lib/events/iconMapping.ts에서 이동)
 */
export type IconKey = 
  // 크리스마스
  | "tree" | "snowflake" | "star" | "gift" | "bell" | "candle" | "snowman" | "santa"
  // 신년
  | "fire" | "rocket" | "sparkles" | "confetti" | "starOfLife" | "magic" | "balloon"
  // 발렌타인
  | "heart" | "heartBroken" | "heartbeat" | "rose" | "flower" | "gem" | "ribbon" | "envelope"
  // 할로윈
  | "pumpkin" | "ghost" | "spider" | "spiderWeb" | "hatWizard" | "skull" | "moon" | "cloudMoon"
  // 계절/일반
  | "sun" | "umbrellaBeach" | "palmTree" | "water" | "iceCream" | "sunPlantWilt" | "butterfly"
  | "leaf" | "mountain" | "mountainSun" | "treePine" | "flowerTulip" | "wheatAwn" | "apple" | "chestnut" | "grapes"
  // 기본 (향 타입별)
  | "petal" | "waterDrop" | "circle" | "cloud";

