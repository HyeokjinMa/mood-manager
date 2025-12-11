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
import { validateAndNormalizeResponse } from "@/lib/llm/validateResponse";
import type { BackgroundParamsResponse } from "@/types/llm";
import { getCachedResponse, setCachedResponse } from "@/lib/cache/llmCache";
import { getMockResponse } from "../utils/mockResponse";
import { PythonEmotionPredictionProvider } from "@/lib/prediction/PythonEmotionPredictionProvider";
import { validatePythonResponse } from "@/lib/prediction/validatePythonResponse";
import type { PythonPredictionResponse } from "@/lib/prediction/types";
import { getAndResetEmotionCounts } from "@/lib/emotionCounts/EmotionCountStore";
import type { EmotionPredictionInput } from "@/lib/prediction/EmotionPredictionProvider";
import type { StreamHandlerParams } from "../types";
import OpenAI from "openai";
import { getAllUserPreferenceWeights } from "@/lib/preferences/getUserPreferenceWeights";
import { mapMusicIDToTrack } from "@/lib/music/mapMusicIDToTrack";
// import { getMusicTracksByGenre } from "@/lib/music/getMusicTrackByID"; // 사용되지 않음

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

  // DB 기반 선호도 가중치 조회 (향/장르/태그)
  const {
    scents: scentWeights,
    genres: genreWeights,
    tags: tagWeights,
  } = await getAllUserPreferenceWeights(userId, session);

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

  // LLMInput에 정규화된 가중치 추가 주입
  llmInput.genrePreferenceWeights = genreWeights;
  llmInput.scentPreferenceWeights = scentWeights;
  llmInput.tagPreferenceWeights = tagWeights;

  // ===== 1. 로그인 세션 기준으로 감정 카운터 조회 및 클렌징 =====
  console.log("[handleStreamMode] 🔄 Step 2.1: 감정 카운터 조회 및 클렌징");
  const emotionCounts = getAndResetEmotionCounts(userId);
  console.log("[handleStreamMode] ✅ Step 2.1 완료:", {
    laughter: emotionCounts.laughter,
    sigh: emotionCounts.sigh,
    crying: emotionCounts.crying,
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
    // 바로 LLM-only fallback으로 진행
    console.log("[handleStreamMode] 🔄 Step 2.2: Python 서버 호출 (마르코프 체인 예측)");
    const pythonStartTime = Date.now();
    
    if (!process.env.PYTHON_SERVER_URL) {
      console.log("[handleStreamMode] ⚠️ PYTHON_SERVER_URL 없음, Python 단계 건너뜀");
      pythonResponse = null;
    } else {
      const pythonProvider = new PythonEmotionPredictionProvider();

      const predictionInput: EmotionPredictionInput = {
        preprocessed: preprocessedWithCounts,
        currentTime: Date.now(),
        segmentCount: 10,
      };

      // Python 서버 호출
      pythonResponse = await pythonProvider.getPythonResponse(predictionInput, userId);
      console.log(`[handleStreamMode] ✅ Step 2.2 완료 (${Date.now() - pythonStartTime}ms)`);

      // Python 응답 검증
      if (!validatePythonResponse(pythonResponse)) {
        console.warn("[handleStreamMode] ⚠️ Python 응답 검증 실패, fallback으로 진행");
        pythonResponse = null;
      } else {
        console.log("[handleStreamMode] ✅ Python 응답 검증 성공:", {
          currentId: pythonResponse.current_id,
          futureId: pythonResponse.future_id,
        });
      }
    }
  } catch (error) {
    console.error("[handleStreamMode] ❌ Python 서버 호출 실패, fallback으로 진행:", error);
    pythonResponse = null;
  }

  // Python 응답이 없으면 기존 방식으로 fallback
  if (!pythonResponse) {
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
  console.log("[handleStreamMode] 🔄 Step 2.3: LLM 프롬프트 생성");
  const promptStartTime = Date.now();
  // 세션 정보를 전달하여 목업 모드 확인
  const prompt = await generatePromptFromPythonResponse(llmInput, pythonResponse, userId, segments, session);
  console.log(`[handleStreamMode] ✅ Step 2.3 완료 (${Date.now() - promptStartTime}ms)`);

  // ===== LLM 인풋 로깅 =====
  console.log("\n" + "=".repeat(100));
  console.log("📥 [LLM 인풋 정보]");
  console.log("=".repeat(100));
  console.log("\n[현재 무드 정보]");
  console.log("  - 무드명:", llmInput.moodName);
  console.log("  - 음악 장르:", llmInput.musicGenre);
  console.log("  - 향 타입:", llmInput.scentType);
  console.log("  - 시간:", llmInput.timeOfDay, "시");
  console.log("  - 계절:", llmInput.season);
  console.log("\n[선호도 가중치]");
  console.log("  - 장르:", JSON.stringify(llmInput.genrePreferenceWeights || {}, null, 2));
  console.log("  - 향:", JSON.stringify(llmInput.scentPreferenceWeights || {}, null, 2));
  console.log("  - 태그:", JSON.stringify(llmInput.tagPreferenceWeights || {}, null, 2));
  console.log("\n[프롬프트 정보]");
  console.log("  - 프롬프트 길이:", prompt.length, "자");
  console.log("  - 프롬프트 토큰 추정:", Math.ceil(prompt.length / 4), "토큰 (대략적 추정)");
  console.log("\n[프롬프트 내용 - 처음 1000자]");
  console.log(prompt.substring(0, 1000));
  console.log("\n[프롬프트 내용 - 마지막 500자]");
  console.log(prompt.substring(Math.max(0, prompt.length - 500)));
  console.log("=".repeat(100) + "\n");

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
      return NextResponse.json({ ...cachedResponse, source: "cache" });
    }
  }

  // ===== 4. LLM으로 배경 파라미터 생성 =====
  console.log("[handleStreamMode] 🔄 Step 2.4: LLM 호출 시작");
  const llmCallStartTime = Date.now();
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.warn("[handleStreamMode] ⚠️ OPENAI_API_KEY 없음, 목업 데이터로 폴백");
    const mockResponse = { ...getMockResponse(), source: "mock-no-key" as const };
    setCachedResponse(cacheKey, mockResponse);
    return NextResponse.json(mockResponse);
  }

  const openai = new OpenAI({ 
    apiKey,
    timeout: 120000, // 120초 타임아웃 (LLM 호출이 오래 걸릴 수 있음)
  });

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { 
          role: "system", 
          content: `Generate 10 mood segments. JSON Schema enforces structure.

Required: segments[].{moodAlias, moodColor, lighting{brightness, temperature}, scent{type, name, level, interval}, music{musicID:10-69, fadeIn, fadeOut}, background{icons[], wind{}, animation{}}}

Use music.musicID (not musicSelection). Use background.icons (not backgroundIcons).

CRITICAL: Icon Diversity & Music Diversity & Scent Diversity
- Use 8-12 DIFFERENT icon keys across 10 segments
- Use DIFFERENT musicID for each segment (no duplicates)
- Use DIFFERENT scent types across 10 segments (no single type repeated more than 3 times)
  - Available scent types: Floral, Woody, Spicy, Fresh, Citrus, Herbal, Musk, Oriental
  - Vary scent types based on user preferences and segment mood
  - Do NOT use the same scent type for all segments
  - Example: Segment 0: Woody, Segment 1: Floral, Segment 2: Spicy, Segment 3: Fresh, etc.` 
        },
        { role: "user", content: prompt },
      ],
      response_format: { 
        type: "json_schema",
        json_schema: {
          name: "complete_segment_output",
          strict: true,
          schema: {
            type: "object",
            required: ["segments"],
            properties: {
              segments: {
                type: "array",
                minItems: 10,
                maxItems: 10,
                items: {
                  type: "object",
                  required: ["moodAlias", "moodColor", "lighting", "scent", "music", "background"],
                  properties: {
                    moodAlias: { type: "string" },
                    moodColor: { type: "string", pattern: "^#[A-Fa-f0-9]{6}$" },
                    lighting: {
                      type: "object",
                      required: ["brightness", "temperature"],
                      properties: {
                        brightness: { type: "integer", minimum: 0, maximum: 100 },
                        temperature: { type: "integer", minimum: 2000, maximum: 6500 }
                      },
                      additionalProperties: false
                    },
                    scent: {
                      type: "object",
                      required: ["type", "name", "level", "interval"],
                      properties: {
                        type: { type: "string", enum: ["Musk", "Aromatic", "Woody", "Citrus", "Honey", "Green", "Dry", "Leathery", "Marine", "Spicy", "Floral", "Powdery"] },
                        name: { type: "string" },
                        level: { type: "integer", minimum: 1, maximum: 10 },
                        interval: { type: "integer", enum: [5, 10, 15, 20, 25, 30] }
                      },
                      additionalProperties: false
                    },
                    music: {
                      type: "object",
                      required: ["musicID", "fadeIn", "fadeOut"],
                      properties: {
                        musicID: { type: "integer", minimum: 10, maximum: 69 },
                        fadeIn: { type: "integer", minimum: 0, maximum: 5000 },
                        fadeOut: { type: "integer", minimum: 0, maximum: 5000 }
                      },
                      additionalProperties: false
                    },
                    background: {
                      type: "object",
                      required: ["icons", "wind", "animation"],
                      properties: {
                        icons: {
                          type: "array",
                          minItems: 1,
                          maxItems: 4,
                          items: { type: "string" }
                        },
                        wind: {
                          type: "object",
                          required: ["direction", "speed"],
                          properties: {
                            direction: { type: "integer", minimum: 0, maximum: 360 },
                            speed: { type: "number", minimum: 0, maximum: 10 }
                          },
                          additionalProperties: false
                        },
                        animation: {
                          type: "object",
                          required: ["speed", "iconOpacity"],
                          properties: {
                            speed: { type: "number", minimum: 0, maximum: 10 },
                            iconOpacity: { type: "number", minimum: 0, maximum: 1 }
                          },
                          additionalProperties: false
                        }
                      },
                      additionalProperties: false
                    }
                  },
                  additionalProperties: false
                }
              }
            },
            additionalProperties: false
          }
        }
      },
      temperature: 0.0, // 구조 준수 최우선: 생체 데이터 기반이므로 창의도 불필요, 정확한 구조 준수만 필요
      max_tokens: 8000, // JSON Schema + 10개 세그먼트 = 많은 토큰 필요
    });

    // ===== LLM API 응답 정보 로깅 =====
    console.log("\n" + "=".repeat(100));
    console.log("📊 [LLM API 응답 정보]");
    console.log("=".repeat(100));
    console.log("사용된 토큰:", completion.usage?.total_tokens || "N/A");
    console.log("  - 입력 토큰:", completion.usage?.prompt_tokens || "N/A");
    console.log("  - 출력 토큰:", completion.usage?.completion_tokens || "N/A");
    console.log("완료 이유:", completion.choices[0].finish_reason || "N/A");
    console.log("=".repeat(100) + "\n");
    console.log(`[handleStreamMode] ✅ Step 2.4 완료 (${Date.now() - llmCallStartTime}ms)`);

    const rawResponse = JSON.parse(completion.choices[0].message.content || "{}");
    
    // ===== LLM 원본 응답 로깅 =====
    console.log("\n" + "=".repeat(100));
    console.log("📋 [LLM 원본 응답]");
    console.log("=".repeat(100));
    console.log("응답 타입:", typeof rawResponse);
    console.log("세그먼트 개수:", Array.isArray(rawResponse.segments) ? rawResponse.segments.length : "N/A");
    console.log("\n[전체 응답 JSON]");
    console.log(JSON.stringify(rawResponse, null, 2));
    console.log("=".repeat(100) + "\n");
    
    console.log("[handleStreamMode] 🔄 Step 2.5: LLM 응답 검증 및 정규화");
    const validationStartTime = Date.now();
    const validatedResponse = validateAndNormalizeResponse(rawResponse);
    console.log(`[handleStreamMode] ✅ Step 2.5 완료 (${Date.now() - validationStartTime}ms)`);
    
    // ===== 검증된 응답 로깅 =====
    console.log("\n" + "=".repeat(100));
    console.log("✅ [검증된 LLM 응답]");
    console.log("=".repeat(100));
    if ('segments' in validatedResponse && Array.isArray(validatedResponse.segments)) {
      console.log(`총 ${validatedResponse.segments.length}개 세그먼트 생성됨`);
      
      // 선호도 반영 확인
      const musicIDs = validatedResponse.segments.map(seg => {
        const musicID = typeof seg.musicSelection === 'number' 
          ? seg.musicSelection 
          : parseInt(String(seg.musicSelection), 10);
        return musicID;
      }).filter(id => !isNaN(id));
      
      const uniqueMusicIDs = new Set(musicIDs);
      console.log(`\n[음악 다양성 확인]`);
      console.log(`  - 총 음악 ID: ${musicIDs.length}개`);
      console.log(`  - 고유 음악 ID: ${uniqueMusicIDs.size}개`);
      console.log(`  - 중복 여부: ${musicIDs.length !== uniqueMusicIDs.size ? "⚠️ 중복 발견" : "✅ 중복 없음"}`);
      
      const allIconKeys = validatedResponse.segments.flatMap(seg => seg.iconKeys || []);
      const uniqueIconKeys = new Set(allIconKeys);
      console.log(`\n[아이콘 다양성 확인]`);
      console.log(`  - 총 아이콘 키: ${allIconKeys.length}개`);
      console.log(`  - 고유 아이콘 키: ${uniqueIconKeys.size}개`);
      console.log(`  - 다양성: ${uniqueIconKeys.size >= 8 ? "✅ 좋음 (8개 이상)" : "⚠️ 부족 (8개 미만)"}`);
      
      // 향 다양성 확인
      const allScentTypes = validatedResponse.segments.map(seg => seg.scent?.type).filter(Boolean) as string[];
      const uniqueScentTypes = new Set(allScentTypes);
      const scentTypeCounts: Record<string, number> = {};
      allScentTypes.forEach(type => {
        scentTypeCounts[type] = (scentTypeCounts[type] || 0) + 1;
      });
      
      console.log(`\n[향 다양성 확인]`);
      console.log(`  - 총 향 타입: ${allScentTypes.length}개`);
      console.log(`  - 고유 향 타입: ${uniqueScentTypes.size}개`);
      console.log(`  - 향 타입 분포:`, JSON.stringify(scentTypeCounts, null, 2));
      const maxScentCount = Object.keys(scentTypeCounts).length > 0 ? Math.max(...Object.values(scentTypeCounts)) : 0;
      console.log(`  - 다양성: ${maxScentCount <= 3 ? "✅ 좋음 (최대 3회 이하)" : `⚠️ 부족 (${maxScentCount}회 반복)`}`);
      
      validatedResponse.segments.forEach((seg, idx) => {
        console.log(`\n[Segment ${idx}]`);
        console.log(`  moodAlias: "${seg.moodAlias}"`);
        console.log(`  musicSelection: ${seg.musicSelection} (type: ${typeof seg.musicSelection})`);
        console.log(`  moodColor: "${seg.moodColor}"`);
        console.log(`  lighting: brightness=${seg.lighting?.brightness}, temperature=${seg.lighting?.temperature}K`);
        console.log(`  scent: type=${seg.scent?.type}, name=${seg.scent?.name}`);
        console.log(`  backgroundIcon: ${seg.backgroundIcon?.name} (${seg.backgroundIcon?.category})`);
        console.log(`  backgroundIcons: [${seg.iconKeys?.join(", ") || ""}]`);
        console.log(`  backgroundWind: direction=${seg.backgroundWind?.direction}°, speed=${seg.backgroundWind?.speed}`);
        console.log(`  animationSpeed: ${seg.animationSpeed}, iconOpacity: ${seg.iconOpacity}`);
      });
      
      // 최종 요약 출력 (기존 형식 유지)
      console.log(`\n✅ [Icon Diversity] 아이콘 다양성: ${(uniqueIconKeys.size / 21).toFixed(2)} (고유: ${uniqueIconKeys.size}/21)`);
      validatedResponse.segments.forEach((seg, idx) => {
        const musicID = typeof seg.musicSelection === "number" ? seg.musicSelection : parseInt(seg.musicSelection || "0", 10);
        const iconCount = seg.iconKeys?.length || 0;
        console.log(`Segment ${idx}: ${seg.moodAlias} | musicID ${musicID} | scent: ${seg.scent?.type}/${seg.scent?.name} | ${iconCount} icons`);
      });
    } else {
      console.log(JSON.stringify(validatedResponse, null, 2));
    }
    console.log("=".repeat(100) + "\n");
    
    if ('segments' in validatedResponse && Array.isArray(validatedResponse.segments)) {
      // 10개 세그먼트 응답
      for (let i = 0; i < validatedResponse.segments.length; i++) {
        const segment = validatedResponse.segments[i];
        
        try {
          // musicSelection이 musicID (숫자)로 전달됨
          const musicID = typeof segment.musicSelection === 'number' 
            ? segment.musicSelection 
            : parseInt(String(segment.musicSelection), 10);
          
          if (isNaN(musicID) || musicID < 10 || musicID > 69) {
            console.warn(`[Segment ${i}] 잘못된 musicID: "${segment.musicSelection}" → Fallback`);
            // Fallback: Pop 장르의 첫 번째 트랙 (musicID 20)
            const fallbackTrack = await mapMusicIDToTrack(20);
            segment.musicTracks = fallbackTrack;
            if (fallbackTrack.length > 0 && fallbackTrack[0]?.duration) {
              segment.duration = fallbackTrack[0].duration;
            }
          } else {
            const musicTracks = await mapMusicIDToTrack(musicID);
            
            if (musicTracks.length > 0) {
              segment.musicTracks = musicTracks;
              // 실제 MP3 길이로 segment duration 업데이트
              if (musicTracks[0]?.duration) {
                segment.duration = musicTracks[0].duration;
              }
              console.log(`[Segment ${i}] ✅ musicID ${musicID} 매핑 성공: ${musicTracks[0].title}`);
            } else {
              console.warn(`[Segment ${i}] 매핑 실패: musicID ${musicID} → Fallback`);
              // Fallback: Pop 장르의 첫 번째 트랙 (musicID 20)
              const fallbackTrack = await mapMusicIDToTrack(20);
              segment.musicTracks = fallbackTrack;
              if (fallbackTrack.length > 0 && fallbackTrack[0]?.duration) {
                segment.duration = fallbackTrack[0].duration;
              }
            }
          }
        } catch (error) {
          console.error(`[Segment ${i}] 에러:`, error);
          // Fallback: Pop 장르의 첫 번째 트랙 (musicID 20)
          const fallbackTrack = await mapMusicIDToTrack(20);
          segment.musicTracks = fallbackTrack;
          if (fallbackTrack.length > 0 && fallbackTrack[0]?.duration) {
            segment.duration = fallbackTrack[0].duration;
          }
        }
      }
    } else {
      // 단일 세그먼트 응답
      const segment = validatedResponse as BackgroundParamsResponse;
      
      try {
        // musicSelection이 musicID (숫자)로 전달됨
        const musicID = typeof segment.musicSelection === 'number' 
          ? segment.musicSelection 
          : parseInt(String(segment.musicSelection), 10);
        
        if (isNaN(musicID) || musicID < 10 || musicID > 69) {
          console.warn(`[단일 세그먼트] 잘못된 musicID: "${segment.musicSelection}" → Fallback`);
          const fallbackTrack = await mapMusicIDToTrack(20);
          segment.musicTracks = fallbackTrack;
        } else {
          const musicTracks = await mapMusicIDToTrack(musicID);
          
          if (musicTracks.length > 0) {
            segment.musicTracks = musicTracks;
            if (musicTracks[0]?.duration) {
              segment.duration = musicTracks[0].duration;
            }
            console.log(`[단일 세그먼트] ✅ musicID ${musicID} 매핑 성공: ${musicTracks[0].title}`);
          } else {
            console.warn(`[단일 세그먼트] 매핑 실패: musicID ${musicID} → Fallback`);
            const fallbackTrack = await mapMusicIDToTrack(20);
            segment.musicTracks = fallbackTrack;
          }
        }
      } catch (error) {
        console.error(`[단일 세그먼트] 에러:`, error);
        const fallbackTrack = await mapMusicIDToTrack(20);
        segment.musicTracks = fallbackTrack;
        if (fallbackTrack.length > 0 && fallbackTrack[0]?.duration) {
          segment.duration = fallbackTrack[0].duration;
        }
      }
    }
    
    
    // ===== 최종 mood JSON 로깅 =====
    console.log("\n" + "=".repeat(100));
    console.log("🎵 [최종 Mood JSON - 음악 매핑 완료 후]");
    console.log("=".repeat(100));
    if ('segments' in validatedResponse && Array.isArray(validatedResponse.segments)) {
      validatedResponse.segments.forEach((seg, idx) => {
        console.log(`\n[Segment ${idx}]`);
        console.log(`  moodAlias: "${seg.moodAlias}"`);
        console.log(`  musicSelection: ${seg.musicSelection}`);
        console.log(`  musicTracks: ${seg.musicTracks?.length || 0}개`);
        if (seg.musicTracks && seg.musicTracks.length > 0) {
          const track = seg.musicTracks[0];
          console.log(`    - title: "${track.title}"`);
          console.log(`    - artist: "${track.artist || "Unknown"}"`);
          console.log(`    - duration: ${track.duration}ms (${Math.round(track.duration / 1000)}초)`);
          console.log(`    - fileUrl: ${track.fileUrl}`);
          console.log(`    - albumImageUrl: ${track.albumImageUrl || "N/A"}`);
        }
        console.log(`  moodColor: "${seg.moodColor}"`);
        console.log(`  backgroundIcon: ${seg.backgroundIcon?.name} (${seg.backgroundIcon?.category})`);
        console.log(`  backgroundIcons: [${seg.iconKeys?.join(", ") || ""}]`);
        console.log(`  backgroundWind: direction=${seg.backgroundWind?.direction}, speed=${seg.backgroundWind?.speed}`);
        console.log(`  animationSpeed: ${seg.animationSpeed}`);
        console.log(`  iconOpacity: ${seg.iconOpacity}`);
      });
    } else {
      const seg = validatedResponse as BackgroundParamsResponse;
      console.log(`  moodAlias: "${seg.moodAlias}"`);
      console.log(`  musicSelection: ${seg.musicSelection}`);
      console.log(`  musicTracks: ${seg.musicTracks?.length || 0}개`);
      if (seg.musicTracks && seg.musicTracks.length > 0) {
        const track = seg.musicTracks[0];
        console.log(`    - title: "${track.title}"`);
        console.log(`    - artist: "${track.artist || "Unknown"}"`);
        console.log(`    - duration: ${track.duration}ms (${Math.round(track.duration / 1000)}초)`);
        console.log(`    - fileUrl: ${track.fileUrl}`);
        console.log(`    - albumImageUrl: ${track.albumImageUrl || "N/A"}`);
      }
    }
    console.log("=".repeat(100) + "\n");
    
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
    console.error("[LLM API] 에러:", openaiError);
    // 에러 상세 정보 로깅
    if (openaiError instanceof Error) {
      console.error("[LLM API] 에러 메시지:", openaiError.message);
      console.error("[LLM API] 에러 스택:", openaiError.stack);
    }
    // API 키 확인
    if (!process.env.OPENAI_API_KEY) {
      console.error("[LLM API] OPENAI_API_KEY가 설정되지 않았습니다.");
    }
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

  const openai = new OpenAI({ 
    apiKey,
    timeout: 120000, // 120초 타임아웃 (LLM 호출이 오래 걸릴 수 있음)
  });

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { 
          role: "system", 
          content: `Generate 10 mood segments. JSON Schema enforces structure.

Required: segments[].{moodAlias, moodColor, lighting{brightness, temperature}, scent{type, name, level, interval}, music{musicID:10-69, fadeIn, fadeOut}, background{icons[], wind{}, animation{}}}

Use music.musicID (not musicSelection). Use background.icons (not backgroundIcons).

CRITICAL: Icon Diversity & Music Diversity & Scent Diversity
- Use 8-12 DIFFERENT icon keys across 10 segments
- Use DIFFERENT musicID for each segment (no duplicates)
- Use DIFFERENT scent types across 10 segments (no single type repeated more than 3 times)
  - Available scent types: Floral, Woody, Spicy, Fresh, Citrus, Herbal, Musk, Oriental
  - Vary scent types based on user preferences and segment mood
  - Do NOT use the same scent type for all segments
  - Example: Segment 0: Woody, Segment 1: Floral, Segment 2: Spicy, Segment 3: Fresh, etc.` 
        },
        { role: "user", content: prompt },
      ],
      response_format: { 
        type: "json_schema",
        json_schema: {
          name: "complete_segment_output",
          strict: true,
          schema: {
            type: "object",
            required: ["segments"],
            properties: {
              segments: {
                type: "array",
                minItems: 10,
                maxItems: 10,
                items: {
                  type: "object",
                  required: ["moodAlias", "moodColor", "lighting", "scent", "music", "background"],
                  properties: {
                    moodAlias: { type: "string" },
                    moodColor: { type: "string", pattern: "^#[A-Fa-f0-9]{6}$" },
                    lighting: {
                      type: "object",
                      required: ["brightness", "temperature"],
                      properties: {
                        brightness: { type: "integer", minimum: 0, maximum: 100 },
                        temperature: { type: "integer", minimum: 2000, maximum: 6500 }
                      },
                      additionalProperties: false
                    },
                    scent: {
                      type: "object",
                      required: ["type", "name", "level", "interval"],
                      properties: {
                        type: { type: "string", enum: ["Musk", "Aromatic", "Woody", "Citrus", "Honey", "Green", "Dry", "Leathery", "Marine", "Spicy", "Floral", "Powdery"] },
                        name: { type: "string" },
                        level: { type: "integer", minimum: 1, maximum: 10 },
                        interval: { type: "integer", enum: [5, 10, 15, 20, 25, 30] }
                      },
                      additionalProperties: false
                    },
                    music: {
                      type: "object",
                      required: ["musicID", "fadeIn", "fadeOut"],
                      properties: {
                        musicID: { type: "integer", minimum: 10, maximum: 69 },
                        fadeIn: { type: "integer", minimum: 0, maximum: 5000 },
                        fadeOut: { type: "integer", minimum: 0, maximum: 5000 }
                      },
                      additionalProperties: false
                    },
                    background: {
                      type: "object",
                      required: ["icons", "wind", "animation"],
                      properties: {
                        icons: {
                          type: "array",
                          minItems: 1,
                          maxItems: 4,
                          items: { type: "string" }
                        },
                        wind: {
                          type: "object",
                          required: ["direction", "speed"],
                          properties: {
                            direction: { type: "integer", minimum: 0, maximum: 360 },
                            speed: { type: "number", minimum: 0, maximum: 10 }
                          },
                          additionalProperties: false
                        },
                        animation: {
                          type: "object",
                          required: ["speed", "iconOpacity"],
                          properties: {
                            speed: { type: "number", minimum: 0, maximum: 10 },
                            iconOpacity: { type: "number", minimum: 0, maximum: 1 }
                          },
                          additionalProperties: false
                        }
                      },
                      additionalProperties: false
                    }
                  },
                  additionalProperties: false
                }
              }
            },
            additionalProperties: false
          }
        }
      },
      temperature: 0.0, // 구조 준수 최우선: 생체 데이터 기반이므로 창의도 불필요, 정확한 구조 준수만 필요
      max_tokens: 8000, // JSON Schema + 10개 세그먼트 = 많은 토큰 필요
    });

    // JSON Schema를 사용하면 응답이 이미 검증되었지만, 여전히 문자열로 반환됨
    let rawResponse: { segments?: unknown[] } | unknown;
    try {
      const content = completion.choices[0].message.content || "{}";
      rawResponse = typeof content === 'string' ? JSON.parse(content) : content;
    } catch (parseError) {
      console.error("[Fallback] JSON 파싱 에러:", parseError);
      if (completion.choices[0].message.content) {
        const content = completion.choices[0].message.content;
        console.error("[Fallback] 원본 응답 길이:", content.length);
        console.error("[Fallback] 원본 응답 (처음 500자):", content.substring(0, 500));
        console.error("[Fallback] 원본 응답 (마지막 500자):", content.substring(Math.max(0, content.length - 500)));
        // 에러 위치 주변 확인
        const errorMatch = (parseError as Error).message.match(/position (\d+)/);
        if (errorMatch) {
          const errorPos = parseInt(errorMatch[1], 10);
          const start = Math.max(0, errorPos - 100);
          const end = Math.min(content.length, errorPos + 100);
          console.error("[Fallback] 에러 위치 주변:", content.substring(start, end));
        }
      }
      // 에러 발생 시 목업 응답 반환
      const mockResponse = { ...getMockResponse(), source: "mock-json-parse-error" as const };
      return NextResponse.json(mockResponse);
    }
    
    const validatedResponse = validateAndNormalizeResponse(rawResponse as Parameters<typeof validateAndNormalizeResponse>[0]);
    
    // ===== 검증된 응답 로깅 (Fallback) =====
    console.log("\n" + "=".repeat(100));
    console.log("✅ [검증된 LLM 응답 - Fallback 모드]");
    console.log("=".repeat(100));
    if ('segments' in validatedResponse && Array.isArray(validatedResponse.segments)) {
      console.log(`총 ${validatedResponse.segments.length}개 세그먼트 생성됨`);
      
      // 선호도 반영 확인
      const musicIDs = validatedResponse.segments.map(seg => {
        const musicID = typeof seg.musicSelection === 'number' 
          ? seg.musicSelection 
          : parseInt(String(seg.musicSelection), 10);
        return musicID;
      }).filter(id => !isNaN(id));
      
      const uniqueMusicIDs = new Set(musicIDs);
      console.log(`\n[음악 다양성 확인]`);
      console.log(`  - 총 음악 ID: ${musicIDs.length}개`);
      console.log(`  - 고유 음악 ID: ${uniqueMusicIDs.size}개`);
      console.log(`  - 중복 여부: ${musicIDs.length !== uniqueMusicIDs.size ? "⚠️ 중복 발견" : "✅ 중복 없음"}`);
      
      const allIconKeys = validatedResponse.segments.flatMap(seg => seg.iconKeys || []);
      const uniqueIconKeys = new Set(allIconKeys);
      console.log(`\n[아이콘 다양성 확인]`);
      console.log(`  - 총 아이콘 키: ${allIconKeys.length}개`);
      console.log(`  - 고유 아이콘 키: ${uniqueIconKeys.size}개`);
      console.log(`  - 다양성: ${uniqueIconKeys.size >= 8 ? "✅ 좋음 (8개 이상)" : "⚠️ 부족 (8개 미만)"}`);
      
      // 향 다양성 확인
      const allScentTypes = validatedResponse.segments.map(seg => seg.scent?.type).filter((type): type is string => Boolean(type));
      const uniqueScentTypes = new Set(allScentTypes);
      const scentTypeCounts: Record<string, number> = {};
      allScentTypes.forEach(type => {
        scentTypeCounts[type] = (scentTypeCounts[type] || 0) + 1;
      });
      
      console.log(`\n[향 다양성 확인]`);
      console.log(`  - 총 향 타입: ${allScentTypes.length}개`);
      console.log(`  - 고유 향 타입: ${uniqueScentTypes.size}개`);
      console.log(`  - 향 타입 분포:`, JSON.stringify(scentTypeCounts, null, 2));
      const maxScentCount = Object.keys(scentTypeCounts).length > 0 ? Math.max(...Object.values(scentTypeCounts)) : 0;
      console.log(`  - 다양성: ${maxScentCount <= 3 ? "✅ 좋음 (최대 3회 이하)" : `⚠️ 부족 (${maxScentCount}회 반복)`}`);
    }
    console.log("=".repeat(100) + "\n");
    
    // ===== musicSelection을 musicTracks로 변환 (Fallback) =====
    if ('segments' in validatedResponse && Array.isArray(validatedResponse.segments)) {
      for (let i = 0; i < validatedResponse.segments.length; i++) {
        const segment = validatedResponse.segments[i];
        
        try {
          // musicSelection이 musicID (숫자)로 전달됨
          const musicID = typeof segment.musicSelection === 'number' 
            ? segment.musicSelection 
            : parseInt(String(segment.musicSelection), 10);
          
          if (isNaN(musicID) || musicID < 10 || musicID > 69) {
            console.warn(`[Fallback Segment ${i}] 잘못된 musicID: "${segment.musicSelection}" → Fallback`);
            const fallbackTrack = await mapMusicIDToTrack(20);
            segment.musicTracks = fallbackTrack;
          } else {
            const musicTracks = await mapMusicIDToTrack(musicID);
            
            if (musicTracks.length > 0) {
              segment.musicTracks = musicTracks;
              console.log(`[Fallback Segment ${i}] ✅ musicID ${musicID} 매핑 성공: ${musicTracks[0].title}`);
            } else {
              console.warn(`[Fallback Segment ${i}] 매핑 실패: musicID ${musicID} → Fallback`);
              const fallbackTrack = await mapMusicIDToTrack(20);
              segment.musicTracks = fallbackTrack;
            }
          }
        } catch (error) {
          console.error(`[Fallback Segment ${i}] 에러:`, error);
          const fallbackTrack = await mapMusicIDToTrack(20);
          segment.musicTracks = fallbackTrack;
        }
      }
    } else {
      const segment = validatedResponse as BackgroundParamsResponse;
      // const originalSegment = segments?.[0]; // 사용되지 않음
      
      try {
        // musicSelection이 musicID (숫자)로 전달됨
        const musicID = typeof segment.musicSelection === 'number' 
          ? segment.musicSelection 
          : parseInt(String(segment.musicSelection), 10);
        
        if (isNaN(musicID) || musicID < 10 || musicID > 69) {
          console.warn(`[Fallback 단일 세그먼트] 잘못된 musicID: "${segment.musicSelection}" → Fallback`);
          const fallbackTrack = await mapMusicIDToTrack(20);
          segment.musicTracks = fallbackTrack;
        } else {
          const musicTracks = await mapMusicIDToTrack(musicID);
          
          if (musicTracks.length > 0) {
            segment.musicTracks = musicTracks;
            console.log(`[Fallback 단일 세그먼트] ✅ musicID ${musicID} 매핑 성공: ${musicTracks[0].title}`);
          } else {
            console.warn(`[Fallback 단일 세그먼트] 매핑 실패: musicID ${musicID} → Fallback`);
            const fallbackTrack = await mapMusicIDToTrack(20);
            segment.musicTracks = fallbackTrack;
          }
        }
      } catch (error) {
        console.error(`[Fallback 단일 세그먼트] 에러:`, error);
        const fallbackTrack = await mapMusicIDToTrack(20);
        segment.musicTracks = fallbackTrack;
      }
    }
    
    return NextResponse.json({ ...validatedResponse, source: "openai-fallback" });
  } catch (error) {
    console.error("[Fallback] 에러:", error);
    return NextResponse.json(getMockResponse());
  }
}
