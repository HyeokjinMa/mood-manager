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

  // 선호도 가중치 (명시적 지시 포함)
  let preferenceWeights = "";
  if (llmInput.genrePreferenceWeights || llmInput.scentPreferenceWeights || llmInput.tagPreferenceWeights) {
    const genreWeights = llmInput.genrePreferenceWeights || {};
    const scentWeights = llmInput.scentPreferenceWeights || {};
    const tagWeights = llmInput.tagPreferenceWeights || {};
    
    preferenceWeights = `\n[사용자 선호도 가중치 - 반드시 반영하세요]
    
음악 장르 선호도 (가중치가 높을수록 선호):
${Object.entries(genreWeights).map(([genre, weight]) => `  - ${genre}: ${weight.toFixed(2)}`).join("\n")}

향 타입 선호도 (가중치가 높을수록 선호):
${Object.entries(scentWeights).map(([scent, weight]) => `  - ${scent}: ${weight.toFixed(2)}`).join("\n")}

태그 선호도 (가중치가 높을수록 선호):
${Object.entries(tagWeights).map(([tag, weight]) => `  - ${tag}: ${weight.toFixed(2)}`).join("\n")}

[선호도 반영 규칙]
1. 가중치가 0.7 이상인 항목을 우선적으로 선택하세요
2. 가중치가 0.3 이하인 항목은 피하세요
3. 음악 선택 시: 가중치가 높은 장르의 음악을 우선 선택
4. 향 선택 시: 가중치가 높은 향 타입을 우선 선택
5. 무드/태그 선택 시: 가중치가 높은 태그와 일치하는 무드를 우선 선택
`;
  }

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

[감정 예측 - 참고 자료]
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

[규칙 - CRITICAL]
1. 10개 세그먼트 생성 (각각 고유한 값)
2. music.musicID는 위 음악 목록에서 선택 (10-69)
3. ⚠️ 각 세그먼트마다 반드시 다른 musicID 사용 (중복 금지)
   - 10개 세그먼트 = 10개 서로 다른 musicID
   - 같은 musicID를 두 번 사용하면 안 됩니다
4. ⚠️ icons는 위 아이콘 카탈로그에서 1-4개 선택 (아이콘 다양성 필수)
   - 10개 세그먼트 전체에서 8-12개 서로 다른 icon key를 사용하세요
   - 같은 icon key 조합을 반복하지 마세요
   - 계절, 시간대, 분위기에 맞는 다양한 아이콘을 선택하세요
   - 겨울 관련 아이콘(snowflake, star, tree)만 반복 사용하지 마세요
   - 자연 요소(leaf, flower, cloud, sun, moon), 추상 요소(circle, dot, line), 생활 요소(cup, book, heart) 등을 다양하게 활용하세요
   - 각 세그먼트마다 다른 icon 조합을 사용하여 시각적 다양성을 확보하세요
5. ⚠️ scent.type은 위 선호도 가중치를 반영하여 다양하게 선택 (향 다양성 필수)
   - 10개 세그먼트에서 같은 향 타입을 3번 이상 반복하지 마세요
   - 사용 가능한 향 타입: Floral, Woody, Spicy, Fresh, Citrus, Herbal, Musk, Oriental
   - 선호도 가중치가 높은 향 타입을 우선 선택하되, 다양성도 고려하세요
   - 모든 세그먼트가 같은 향 타입(Woody 등)으로 통일되지 않도록 주의하세요
   - 각 세그먼트의 무드와 분위기에 맞는 다양한 향 타입을 선택하세요
   - 예: Segment 0: Woody, Segment 1: Floral, Segment 2: Spicy, Segment 3: Fresh 등
6. 색상은 너무 밝지 않게 (#FFFFFF, #F0FFF0 등 피하기)
   - 흰색 비율이 80% 이상인 색상은 피하세요

JSON Schema가 구조를 강제하므로 위 구조를 정확히 따라야 합니다.`;
}
