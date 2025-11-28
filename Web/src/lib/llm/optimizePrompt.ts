// src/lib/llm/optimizePrompt.ts
/**
 * 프롬프트 최적화
 * 
 * 최소 비용으로 유효한 응답을 받기 위한 프롬프트 최적화
 */

import type { LLMInput } from "./prepareLLMInput";

interface MoodStreamSegmentMood {
  id: string;
  name: string;
  color: string;
}

interface MoodStreamSegment {
  timestamp: number;
  moodName?: string;
  musicGenre?: string;
  scentType?: string;
  mood?: MoodStreamSegmentMood;
  music?: { genre: string; title: string };
  scent?: { type: string; name: string };
  lighting?: { color: string; rgb: [number, number, number] };
  duration: number;
}

/**
 * 프롬프트 최적화 전략
 * 
 * 1. 구조화된 JSON 요청 (Few-shot 대신 구조 명시)
 * 2. 불필요한 설명 제거
 * 3. 핵심 정보만 포함
 * 4. 예시 최소화
 * 5. 30분 스트림 전체 정보 포함
 */
export function generateOptimizedPrompt(
  input: LLMInput,
  segments?: MoodStreamSegment[]
): string {
  const { preprocessed, moodName, musicGenre, scentType, userPreferences, timeOfDay, season } = input;
  
  // 날씨 정보 간소화
  const weather = `${preprocessed.weather.temperature}°C, ${preprocessed.weather.humidity}%, ${
    ['없음', '비', '비/눈', '눈'][preprocessed.weather.rainType]
  }, ${['', '맑음', '', '구름', '흐림'][preprocessed.weather.sky]}`;
  
  // 감정 이벤트 간소화 (영어 표기)
  const emotions = Object.entries({
    laughter: preprocessed.emotionEvents.laughter?.length || 0,
    sigh: preprocessed.emotionEvents.sigh?.length || 0,
    anger: preprocessed.emotionEvents.anger?.length || 0,
    sadness: preprocessed.emotionEvents.sadness?.length || 0,
  })
    .filter(([_, count]) => count > 0)
    .map(([emotion, count]) => `${emotion}(${count})`)
    .join(", ") || "calm";
  
  // 선호도 간소화 (선호만 표시)
  const musicPrefs = Object.entries(userPreferences.music)
    .filter(([_, v]) => v === '+')
    .map(([k]) => k)
    .slice(0, 3)
    .join(', ');
  
  const colorPrefs = Object.entries(userPreferences.color)
    .filter(([_, v]) => v === '+')
    .map(([k]) => k)
    .slice(0, 3)
    .join(', ');
  
  const scentPrefs = Object.entries(userPreferences.scent)
    .filter(([_, v]) => v === '+')
    .map(([k]) => k)
    .slice(0, 3)
    .join(', ');

  // 아이콘 카탈로그 (LLM이 선택할 수 있는 30개 키)
  const iconCatalog = [
    // Weather (6)
    { key: "sun_soft", desc: "soft sun, warm daylight, gentle energy" },
    { key: "moon_calm", desc: "night, quiet, calm focus" },
    { key: "cloud_soft", desc: "cloudy, overcast, soft sky" },
    { key: "rain_light", desc: "light rain, watery, calm" },
    { key: "snow_soft", desc: "snow, cold, quiet, still" },
    { key: "fog_mist", desc: "fog, mist, hazy, dreamy" },

    // Nature (8)
    { key: "leaf_gentle", desc: "leaves, nature, green, relaxing" },
    { key: "tree_peace", desc: "forest, trees, deep calm" },
    { key: "flower_soft", desc: "floral, soft, gentle mood" },
    { key: "wave_slow", desc: "ocean, marine, slow waves" },
    { key: "mountain_silhouette", desc: "mountains, horizon, stable" },
    { key: "forest_deep", desc: "deep forest, grounded, concentrated" },
    { key: "star_sparkle", desc: "small stars, twinkle, night" },
    { key: "breeze_wind", desc: "soft wind, air movement" },

    // Objects / Space (8)
    { key: "candle_warm", desc: "candle, warm light, cozy" },
    { key: "coffee_mug", desc: "coffee/tea mug, cafe, focus" },
    { key: "book_focus", desc: "open book, reading, deep focus" },
    { key: "sofa_relax", desc: "sofa, rest, relaxation" },
    { key: "window_light", desc: "window with light, view, calm" },
    { key: "lamp_soft", desc: "soft lamp, indoor light" },
    { key: "clock_slow", desc: "slow time, no rush" },
    { key: "fireplace_cozy", desc: "fireplace, cozy, warm evening" },

    // Emotion / Abstract (8)
    { key: "heart_soft", desc: "warm feelings, gentle heart" },
    { key: "sparkle_energy", desc: "sparkles, light energy" },
    { key: "bubble_thought", desc: "thought bubble, thinking" },
    { key: "orb_glow", desc: "soft glowing orb" },
    { key: "pulse_calm", desc: "calm pulse, slow rhythm" },
    { key: "target_focus", desc: "target, high focus point" },
    { key: "wave_brain", desc: "brain waves, mental flow" },
    { key: "meditation_pose", desc: "meditation, stillness" },
  ];
  const iconCatalogText = iconCatalog
    .map((i) => `- ${i.key}: ${i.desc}`)
    .join("\n");
  
  // 10개 세그먼트 정보 간소화 (있는 경우)
  let streamInfo = "";
  if (segments && segments.length > 0) {
    // 스트림 요약: 무드 패턴, 장르, 향 종류
    const uniqueMoods = [...new Set(segments.map(s => s.moodName || s.mood?.name).filter(Boolean))];
    const uniqueGenres = [...new Set(segments.map(s => s.musicGenre || s.music?.genre).filter(Boolean))];
    const uniqueScents = [...new Set(segments.map(s => s.scentType || s.scent?.type).filter(Boolean))];
    
    streamInfo = `[10개세그먼트] 무드:${uniqueMoods.join(',')} 장르:${uniqueGenres.join(',')} 향:${uniqueScents.join(',')}`;
  }
  
  // 최적화된 프롬프트 (토큰 최소화, 영어 응답 강제, 다양성 강조)
  return `Mood background design (Respond in English only)

[MOOD] ${moodName} | [MUSIC] ${musicGenre} | [SCENT] ${scentType} | [TIME] ${timeOfDay}h | [SEASON] ${season}
${streamInfo ? streamInfo + "\n" : ""}
[BIOMETRICS] stress:${preprocessed.recent_stress_index}/100 sleep:${preprocessed.latest_sleep_score}/100
[WEATHER] ${weather}
[EMOTIONS] ${emotions}
[PREFERENCES] music:${musicPrefs} color:${colorPrefs} scent:${scentPrefs}

[ICON CATALOG]
Choose exactly ONE icon key from the list below:
${iconCatalogText}

Return ONE JSON object only, in English, with the following fields.
Important:
- Use ONLY one of the iconCategory keys above for backgroundIcon.category.
- Do NOT invent new icon categories.
- VARIETY: Even for similar moods, vary colors, icons, and music selections. Avoid repetitive blue/calm themes. Use diverse color palettes (warm yellows, browns, greens, purples, etc.) when appropriate.
- moodColor: Choose colors that match the mood but vary across different segments. Don't always default to blue tones.

{
  "moodAlias": "2-4 word English nickname",
  "musicSelection": "track title / style in English",
  "moodColor": "#HEX",
  "lighting": {"brightness": 0-100, "temperature": 2000-6500},
  "backgroundIcon": {
    "category": "one of: sun_soft | moon_calm | cloud_soft | rain_light | snow_soft | fog_mist | leaf_gentle | tree_peace | flower_soft | wave_slow | mountain_silhouette | forest_deep | star_sparkle | breeze_wind | candle_warm | coffee_mug | book_focus | sofa_relax | window_light | lamp_soft | clock_slow | fireplace_cozy | heart_soft | sparkle_energy | bubble_thought | orb_glow | pulse_calm | target_focus | wave_brain | meditation_pose"
  },
  "backgroundWind": {"direction": 0-360, "speed": 0-10},
  "animationSpeed": 0-10,
  "iconOpacity": 0-1
}`;
}

