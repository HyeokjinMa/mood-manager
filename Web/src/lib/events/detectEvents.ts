/**
 * 이벤트 감지 유틸리티
 * 
 * 날짜 기반으로 특별한 이벤트(크리스마스, 신년, 발렌타인 등)를 감지하고
 * 해당 이벤트에 맞는 아이콘 세트와 음악 카테고리를 반환
 */

export type EventType = 
  | "christmas" 
  | "newyear" 
  | "valentine" 
  | "halloween" 
  | "spring" 
  | "summer" 
  | "autumn" 
  | "winter"
  | null;

export interface EventInfo {
  type: EventType;
  name: string;
  description: string;
  iconSet: string[]; // 이벤트에 맞는 아이콘 세트 (이모지 또는 아이콘 이름)
  musicCategory?: string; // 음악 카테고리 (예: "christmas_carol", "newyear_celebration")
  startDate?: Date;
  endDate?: Date;
}

/**
 * 현재 날짜 기반 이벤트 감지
 */
export function detectCurrentEvent(date: Date = new Date()): EventInfo | null {
  const month = date.getMonth() + 1; // 1-12
  const day = date.getDate();
  const year = date.getFullYear();

  // 크리스마스 시즌 (12월 1일 ~ 12월 31일)
  if (month === 12) {
    return {
      type: "christmas",
      name: "Christmas Season",
      description: "크리스마스 시즌 - 캐롤과 겨울 분위기",
      iconSet: ["🎄", "❄️", "⭐", "🎁", "🔔", "🕯️", "⛄", "🎅"],
      musicCategory: "christmas_carol",
      startDate: new Date(year, 11, 1), // 12월 1일
      endDate: new Date(year, 11, 31), // 12월 31일
    };
  }

  // 신년 (1월 1일 ~ 1월 7일)
  if (month === 1 && day <= 7) {
    return {
      type: "newyear",
      name: "New Year Celebration",
      description: "신년 축하 - 희망과 새로운 시작",
      iconSet: ["🎆", "🎇", "✨", "🎊", "🎉", "🌟", "💫", "🎈"],
      musicCategory: "newyear_celebration",
      startDate: new Date(year, 0, 1), // 1월 1일
      endDate: new Date(year, 0, 7), // 1월 7일
    };
  }

  // 발렌타인 데이 (2월 14일)
  if (month === 2 && day === 14) {
    return {
      type: "valentine",
      name: "Valentine's Day",
      description: "발렌타인 데이 - 사랑과 로맨스",
      iconSet: ["💕", "💖", "💗", "🌹", "💐", "💝", "🎀", "💌"],
      musicCategory: "romantic",
      startDate: new Date(year, 1, 14),
      endDate: new Date(year, 1, 14),
    };
  }

  // 할로윈 (10월 31일)
  if (month === 10 && day === 31) {
    return {
      type: "halloween",
      name: "Halloween",
      description: "할로윈 - 신비로운 분위기",
      iconSet: ["🎃", "👻", "🦇", "🕷️", "🕸️", "🧙", "⚰️", "🌙"],
      musicCategory: "mysterious",
      startDate: new Date(year, 9, 31),
      endDate: new Date(year, 9, 31),
    };
  }

  // 계절별 이벤트 (이벤트가 없을 때 계절만 표시)
  if (month >= 3 && month <= 5) {
    return {
      type: "spring",
      name: "Spring",
      description: "봄 - 새싹과 꽃",
      iconSet: ["🌸", "🌺", "🌷", "🌼", "🦋", "🐝", "🌿", "🍃"],
      musicCategory: "spring",
    };
  }

  if (month >= 6 && month <= 8) {
    return {
      type: "summer",
      name: "Summer",
      description: "여름 - 햇살과 바다",
      iconSet: ["☀️", "🌊", "🏖️", "🌴", "🍉", "🍦", "🌻", "🦋"],
      musicCategory: "summer",
    };
  }

  if (month >= 9 && month <= 11) {
    return {
      type: "autumn",
      name: "Autumn",
      description: "가을 - 낙엽과 수확",
      iconSet: ["🍂", "🍁", "🌾", "🍎", "🌰", "🦔", "🍇", "🌙"],
      musicCategory: "autumn",
    };
  }

  if (month === 12 || month === 1 || month === 2) {
    return {
      type: "winter",
      name: "Winter",
      description: "겨울 - 눈과 차가움",
      iconSet: ["❄️", "⛄", "🌨️", "🧊", "🔥", "☕", "🧣", "🎄"],
      musicCategory: "winter",
    };
  }

  return null;
}

/**
 * LLM에 전달할 이벤트 정보 포맷팅
 */
export function formatEventForLLM(event: EventInfo | null): string {
  if (!event) return "";
  
  return `${event.name}: ${event.description}. Music category: ${event.musicCategory || "general"}. Icons: ${event.iconSet.join(", ")}`;
}

