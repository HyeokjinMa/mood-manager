import type { EventType } from "./detectEvents";

/**
 * 이벤트 아이콘 매핑
 * 
 * - 실제 React 아이콘 컴포넌트는 사용하지 않고,
 *   Canvas 드로잉용으로 문자열 키만 관리합니다.
 * - 키 → 드로잉 함수 매핑은 ScentBackground/drawing.ts 의 drawIconByKey 에서 처리합니다.
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

/**
 * 이벤트별 아이콘 세트
 * - EventType 에는 null 이 포함되어 있으므로, null 을 제외한 실제 이벤트 문자열만 키로 사용
 */
export const EVENT_ICON_SETS: Record<Exclude<EventType, null>, IconKey[]> = {
  // 트리 자체보다는 장식/장면 느낌의 아이콘 위주로 구성
  christmas: ["snowflake", "star", "gift", "bell", "candle", "snowman", "sparkles"],
  newyear: ["fire", "rocket", "sparkles", "confetti", "starOfLife", "magic", "balloon", "star"],
  valentine: ["heart", "heartBroken", "heartbeat", "rose", "flower", "gem", "ribbon", "envelope"],
  halloween: ["pumpkin", "ghost", "spider", "spiderWeb", "hatWizard", "skull", "moon", "cloudMoon"],
  spring: ["flower", "flowerTulip", "butterfly", "leaf", "sun", "treePine", "apple", "grapes"],
  summer: ["sun", "umbrellaBeach", "palmTree", "water", "iceCream", "sunPlantWilt", "butterfly", "star"],
  autumn: ["leaf", "wheatAwn", "apple", "chestnut", "grapes", "mountain", "moon", "treePine"],
  winter: ["snowflake", "snowman", "moon", "cloudMoon", "iceCream", "candle"],
};

/**
 * 향 타입별 기본 아이콘 (이벤트가 없을 때)
 */
export const SCENT_DEFAULT_ICONS: Record<string, IconKey> = {
  Floral: "petal",
  Marine: "waterDrop",
  Citrus: "circle",
  Woody: "leaf",
  Musk: "cloud",
  Aromatic: "leaf",
  Green: "leaf",
  Spicy: "circle",
  Honey: "circle",
  Dry: "circle",
  Leathery: "circle",
  Powdery: "circle",
};

/**
 * 이벤트가 있을 때 사용할 아이콘 세트 가져오기
 */
export function getIconSetForEvent(eventType: EventType | null, scentType?: string): IconKey[] {
  if (eventType && EVENT_ICON_SETS[eventType]) {
    return EVENT_ICON_SETS[eventType];
  }
  
  // 이벤트가 없으면 향 타입별 기본 아이콘 사용
  const defaultIcon = scentType ? SCENT_DEFAULT_ICONS[scentType] || "circle" : "circle";
  return [defaultIcon];
}

/**
 * 랜덤 아이콘 선택 (여러 아이콘 혼합)
 */
export function getRandomIconFromSet(iconSet: IconKey[]): IconKey {
  return iconSet[Math.floor(Math.random() * iconSet.length)];
}

