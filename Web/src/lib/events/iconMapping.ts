import type { EventInfo, EventType } from "./detectEvents";
import type { IconKey } from "@/types/events";

// 하위 호환성을 위해 re-export
export type { IconKey } from "@/types/events";

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
export function getIconSetForEvent(event: EventInfo | null, scentType?: string): IconKey[] {
  if (event && event.type && EVENT_ICON_SETS[event.type]) {
    return EVENT_ICON_SETS[event.type];
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

/**
 * LLM 프롬프트용 아이콘 카탈로그
 * - 모든 사용 가능한 아이콘 키와 설명
 */
export const iconCatalog: Array<{ key: IconKey; desc: string }> = [
  // 크리스마스
  { key: "tree", desc: "크리스마스 트리, 겨울, 축제" },
  { key: "snowflake", desc: "눈송이, 겨울, 차갑고 조용함" },
  { key: "star", desc: "별, 밤하늘, 반짝임" },
  { key: "gift", desc: "선물, 축하, 기쁨" },
  { key: "bell", desc: "종, 축제, 경쾌함" },
  { key: "candle", desc: "촛불, 따뜻함, 평온" },
  { key: "snowman", desc: "눈사람, 겨울, 즐거움" },
  { key: "santa", desc: "산타클로스, 크리스마스" },
  
  // 신년
  { key: "fire", desc: "불꽃, 에너지, 열정" },
  { key: "rocket", desc: "로켓, 시작, 희망" },
  { key: "sparkles", desc: "반짝임, 축하, 밝음" },
  { key: "confetti", desc: "색종이, 축하, 파티" },
  { key: "starOfLife", desc: "생명의 별, 희망" },
  { key: "magic", desc: "마법, 신비, 특별함" },
  { key: "balloon", desc: "풍선, 축하, 경쾌함" },
  
  // 발렌타인
  { key: "heart", desc: "하트, 사랑, 따뜻함" },
  { key: "heartBroken", desc: "깨진 하트, 슬픔, 아픔" },
  { key: "heartbeat", desc: "심장박동, 생명, 활력" },
  { key: "rose", desc: "장미, 로맨스, 아름다움" },
  { key: "flower", desc: "꽃, 자연, 부드러움" },
  { key: "gem", desc: "보석, 소중함, 빛남" },
  { key: "ribbon", desc: "리본, 장식, 우아함" },
  { key: "envelope", desc: "편지, 소통, 따뜻함" },
  
  // 할로윈
  { key: "pumpkin", desc: "호박, 가을, 할로윈" },
  { key: "ghost", desc: "유령, 신비, 어둠" },
  { key: "spider", desc: "거미, 신비, 정밀함" },
  { key: "spiderWeb", desc: "거미줄, 연결, 복잡함" },
  { key: "hatWizard", desc: "마법사 모자, 신비, 마법" },
  { key: "skull", desc: "해골, 어둠, 신비" },
  { key: "moon", desc: "달, 밤, 고요함" },
  { key: "cloudMoon", desc: "구름과 달, 밤하늘, 평온" },
  
  // 계절/일반
  { key: "sun", desc: "태양, 낮, 따뜻함, 활력" },
  { key: "umbrellaBeach", desc: "비치 우산, 여름, 휴양" },
  { key: "palmTree", desc: "야자수, 열대, 여름" },
  { key: "water", desc: "물, 시원함, 흐름" },
  { key: "iceCream", desc: "아이스크림, 여름, 즐거움" },
  { key: "sunPlantWilt", desc: "시든 식물, 더위, 여름" },
  { key: "butterfly", desc: "나비, 자연, 자유" },
  { key: "leaf", desc: "잎, 자연, 생명" },
  { key: "mountain", desc: "산, 안정, 높음" },
  { key: "mountainSun", desc: "산과 태양, 새벽, 희망" },
  { key: "treePine", desc: "소나무, 겨울, 강인함" },
  { key: "flowerTulip", desc: "튤립, 봄, 아름다움" },
  { key: "wheatAwn", desc: "밀, 가을, 수확" },
  { key: "apple", desc: "사과, 가을, 자연" },
  { key: "chestnut", desc: "밤, 가을, 따뜻함" },
  { key: "grapes", desc: "포도, 가을, 풍요" },
  
  // 기본 (향 타입별)
  { key: "petal", desc: "꽃잎, 부드러움, 자연" },
  { key: "waterDrop", desc: "물방울, 시원함, 순수" },
  { key: "circle", desc: "원, 단순, 평온" },
  { key: "cloud", desc: "구름, 부드러움, 평온" },
];

