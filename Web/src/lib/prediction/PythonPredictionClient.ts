/**
 * Python 서버와의 통신 클라이언트
 * 
 * 시계열+마르코프 체인 모델 서버와 HTTP 통신
 */

interface PythonPredictRequest {
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

interface PythonPredictResponse {
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

interface PythonAsyncJobResponse {
  status: "accepted";
  jobId: string;
  estimatedTime?: number;
}

interface PythonJobStatusResponse {
  status: "pending" | "processing" | "completed" | "failed";
  jobId: string;
  progress?: number;
  error?: string;
}

export class PythonPredictionClient {
  private baseUrl: string;
  private timeout: number;
  private retryMax: number;
  
  constructor() {
    this.baseUrl = process.env.PYTHON_SERVER_URL || "http://localhost:8000";
    this.timeout = parseInt(process.env.PYTHON_SERVER_TIMEOUT || "30000", 10);
    this.retryMax = parseInt(process.env.PYTHON_SERVER_RETRY_MAX || "3", 10);
  }
  
  /**
   * 동기 방식: Python 서버에서 즉시 예측 결과 반환
   */
  async predictSync(request: PythonPredictRequest): Promise<PythonPredictResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);
    
    try {
      const response = await fetch(`${this.baseUrl}/api/predict`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`Python server error: ${response.status} ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }
  
  /**
   * 비동기 방식: 작업 요청 후 jobId 반환
   */
  async predictAsync(request: PythonPredictRequest): Promise<PythonAsyncJobResponse> {
    const response = await fetch(`${this.baseUrl}/api/predict/async`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });
    
    if (!response.ok) {
      throw new Error(`Python server error: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  }
  
  /**
   * 비동기 작업 상태 확인
   */
  async getJobStatus(jobId: string): Promise<PythonJobStatusResponse> {
    const response = await fetch(`${this.baseUrl}/api/predict/status/${jobId}`);
    
    if (!response.ok) {
      throw new Error(`Python server error: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  }
  
  /**
   * 비동기 작업 결과 조회
   */
  async getJobResult(jobId: string): Promise<PythonPredictResponse> {
    const response = await fetch(`${this.baseUrl}/api/predict/result/${jobId}`);
    
    if (!response.ok) {
      throw new Error(`Python server error: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  }
  
  /**
   * 비동기 작업 완료까지 대기 (폴링)
   */
  async waitForJob(
    jobId: string,
    options?: {
      interval?: number; // 폴링 간격 (ms)
      maxWait?: number; // 최대 대기 시간 (ms)
      onProgress?: (progress: number) => void;
    }
  ): Promise<PythonPredictResponse> {
    const interval = options?.interval || 1000; // 1초
    const maxWait = options?.maxWait || 60000; // 60초
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWait) {
      const status = await this.getJobStatus(jobId);
      
      if (status.status === "completed") {
        return this.getJobResult(jobId);
      }
      
      if (status.status === "failed") {
        throw new Error(status.error || "Job failed");
      }
      
      if (options?.onProgress && status.progress !== undefined) {
        options.onProgress(status.progress);
      }
      
      await new Promise(resolve => setTimeout(resolve, interval));
    }
    
    throw new Error("Job timeout");
  }
}

// 싱글톤 인스턴스
export const pythonPredictionClient = new PythonPredictionClient();

