/**
 * 스트림 모드 핸들러
 * 3개 세그먼트 전체에 대한 배경 파라미터 생성
 * 
 * 프로세스:
 * 1. 로그인 세션 기준으로 감정 카운터 조회 및 클렌징
 * 2. Python 서버에서 감정 예측 받기 (전처리 데이터 + 감정 카운터)
 * 3. Python 응답 검증
 * 4. Python 응답 JSON을 그대로 LLM 프롬프트에 포함
 * 5. LLM으로 배경 파라미터 생성
 */

import { NextResponse } from "next/server";
import { prepareLLMInput, type LLMInput } from "@/lib/llm/prepareLLMInput";
import { generatePromptFromPythonResponse } from "@/lib/llm/optimizePromptForPython";
import { validateAndNormalizeResponse, type BackgroundParamsResponse } from "@/lib/llm/validateResponse";
import { getCachedResponse, setCachedResponse } from "@/lib/cache/llmCache";
import { getMockResponse } from "../utils/mockResponse";
import { PythonEmotionPredictionProvider } from "@/lib/prediction/PythonEmotionPredictionProvider";
import { validatePythonResponse } from "@/lib/prediction/validatePythonResponse";
import type { PythonPredictionResponse } from "@/lib/prediction/types";
import { getAndResetEmotionCounts } from "@/lib/emotionCounts/EmotionCountStore";
import type { EmotionPredictionInput } from "@/lib/prediction/EmotionPredictionProvider";
import type { StreamHandlerParams } from "../types";
import OpenAI from "openai";

export async function handleStreamMode({
  segments,
  preprocessed,
  moodStream,
  userPreferences,
  forceFresh,
  userId, // 로그인 세션 기준
  session, // 목업 모드 확인용
}: StreamHandlerParams): Promise<NextResponse> {
  if (!segments || !Array.isArray(segments) || segments.length === 0) {
    // segments가 없으면 목업 응답 반환
    return NextResponse.json(getMockResponse());
  }

  // 3개 세그먼트 정보로 LLM Input 준비 (첫 번째 세그먼트를 대표로 사용)
  const firstSegment = segments[0];

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
        id: firstSegment.mood?.id || "",
        name: firstSegment.mood?.name || "",
        cluster: "0",
        music: {
          genre: firstSegment.mood?.music?.genre || "",
          title: firstSegment.mood?.music?.title || "",
        },
        scent: {
          type: firstSegment.mood?.scent?.type || "",
          name: firstSegment.mood?.scent?.name || "",
        },
        lighting: {
          color: firstSegment.mood?.lighting?.color || "#E6F3FF",
          rgb: firstSegment.mood?.lighting?.rgb || [230, 243, 255],
        },
      },
      userDataCount: moodStream.userDataCount || 0,
    },
    userPreferences
  );

  // ===== 1. 로그인 세션 기준으로 감정 카운터 조회 및 클렌징 =====
  const emotionCounts = getAndResetEmotionCounts(userId);
  console.log(`[Stream Handler] Emotion counts for user ${userId}:`, {
    laughter: emotionCounts.laughter,
    sigh: emotionCounts.sigh,
    crying: emotionCounts.crying,
    accumulationDuration: Math.floor((Date.now() - emotionCounts.lastResetTime) / 1000),
  });

  // 전처리 데이터에 감정 카운터 추가
  const preprocessedWithCounts = {
    ...preprocessed,
    emotionCounts: {
      laughter: emotionCounts.laughter,
      sigh: emotionCounts.sigh,
      crying: emotionCounts.crying,
    },
    accumulationDurationSeconds: Math.floor((Date.now() - emotionCounts.lastResetTime) / 1000),
    lastResetTime: emotionCounts.lastResetTime,
  };

  let pythonResponse: PythonPredictionResponse | null = null;

  try {
    // ===== 2. Python 서버에서 감정 예측 받기 =====
    // PYTHON_SERVER_URL 이 없는 환경에서는 Python 단계를 건너뛰고
    // 바로 LLM-only fallback 으로 진행한다.
    if (!process.env.PYTHON_SERVER_URL) {
      console.warn(
        "[Stream Handler] PYTHON_SERVER_URL not set. Skipping Python step and using LLM-only fallback."
      );
      pythonResponse = null;
    } else {
      const pythonProvider = new PythonEmotionPredictionProvider();

      const predictionInput: EmotionPredictionInput = {
        preprocessed: preprocessedWithCounts,
        currentTime: Date.now(),
        segmentCount: 3,
      };

      // Python 서버 호출
      pythonResponse = await pythonProvider.getPythonResponse(predictionInput);

      // Python 응답 검증
      if (!validatePythonResponse(pythonResponse)) {
        console.error("[Stream Handler] Invalid Python response, using fallback");
        pythonResponse = null;
      } else {
        console.log("\n" + "=".repeat(80));
        console.log("✅ [Stream Handler] Python response validated successfully:");
        console.log("=".repeat(80));
        console.log(JSON.stringify(pythonResponse, null, 2));
        console.log("=".repeat(80) + "\n");
      }
    }
  } catch (pythonError) {
    console.error("[Stream Handler] Python server error, using fallback:", pythonError);
    pythonResponse = null;
  }

  // Python 응답이 없으면 기존 방식으로 fallback
  if (!pythonResponse) {
    console.warn("[Stream Handler] Python response not available, falling back to original prompt");
  return handleStreamModeFallback({
    segments,
    preprocessed,
    moodStream,
    userPreferences,
    forceFresh,
    llmInput,
    userId,
    session,
  });
  }

  // ===== 3. Python 응답 JSON을 그대로 LLM 프롬프트에 포함 =====
  // 세션 정보를 전달하여 목업 모드 확인
  const prompt = await generatePromptFromPythonResponse(llmInput, pythonResponse, userId, segments, session);

  // 캐시 확인 (Python 응답 포함)
  const cacheKey = {
    moodName: llmInput.moodName,
    musicGenre: llmInput.musicGenre,
    scentType: llmInput.scentType,
    timeOfDay: llmInput.timeOfDay || new Date().getHours(),
    season: llmInput.season || "Winter",
    stressIndex: preprocessed.recent_stress_index,
    segmentIndex: undefined,
    pythonCurrentId: pythonResponse.current_id,
    pythonFutureId: pythonResponse.future_id,
  };

  if (!forceFresh) {
    const cachedResponse = getCachedResponse(cacheKey);
    if (cachedResponse) {
      console.log("[LLM Cache] Cache hit (with Python response), returning cached response");
      return NextResponse.json({ ...cachedResponse, source: "cache" });
    }
  }

  // ===== 4. LLM으로 배경 파라미터 생성 =====
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.warn("OPENAI_API_KEY not found, using mock response");
    const mockResponse = { ...getMockResponse(), source: "mock-no-key" as const };
    setCachedResponse(cacheKey, mockResponse);
    return NextResponse.json(mockResponse);
  }

  const openai = new OpenAI({ apiKey });

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "JSON만 응답" },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.9,
      max_tokens: 3000,
    });

    const rawResponse = JSON.parse(completion.choices[0].message.content || "{}");
    
    // ===== LLM 원시 응답 로깅 =====
    console.log("\n" + "=".repeat(80));
    console.log("🎨 [LLM API] Raw Response from OpenAI (with Python input):");
    console.log("=".repeat(80));
    console.log(JSON.stringify(rawResponse, null, 2));
    console.log("=".repeat(80) + "\n");
    
    const validatedResponse = validateAndNormalizeResponse(rawResponse);
    
    // ===== 검증된 응답 로깅 =====
    console.log("\n" + "=".repeat(80));
    console.log("✅ [LLM API] Validated Response (with Python input):");
    console.log("=".repeat(80));
    if ('segments' in validatedResponse && Array.isArray(validatedResponse.segments)) {
      console.log(`Total segments: ${validatedResponse.segments.length}`);
      validatedResponse.segments.forEach((seg, idx) => {
        console.log(`\n--- Segment ${idx} ---`);
        console.log(`  moodAlias: "${seg.moodAlias}"`);
        console.log(`  musicSelection: "${seg.musicSelection}"`);
        console.log(`  moodColor: "${seg.moodColor}"`);
        console.log(`  backgroundIcon: { name: "${seg.backgroundIcon.name}", category: "${seg.backgroundIcon.category}" }`);
      });
    }
    console.log("=".repeat(80) + "\n");
    
    // 캐시 저장
    const cacheResponse: BackgroundParamsResponse = 'segments' in validatedResponse && Array.isArray(validatedResponse.segments)
      ? validatedResponse.segments[0]
      : validatedResponse as BackgroundParamsResponse;
    setCachedResponse(cacheKey, cacheResponse);
    
    return NextResponse.json({ 
      ...validatedResponse, 
      source: "openai",
      pythonResponse: pythonResponse, // Python 응답도 함께 반환 (디버깅/검증용)
    });
  } catch (openaiError) {
    console.error("[LLM API] OpenAI API 호출 실패:", openaiError);
    const mockResponse = { ...getMockResponse(), source: "mock-openai-error" as const };
    setCachedResponse(cacheKey, mockResponse);
    return NextResponse.json(mockResponse);
  }
}

/**
 * Fallback 핸들러 (Python 응답 없을 때 기존 방식 사용)
 */
async function handleStreamModeFallback({
  segments,
  preprocessed,
  moodStream,
  userPreferences,
  forceFresh,
  llmInput,
  userId,
  session,
}: Pick<StreamHandlerParams, "segments" | "preprocessed" | "moodStream" | "userPreferences" | "forceFresh" | "userId"> & {
  llmInput: LLMInput;
  session?: { user?: { email?: string; id?: string } } | null;
}): Promise<NextResponse> {
  // 기존 generateOptimizedPrompt 사용 (Python 없이)
  const { generateOptimizedPrompt } = await import("@/lib/llm/optimizePrompt");
  const prompt = generateOptimizedPrompt(llmInput, segments);
  
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(getMockResponse());
  }

  const openai = new OpenAI({ apiKey });

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "JSON만 응답" },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.9,
      max_tokens: 3000,
    });

    const rawResponse = JSON.parse(completion.choices[0].message.content || "{}");
    const validatedResponse = validateAndNormalizeResponse(rawResponse);
    
    return NextResponse.json({ ...validatedResponse, source: "openai-fallback" });
  } catch (error) {
    console.error("[Stream Handler Fallback] Error:", error);
    return NextResponse.json(getMockResponse());
  }
}
