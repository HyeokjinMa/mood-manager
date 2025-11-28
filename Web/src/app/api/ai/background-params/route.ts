// src/app/api/ai/background-params/route.ts
/**
 * POST /api/ai/background-params
 * 
 * LLM으로 동적 배경 파라미터 생성
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth, checkMockMode } from "@/lib/auth/session";
import { prepareLLMInput } from "@/lib/llm/prepareLLMInput";
import { generateOptimizedPrompt } from "@/lib/llm/optimizePrompt";
import { validateAndNormalizeResponse, type BackgroundParamsResponse } from "@/lib/llm/validateResponse";
import { getCachedResponse, setCachedResponse } from "@/lib/cache/llmCache";
import { getMockPreprocessingData, getMockMoodStream } from "@/lib/mock/mockData";
import OpenAI from "openai";

/**
 * OpenAI API 호출 및 배경 파라미터 생성
 *
 * mode:
 * - "stream" (default): 10개 세그먼트 전체에 대한 배경 파라미터 생성
 * - "scent": 현재 세그먼트의 향 / 아이콘만 재추천
 * - "music": 현재 세그먼트의 음악 / 풍향·풍속만 재추천
 */
export async function POST(request: NextRequest) {
  try {
    // 세션 확인 (인증 필요)
    const sessionOrError = await requireAuth();
    if (sessionOrError instanceof NextResponse) {
      return sessionOrError;
    }
    const session = sessionOrError;
    
    // 관리자 모드 확인 (데이터는 목업이지만 LLM은 실제 호출)
    const isAdminMode = checkMockMode(session);
    if (isAdminMode) {
      console.log("[LLM API] 관리자 모드: 데이터는 목업이지만 LLM은 실제 호출");
    }

    const body = await request.json();
    const mode = (body.mode || "stream") as "stream" | "scent" | "music";
    const forceFresh = body.forceFresh === true;

    // ------------------------------
    // 1) 공통: 전처리 / 무드스트림 데이터 조회
    // 관리자 모드여도 목업 데이터를 가져와서 LLM에 실제로 전달
    // ------------------------------
    
    // 관리자 모드인 경우 목업 데이터 직접 사용 (fetch 대신)
    let preprocessed, moodStream;
    
    if (isAdminMode) {
      console.log("[LLM API] 관리자 모드: 목업 데이터 직접 사용");
      preprocessed = getMockPreprocessingData();
      const mockMoodStream = getMockMoodStream();
      moodStream = {
        currentMood: mockMoodStream.currentMood,
        moodStream: mockMoodStream.segments,
        userDataCount: mockMoodStream.userDataCount,
      };
    } else {
      // 일반 모드: API 호출 (서버 사이드에서 쿠키 전달)
      const requestHeaders = new Headers();
      const cookies = request.headers.get("cookie");
      if (cookies) {
        requestHeaders.set("cookie", cookies);
      }
      
      const [preprocessedRes, moodStreamRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/preprocessing`, {
          headers: requestHeaders,
          credentials: "include",
        }),
        fetch(`${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/moods/current`, {
          headers: requestHeaders,
          credentials: "include",
        }),
      ]);

      if (!preprocessedRes.ok || !moodStreamRes.ok) {
        // 에러 발생 시 목업 데이터로 대체
        console.warn("[LLM API] API 호출 실패, 목업 데이터 사용");
        preprocessed = getMockPreprocessingData();
        const mockMoodStream = getMockMoodStream();
        moodStream = {
          currentMood: mockMoodStream.currentMood,
          moodStream: mockMoodStream.segments,
          userDataCount: mockMoodStream.userDataCount,
        };
      } else {
        preprocessed = await preprocessedRes.json();
        moodStream = await moodStreamRes.json();
      }
    }

    // ------------------------------
    // 2) mode 별 분기
    // ------------------------------

    // (A) 스트림 전체용: 기존 로직 유지 (10개 세그먼트)
    if (mode === "stream") {
      const segments = body.segments;
      if (!segments || !Array.isArray(segments) || segments.length === 0) {
        // segments가 없으면 목업 응답 반환
        return NextResponse.json(getMockResponse());
      }

      // 10개 세그먼트 정보로 LLM Input 준비 (첫 번째 세그먼트를 대표로 사용)
      const firstSegment = segments[0];

      const llmInput = await prepareLLMInput(
        preprocessed,
        {
          currentMood: {
            id: firstSegment.mood?.id || "",
            name: firstSegment.moodName || firstSegment.mood?.name || "",
            cluster: "0",
            music: {
              genre: firstSegment.musicGenre || firstSegment.music?.genre || "",
              title: firstSegment.music?.title || "",
            },
            scent: {
              type: firstSegment.scentType || firstSegment.scent?.type || "",
              name: firstSegment.scent?.name || "",
            },
            lighting: {
              color: firstSegment.lighting?.color || "#E6F3FF",
              rgb: firstSegment.lighting?.rgb || [230, 243, 255],
            },
          },
          userDataCount: moodStream.userDataCount || 0,
        },
        body.userPreferences
      );

      // 캐시 확인 (비용 절감)
      // "stream" 모드에서는 segmentIndex를 포함하지 않음
      const cacheKey = {
        moodName: llmInput.moodName,
        musicGenre: llmInput.musicGenre,
        scentType: llmInput.scentType,
        timeOfDay: llmInput.timeOfDay || new Date().getHours(),
        season: llmInput.season || "Winter",
        stressIndex: preprocessed.recent_stress_index,
        segmentIndex: undefined, // stream 모드에서는 undefined
      };

      // 대시보드에서 강제 새로고침(forceFresh) 요청이 아닌 경우에만 캐시 사용
      if (!forceFresh) {
        const cachedResponse = getCachedResponse(cacheKey);
        if (cachedResponse) {
          console.log("[LLM Cache] Cache hit, returning cached response");
          return NextResponse.json({ ...cachedResponse, source: "cache" });
        }
      }

      // 최적화된 프롬프트 생성 (토큰 최소화, 10개 세그먼트 요약 포함)
      const prompt = generateOptimizedPrompt(llmInput, segments);

      // OpenAI API 키 확인
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
          temperature: 0.7,
          max_tokens: 500,
        });

        const rawResponse = JSON.parse(completion.choices[0].message.content || "{}");
        const validatedResponse = validateAndNormalizeResponse(rawResponse);
        setCachedResponse(cacheKey, validatedResponse);
        return NextResponse.json({ ...validatedResponse, source: "openai" });
      } catch (openaiError) {
        console.error("[LLM API] OpenAI API 호출 실패:", openaiError);
        // OpenAI API 실패 시 목업 응답 반환
        const mockResponse = { ...getMockResponse(), source: "mock-openai-error" as const };
        setCachedResponse(cacheKey, mockResponse);
        return NextResponse.json(mockResponse);
      }
    }

    // (B) 향 전용: 현재 세그먼트의 향 / 아이콘만 재추천
    if (mode === "scent") {
      const segment = body.segment;
      if (!segment) {
        return NextResponse.json(
          { error: "INVALID_INPUT", message: "segment is required for scent mode" },
          { status: 400 }
        );
      }

      const llmInput = await prepareLLMInput(
        preprocessed,
        {
          currentMood: {
            id: segment.mood?.id || "",
            name: segment.moodName || segment.mood?.name || "",
            cluster: "0",
            music: {
              genre: segment.musicGenre || segment.music?.genre || "",
              title: segment.music?.title || "",
            },
            scent: {
              type: segment.scentType || segment.scent?.type || "",
              name: segment.scent?.name || "",
            },
            lighting: {
              color: segment.lighting?.color || "#E6F3FF",
              rgb: segment.lighting?.rgb || [230, 243, 255],
            },
          },
          userDataCount: moodStream.userDataCount || 0,
        },
        body.userPreferences
      );

      // "scent" 모드: 현재 세그먼트 인덱스 포함
      // body에서 segmentIndex를 직접 받거나, moodStream에서 찾기
      const segmentIndexFromBody = body.segmentIndex;
      const currentSegmentIndex = segmentIndexFromBody !== undefined 
        ? segmentIndexFromBody 
        : (moodStream.moodStream?.findIndex((s: { timestamp: number; duration: number }) => 
            s.timestamp === segment.timestamp && 
            s.duration === segment.duration
          ) ?? -1);
      const cacheKey = {
        moodName: llmInput.moodName,
        musicGenre: llmInput.musicGenre,
        scentType: llmInput.scentType,
        timeOfDay: llmInput.timeOfDay || new Date().getHours(),
        season: llmInput.season || "Winter",
        stressIndex: preprocessed.recent_stress_index,
        segmentIndex: currentSegmentIndex >= 0 ? currentSegmentIndex : undefined,
      };

      const cachedResponse = getCachedResponse(cacheKey);
      if (cachedResponse) {
        return NextResponse.json({ ...cachedResponse, source: "cache" });
      }

      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        console.warn("OPENAI_API_KEY not found, returning minimal mock for scent");
        const mock: BackgroundParamsResponse = {
          moodAlias: "Calm Breeze",
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
        moodAlias: segment.moodName || segment.mood?.name || "Calm Breeze",
        musicSelection: segment.music?.title || segment.musicTitle || "Ambient Meditation",
        moodColor: segment.lighting?.color || "#E6F3FF",
        lighting: {
          brightness: segment.lighting?.brightness || 50,
          temperature: segment.lighting?.temperature || 4000,
        },
        backgroundIcon: raw.backgroundIcon || { name: "FaLeaf", category: "nature" },
        backgroundWind: segment.backgroundWind || {
          direction: 180,
          speed: 5,
        },
        animationSpeed: segment.animationSpeed || 5,
        iconOpacity: segment.iconOpacity || 0.7,
      };
      
      setCachedResponse(cacheKey, result);
      return NextResponse.json({ ...result, source: "openai" });
    }

    // (C) 음악 전용: 현재 세그먼트의 음악 / 풍향·풍속만 재추천
    if (mode === "music") {
      const segment = body.segment;
      if (!segment) {
        return NextResponse.json(
          { error: "INVALID_INPUT", message: "segment is required for music mode" },
          { status: 400 }
        );
      }

      const llmInput = await prepareLLMInput(
        preprocessed,
        {
          currentMood: {
            id: segment.mood?.id || "",
            name: segment.moodName || segment.mood?.name || "",
            cluster: "0",
            music: {
              genre: segment.musicGenre || segment.music?.genre || "",
              title: segment.music?.title || "",
            },
            scent: {
              type: segment.scentType || segment.scent?.type || "",
              name: segment.scent?.name || "",
            },
            lighting: {
              color: segment.lighting?.color || "#E6F3FF",
              rgb: segment.lighting?.rgb || [230, 243, 255],
            },
          },
          userDataCount: moodStream.userDataCount || 0,
        },
        body.userPreferences
      );

      // "scent" 모드: 현재 세그먼트 인덱스 포함
      // body에서 segmentIndex를 직접 받거나, moodStream에서 찾기
      const segmentIndexFromBody = body.segmentIndex;
      const currentSegmentIndex = segmentIndexFromBody !== undefined 
        ? segmentIndexFromBody 
        : (moodStream.moodStream?.findIndex((s: { timestamp: number; duration: number }) => 
            s.timestamp === segment.timestamp && 
            s.duration === segment.duration
          ) ?? -1);
      const cacheKey = {
        moodName: llmInput.moodName,
        musicGenre: llmInput.musicGenre,
        scentType: llmInput.scentType,
        timeOfDay: llmInput.timeOfDay || new Date().getHours(),
        season: llmInput.season || "Winter",
        stressIndex: preprocessed.recent_stress_index,
        segmentIndex: currentSegmentIndex >= 0 ? currentSegmentIndex : undefined,
      };

      const cachedResponse = getCachedResponse(cacheKey);
      if (cachedResponse) {
        return NextResponse.json({ ...cachedResponse, source: "cache" });
      }

      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        console.warn("OPENAI_API_KEY not found, returning minimal mock for music");
        const segment = body.segment;
        const mock: BackgroundParamsResponse = {
          moodAlias: segment?.moodName || segment?.mood?.name || "Calm Breeze",
          musicSelection: segment?.music?.title || segment?.musicTitle || llmInput.moodName,
          moodColor: segment?.lighting?.color || "#E6F3FF",
          lighting: {
            brightness: segment?.lighting?.brightness || 50,
            temperature: segment?.lighting?.temperature || 4000,
          },
          backgroundIcon: segment?.backgroundIcon || {
            name: "FaMusic",
            category: "object",
          },
          backgroundWind: { direction: 180, speed: 3 },
          animationSpeed: segment?.animationSpeed || 5,
          iconOpacity: segment?.iconOpacity || 0.7,
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
      [현재 곡]: ${segment.music?.title || segment.musicTitle || ""}
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
        moodAlias: segment.moodName || segment.mood?.name || "Calm Breeze",
        musicSelection: raw.musicSelection || segment.music?.title || segment.musicTitle || llmInput.moodName,
        moodColor: segment.lighting?.color || "#E6F3FF",
        lighting: {
          brightness: segment.lighting?.brightness || 50,
          temperature: segment.lighting?.temperature || 4000,
        },
        backgroundIcon: segment.backgroundIcon || {
          name: "FaMusic",
          category: "object",
        },
        backgroundWind: raw.backgroundWind || { direction: 180, speed: 3 },
        animationSpeed: segment.animationSpeed || 5,
        iconOpacity: segment.iconOpacity || 0.7,
      };
      
      setCachedResponse(cacheKey, result);
      return NextResponse.json({ ...result, source: "openai" });
    }

    // 방어 코드 (이곳에 도달하지 않아야 함)
    return NextResponse.json(getMockResponse());
  } catch (error) {
    console.error("Background params generation error:", error);
    
    // 에러 발생 시 목업 응답 반환 (서비스 중단 방지)
    return NextResponse.json(getMockResponse());
  }
}

/**
 * [MOCK] 목업 응답 (OpenAI API 실패 시 fallback)
 * UI FLOW 확인을 위해 보존
 * TODO: DB 연결 실패 시 자동으로 이 함수 호출하도록 개선 가능
 */
function getMockResponse() {
  return {
    moodAlias: "겨울비의 평온",
    musicSelection: "Ambient Rain Meditation",
    moodColor: "#6B8E9F",
    lighting: {
      brightness: 50,
      temperature: 4000,
    },
    backgroundIcon: {
      name: "FaCloudRain",
      category: "weather",
    },
    backgroundWind: {
      direction: 180,
      speed: 3,
    },
    animationSpeed: 4,
    iconOpacity: 0.7,
    iconCount: 8,
    iconSize: 50,
    particleEffect: false,
    gradientColors: ["#6B8E9F", "#87CEEB"],
    source: "mock" as const,
  };
}

