// src/lib/llm/generatePrompt.ts
/**
 * LLM 프롬프트 생성
 */

import type { LLMInput } from "./prepareLLMInput";

/**
 * 날씨 정보 문자열 변환
 */
function formatWeather(weather: LLMInput["preprocessed"]["weather"]): string {
  const rainTypes = ['없음', '비', '비/눈', '눈'];
  const skyTypes = ['', '맑음', '', '구름 많음', '흐림'];
  
  return `${weather.temperature}°C, 습도 ${weather.humidity}%, ${rainTypes[weather.rainType]}, ${skyTypes[weather.sky]}`;
}

/**
 * 감정 이벤트 요약
 */
function formatEmotionEvents(
  emotionEvents: LLMInput["preprocessed"]["emotionEvents"]
): string {
  const counts = {
    웃음: emotionEvents.laughter?.length || 0,
    한숨: emotionEvents.sigh?.length || 0,
    분노: emotionEvents.anger?.length || 0,
    슬픔: emotionEvents.sadness?.length || 0,
    평온: emotionEvents.neutral?.length || 0,
  };
  
  const dominant = Object.entries(counts)
    .filter(([_, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([emotion, count]) => `${emotion}(${count}회)`)
    .join(', ');
  
  return dominant || '평온 상태';
}

/**
 * 선호도 문자열 변환
 */
function formatPreferences(prefs: Record<string, '+' | '-'>): string {
  return Object.entries(prefs)
    .filter(([_, value]) => value === '+')
    .map(([key]) => key)
    .join(', ') || '없음';
}

/**
 * LLM 프롬프트 생성
 */
export function generatePrompt(input: LLMInput): string {
  const { preprocessed, moodName, musicGenre, scentType, userPreferences, timeOfDay, season } = input;
  
  const weatherString = formatWeather(preprocessed.weather);
  const emotionSummary = formatEmotionEvents(preprocessed.emotionEvents);
  
  const musicPrefs = formatPreferences(userPreferences.music);
  const colorPrefs = formatPreferences(userPreferences.color);
  const scentPrefs = formatPreferences(userPreferences.scent);
  
  const preferenceWeight = input.userDataCount 
    ? Math.min(1.0, input.userDataCount / 100) 
    : 0;
  
  let prompt = `당신은 감성적인 무드 배경을 설계하는 전문가입니다.

[무드 정보]
- 무드: ${moodName}
- 음악 장르: ${musicGenre}
- 향: ${scentType}
- 시간대: ${timeOfDay || new Date().getHours()}시
- 계절: ${season || inferSeason(new Date().getMonth() + 1)}

[전처리된 생체 데이터]
- 평균 스트레스 지수: ${preprocessed.average_stress_index}/100
- 최근 스트레스 지수: ${preprocessed.recent_stress_index}/100
- 최근 수면 점수: ${preprocessed.latest_sleep_score}/100
- 최근 수면 시간: ${preprocessed.latest_sleep_duration}분

[날씨 정보]
- ${weatherString}

[감정 이벤트]
- ${emotionSummary}
`;
  
  if (preferenceWeight > 0.5) {
    prompt += `
[사용자 선호도] (중요도: ${Math.round(preferenceWeight * 100)}%)
- 음악: ${musicPrefs}
- 색상: ${colorPrefs}
- 향: ${scentPrefs}

사용자 선호도를 반드시 고려하여 배경을 설계하세요.
`;
  } else {
    prompt += `
[사용자 선호도] (참고용)
- 음악: ${musicPrefs}
- 색상: ${colorPrefs}
- 향: ${scentPrefs}
`;
  }
  
  prompt += `
[요구사항]
1. 무드별명: 무드의 특성을 잘 나타내는 한국어 별명 (2-4단어)
2. 음악 선곡: 장르에 맞는 구체적인 곡명 또는 스타일
3. 무드 컬러: HEX 코드 (사용자 비선호 색상 피하기)
4. 조명: RGB 값과 밝기 (0-100, 스트레스 지수 고려)
5. 배경 아이콘: React Icons 이름 (날씨/계절에 맞게)
6. 배경 풍향: 0-360도
7. 배경 풍속: 0-10 (무드에 맞게)
8. 애니메이션 속도: 0-10
9. 아이콘 투명도: 0-1
10. 아이콘 개수: 5-10 (선택적)
11. 아이콘 크기: 0-100 (선택적)
12. 파티클 효과: true/false (선택적)
13. 그라데이션 색상: 2-3개 HEX 코드 (선택적)

다음 JSON 형식으로 응답하세요:
{
  "moodAlias": "...",
  "musicSelection": "...",
  "moodColor": "#...",
  "lighting": { "rgb": [...], "brightness": ..., "temperature": ... },
  "backgroundIcon": { "name": "...", "category": "..." },
  "backgroundWind": { "direction": ..., "speed": ... },
  "animationSpeed": ...,
  "iconOpacity": ...,
  "iconCount": ...,
  "iconSize": ...,
  "particleEffect": ...,
  "gradientColors": [...]
}`;
  
  return prompt;
}

function inferSeason(month: number): string {
  if (month >= 3 && month <= 5) return "Spring";
  if (month >= 6 && month <= 8) return "Summer";
  if (month >= 9 && month <= 11) return "Autumn";
  return "Winter";
}

