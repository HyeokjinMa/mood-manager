/**
 * Python 응답 기반 LLM 프롬프트 생성
 * 
 * Phase 2: CompleteSegmentOutput 구조를 요구하는 간결한 프롬프트
 */

import type { LLMInput } from "./prepareLLMInput";
import type { PythonPredictionResponse } from "@/lib/prediction/types";
import { getAvailableMusicForLLM, formatMusicListForLLM } from "@/lib/music/getAvailableMusicForLLM";
import { iconCatalog } from "@/lib/events/iconMapping";

/**
 * Python 응답 기반 프롬프트 생성 (간결 버전)
 */
export async function generatePromptFromPythonResponse(
  llmInput: LLMInput,
  pythonResponse: PythonPredictionResponse,
  userId: string,
  segments?: unknown[],
  session?: { user?: { email?: string; id?: string } } | null
): Promise<string> {
  const { moodName, musicGenre, scentType, timeOfDay, season } = llmInput;
  const pythonResponseJson = JSON.stringify(pythonResponse, null, 2);
  
  // 음악 목록 (전체 정보 포함 - LLM이 선택을 위해 필요)
  const availableMusic = await getAvailableMusicForLLM();
  const musicListText = formatMusicListForLLM(availableMusic);

  // 아이콘 카탈로그 (전체 정보 포함 - LLM이 선택을 위해 필요)
  const iconCatalogText = iconCatalog
    .map((i) => `- ${i.key}: ${i.desc}`)
    .join("\n");

  // 선호도 가중치 (간결하게)
  const preferenceWeights = llmInput.userPreferences
    ? `\n[선호도 가중치]\n${JSON.stringify(llmInput.userPreferences, null, 2)}`
    : "";

  return `${musicListText}

================================================================================
무드 배경 디자인 생성: 10개 세그먼트
================================================================================

[컨텍스트]
- 무드: ${moodName}
- 음악 장르: ${musicGenre}
- 향: ${scentType}
- 시간: ${timeOfDay}시
- 계절: ${season}

[감정 예측]
${pythonResponseJson}
${preferenceWeights}

[아이콘 카탈로그]
${iconCatalogText}

[출력 구조 - JSON Schema가 구조를 강제합니다]
각 세그먼트는 다음 구조를 정확히 따라야 합니다:
{
  "moodAlias": "2-4단어 영어 별칭",
  "moodColor": "#HEX (너무 밝지 않게)",
  "lighting": {
    "rgb": [r, g, b],
    "brightness": 0-100,
    "temperature": 2000-6500
  },
  "scent": {
    "type": "Floral|Woody|Spicy|Fresh|Citrus|Herbal|Musk|Oriental",
    "name": "구체적 이름",
    "level": 1-10,
    "interval": 5|10|15|20|25|30
  },
  "music": {
    "musicID": 10-69,
    "volume": 0-100,
    "fadeIn": 750,  // 밀리초 (ms) 단위, 750ms = 0.75초
    "fadeOut": 750  // 밀리초 (ms) 단위, 750ms = 0.75초
  },
  "background": {
    "icons": ["icon1", "icon2"],
    "wind": {
      "direction": 0-360,
      "speed": 0-10
    },
    "animation": {
      "speed": 0-10,
      "iconOpacity": 0-1
    }
  }
}

[규칙]
1. 10개 세그먼트 생성 (각각 고유한 값)
2. music.musicID는 위 음악 목록에서 선택 (10-69)
3. 각 세그먼트마다 다른 musicID 사용
4. icons는 위 아이콘 카탈로그에서 1-4개 선택
   - 계절, 시간대, 분위기에 맞는 다양한 아이콘을 선택하세요
   - 겨울 관련 아이콘(snowflake, star, tree)만 반복 사용하지 마세요
   - 자연 요소(leaf, flower, cloud, sun, moon), 추상 요소(circle, dot, line), 생활 요소(cup, book, heart) 등을 다양하게 활용하세요
   - 10개 세그먼트에서 최대한 다양한 아이콘 조합을 사용하세요
5. 색상은 너무 밝지 않게 (#FFFFFF, #F0FFF0 등 피하기)
   - 흰색 비율이 80% 이상인 색상은 피하세요

JSON Schema가 구조를 강제하므로 위 구조를 정확히 따라야 합니다.`;
}
