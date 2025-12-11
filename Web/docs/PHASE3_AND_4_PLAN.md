# Phase 3 & 4 작업 계획서

## 📋 개요

**작업 기간**: Phase 3 → Phase 4 순차 진행  
**목표**: 
- Phase 3: 무드스트림 자동 생성 로직 개선
- Phase 4: Prisma 클라이언트 안정화 및 Docs 정리

---

## 🔴 Phase 3: 무드스트림 자동 생성 로직 개선

### 문제점 분석

**현재 상태** (`useMoodStreamManager.ts`):
- ✅ 초기 세그먼트 로드 로직 존재
- ✅ LLM 세그먼트 생성 및 병합 로직 존재
- ✅ 자동 생성 조건 체크 로직 존재
- ⚠️ 자동 생성 조건이 여러 useEffect에 분산되어 복잡함
- ⚠️ 병합 전략이 하드코딩되어 있음 (3개 + 4개)
- ⚠️ 생성 실패 시 재시도 로직 없음

**개선 필요 사항**:
1. 자동 생성 조건을 명확한 함수로 분리
2. 병합 전략을 설정 가능하게 변경
3. 생성 실패 시 재시도 로직 추가 (최대 3회, 지수 백오프)
4. 로그인 후 최초 진입 시 자동 생성 로직 명확화

### 작업 내용

#### 1. 자동 생성 조건 함수화

**파일**: `src/hooks/useMoodStreamManager.ts`

```typescript
/**
 * 자동 생성 조건 체크
 * 
 * @param isFirstVisit - 로그인 후 최초 진입 여부
 * @param currentIndex - 현재 세그먼트 인덱스
 * @param totalSegments - 전체 세그먼트 수
 * @param isLoading - 로딩 중 여부
 * @param isGenerating - 생성 중 여부
 * @returns 자동 생성 필요 여부
 */
function shouldAutoGenerateStream(
  isFirstVisit: boolean,
  currentIndex: number,
  totalSegments: number,
  isLoading: boolean,
  isGenerating: boolean
): boolean {
  // 로딩 중이거나 생성 중이면 스킵
  if (isLoading || isGenerating) {
    return false;
  }
  
  // 로그인 후 최초 진입: 초기 3세그먼트만 있을 때
  if (isFirstVisit && totalSegments === 3) {
    return true;
  }
  
  // 현재 세그먼트가 뒤에서 2번째 이내
  if (totalSegments > 0 && currentIndex >= totalSegments - 2) {
    return true;
  }
  
  return false;
}
```

#### 2. 병합 전략 개선

**파일**: `src/hooks/useMoodStreamManager.ts`

```typescript
/**
 * 세그먼트 병합 전략 설정
 */
interface MergeStrategy {
  /** 초기 세그먼트 수 */
  initialCount: number;
  /** LLM 생성 세그먼트 수 */
  llmCount: number;
  /** 병합 시 유지할 LLM 세그먼트 수 (나머지 버림) */
  keepLlmCount: number;
}

const DEFAULT_MERGE_STRATEGY: MergeStrategy = {
  initialCount: 3,
  llmCount: 7,
  keepLlmCount: 4, // 7개 중 4개만 유지 (마지막 3개 버림)
};

/**
 * 세그먼트 병합
 */
function mergeSegments(
  initialSegments: MoodStreamSegment[],
  llmSegments: MoodStreamSegment[],
  strategy: MergeStrategy = DEFAULT_MERGE_STRATEGY
): MoodStreamSegment[] {
  // 초기 세그먼트가 strategy.initialCount와 일치하는지 확인
  if (initialSegments.length === strategy.initialCount) {
    // 초기 세그먼트 + LLM 앞 keepLlmCount개
    return [
      ...initialSegments,
      ...llmSegments.slice(0, strategy.keepLlmCount)
    ];
  }
  
  // 일반적인 경우: 그냥 추가
  return [...initialSegments, ...llmSegments];
}
```

#### 3. 재시도 로직 추가

**파일**: `src/hooks/useMoodStreamManager.ts`

```typescript
/**
 * 재시도 설정
 */
interface RetryConfig {
  maxRetries: number;
  initialDelay: number; // ms
  maxDelay: number; // ms
  backoffMultiplier: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
};

/**
 * 지수 백오프를 사용한 재시도 로직
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<T> {
  let lastError: Error | null = null;
  let delay = config.initialDelay;
  
  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt < config.maxRetries) {
        console.log(
          `[useMoodStreamManager] Retry attempt ${attempt + 1}/${config.maxRetries} after ${delay}ms`
        );
        await new Promise(resolve => setTimeout(resolve, delay));
        delay = Math.min(delay * config.backoffMultiplier, config.maxDelay);
      }
    }
  }
  
  throw lastError || new Error("Max retries exceeded");
}
```

#### 4. useEffect 통합 및 개선

**파일**: `src/hooks/useMoodStreamManager.ts`

```typescript
// 기존: 여러 useEffect로 분산
// 개선: 하나의 useEffect로 통합하여 로직 명확화

useEffect(() => {
  if (!isAuthenticated) {
    return;
  }
  
  // 1. 초기 세그먼트 로드
  if (moodStreamData.segments.length === 0 && !moodStreamData.isLoading) {
    loadInitialSegments();
    return;
  }
  
  // 2. 자동 생성 조건 체크
  const isFirstVisit = 
    moodStreamData.segments.length === 3 &&
    moodStreamData.segments[0]?.backgroundParams?.source === "initial";
  
  if (
    shouldAutoGenerateStream(
      isFirstVisit,
      moodStreamData.currentIndex,
      moodStreamData.segments.length,
      moodStreamData.isLoading,
      moodStreamData.isGeneratingNextStream
    )
  ) {
    const segmentCount = isFirstVisit ? 7 : 10;
    generateAndMergeStream(segmentCount);
  }
}, [
  isAuthenticated,
  moodStreamData.segments.length,
  moodStreamData.currentIndex,
  moodStreamData.isLoading,
  moodStreamData.isGeneratingNextStream,
  loadInitialSegments,
  generateAndMergeStream,
]);
```

### 예상 효과

- ✅ 자동 생성 로직 가독성 향상
- ✅ 불필요한 스트림 생성 방지
- ✅ 생성 실패 시 자동 재시도로 안정성 향상
- ✅ 병합 전략 유연성 확보

---

## 🔴 Phase 4: Prisma 클라이언트 안정화 및 Docs 정리

### 문제점 분석

**현재 상태** (`src/lib/prisma.ts`):
- ✅ 싱글톤 패턴으로 Prisma Client 생성
- ✅ HMR 대응 (개발 환경)
- ❌ 클라이언트 생성 실패 시 처리 없음
- ❌ 타임아웃 로직 없음
- ❌ 재시도 로직 없음
- ❌ 폴백 처리 없음

**문제 시나리오**:
1. DB 연결 실패 시 `new PrismaClient()`가 무한 대기
2. EC2 서버에서 리소스 고갈로 서버 다운
3. 사용자 요청이 모두 블로킹되어 전체 시스템 마비

### 작업 내용

#### 1. Prisma 클라이언트 안정화

**파일**: `src/lib/prisma.ts`

```typescript
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  prismaInitAttempts: number;
  prismaLastError: Error | undefined;
};

// 최대 재시도 횟수
const MAX_INIT_ATTEMPTS = 3;
const INIT_TIMEOUT = 5000; // 5초

/**
 * 타임아웃을 사용한 Prisma Client 생성
 */
async function createPrismaClientWithTimeout(): Promise<PrismaClient> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error("Prisma Client initialization timeout"));
    }, INIT_TIMEOUT);
    
    try {
      const client = new PrismaClient({
        log: process.env.NODE_ENV === "development" 
          ? ["query", "error", "warn"] 
          : ["error"],
      });
      
      // 연결 테스트
      client.$connect()
        .then(() => {
          clearTimeout(timeout);
          resolve(client);
        })
        .catch((error) => {
          clearTimeout(timeout);
          reject(error);
        });
    } catch (error) {
      clearTimeout(timeout);
      reject(error);
    }
  });
}

/**
 * 재시도 로직을 포함한 Prisma Client 생성
 */
async function createPrismaClientWithRetry(): Promise<PrismaClient> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < MAX_INIT_ATTEMPTS; attempt++) {
    try {
      const client = await createPrismaClientWithTimeout();
      globalForPrisma.prismaInitAttempts = 0;
      globalForPrisma.prismaLastError = undefined;
      return client;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      globalForPrisma.prismaLastError = lastError;
      globalForPrisma.prismaInitAttempts = (globalForPrisma.prismaInitAttempts || 0) + 1;
      
      if (attempt < MAX_INIT_ATTEMPTS - 1) {
        const delay = Math.min(1000 * Math.pow(2, attempt), 5000);
        console.warn(
          `[Prisma] Initialization attempt ${attempt + 1}/${MAX_INIT_ATTEMPTS} failed, retrying in ${delay}ms...`
        );
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw new Error(
    `Prisma Client initialization failed after ${MAX_INIT_ATTEMPTS} attempts: ${lastError?.message}`
  );
}

/**
 * Prisma Client 싱글톤 (안정화 버전)
 */
let prismaInstance: PrismaClient | null = null;
let prismaInitPromise: Promise<PrismaClient> | null = null;

export const prisma = (() => {
  // 개발 환경: globalThis에서 재사용
  if (process.env.NODE_ENV !== "production" && globalForPrisma.prisma) {
    return globalForPrisma.prisma;
  }
  
  // 이미 생성 중이면 기존 Promise 재사용
  if (prismaInitPromise) {
    return prismaInitPromise.then(client => {
      prismaInstance = client;
      return client;
    }) as unknown as PrismaClient;
  }
  
  // 새로 생성
  prismaInitPromise = createPrismaClientWithRetry()
    .then(client => {
      prismaInstance = client;
      if (process.env.NODE_ENV !== "production") {
        globalForPrisma.prisma = client;
      }
      return client;
    })
    .catch(error => {
      prismaInitPromise = null;
      throw error;
    });
  
  // Promise를 반환하지만, 동기적으로 접근 가능하도록 처리
  // 실제 사용 시 await 필요
  return prismaInitPromise as unknown as PrismaClient;
})();

/**
 * Prisma Client 안전 접근 래퍼
 * 
 * DB 연결 실패 시 폴백 처리
 */
export async function withPrisma<T>(
  operation: (client: PrismaClient) => Promise<T>,
  fallback?: () => T
): Promise<T> {
  try {
    const client = prismaInstance || await prismaInitPromise;
    if (!client) {
      throw new Error("Prisma Client not initialized");
    }
    return await operation(client);
  } catch (error) {
    console.error("[Prisma] Operation failed:", error);
    if (fallback) {
      console.warn("[Prisma] Using fallback value");
      return fallback();
    }
    throw error;
  }
}
```

**주의사항**: 
- Prisma Client는 싱글톤이므로, 초기화 실패 시 전체 앱에 영향
- 폴백 처리는 각 API Route에서 개별적으로 처리하는 것이 더 안전
- `withPrisma` 래퍼는 선택적으로 사용

#### 2. API Route에서 Prisma 사용 개선

**예시**: `src/app/api/moods/current/route.ts`

```typescript
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Prisma Client가 초기화되지 않았으면 재시도
    if (!prisma) {
      throw new Error("Prisma Client not initialized");
    }
    
    const mood = await prisma.preset.findFirst({
      // ...
    });
    
    return NextResponse.json({ mood });
  } catch (error) {
    console.error("[GET /api/moods/current] Error:", error);
    
    // Prisma 연결 실패 시 목업 데이터 반환
    if (error instanceof Error && error.message.includes("Prisma")) {
      return NextResponse.json({
        mood: getMockMood(),
        source: "fallback",
      });
    }
    
    return createErrorResponse(
      ERROR_CODES.INTERNAL_ERROR,
      "Internal server error"
    );
  }
}
```

#### 3. Docs 정리

**정리 대상 파일** (`Web/docs/`):

**유지할 문서** (팀 공유 문서):
- `README.md` (프로젝트 루트)
- `REFACTORING_PLAN.md` (리팩토링 전체 계획)
- `SIMPLIFICATION_PLAN.md` (단순화 계획)
- `FLOW_ANALYSIS.md` (시스템 흐름 분석)

**정리할 문서** (작업 완료 문서):
- `PHASE1_COMPLETION.md` → `REFACTORING_PLAN.md`에 통합 또는 삭제
- `PHASE1_REQUIREMENTS.md` → 삭제 (작업 완료)
- `PHASE1_SIMPLIFICATION_COMPLETION.md` → `SIMPLIFICATION_PLAN.md`에 통합
- `PHASE2_COMPLETION.md` → 삭제
- `PHASE2_PLAN.md` → 삭제
- `PHASE2_SIMPLIFICATION_COMPLETION.md` → `SIMPLIFICATION_PLAN.md`에 통합
- `PHASE3_COMPLETION.md` → 삭제
- `PHASE4_COMPLETION.md` → 삭제
- `PHASE4_EXTRA_COMPLETION.md` → 삭제

**검토 필요 문서**:
- `CLEANUP_AND_REFACTORING_PLAN.md` → `REFACTORING_PLAN.md`와 중복 여부 확인
- `CLEANUP_TASKS.md` → 완료 여부 확인 후 삭제 또는 통합
- `COMPREHENSIVE_UI_IMPROVEMENTS_PLAN.md` → 향후 작업 계획이면 유지
- `ENHANCED_UI_FEATURES_PLAN.md` → 향후 작업 계획이면 유지
- `LLM_OUTPUT_REFACTORING_PLAN.md` → 완료 여부 확인
- `REFACTORING_SUMMARY.md` → `REFACTORING_PLAN.md`에 통합
- `TROUBLESHOOTING_GUIDE.md` → 유지 (운영 문서)
- `VOLUME_CONTROL_IMPLEMENTATION_PLAN.md` → 완료 여부 확인

**정리 작업**:
1. 완료된 Phase 문서들을 `REFACTORING_PLAN.md` 또는 `SIMPLIFICATION_PLAN.md`에 요약 추가
2. 중복 문서 통합
3. 불필요한 문서 삭제
4. 최종 문서 구조:
   ```
   docs/
   ├── REFACTORING_PLAN.md (전체 리팩토링 계획 및 완료 요약)
   ├── SIMPLIFICATION_PLAN.md (단순화 계획 및 완료 요약)
   ├── FLOW_ANALYSIS.md (시스템 흐름 분석)
   ├── TROUBLESHOOTING_GUIDE.md (운영 가이드)
   └── PHASE3_AND_4_PLAN.md (현재 작업 계획)
   ```

### 예상 효과

- ✅ Prisma 클라이언트 생성 실패 시 타임아웃으로 무한 대기 방지
- ✅ 재시도 로직으로 일시적 연결 문제 자동 해결
- ✅ 폴백 처리로 사용자 경험 유지
- ✅ Docs 정리로 프로젝트 구조 명확화

---

## 🔧 라즈베리파이 연동 확인 사항

### 현재 API 상태

**구현 완료**:
- ✅ `/api/search_light` - GET/POST (status, light_off)
- ✅ `/api/light_power` - GET/POST (power)
- ✅ `/api/light_info` - GET/POST (r, g, b, brightness, colortemp)
- ✅ API 키 인증 (`x-api-key` 헤더)

### 라즈베리파이 코드 분석

**요구사항**:
1. `search_light` API의 `light_off` 필드명 확인
   - 라즈베리파이: `light_off_flag`
   - 서버: `light_off`
   - **조치**: 서버 응답에 `light_off_flag` 별칭 추가 또는 라즈베리파이 코드 수정

2. API 키 검증
   - ✅ 프로덕션 환경에서 필수
   - ✅ 개발 환경에서 완화

3. 폴링 주기
   - 라즈베리파이: 3초 (`POLL_INTERVAL = 3`)
   - 서버: 캐시 헤더 설정됨 (`no-cache`)

### 개선 사항

**파일**: `src/app/api/search_light/route.ts`

```typescript
// 하위 호환성을 위해 light_off_flag도 지원
return NextResponse.json({
  status: searchLightState.status,
  light_off: searchLightState.light_off,
  light_off_flag: searchLightState.light_off, // 라즈베리파이 호환성
});
```

---

## 📊 작업 우선순위

### Phase 3 (우선순위: 🔴 높음)
1. 자동 생성 조건 함수화 (1-2시간)
2. 병합 전략 개선 (1시간)
3. 재시도 로직 추가 (2-3시간)
4. useEffect 통합 (1-2시간)

**총 예상 시간**: 5-8시간

### Phase 4 (우선순위: 🔴 높음 - 서버 안정성)
1. Prisma 클라이언트 안정화 (3-4시간)
2. API Route 폴백 처리 (2-3시간)
3. Docs 정리 (1-2시간)
4. 라즈베리파이 연동 확인 (1시간)

**총 예상 시간**: 7-10시간

---

## ✅ 완료 체크리스트

### Phase 3
- [ ] 자동 생성 조건 함수화
- [ ] 병합 전략 개선
- [ ] 재시도 로직 추가
- [ ] useEffect 통합
- [ ] 테스트 및 검증

### Phase 4
- [ ] Prisma 클라이언트 타임아웃 처리
- [ ] Prisma 클라이언트 재시도 로직
- [ ] API Route 폴백 처리
- [ ] Docs 정리 (완료 문서 삭제/통합)
- [ ] 라즈베리파이 연동 확인 및 수정
- [ ] 테스트 및 검증

---

## 📝 참고 사항

1. **Prisma 클라이언트 초기화**:
   - Next.js 서버리스 환경에서는 각 요청마다 새 인스턴스 생성 가능
   - 싱글톤 패턴이 필수는 아니지만, 연결 풀 관리에 유리
   - 타임아웃과 재시도는 필수

2. **무드스트림 자동 생성**:
   - 사용자 경험을 위해 실패 시에도 기본 세그먼트 제공
   - 재시도는 백그라운드에서 조용히 수행

3. **Docs 정리**:
   - 완료된 작업 문서는 삭제하되, 주요 내용은 계획 문서에 요약
   - 향후 참고를 위해 Git 히스토리 보존

