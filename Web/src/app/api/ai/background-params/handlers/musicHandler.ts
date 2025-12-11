/**
 * 음악 모드 핸들러
 * 현재 세그먼트의 음악 / 풍향·풍속만 재추천
 */

import { NextResponse } from "next/server";
import { prepareLLMInput } from "@/lib/llm/prepareLLMInput";
import type { BackgroundParamsResponse } from "@/types/llm";
import { getCachedResponse, setCachedResponse } from "@/lib/cache/llmCache";
import { getCacheKey } from "../utils/getCacheKey";
import { getSegmentIndex } from "../utils/getSegmentIndex";
import type { MusicHandlerParams } from "../types";
import OpenAI from "openai";

export async function handleMusicMode({
  segment,
  segmentIndexFromBody,
  preprocessed,
  moodStream,
  userPreferences,
}: MusicHandlerParams): Promise<NextResponse> {
  if (!segment) {
    return NextResponse.json(
      { error: "INVALID_INPUT", message: "segment is required for music mode" },
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
    console.warn("OPENAI_API_KEY not found, returning minimal mock for music");
    const mock: BackgroundParamsResponse = {
      moodAlias: segment?.mood?.name || "Unknown Mood",
      musicSelection: segment?.mood?.music?.title || llmInput.moodName,
      moodColor: segment?.mood?.lighting?.color || "#E6F3FF",
      lighting: {
        brightness: 50,
        temperature: 4000,
      },
      backgroundIcon: {
        name: "FaMusic",
        category: "object",
      },
      backgroundWind: { direction: 180, speed: 3 },
      animationSpeed: 5,
      iconOpacity: 0.7,
    };
    setCachedResponse(cacheKey, mock);
    return NextResponse.json({ ...mock, source: "mock-no-key" });
  }

  const openai = new OpenAI({ apiKey });

  const prompt = `
  당신은 음악과 바람 애니메이션을 매칭하는 어시스턴트입니다.
  아래 정보를 보고, 현재 무드와 장르는 유지하면서 같은 장르 안에서 다른 느낌의 곡 제목을 하나 추천하고,
  그 곡에 어울리는 바람의 방향과 속도를 추천하세요.

  [무드]: ${llmInput.moodName}
  [음악 장르]: ${llmInput.musicGenre}
      [현재 곡]: ${segment.mood?.music?.title || ""}
  [스트레스]: 평균 ${preprocessed.average_stress_index}, 최근 ${preprocessed.recent_stress_index}

  아래 JSON 형식으로만 응답하세요.
  {
    "musicSelection": "새 곡 제목 (예: Calm Ocean Breath)",
    "backgroundWind": {
      "direction": 0-360 (숫자),
      "speed": 0-10 (숫자, 0은 정지, 10은 매우 빠름)
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
        musicSelection: raw.musicSelection || segment.mood?.music?.title || llmInput.moodName,
        moodColor: segment.mood?.lighting?.color || "#E6F3FF",
        lighting: {
          brightness: 50,
          temperature: 4000,
        },
        backgroundIcon: {
      name: "FaMusic",
      category: "object",
    },
      backgroundWind: raw.backgroundWind || { direction: 180, speed: 3 },
      animationSpeed: 5,
      iconOpacity: 0.7,
  };
  
  setCachedResponse(cacheKey, result);
  return NextResponse.json({ ...result, source: "openai" });
}

