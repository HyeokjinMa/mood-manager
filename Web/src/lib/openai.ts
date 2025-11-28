// ======================================================
// File: src/lib/openai.ts
// ======================================================

/*
  [OpenAI 역할]
  
  - 무드 속성(음악, 조명색, 주기, 향)을 기반으로 무드 이름을 생성
  - Few-shot 프롬프트 사용
  - 무드의 특성을 반영한 창의적인 이름 생성 (예: "bright sky", "blooming love")
  
  [사용 방법]
  - 백엔드에서 무드 속성(음악, 색상, 향, 주기)을 결정한 후
  - 이 함수에 전달하여 해당 무드에 맞는 이름을 생성
  - 사전 정의된 이름이 아닌, 무드 속성에 맞는 새로운 이름 생성
*/

// import OpenAI from "openai"; // TODO: 백엔드 API 연동 시 주석 해제 및 패키지 설치 필요

// OpenAI 클라이언트 초기화
// const openai = new OpenAI({
//   apiKey: process.env.OPENAI_API_KEY,
// });

/**
 * 무드 이름 생성 (Few-shot)
 * 
 * 무드 속성(음악, 조명색, 향, 주기)을 기반으로 해당 무드에 맞는 이름을 생성합니다.
 * 사전 정의된 이름이 아닌, 무드의 특성을 반영한 창의적인 이름을 생성합니다.
 * 
 * @param moodAttributes - 무드 속성 (음악, 색상, 향, 주기 등)
 * @returns 무드 이름 (예: "bright sky", "blooming love", "gentle rain" 등)
 * 
 * [Few-shot 예시]
 * - 입력: { music: "upbeat", color: "#FFD700", scent: "Lavender", interval: 5 }
 * - 출력: "Bright Sky"
 * 
 * - 입력: { music: "romantic", color: "#FF69B4", scent: "Rose", interval: 3 }
 * - 출력: "Blooming Love"
 */
export async function inferMoodName(moodAttributes: {
  music: {
    title: string;
    genre?: string;
    tempo?: "slow" | "moderate" | "fast";
  };
  lighting: {
    color: string; // HEX 색상 코드
    brightness?: number; // 0-100
    pattern?: "static" | "pulsing" | "breathing";
  };
  scent: {
    type: string; // 향 종류 (예: "Lavender", "Rose", "Green")
    level: number; // 1-10
    interval?: number; // 분사 주기 (분)
  };
  moodCategory?: "positive" | "neutral" | "negative"; // 감정 카테고리 (선택사항)
}): Promise<string> {
  // Few-shot 프롬프트 구성 (향후 사용 예정)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _fewShotExamples = `
다음은 무드 속성(음악, 조명색, 향, 주기)을 기반으로 무드 이름을 생성하는 예시입니다:

예시 1:
입력: { music: { title: "Upbeat Melody", tempo: "fast" }, lighting: { color: "#FFD700", brightness: 80 }, scent: { type: "Lavender", level: 5 }, moodCategory: "positive" }
출력: Bright Sky

예시 2:
입력: { music: { title: "Romantic Ballad", tempo: "slow" }, lighting: { color: "#FF69B4", brightness: 60 }, scent: { type: "Rose", level: 7 }, moodCategory: "positive" }
출력: Blooming Love

예시 3:
입력: { music: { title: "Calm Ocean", tempo: "moderate" }, lighting: { color: "#87CEEB", brightness: 50 }, scent: { type: "Green", level: 4 }, moodCategory: "neutral" }
출력: Gentle Rain

예시 4:
입력: { music: { title: "Storm Sounds", tempo: "slow" }, lighting: { color: "#2F4F4F", brightness: 30 }, scent: { type: "Eucalyptus", level: 3 }, moodCategory: "negative" }
출력: Stormy Night

예시 5:
입력: { music: { title: "Morning Birds", tempo: "moderate" }, lighting: { color: "#FFA500", brightness: 70 }, scent: { type: "Citrus", level: 6 }, moodCategory: "positive" }
출력: Peaceful Dawn
`;

  // TODO: 백엔드 API 연동 시 주석 해제
  // const prompt = `${fewShotExamples}
  //
  // 이제 다음 무드 속성을 기반으로 해당 무드에 맞는 창의적인 이름을 생성하세요:
  // 입력: ${JSON.stringify(moodAttributes)}
  // 출력: (무드 이름만 출력하세요, 예: "Bright Sky", "Blooming Love", "Gentle Rain" 등. 무드의 특성(음악, 색상, 향)을 반영한 자연스럽고 시적인 이름을 생성하세요)`;
  // try {
  //   const response = await openai.chat.completions.create({
  //     model: "gpt-4o-mini", // 비용 효율적인 모델 사용
  //     messages: [
  //       {
  //         role: "system",
  //         content: "당신은 무드 속성(음악, 조명색, 향, 주기)을 분석하여 해당 무드에 맞는 창의적이고 시적인 이름을 생성하는 전문가입니다. 무드의 특성을 반영한 자연스러운 이름을 생성하세요. 사전 정의된 이름이 아닌, 무드 속성에 맞는 새로운 이름을 생성합니다.",
  //       },
  //       {
  //         role: "user",
  //         content: prompt,
  //       },
  //     ],
  //     temperature: 0.3, // 낮은 temperature로 일관된 응답
  //     max_tokens: 20, // 무드 이름만 필요하므로 짧게
  //   });
  //
  //   const moodName = response.choices[0]?.message?.content?.trim() || "Gentle Breeze";
  //   return moodName;
  // } catch (error) {
  //   console.error("OpenAI API Error:", error);
  //   // 에러 발생 시 기본 무드 반환
  //   return "Gentle Breeze";
  // }
  
  // 목업: 기본 무드 이름 반환
  return "Gentle Breeze";
}

/**
 * JSON Mode를 사용한 무드 이름 생성 (대안 방법)
 * 
 * JSON 형식으로 응답을 받아 파싱이 용이한 방법입니다.
 * 무드 속성을 기반으로 창의적인 이름을 생성합니다.
 */
export async function inferMoodNameWithJSONMode(_moodAttributes: {
  music: {
    title: string;
    genre?: string;
    tempo?: "slow" | "moderate" | "fast";
  };
  lighting: {
    color: string;
    brightness?: number;
    pattern?: "static" | "pulsing" | "breathing";
  };
  scent: {
    type: string;
    level: number;
    interval?: number;
  };
  moodCategory?: "positive" | "neutral" | "negative";
}): Promise<string> {

  // TODO: 백엔드 API 연동 시 사용
  // const fewShotExamples = `
  // 예시 1: { "music": { "title": "Upbeat Melody", "tempo": "fast" }, "lighting": { "color": "#FFD700" }, "scent": { "type": "Lavender" } } → "Bright Sky"
  // 예시 2: { "music": { "title": "Romantic Ballad", "tempo": "slow" }, "lighting": { "color": "#FF69B4" }, "scent": { "type": "Rose" } } → "Blooming Love"
  // 예시 3: { "music": { "title": "Calm Ocean", "tempo": "moderate" }, "lighting": { "color": "#87CEEB" }, "scent": { "type": "Green" } } → "Gentle Rain"
  // `;

  // TODO: 백엔드 API 연동 시 주석 해제
  // try {
  //   const response = await openai.chat.completions.create({
  //     model: "gpt-4o-mini",
  //     messages: [
  //       {
  //         role: "system",
  //         content: "당신은 무드 속성을 분석하여 창의적이고 시적인 무드 이름을 생성하는 전문가입니다. JSON 형식으로 응답하세요.",
  //       },
  //       {
  //         role: "user",
  //         content: `${fewShotExamples}\n\n다음 무드 속성을 기반으로 무드 이름을 생성하세요: ${JSON.stringify(moodAttributes)}`,
  //       },
  //     ],
  //     response_format: { type: "json_object" },
  //     temperature: 0.7, // 창의성을 위해 약간 높게 설정
  //     max_tokens: 50,
  //   });
  //
  //   const content = response.choices[0]?.message?.content;
  //   if (content) {
  //     const parsed = JSON.parse(content);
  //     return parsed.moodName || "Gentle Breeze";
  //   }
  //
  //   return "Gentle Breeze";
  // } catch (error) {
  //   console.error("OpenAI API Error:", error);
  //   return "Gentle Breeze";
  // }
  
  // 목업: 기본 무드 이름 반환
  return "Gentle Breeze";
}
