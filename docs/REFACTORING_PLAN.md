# 최종 리팩토링 계획서

## 개요

이 문서는 Mood Manager 프로젝트의 최종 리팩토링 계획과 향후 작업을 정리합니다.

---

## 현재 상태

### 완료된 작업

#### 1. 코드 리팩토링
- ✅ 중복 함수 통합 (`hexToRgb`, `hexToRgba` → `Web/src/lib/utils.ts`)
- ✅ 커스텀 훅 분리 (`useDeviceSync`, `useMoodColors`, `useHeartAnimation`, `useSegmentSelector`)
- ✅ Props 그룹화 (`moodState`, `deviceState`, `backgroundState`)
- ✅ TypeScript 타입 안정성 향상 (`any` 타입 제거)
- ✅ 사용하지 않는 변수 정리

#### 2. 관리자 모드 구현
- ✅ 관리자 로그인 기능 (`admin@moodmanager.com` / `admin1234`)
- ✅ localStorage 기반 무드셋 관리
- ✅ 샘플 데이터 자동 초기화 (11개 무드셋)
- ✅ 무드 저장/삭제/교체 기능
- ✅ 저장 시간 표시
- ✅ 세그먼트 교체 확인 모달

#### 3. UI/UX 개선
- ✅ 무드셋 페이지: 8개 카드/페이지, 페이지네이션
- ✅ 디바이스 삭제 확인 모달
- ✅ 스프레이 컬러 동기화 (무드 컬러와 일치)
- ✅ 설문조사 팝업 (홈 화면)

---

## 리팩토링 계획

### Phase 0: 현재 상태 (완료)

#### 완료된 작업
- ✅ 코드 리팩토링 (중복 제거, 커스텀 훅 분리, 타입 안정성)
- ✅ 관리자 모드 구현 (Mock 데이터 플로우)
- ✅ UI/UX 개선 (무드셋 페이지, 디바이스 관리, 설문조사)
- ✅ 프로젝트 구조 정리 (Web/, Watch/, ML/, docs/ 구조)

### Phase 1: 데이터 플로우 전환 (우선순위: High)

#### 목표
목업 데이터부터 시작하여 전처리와 LLM 2단계를 거쳐 유효한 다양한 무드스트림을 생성

**참고**: 현재는 LLM이 시계열+마르코프 체인 역할을 대체하고 있으나, Phase 4에서 전용 모델로 교체 예정

#### 전체 데이터 흐름
```
[목업 데이터]
  raw_periodic (생체 신호)
  raw_events (ML 가공된 감정 이벤트)
  ↓
[1단계: 전처리]
  PreprocessedData
  ↓
[2단계: LLM 1차]
  EmotionSegment[] (10개, 일관성 필수, temperature: 0.3)
  ↓
[3단계: LLM 2차]
  MoodSegment[] (10개, 창의성 필수, temperature: 0.7)
  ↓
[최종 출력]
  MoodStreamResponse
```

#### 작업 항목

**1.1 전처리 통합 및 선호도 연동**
- [ ] 선호도 변환 함수 생성 (`Web/src/lib/preferences/convertPreferences.ts`)
  - DB 형식 (쉼표 구분 문자열) → LLM 인풋 형식 (`Record<string, '+' | '-'>`)
- [ ] 전처리 API 수정 (`Web/src/app/api/preprocessing/route.ts`)
  - 사용자 선호도 조회 추가 (`/api/preferences`)
  - 선호도 변환 함수 호출
  - `raw_events` 처리 개선 (ML에서 가공된 데이터 가정)
  - `timeOfDay`, `season` 자동 계산 및 포함
- [ ] 타입 정의 통합 (`Web/src/types/preprocessing.ts`)

**전처리 출력 타입:**
```typescript
interface PreprocessedData {
  // 생체 신호
  average_stress_index: number;      // 0-100
  recent_stress_index: number;       // 0-100
  latest_sleep_score: number;        // 0-100
  latest_sleep_duration: number;     // 분 (0-600)
  
  // 날씨
  weather: {
    temperature: number;              // °C
    humidity: number;                 // %
    rainType: number;                 // 0: 없음, 1: 비, 2: 비/눈, 3: 눈
    sky: number;                     // 1: 맑음, 3: 구름, 4: 흐림
  };
  
  // 감정 이벤트 (ML 가공된 타임스탬프 배열)
  emotionEvents: {
    laughter: number[];               // Unix timestamp (밀리초)
    sigh: number[];
    anger: number[];
    sadness: number[];
    neutral: number[];
  };
  
  // 사용자 선호도
  userPreferences: {
    music: Record<string, '+' | '-'>;
    color: Record<string, '+' | '-'>;
    scent: Record<string, '+' | '-'>;
  };
  
  // 시간 정보
  timeOfDay: number;                  // 0-23
  season: string;                     // "Spring" | "Summer" | "Autumn" | "Winter"
}
```

**1.2 LLM 1차 처리 구현**
- [ ] LLM 1차 API 엔드포인트 생성 (`src/app/api/ai/mood-stream/generate/route.ts`)
- [ ] 프롬프트 생성 함수 (`src/lib/llm/generateEmotionPrompt.ts`)
  - 시계열 패턴 분석
  - 마르코프 체인 기반 전이 확률 고려
  - 30분(10개 세그먼트) 감정 흐름 예측
- [ ] 응답 검증 함수 (`src/lib/llm/validateEmotionResponse.ts`)
- [ ] 타입 정의 (`src/types/emotion.ts`)

**LLM 1차 출력 타입:**
```typescript
interface EmotionSegment {
  timestamp: number;                  // Unix timestamp (밀리초)
  duration: number;                   // 180000 (3분)
  emotion: "calm" | "focus" | "energy" | "relax" | "romantic";
  emotionCluster: "-" | "0" | "+";
  intensity: number;                  // 0-100
}

interface LLM1Output {
  segments: EmotionSegment[];  // 10개
}
```

**LLM 설정:**
- Model: `gpt-4o-mini`
- Temperature: `0.3` (일관성 필수)
- Response format: `json_object`

**1.3 LLM 2차 처리 구현**
- [ ] LLM 2차 API 엔드포인트 생성 (`Web/src/app/api/ai/mood-stream/expand/route.ts`)
- [ ] 프롬프트 생성 함수 (`Web/src/lib/llm/generateMoodPrompt.ts`)
- [ ] 응답 검증 함수 (`Web/src/lib/llm/validateMoodResponse.ts`)
- [ ] 기존 `background-params` API와 통합

**LLM 2차 출력 타입:**
```typescript
interface MoodSegment {
  timestamp: number;
  duration: number;
  mood: {
    id: string;
    name: string;
    color: string;  // HEX
  };
  music: {
    genre: string;
    title: string;
  };
  scent: {
    type: string;
    name: string;
  };
  lighting: {
    color: string;  // HEX
    rgb: [number, number, number];
    brightness: number;
    temperature: number;
  };
}

interface LLM2Output {
  segments: MoodSegment[];  // 10개
  currentMood: MoodSegment["mood"];
}
```

**LLM 설정:**
- Model: `gpt-4o-mini`
- Temperature: `0.7` (창의성 필수)
- Response format: `json_object`

**1.4 무드스트림 생성 로직 통합**
- [ ] 무드스트림 생성 API 수정 (`Web/src/app/api/moods/current/generate/route.ts`)
- [ ] 3단계 플로우 통합
  ```typescript
  // 1. 전처리 데이터 조회
  const preprocessed = await fetchPreprocessing();
  
  // 2. LLM 1차 호출
  const emotionSegments = await generateEmotionSegments(preprocessed);
  
  // 3. LLM 2차 호출
  const moodStream = await generateMoodStream(emotionSegments, preprocessed);
  ```
- [ ] 에러 처리 및 fallback 로직

**예상 시간**: 2-3주

---

### Phase 2: 코드 품질 개선 (우선순위: Medium)

#### 목표
코드 중복 제거, 타입 안정성 향상, 성능 최적화

#### 작업 항목

**2.1 중복 코드 제거**
- [ ] API 라우트 중복 로직 추출
- [ ] 공통 유틸리티 함수 통합
- [ ] 타입 정의 중복 제거

**2.2 에러 처리 개선**
- [ ] 통일된 에러 응답 형식
- [ ] 에러 로깅 시스템 구축
- [ ] 사용자 친화적 에러 메시지

**2.3 성능 최적화**
- [ ] API 응답 캐싱 전략 개선
- [ ] 불필요한 리렌더링 방지
- [ ] 이미지 최적화

**예상 시간**: 1-2주

---

### Phase 3: 기능 확장 (우선순위: Low)

#### 목표
사용자 경험 개선을 위한 추가 기능 구현

#### 작업 항목

**3.1 디바이스 폴더링**
- [ ] 동일 타입 디바이스 그룹화 기능
- [ ] 그룹 아이콘 및 이름 표시
- [ ] 그룹 단위 제어 기능
- [ ] API 엔드포인트 구현

**3.2 무드 폴더링**
- [ ] 무드 세그먼트 그룹화 기능
- [ ] 폴더 클릭 시 스트림 교체 기능
- [ ] 폴더 관리 UI
- [ ] API 엔드포인트 구현

**3.3 선호도 학습 시스템**
- [ ] 사용자 행동 기반 선호도 업데이트
- [ ] 무드 사용 빈도 추적
- [ ] 개인화 추천 시스템

**예상 시간**: 2-3주

---

### Phase 4: 프로덕션 배포 및 고급 ML 통합 (우선순위: High)

#### 목표
1. 시계열 + 마르코프 체인 모델 구현으로 LLM 의존도 감소
2. 프로덕션 웹 애플리케이션 배포
3. 전체 파이프라인 최종 검증

#### 작업 항목

**4.1 시계열 + 마르코프 체인 모델 구현**

**4.1.1 시계열 분석 모듈**
- [ ] 시계열 데이터 전처리 (`Web/src/lib/timeseries/preprocess.ts`)
  - 생체 신호 시계열 데이터 정규화
  - 이동 평균 및 트렌드 분석
  - 계절성 및 주기성 패턴 추출
- [ ] 감정 상태 예측 모델 (`Web/src/lib/timeseries/predictEmotion.ts`)
  - ARIMA 또는 LSTM 기반 시계열 예측
  - 생체 신호 → 감정 상태 매핑
  - 시간대별 감정 변화 패턴 학습

**4.1.2 마르코프 체인 모델**
- [ ] 상태 전이 행렬 생성 (`Web/src/lib/markov/buildTransitionMatrix.ts`)
  - 감정 상태 간 전이 확률 계산
  - 사용자별 개인화된 전이 행렬
  - 시간대별 전이 패턴 고려
- [ ] 마르코프 체인 예측 (`Web/src/lib/markov/predictSequence.ts`)
  - 현재 상태에서 다음 N개 상태 예측
  - 전이 확률 기반 시퀀스 생성
  - 일관성 보장 (temperature: 0.3과 유사한 효과)

**4.1.3 통합 모델**
- [ ] 시계열 + 마르코프 체인 결합 (`Web/src/lib/ml/emotionPredictor.ts`)
  - 시계열 예측 결과를 마르코프 체인의 초기 상태로 사용
  - 10개 세그먼트(30분) 감정 시퀀스 생성
  - LLM Stage 1 대체
- [ ] 모델 학습 및 검증 (`Web/src/lib/ml/trainModel.ts`)
  - 과거 데이터 기반 모델 학습
  - 교차 검증 및 성능 평가
  - 모델 버전 관리

**4.1.4 API 통합**
- [ ] 감정 세그먼트 생성 API 수정 (`Web/src/app/api/ai/emotion-segments/route.ts`)
  - LLM 호출 대신 ML 모델 사용
  - Fallback: LLM 사용 (모델 실패 시)
- [ ] 타입 정의 (`Web/src/types/ml.ts`)
  - `EmotionSegment` 타입 (기존과 동일)
  - `TimeSeriesData`, `MarkovState`, `TransitionMatrix` 타입

**예상 시간**: 4-6주

**4.2 프로덕션 웹 애플리케이션 배포**

**4.2.1 AWS Amplify 배포 설정**
- [ ] 프로덕션 환경 변수 설정
  - 데이터베이스 URL (Production)
  - OpenAI API Key (Production)
  - NextAuth Secret (Production)
  - 기타 보안 키
- [ ] Amplify 빌드 설정 최적화 (`amplify.yml`)
  - 빌드 캐시 전략
  - 환경별 설정 분리
- [ ] 도메인 및 SSL 설정
  - 커스텀 도메인 연결
  - HTTPS 인증서 설정

**4.2.2 데이터베이스 마이그레이션**
- [ ] 프로덕션 데이터베이스 설정
  - MySQL/AWS RDS 설정
  - 연결 풀 최적화
- [ ] 마이그레이션 스크립트 실행
  - Prisma 마이그레이션 적용
  - 초기 데이터 시드
- [ ] 백업 및 복구 전략
  - 자동 백업 설정
  - 복구 프로세스 문서화

**4.2.3 CDN 및 정적 자산 최적화**
- [ ] 이미지 최적화
  - Next.js Image 컴포넌트 활용
  - WebP 형식 변환
- [ ] 정적 자산 CDN 배포
  - CloudFront 또는 Amplify CDN 설정
  - 캐싱 전략 최적화

**예상 시간**: 1-2주

**4.3 전체 파이프라인 최종 검증**

**4.3.1 End-to-End 테스트**
- [ ] WearOS → Firestore 데이터 수집 검증
- [ ] ML 서버 오디오 분류 검증
- [ ] 전처리 → ML 모델 → LLM Stage 2 파이프라인 검증
- [ ] 웹 앱 UI/UX 최종 검증

**4.3.2 성능 테스트**
- [ ] API 응답 시간 측정
- [ ] 동시 사용자 부하 테스트
- [ ] 데이터베이스 쿼리 성능 최적화
- [ ] 프론트엔드 번들 크기 최적화

**4.3.3 모니터링 및 로깅**
- [ ] 에러 추적 시스템 구축 (Sentry 등)
- [ ] 성능 모니터링 (AWS CloudWatch)
- [ ] 사용자 행동 분석 (Google Analytics)
- [ ] 로그 집계 및 분석

**예상 시간**: 2-3주

**전체 Phase 4 예상 시간**: 7-11주

---

## 사용자 선호도 시스템

### 초기값
- 선호(`+`): 10점
- 비선호(`-`): 0점

### 가중치 업데이트
- 대시보드 하트 클릭: +1점
- 최소값: 1점 (0이면 등장하지 않음)

### 정규화
- 각 선호도 합을 장르/향 개수로 나누어 소숫점 단위로 정규화
- 전처리 시 정규화된 데이터 사용

---

## 주요 설계 원칙

### 1. 일관성 vs 창의성
- **LLM 1차**: 일관성 필수 (temperature: 0.3)
  - 같은 생체 데이터 → 같은 감정 패턴
- **LLM 2차**: 창의성 필수 (temperature: 0.7)
  - 같은 감정이라도 다양한 무드 표현

### 2. 다양성
- **스트림 간 다양성**: 다른 전처리 데이터 → 다른 무드스트림
- **세그먼트 간 다양성**: 같은 스트림 내에서도 세그먼트마다 다른 표현

### 3. 사용자 선호도 반영
- 설문에서 수집한 선호도가 LLM 인풋에 포함
- 무드 생성 시 선호도 고려

### 4. 목업 데이터 지원
- 관리자 모드에서 목업 데이터로 전체 플로우 검증 가능
- 실제 데이터와 동일한 구조로 처리

---

## 향후 작업

### 단기 (1-2개월)

1. **데이터 플로우 전환 완료**
   - LLM 1차/2차 처리 구현
   - 목업 데이터로 전체 사이클 검증
   - 관리자 모드에서 완전한 플로우 확인

2. **백엔드 연동**
   - Prisma 스키마 최종화
   - 실제 데이터베이스 연동
   - Firebase 데이터 수집 파이프라인 구축

3. **테스트 코드 작성**
   - 단위 테스트 (유틸리티 함수)
   - 통합 테스트 (API 엔드포인트)
   - E2E 테스트 (주요 사용자 플로우)

### 중기 (3-6개월)

1. **성능 최적화**
   - LLM 응답 캐싱 전략 개선
   - 데이터베이스 쿼리 최적화
   - 프론트엔드 번들 크기 최적화

2. **기능 확장**
   - 디바이스/무드 폴더링
   - 선호도 학습 시스템
   - 무드 히스토리 및 통계

3. **모니터링 및 로깅**
   - 에러 추적 시스템 구축
   - 사용자 행동 분석
   - 성능 모니터링

### 장기 (6개월 이상)

1. **AI 모델 고도화**
   - 개인화 모델 학습 (사용자별 맞춤 예측)
   - 딥러닝 기반 감정 인식 모델
   - 실시간 학습 및 적응 시스템

2. **확장성 개선**
   - 마이크로서비스 아키텍처 전환 검토
   - Redis 캐싱 시스템 도입
   - CDN 및 정적 자산 최적화

3. **보안 강화**
   - 인증/인가 시스템 개선
   - 데이터 암호화
   - 보안 취약점 점검

---

## 우선순위 매트릭스

| 작업 | 우선순위 | 예상 시간 | 의존성 |
|------|---------|----------|--------|
| 데이터 플로우 전환 (LLM 기반) | High | 2-3주 | - |
| 코드 품질 개선 | Medium | 1-2주 | 데이터 플로우 전환 |
| 백엔드 연동 | High | 2-3주 | 데이터 플로우 전환 |
| 시계열+마르코프 체인 모델 구현 | High | 4-6주 | 데이터 플로우 전환, 백엔드 연동 |
| 프로덕션 배포 | High | 1-2주 | 시계열+마르코프 체인 모델 |
| 테스트 코드 작성 | Medium | 1-2주 | 백엔드 연동 |
| 디바이스/무드 폴더링 | Low | 2-3주 | 코드 품질 개선 |
| 선호도 학습 시스템 | Low | 2-3주 | 백엔드 연동 |

---

## 참고 문서

- [API_SPECIFICATION.md](./API_SPECIFICATION.md): API 명세서
- [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md): 프로젝트 구조
- [SETUP_GUIDE.md](./SETUP_GUIDE.md): 설치 및 실행 가이드
- [DATABASE_SETUP.md](./DATABASE_SETUP.md): 데이터베이스 설정 가이드

---

## 업데이트 이력

- 2025-11-28: 최종 리팩토링 계획서 작성 및 설명용 문서 통합
- 2025-11-28: Phase 4 추가 (프로덕션 배포 및 시계열+마르코프 체인 모델 구현)
  - 시계열 분석 모듈 구현 계획
  - 마르코프 체인 모델 구현 계획
  - 프로덕션 웹 애플리케이션 배포 계획
  - 전체 파이프라인 최종 검증 계획
