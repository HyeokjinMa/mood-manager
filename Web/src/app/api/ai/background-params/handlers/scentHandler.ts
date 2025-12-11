/**
 * 향 모드 핸들러
 * 현재 세그먼트의 향 / 아이콘만 재추천
 */

import { NextResponse } from "next/server";
import { prepareLLMInput } from "@/lib/llm/prepareLLMInput";
import type { BackgroundParamsResponse } from "@/types/llm";
import { getCachedResponse, setCachedResponse } from "@/lib/cache/llmCache";
import { getCacheKey } from "../utils/getCacheKey";
import { getSegmentIndex } from "../utils/getSegmentIndex";
import type { ScentHandlerParams } from "../types";
import OpenAI from "openai";

export async function handleScentMode({
  segment,
  segmentIndexFromBody,
  preprocessed,
  moodStream,
  userPreferences,
}: ScentHandlerParams): Promise<NextResponse> {
  if (!segment) {
    return NextResponse.json(
      { error: "INVALID_INPUT", message: "segment is required for scent mode" },
      { status: 400 }
    );
  }

  // emotionEvents가 undefined일 수 있으므로 기본값 제공
  const preprocessedWithDefaults = {
    ...preprocessed,
    emotionEvents: preprocessed.emotionEvents || {
      laughter: [],
      sigh: [],
      anger: [],
      sadness: [],
      neutral: [],
    },
  };

  const llmInput = await prepareLLMInput(
    preprocessedWithDefaults,
    {
      currentMood: {
        id: segment.mood?.id || "",
        name: segment.mood?.name || "",
        cluster: "0",
        music: {
          genre: segment.mood?.music?.genre || "",
          title: segment.mood?.music?.title || "",
        },
        scent: {
          type: segment.mood?.scent?.type || "",
          name: segment.mood?.scent?.name || "",
        },
        lighting: {
          color: segment.mood?.lighting?.color || "#E6F3FF",
          rgb: segment.mood?.lighting?.rgb || [230, 243, 255],
        },
      },
      userDataCount: moodStream.userDataCount || 0,
    },
    userPreferences
  );

  const currentSegmentIndex = getSegmentIndex({
    segmentIndexFromBody,
    segment,
    moodStream,
  });

  const cacheKey = getCacheKey({
    llmInput,
    preprocessed,
    segmentIndex: currentSegmentIndex >= 0 ? currentSegmentIndex : undefined,
  });

  const cachedResponse = getCachedResponse(cacheKey);
  if (cachedResponse) {
    return NextResponse.json({ ...cachedResponse, source: "cache" });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.warn("OPENAI_API_KEY not found, returning minimal mock for scent");
    const mock: BackgroundParamsResponse = {
      moodAlias: "Unknown Mood",
      musicSelection: "Ambient Meditation",
      moodColor: "#E6F3FF",
      lighting: {
        brightness: 50,
        temperature: 4000,
      },
      backgroundIcon: { name: "FaLeaf", category: "nature" },
      backgroundWind: {
        direction: 180,
        speed: 5,
      },
      animationSpeed: 5,
      iconOpacity: 0.7,
    };
    setCachedResponse(cacheKey, mock);
    return NextResponse.json({ ...mock, source: "mock-no-key" });
  }

  const openai = new OpenAI({ apiKey });

  const prompt = `
  당신은 향기와 시각적 아이콘을 매칭하는 어시스턴트입니다.
  아래 정보를 보고, 현재 무드와 감정선은 유지하면서 같은 계열이거나 자연스럽게 이어지는 새로운 향 타입과,
  그 향에 어울리는 React Icons 스타일의 아이콘을 1개 추천하세요.

  [무드]: ${llmInput.moodName}
  [음악 장르]: ${llmInput.musicGenre}
  [현재 향 타입]: ${llmInput.scentType}
  [스트레스]: 평균 ${preprocessed.average_stress_index}, 최근 ${preprocessed.recent_stress_index}
  [수면]: 점수 ${preprocessed.latest_sleep_score}, 시간 ${preprocessed.latest_sleep_duration}분

  아래 JSON 형식으로만 응답하세요.
  {
    "scentType": "marine | citrus | woody | floral | ... (소문자, snake_case)",
    "backgroundIcon": {
      "name": "FaWater",
      "category": "nature | weather | object | abstract"
    }
  }
  `;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: "JSON만 응답" },
      { role: "user", content: prompt },
    ],
    response_format: { type: "json_object" },
    temperature: 0.7,
    max_tokens: 200,
  });

  const raw = JSON.parse(completion.choices[0].message.content || "{}");
  
  // 기존 세그먼트 값으로 완전한 BackgroundParamsResponse 구성
  const result: BackgroundParamsResponse = {
    moodAlias: segment.mood?.name || "Unknown Mood",
    musicSelection: segment.mood?.music?.title || "Ambient Meditation",
    moodColor: segment.mood?.lighting?.color || "#E6F3FF",
    lighting: {
      brightness: 50,
      temperature: 4000,
    },
    backgroundIcon: raw.backgroundIcon || { name: "FaLeaf", category: "nature" },
    backgroundWind: {
      direction: 180,
      speed: 5,
    },
      animationSpeed: 5,
      iconOpacity: 0.7,
  };
  
  setCachedResponse(cacheKey, result);
  return NextResponse.json({ ...result, source: "openai" });
}

