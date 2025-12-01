/**
 * Python 출력을 기반으로 한 LLM 프롬프트 최적화
 * 
 * Python에서 받은 JSON 응답을 그대로 프롬프트에 포함
 */

import type { LLMInput } from "./prepareLLMInput";
import type { MoodStreamSegment } from "@/hooks/useMoodStream/types";
import type { PythonPredictionResponse } from "@/lib/prediction/types";
import { formatPreferenceWeightsForLLM } from "@/lib/preferences/getUserPreferenceWeights";

/**
 * Python 출력 JSON을 그대로 프롬프트에 포함
 */
export async function generatePromptFromPythonResponse(
  llmInput: LLMInput,
  pythonResponse: PythonPredictionResponse,
  userId: string,
  _segments?: MoodStreamSegment[],
  session?: { user?: { email?: string; id?: string } } | null
): Promise<string> {
  const moodName = llmInput.moodName;
  const musicGenre = llmInput.musicGenre;
  const scentType = llmInput.scentType;
  const timeOfDay = llmInput.timeOfDay || new Date().getHours();
  const season = llmInput.season || "Winter";
  
  // Python 응답을 JSON 문자열로 변환 (그대로 포함)
  const pythonResponseJson = JSON.stringify(pythonResponse, null, 2);
  
  // 사용자 선호도 가중치 조회 및 포맷팅 (목업 모드 지원)
  const preferenceWeights = await formatPreferenceWeightsForLLM(userId, session);
  
  return `Mood background design for 3 segments based on emotion prediction from ML model.

[EMOTION PREDICTION FROM ML MODEL - JSON]
${pythonResponseJson}

${preferenceWeights}

[CONTEXT]
- Mood: ${moodName}
- Music Genre: ${musicGenre}
- Scent: ${scentType}
- Time of Day: ${timeOfDay}h
- Season: ${season}
- Stress: average ${llmInput.preprocessed.average_stress_index}/100, recent ${llmInput.preprocessed.recent_stress_index}/100
- Sleep: score ${llmInput.preprocessed.latest_sleep_score}/100, duration ${llmInput.preprocessed.latest_sleep_duration}min
- Weather: temp ${llmInput.preprocessed.weather.temperature}°C, humidity ${llmInput.preprocessed.weather.humidity}%, rain ${llmInput.preprocessed.weather.rainType}, sky ${llmInput.preprocessed.weather.sky}

[REQUIREMENTS]
Generate background parameters for 3 segments that reflect the emotional transition based on the ML model prediction above.
- Segment 0-1: Based on "current_title" and "current_description" from the JSON
- Segment 2: Based on "future_title" and "future_description" from the JSON
- Create smooth visual and audio transitions between segments
- Each segment should have unique colors, icons, and music selections
- Consider the emotional state described in "current_description" and "future_description"

Return a JSON object with this structure:
{
  "segments": [
    {
      "moodAlias": "unique 2-4 word English nickname",
      "musicSelection": "unique track title/style",
      "moodColor": "#HEX",
      "lighting": {"brightness": 0-100, "temperature": 2000-6500},
      "backgroundIcon": {"category": "one of: sun_soft | moon_calm | ..."},
      "backgroundWind": {"direction": 0-360, "speed": 0-10},
      "animationSpeed": 0-10,
      "iconOpacity": 0-1
    },
    // ... 2 more segments
  ]
}
`;
}

