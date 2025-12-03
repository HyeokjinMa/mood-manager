/**
 * Python 파일 기반 감정 예측 제공자
 * 
 * JSON 파일을 통해 Python 서버와 통신
 * 개발/테스트 목적으로 사용 (프로덕션에는 REST API 권장)
 */

import { promises as fs } from "fs";
import { join } from "path";
import type { EmotionPredictionProvider, EmotionSegment, EmotionPredictionInput } from "./EmotionPredictionProvider";

interface PythonFileRequest {
  userId: string;
  preprocessing: {
    average_stress_index: number;
    recent_stress_index: number;
    latest_sleep_score: number;
    latest_sleep_duration: number;
    weather: {
      temperature: number;
      humidity: number;
      rainType: number;
      sky: number;
    };
    emotionEvents: {
      laughter: number[];
      sigh: number[];
      anger: number[];
      sadness: number[];
      neutral: number[];
    };
  };
  userPreferences?: {
    music?: Record<string, '+' | '-'>;
    color?: Record<string, '+' | '-'>;
    scent?: Record<string, '+' | '-'>;
  };
  currentTime: number;
  segmentCount: number;
}

interface PythonFileResponse {
  status: "success" | "error";
  segments?: Array<{
    timestamp: number;
    duration: number;
    emotion: string;
    intensity: number;
    confidence?: number;
  }>;
  error?: string;
}

export class PythonFileBasedProvider implements EmotionPredictionProvider {
  readonly name = "PythonFile";
  readonly version = "1.0.0";
  
  private requestDir: string;
  private responseDir: string;
  private maxWaitTime: number;
  private pollInterval: number;
  
  constructor() {
    // 환경 변수에서 경로 설정
    const baseDir = process.env.PYTHON_FILE_BASE_DIR || "/tmp/mood-predictions";
    this.requestDir = process.env.PYTHON_FILE_REQUEST_DIR || join(baseDir, "requests");
    this.responseDir = process.env.PYTHON_FILE_RESPONSE_DIR || join(baseDir, "results");
    this.maxWaitTime = parseInt(process.env.PYTHON_FILE_MAX_WAIT || "60000", 10); // 60초
    this.pollInterval = parseInt(process.env.PYTHON_FILE_POLL_INTERVAL || "500", 10); // 0.5초
  }
  
  async predictEmotions(input: EmotionPredictionInput): Promise<EmotionSegment[]> {
    // 디렉토리 생성
    await this.ensureDirectories();
    
    // 요청 파일 생성
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const requestFile = join(this.requestDir, `${requestId}.json`);
    const responseFile = join(this.responseDir, `${requestId}.json`);
    
    const requestData: PythonFileRequest = {
      userId: "current_user", // TODO: 실제 userId 전달
      preprocessing: {
        average_stress_index: input.preprocessed.average_stress_index,
        recent_stress_index: input.preprocessed.recent_stress_index,
        latest_sleep_score: input.preprocessed.latest_sleep_score,
        latest_sleep_duration: input.preprocessed.latest_sleep_duration,
        weather: {
          temperature: input.preprocessed.weather.temperature,
          humidity: input.preprocessed.weather.humidity,
          rainType: input.preprocessed.weather.rainType,
          sky: input.preprocessed.weather.sky,
        },
        emotionEvents: input.preprocessed.emotionEvents ? {
          laughter: input.preprocessed.emotionEvents.laughter,
          sigh: input.preprocessed.emotionEvents.sigh,
          anger: input.preprocessed.emotionEvents.anger,
          sadness: input.preprocessed.emotionEvents.sadness,
          neutral: input.preprocessed.emotionEvents.neutral,
        } : {
          laughter: [],
          sigh: [],
          anger: [],
          sadness: [],
          neutral: [],
        },
      },
      currentTime: input.currentTime,
      segmentCount: input.segmentCount || 10,
    };
    
    // 요청 파일 쓰기
    await fs.writeFile(requestFile, JSON.stringify(requestData, null, 2), "utf-8");
    console.log(`[PythonFileBasedProvider] Request file created: ${requestFile}`);
    
    // 응답 파일 대기 (폴링)
    const startTime = Date.now();
    while (Date.now() - startTime < this.maxWaitTime) {
      try {
        const responseData = await fs.readFile(responseFile, "utf-8");
        const response: PythonFileResponse = JSON.parse(responseData);
        
        // 응답 파일 삭제
        await fs.unlink(responseFile).catch(() => {});
        
        if (response.status === "error" || !response.segments) {
          throw new Error(response.error || "Unknown error from Python server");
        }
        
        // EmotionSegment 배열로 변환
        return response.segments.map((seg) => ({
          timestamp: seg.timestamp,
          duration: seg.duration,
          emotion: seg.emotion,
          intensity: seg.intensity,
          confidence: seg.confidence,
        }));
      } catch (error) {
        // 파일이 아직 없으면 계속 대기
        if (error instanceof Error && (error as NodeJS.ErrnoException).code === "ENOENT") {
          await new Promise(resolve => setTimeout(resolve, this.pollInterval));
          continue;
        }
        throw error;
      }
    }
    
    // 타임아웃: 요청 파일 삭제
    await fs.unlink(requestFile).catch(() => {});
    throw new Error("Python file-based prediction timeout");
  }
  
  private async ensureDirectories(): Promise<void> {
    await fs.mkdir(this.requestDir, { recursive: true }).catch(() => {});
    await fs.mkdir(this.responseDir, { recursive: true }).catch(() => {});
  }
}

