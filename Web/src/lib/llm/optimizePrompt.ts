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
  
  // 10개 세그먼트 정보 상세화 (각 세그먼트별로 다른 값 생성)
  let streamInfo = "";
  if (segments && segments.length > 0) {
    // 각 세그먼트의 상세 정보를 인덱스와 함께 나열
    const segmentDetails = segments.map((seg, idx) => {
      const segMood = seg.moodName || seg.mood?.name || moodName;
      const segGenre = seg.musicGenre || seg.music?.genre || musicGenre;
      const segScent = seg.scentType || seg.scent?.type || scentType;
      return `Segment${idx}: mood=${segMood} genre=${segGenre} scent=${segScent}`;
    }).join(" | ");
    
    streamInfo = `[10 SEGMENTS] ${segmentDetails}`;
  }
  
  // 최적화된 프롬프트 (10개 세그먼트 각각에 대해 다른 값 생성 요청)
  return `Mood background design for 10 segments (Respond in English only)

[BASE CONTEXT]
[MOOD] ${moodName} | [MUSIC] ${musicGenre} | [SCENT] ${scentType} | [TIME] ${timeOfDay}h | [SEASON] ${season}
[BIOMETRICS] stress:${preprocessed.recent_stress_index}/100 sleep:${preprocessed.latest_sleep_score}/100
[WEATHER] ${weather}
[EMOTIONS] ${emotions}
[PREFERENCES] music:${musicPrefs} color:${colorPrefs} scent:${scentPrefs}

${streamInfo ? streamInfo + "\n" : ""}
[ICON CATALOG]
Choose exactly ONE icon key from the list below:
${iconCatalogText}

[REQUIREMENTS]
You must generate DIFFERENT values for EACH of the 10 segments. Each segment should have:
- UNIQUE moodAlias (2-4 word English nickname, vary across segments)
- UNIQUE musicSelection (different track title/style for each segment)
- UNIQUE moodColor (CRITICAL: Each segment MUST have a different color. Use diverse palette: warm yellows (#FFD700, #FFA500), browns (#8B4513, #A0522D), greens (#228B22, #32CD32), purples (#9370DB, #8A2BE2), oranges (#FF6347, #FF8C00), pinks (#FF69B4, #FF1493), teals (#008080, #20B2AA), reds (#DC143C, #B22222). DO NOT use the same color for multiple segments. Maximum 1 duplicate color allowed across all 10 segments.)
- UNIQUE backgroundIcon.category (choose different icons from catalog for each segment)
- UNIQUE backgroundWind (vary direction and speed)
- Vary animationSpeed, iconOpacity across segments

CRITICAL COLOR REQUIREMENT: 
- Generate 10 DISTINCT colors. You may reuse a color at most ONCE (so minimum 5 unique colors, ideally 8-10 unique colors).
- Do NOT generate the same color for more than 2 segments.
- Use the full color spectrum: warm, cool, pastel, vibrant tones.
- Each segment's moodColor should be visually distinguishable from others.

Return a JSON object with this structure:
{
  "segments": [
{
      "moodAlias": "unique 2-4 word English nickname for segment 0",
      "musicSelection": "unique track title/style for segment 0",
      "moodColor": "#HEX (vary colors, not just blue)",
  "lighting": {"brightness": 0-100, "temperature": 2000-6500},
  "backgroundIcon": {
        "category": "one icon key from catalog above"
  },
  "backgroundWind": {"direction": 0-360, "speed": 0-10},
  "animationSpeed": 0-10,
  "iconOpacity": 0-1
    },
    ... (repeat for segments 1-9, each with UNIQUE values)
  ]
}

Important:
- Generate 10 distinct segments in the "segments" array
- Use ONLY icon keys from the catalog above
- Vary colors, icons, music, and wind parameters across segments
- Each segment should feel unique while maintaining mood coherence`;
}

