# Mood Manager 통합 가이드 문서

## 개요

이 문서는 Mood Manager 프로젝트의 리팩토링, 구현 상태, 테스트 가이드, 배포 체크리스트를 통합한 종합 가이드입니다.

**최종 업데이트**: 2024년 12월  
**상태**: ✅ Phase 2 구현 완료, 목업 모드 최적화 완료, 빌드 성공 확인

---

## 목차

1. [네트워크 아키텍처](#네트워크-아키텍처)
2. [리팩토링 검토 및 기능 유효성 검증](#리팩토링-검토-및-기능-유효성-검증)
3. [현재 구현 상태](#현재-구현-상태)
4. [Phase 2 구현 완료 사항](#phase-2-구현-완료-사항)
5. [목업 모드 아키텍처 및 사용 가이드](#목업-모드-아키텍처-및-사용-가이드)
6. [데이터베이스 스키마](#데이터베이스-스키마)
7. [테스트 가이드](#테스트-가이드)
8. [배포 전 체크리스트](#배포-전-체크리스트)
9. [코드 품질 및 개선 사항](#코드-품질-및-개선-사항)

---

## 네트워크 아키텍처

### 인프라 구조

```
┌─────────────────────────────────────────────────────────┐
│                    AWS 내부 네트워크                      │
│                                                         │
│  ┌──────────┐      ┌──────────┐      ┌──────────┐     │
│  │   DB     │◄────►│   Web    │◄────►│  Python  │     │
│  │          │      │  :3000   │      │  :5000   │     │
│  │(RDS/등)   │      │ (Next.js) │      │(시계열+    │     │
│  └──────────┘      └──────────┘      │  마르코프)  │     │
│                                        └──────────┘     │
│                                                         │
└─────────────────────────────────────────────────────────┘
                    ▲                    │
                    │                    │
            내부 통신              외부 통신 필요
                    │                    │
                    │                    ▼
            ┌───────┴────────┐   ┌──────────┐
            │  AWS 내부      │   │    ML    │
            │  서비스 간     │   │  Python  │
            │  통신          │   │  서버    │
            └────────────────┘   └──────────┘
```

### 통신 규칙

#### 1. AWS 내부 네트워크 통신
- **Web 서버 (포트 3000) ↔ Python 서버 (포트 5000)**: 내부 통신
- **Web 서버 ↔ DB**: 내부 통신
- **Python 서버 ↔ DB**: 내부 통신 (직접 연결 가능)

**설정:**
- 내부 프라이빗 IP 또는 내부 DNS 사용
- 보안 그룹에서 내부 통신 허용
- `PYTHON_SERVER_URL`은 내부 주소로 설정 (예: `http://python-service:5000`)

#### 2. 외부 통신
- **ML Python 서버**: 외부에서 접근 가능해야 함
- **목적**: ML 서버가 웹 앱의 `/api/ml/emotion-counts` 엔드포인트 호출

**설정:**
- 웹 앱은 공개 엔드포인트 제공 (ALB, API Gateway 등)
- ML 서버는 외부 IP 또는 도메인으로 접근
- API 키 기반 인증으로 보안 유지

### 환경 변수 구성

```env
# AWS 내부 네트워크 (Python 시계열+마르코프 서버)
PYTHON_SERVER_URL=http://python-service:5000
# 또는 내부 프라이빗 IP
# PYTHON_SERVER_URL=http://10.0.1.100:5000
PYTHON_SERVER_TIMEOUT=30000

# 외부 통신 (ML 서버용)
ML_API_KEY=your-secure-api-key-here
NEXT_PUBLIC_BASE_URL=https://your-web-app-domain.com

# 데이터베이스 (AWS 내부)
DATABASE_URL=postgresql://postgres:moodmanagerrds@mood-manager-db.cd4iisicagg0.ap-northeast-2.rds.amazonaws.com:5432/postgres?sslmode=require

# OpenAI
OPENAI_API_KEY=sk-...
```

### 네트워크 보안 고려사항

1. **내부 통신 보안**
   - AWS VPC 내부 통신은 자동으로 암호화되지 않음
   - 민감한 데이터는 HTTPS 또는 내부 TLS 사용 권장
   - 보안 그룹 규칙으로 불필요한 포트 차단

2. **외부 통신 보안**
   - ML 서버 인증: API 키 기반 (`x-ml-api-key` 헤더)
   - 웹 앱 인증: 세션 기반 (`requireAuth()`)
   - HTTPS 필수

3. **포트 관리**
   - 웹 서버: 3000 (내부), 80/443 (외부 - ALB)
   - Python 서버: 5000 (내부만)
   - DB: 기본 포트 (내부만)

---

## 리팩토링 검토 및 기능 유효성 검증

### 완료된 개선 사항

#### 1. 타입 정의 통합 ✅
- `PythonPredictionResponse` 타입을 `lib/prediction/types.ts`로 통합
- 중복 타입 정의 제거
- 모든 파일에서 일관된 타입 사용

#### 2. 감정 카운터 저장소 개선 ✅
- 원자적 연산으로 변경 (`getAndResetEmotionCounts`)
- 음수 값 방지 (`Math.max(0, value)`)
- 메모리 기반 저장소 구현 (향후 Redis 마이그레이션 가능)

#### 3. ML 서버 API 인증 ✅
- API 키 기반 인증 추가 (`x-ml-api-key` 헤더)
- 환경 변수 `ML_API_KEY` 필수 검증

#### 4. Python 서버 통신 개선 ✅
- 타임아웃 처리 추가 (`AbortController`)
- 환경 변수 필수 검증
- 에러 핸들링 강화

#### 5. Python 응답 검증 개선 ✅
- 상세 로그 추가 (값과 타입)
- 디버깅 용이성 향상

### 데이터 흐름

```
1. ML 서버 → POST /api/ml/emotion-counts
   → addEmotionCounts()로 누적
   
2. 사용자 요청 → GET /api/preprocessing
   → getEmotionCounts()로 조회 (클렌징 안함)
   
3. 무드스트림 생성 → POST /api/ai/background-params
   → getAndResetEmotionCounts()로 조회 및 클렌징
   → Python 서버 호출
   → LLM 프롬프팅
```

### 테스트 시나리오

#### 시나리오 1: 정상 플로우
1. ML 서버에서 감정 카운트 전송 (laughter: 5, sigh: 3, crying: 2)
2. 전처리 API 호출 → emotionCounts 확인
3. 무드스트림 생성 → Python 서버 호출 → 카운터 클렌징
4. 다시 전처리 API 호출 → emotionCounts가 0인지 확인

#### 시나리오 2: Python 서버 다운
1. Python 서버 다운 상태
2. 무드스트림 생성 요청
3. Fallback으로 기존 프롬프트 방식 사용 확인
4. 카운터는 클렌징되지 않음 확인

---

## 현재 구현 상태

### ✅ 완료된 구현

#### 1. 데이터베이스 구조 및 연결
- **Prisma 스키마**: 완전히 정의됨 (`Web/prisma/schema.prisma`)
  - User, Device, Preset, Fragrance, Light, Sound, UserPreferences, Inquiry, PasswordResetToken 모델
  - ✅ **PostgreSQL 데이터베이스로 변경 완료** (기존 MySQL에서 전환)
  - ✅ **User 모델에 `isAdmin` 필드 추가 완료** (어드민 설정을 DB에 저장)
  - ✅ **Genre, ScentPreference, GenrePreference 모델 추가 완료** (Phase 2)
  - 관계형 데이터 구조 완성
- **Prisma Client**: 초기화 및 싱글톤 패턴 구현 (`Web/src/lib/prisma.ts`)
- **DB 연결 정보**: AWS RDS PostgreSQL 인스턴스 제공됨
  - Host: `mood-manager-db.cd4iisicagg0.ap-northeast-2.rds.amazonaws.com`
  - Port: `5432`
  - User: `postgres`
  - Password: `moodmanagerrds`

#### 2. Firebase 연결 및 데이터 파이프라인
- **Firebase Client SDK**: 초기화 완료
- **Firebase Admin SDK**: 초기화 완료
- **데이터 조회 로직**: 구현 완료
  - `fetchTodayPeriodicRaw`: 오늘 날짜 생체 데이터 조회
  - `periodicListener`: 실시간 데이터 리스너
  - `preprocessing/route.ts`: 전처리 API에서 Firebase 데이터 사용

#### 3. 데이터 파이프라인 연결
- **전처리 API**: 구현 완료
  - Firebase에서 생체 데이터 조회
  - 스트레스 지수 계산
  - 수면 점수 계산
  - 날씨 정보 조회
  - 감정 카운터 조회
- **ML 서버 통신**: 구현 완료
  - `/api/ml/emotion-counts`: ML 서버에서 감정 카운트 전송 API
  - 감정 카운터 누적 및 클렌징 로직
- **Python 서버 통신**: 구현 완료
  - `PythonEmotionPredictionProvider`: Python 시계열+마르코프 서버 통신
  - REST API 기반 통신
  - 타임아웃 및 에러 핸들링

#### 4. 디바이스 관리 (DB 레벨)
- **디바이스 API**: 구현 완료
  - `GET /api/devices`: 디바이스 목록 조회
  - `POST /api/devices`: 디바이스 생성
  - `DELETE /api/devices/[deviceId]`: 디바이스 삭제
  - `PUT /api/devices/[deviceId]/power`: 전원 제어
  - `PUT /api/devices/[deviceId]/scent-level`: 향 레벨 제어
  - `PUT /api/devices/[deviceId]/scent-interval`: 향 간격 제어
- **무드 적용 API**: 구현 완료
  - `PUT /api/moods/current/color`: 조명 색상 변경
  - `PUT /api/moods/current/scent`: 향 변경
  - `PUT /api/moods/current/song`: 음악 변경
- **디바이스 상태 관리**: DB에 저장 및 조회 완료

### ❌ 미구현 항목

#### 1. 실제 디바이스 연결 (하드웨어 통신)
**현재 상태:**
- 디바이스 제어는 DB에만 저장됨
- 실제 Philips Wiz 또는 기타 스마트 기기와의 통신 없음
- UI에서 디바이스 제어는 가능하나 실제 기기 반영 안됨

**필요한 구현:**
- [ ] **Philips Wiz API 통합** (Philips Hue가 아닌 Wiz 제품 라인업)
  - Wiz 스마트 전구는 Hue Bridge 없이 Wi-Fi로 직접 연결
  - 역공학을 통한 API 분석 필요
  - 조명 제어 API 호출 (색상, 밝기, 온도)
  - 디바이스 상태 동기화

#### 2. 데이터베이스 마이그레이션 및 스키마 보수
**현재 상태:**
- Prisma 스키마는 정의되어 있으나 마이그레이션 미실행
- 프로덕션 DB 스키마 적용 필요

**필요한 작업:**
- [ ] 개발 환경 마이그레이션 실행
- [ ] 프로덕션 마이그레이션 계획 수립
- [ ] 스키마 변경 시 마이그레이션 전략 수립

#### 3. 데이터 파이프라인 통합 테스트
**필요한 작업:**
- [ ] End-to-End 테스트 시나리오 작성
- [ ] 각 단계별 데이터 검증
- [ ] 에러 시나리오 테스트

---

## Phase 2 구현 완료 사항

### 목표
1. ✅ 선호도 가중치 시스템 구현
2. ✅ 하트 클릭 기능 (더블클릭, 가중치 +1)
3. ✅ 별표 (무드 저장) 기능 및 UI 개선

### 구현 완료 내역

#### 1. 선호도 가중치 시스템 ✅

**구현 내용:**
- Fragrance & Genre 시드 데이터 생성 (16개 향, 10개 장르)
- 사용자 생성 시 초기 가중치 +1 부여
- 설문 완료 시 가중치 저장 (호 +10, 불호 +1)
- 가중치 정규화 및 LLM 프롬프트 반영

**가중치 규칙:**
1. **초기값**: 모든 사용자에게 모든 Fragrance와 Genre에 기본적으로 +1 가중치로 시작
2. **설문 완료 시**:
   - 호 (초록색 유지): 가중치 +10
   - 불호 (초록색 끔): 가중치 +1 (최소값 1 유지)
3. **하트 클릭**: 1회당 +1 증가
4. **정규화**: 모든 가중치를 합산하여 분모로 사용, 소수점으로 정규화 (합 = 1)

**설문 데이터:**
- **향 옵션 (16개)**: "Citrus", "Floral", "Woody", "Fresh", "Spicy", "Sweet", "Herbal", "Fruity", "Musk", "Aromatic", "Honey", "Green", "Dry", "Leathery", "Marine", "Powdery"
- **음악 장르 옵션 (10개)**: "newage", "classical", "jazz", "ambient", "nature", "meditation", "piano", "guitar", "orchestral", "electronic"

**구현 파일:**
- `Web/src/lib/db/seedFragrancesAndGenres.ts`: 시드 데이터 생성
- `Web/src/lib/auth/createDefaultUserSetup.ts`: 초기 가중치 부여
- `Web/src/app/api/preferences/route.ts`: 설문 완료 시 가중치 저장
- `Web/src/lib/preferences/normalizeWeights.ts`: 가중치 정규화
- `Web/src/lib/preferences/getUserPreferenceWeights.ts`: 가중치 조회
- `Web/src/lib/llm/optimizePromptForPython.ts`: LLM 프롬프트에 가중치 포함

#### 2. 하트 클릭 기능 ✅

**구현 내용:**
- 무드 대시보드 더블클릭 이벤트 추가
- 하트 애니메이션 컴포넌트 구현
- API 엔드포인트 생성: `POST /api/preferences/heart`
- 가중치 +1 업데이트

**동작:**
- 무드 대시보드 영역 더블클릭 시 하트 애니메이션 표시
- 현재 세그먼트의 향과 장르에 가중치 +1 적용
- API 호출하여 서버에 가중치 업데이트 요청

**구현 파일:**
- `Web/src/app/(main)/home/components/MoodDashboard/MoodDashboard.tsx`: 더블클릭 이벤트
- `Web/src/app/(main)/home/components/MoodDashboard/hooks/useHeartAnimation.ts`: 하트 애니메이션 로직
- `Web/src/app/api/preferences/heart/route.ts`: API 엔드포인트

#### 3. 별표 (무드 저장) 기능 ✅

**구현 내용:**
- 무드 대시보드에 별표 버튼 추가
- 무드 저장 API 수정: `POST /api/moods/saved`
- 무드셋 페이지 레이아웃 변경 (2*3 → 1*3)
- 저장된 무드 더블클릭 시 확인 모달 및 세그먼트 대체
- 무드 적용 API 엔드포인트 생성: `POST /api/moods/saved/[savedMoodId]/apply`

**동작:**
1. **별표 클릭**: 즉시 반영 (확인 모달 없음)
   - 무드 저장 API 호출
   - 무드셋 페이지에 즉시 표시
2. **별표 취소**: 별표 다시 클릭 시 취소
   - 무드 삭제 API 호출
3. **무드셋에서 삭제**: 삭제 버튼 클릭
   - 확인 모달 표시 후 삭제
4. **저장된 무드 더블클릭**: 
   - 확인 메시지: "현재 세그먼트를 대체하시겠습니까?"
   - 확인 시: 현재 세그먼트를 저장된 무드로 대체

**UI 변경:**
- 무드셋 페이지: 2*3 그리드 → 1*3 구조
- 각 블록을 가로로 3분할하여 세그먼트 정보 표시

**구현 파일:**
- `Web/src/app/(main)/home/components/MoodDashboard/hooks/useMoodDashboard.ts`: 별표 저장 로직
- `Web/src/app/api/moods/saved/route.ts`: 무드 저장 API
- `Web/src/app/api/moods/saved/[savedMoodId]/route.ts`: 무드 삭제 API
- `Web/src/app/api/moods/saved/[savedMoodId]/apply/route.ts`: 무드 적용 API
- `Web/src/app/(main)/mood/page.tsx`: 무드셋 페이지 레이아웃 변경

---

## 목업 모드 아키텍처 및 사용 가이드

### 관리자 계정 정보

- **이메일**: `admin@moodmanager.com`
- **비밀번호**: `admin1234`

### 목업 모드 동작 방식

#### 1. 인증 및 세션
- 관리자 계정으로 로그인 시 자동으로 목업 모드 활성화
- `isMockMode()` 함수가 DB에서 `isAdmin` 플래그 조회 (DB 연결 실패 시 이메일 기반 폴백)
- 모든 API 엔드포인트에서 `checkMockMode()`로 확인

#### 2. 현재 구조 (최적화 완료) ✅

**프론트엔드 처리:**
- `session?.user?.email === ADMIN_EMAIL`로 확인
- 목업 모드일 경우:
  - **무드 저장**: `localStorage`에 저장 후 API 호출 스킵
  - **무드 조회**: `localStorage`에서 조회 후 API 호출 스킵
  - **무드 삭제**: `localStorage`에서 삭제 후 API 호출 스킵
  - **무드 적용**: `localStorage`에서 조회 후 API 호출 스킵

**백엔드 처리:**
- `checkMockMode(session)` 확인
- 목업 모드일 경우:
  - **설문/하트 클릭**: 목업 응답 반환 (`{ success: true, mock: true }`)
  - **데이터 조회**: 목업 데이터 반환
  - Console에 로그 출력

**최적화 완료:**
- ✅ 프론트엔드에서 목업 모드일 경우 API 호출 스킵 (무드 저장/조회/삭제/적용)
- ✅ 불필요한 API 호출 제거
- ✅ 네트워크 트래픽 감소

### Phase 2 기능별 목업 모드 동작

#### 1. 설문 완료 시 가중치 저장

**API**: `POST /api/preferences`

**목업 모드 동작**:
- ✅ API 호출 성공 응답 반환 (`{ success: true, mock: true }`)
- ✅ Console에 설문 데이터 로그 출력
- ❌ 실제 DB 저장 없음 (의도된 동작)

**테스트 방법**:
1. 설문 팝업에서 호/불호 선택
2. 설문 완료 버튼 클릭
3. Network 탭에서 `POST /api/preferences` 호출 확인
4. Console에서 `[POST /api/preferences] 목업 모드` 로그 확인
5. 응답이 `{ success: true, mock: true }`인지 확인

#### 2. 하트 클릭 기능

**API**: `POST /api/preferences/heart`

**목업 모드 동작**:
- ✅ API 호출 성공 응답 반환 (`{ success: true, mock: true }`)
- ✅ Console에 하트 클릭 데이터 로그 출력 (fragranceName, genreName)
- ❌ 실제 DB 저장 없음 (의도된 동작)

**테스트 방법**:
1. 무드 대시보드 영역 더블클릭
2. 하트 애니메이션 확인
3. Network 탭에서 `POST /api/preferences/heart` 호출 확인
4. Console에서 `[POST /api/preferences/heart] 목업 모드` 로그 확인
5. 요청 본문에 `fragranceName`, `genreName` 포함 확인

#### 3. 별표 (무드 저장) 기능

**API**: `POST /api/moods/saved`

**목업 모드 동작**:
- ✅ 프론트엔드에서 `localStorage`에 저장 (API 호출 스킵)
- ✅ Console에 저장 데이터 로그 출력 (클라이언트 측)
- ❌ 서버 DB 저장 없음

**테스트 방법**:
1. 무드 대시보드 우측 상단 별표 버튼 클릭
2. 별표가 노란색으로 채워지는지 확인
3. Network 탭에서 API 호출이 없는지 확인 (목업 모드 최적화)
4. 무드셋 페이지에서 저장된 무드 확인 (localStorage에서 조회)

#### 4. 무드셋 페이지 조회

**API**: `GET /api/moods/saved`

**목업 모드 동작**:
- ✅ 프론트엔드에서 `localStorage`에서 조회 (API 호출 스킵)
- ✅ 샘플 데이터 자동 초기화 (`initializeSampleMoods()`)
- ❌ 서버 DB 조회 없음

**테스트 방법**:
1. 무드셋 페이지 접속
2. Network 탭에서 API 호출이 없는지 확인 (목업 모드 최적화)
3. 클라이언트에서 localStorage에서 무드 목록 조회 확인

#### 5. 가중치 조회 및 LLM 프롬프트 반영

**함수**: `getUserScentWeights()`, `getUserGenreWeights()`, `formatPreferenceWeightsForLLM()`

**목업 모드 동작**:
- ✅ 목업 가중치 데이터 반환 (설문 완료 가정)
- ✅ 정규화된 가중치 계산
- ✅ LLM 프롬프트에 가중치 포함

**목업 가중치 데이터**:
```typescript
// 향 가중치 (호: 0.3, 불호: 0.05)
Citrus: 0.3, Floral: 0.2, Woody: 0.15, Fresh: 0.1, ...
Spicy: 0.05, Dry: 0.05, Leathery: 0.05

// 장르 가중치 (호: 0.4, 불호: 0.05)
newage: 0.4, classical: 0.2, jazz: 0.15, ambient: 0.1, ...
guitar: 0.05, orchestral: 0.05
```

**테스트 방법**:
1. 무드스트림 생성 시 Console에서 LLM 프롬프트 확인
2. `[USER PREFERENCE WEIGHTS]` 섹션 확인
3. 목업 가중치가 정규화되어 표시되는지 확인
4. 높은 가중치 항목이 우선적으로 표시되는지 확인

### 전체 테스트 시나리오

#### 시나리오 1: 설문 완료 → 하트 클릭 → 별표 저장

1. **로그인**
   - `admin@moodmanager.com` / `admin1234`로 로그인
   - Console에서 `[NextAuth] Admin account detected` 확인

2. **설문 완료**
   - 설문 팝업에서 호/불호 선택
   - 설문 완료 버튼 클릭
   - Network: `POST /api/preferences` 성공 확인
   - Console: `[POST /api/preferences] 목업 모드` 로그 확인

3. **하트 클릭**
   - 무드 대시보드 더블클릭
   - 하트 애니메이션 확인
   - Network: `POST /api/preferences/heart` 성공 확인
   - Console: `[POST /api/preferences/heart] 목업 모드` 로그 확인

4. **별표 저장**
   - 별표 버튼 클릭
   - Network: API 호출 없음 확인 (목업 모드 최적화)
   - Console: 클라이언트 측 로그 확인
   - 무드셋 페이지에서 저장된 무드 확인 (localStorage)

5. **LLM 프롬프트 확인**
   - 무드스트림 생성
   - Console에서 LLM 프롬프트 확인
   - `[USER PREFERENCE WEIGHTS]` 섹션에 목업 가중치 포함 확인

### 알려진 제한사항

1. **DB 저장 없음**
   - 모든 저장 요청은 성공 응답만 반환
   - 실제 DB에 데이터가 저장되지 않음

2. **가중치 업데이트 없음**
   - 설문 완료나 하트 클릭 시 가중치가 실제로 업데이트되지 않음
   - 목업 가중치 데이터는 고정값 사용

3. **무드 저장은 localStorage**
   - 무드 저장은 클라이언트의 localStorage에 저장
   - 서버 재시작 시에도 유지됨 (브라우저 저장)

---

## 데이터베이스 스키마

### ERD (Entity Relationship Diagram)

```mermaid
erDiagram
    User ||--o{ Device : "has"
    User ||--o{ Preset : "creates"
    User ||--o| UserPreferences : "has"
    User ||--o{ Inquiry : "writes"
    User ||--o{ ScentPreference : "has"
    User ||--o{ GenrePreference : "has"
    
    Device }o--|| Preset : "uses"
    
    Preset }o--|| Fragrance : "uses"
    Preset }o--|| Light : "uses"
    Preset }o--|| Sound : "uses"
    
    Sound }o--o| Genre : "belongs to"
    
    Fragrance ||--o{ ScentPreference : "has"
    Genre ||--o{ GenrePreference : "has"
    
    User {
        string id PK
        string email UK
        string password
        string phone UK
        string familyName
        string givenName
        datetime birthDate
        string gender
        string profileImageUrl
        string provider
        string providerId UK
        boolean hasSurvey
        boolean isAdmin
        datetime createdAt
        datetime updatedAt
    }
    
    Device {
        string id PK
        string userId FK
        string name
        string type
        enum status
        datetime registeredAt
        boolean isConnected
        boolean power
        int battery
        int brightness
        string color
        int temperature
        string scentType
        int scentLevel
        int scentInterval
        int volume
        string nowPlaying
        string externalDeviceId
        string currentPresetId FK
    }
    
    Preset {
        string id PK
        string userId FK
        int fragranceId FK
        int lightId FK
        int soundId FK
        string name
        string cluster
        boolean isDefault
        boolean isStarred
        datetime createdAt
        datetime updatedAt
        string updatedType
    }
    
    Fragrance {
        int id PK
        string name
        string description
        string color
        int intensityLevel
        int operatingMin
        json componentsJson
    }
    
    Light {
        int id PK
        string name
        string color
        int brightness
        int temperature
        json rgb
    }
    
    Sound {
        int id PK
        string name
        string fileUrl
        int duration
        int genreId FK
        json componentsJson
    }
    
    Genre {
        int id PK
        string name UK
        string description
        datetime createdAt
    }
    
    UserPreferences {
        int id PK
        string userId FK UK
        string scentLiked
        string scentDisliked
        string colorLiked
        string colorDisliked
        string musicLiked
        string musicDisliked
        datetime createdAt
        datetime updatedAt
    }
    
    ScentPreference {
        int id PK
        string userId FK
        int scentId FK
        int weight
        datetime createdAt
        datetime updatedAt
    }
    
    GenrePreference {
        int id PK
        string userId FK
        int genreId FK
        int weight
        datetime createdAt
        datetime updatedAt
    }
    
    Inquiry {
        int id PK
        string userId FK
        string subject
        text message
        string status
        text answer
        string answeredBy
        datetime answeredAt
        datetime createdAt
    }
    
    PasswordResetToken {
        int id PK
        string email
        string code
        string token UK
        datetime expiresAt
        boolean used
        datetime createdAt
    }
```

### 주요 테이블 설명

#### User
- 사용자 기본 정보 및 인증 정보
- `isAdmin`: 관리자 여부 (목업 모드 확인용)

#### Device
- 사용자 디바이스 정보
- `isConnected`: 디바이스 연결 상태
- `power`: 전원 상태
- `temperature`: 조명 온도 (Kelvin)
- `externalDeviceId`: 외부 디바이스 ID (예: Philips Wiz)

#### Preset
- 무드 프리셋 정보
- `isStarred`: 별표 저장 여부 (Phase 2)

#### Fragrance
- 향 종류 정보 (16개)
- Phase 2 시드 데이터 포함

#### Genre
- 음악 장르 정보 (10개)
- Phase 2 시드 데이터 포함

#### ScentPreference
- 사용자별 향 선호도 가중치 (Phase 2)
- `weight`: 가중치 (초기값 1, 설문 +10, 하트 +1)

#### GenrePreference
- 사용자별 장르 선호도 가중치 (Phase 2)
- `weight`: 가중치 (초기값 1, 설문 +10, 하트 +1)

---

## 테스트 가이드

### Phase 2 기능 테스트 체크리스트

#### 테스트 전 준비사항

**환경 확인:**
- [ ] 개발 서버 실행 (`npm run dev`)
- [ ] 관리자 계정으로 로그인
  - 이메일: `admin@moodmanager.com`
  - 비밀번호: `admin1234`
- [ ] Console에서 `[NextAuth] Admin account detected` 확인
- [ ] 브라우저 개발자 도구 열기 (Network, Console 탭)

**목업 모드 확인:**
- [ ] 모든 API 응답에 `mock: true` 포함 확인 (설문/하트 클릭)
- [ ] 무드 저장/조회 시 API 호출 없음 확인 (목업 모드 최적화)
- [ ] Console에 `[목업 모드]` 로그 출력 확인

#### 1. 설문 완료 시 가중치 저장 기능

**테스트 시나리오:**
1. **설문 팝업 표시 확인**
   - [ ] 홈 화면 접속 시 설문 팝업이 표시되는지 확인
   - [ ] 향 선택 단계에서 16개 향이 모두 초록색으로 표시되는지 확인
   - [ ] 음악 장르 선택 단계에서 10개 장르가 모두 초록색으로 표시되는지 확인

2. **호/불호 선택 테스트**
   - [ ] 향 더블클릭 시 회색으로 변하고 아래로 이동하는지 확인
   - [ ] 회색 항목 다시 더블클릭 시 초록색으로 복구되는지 확인
   - [ ] 음악 장르도 동일하게 동작하는지 확인

3. **설문 완료 및 API 호출 확인**
   - [ ] 설문 완료 버튼 클릭
   - [ ] Network 탭에서 `POST /api/preferences` 호출 확인
   - [ ] 요청 본문에 `scentLiked`, `scentDisliked`, `musicLiked`, `musicDisliked` 배열이 포함되는지 확인
   - [ ] 응답이 `{ success: true, mock: true }`인지 확인

4. **가중치 저장 로직 확인 (Console 로그)**
   - [ ] Console에서 `[POST /api/preferences] 목업 모드` 로그 확인
   - [ ] 설문 데이터가 Console에 로그로 출력되는지 확인

**예상 결과:**
- 설문 완료 시 API 호출 성공
- Console에 설문 데이터 로그 출력
- (DB 마이그레이션 후) 실제 DB에 `ScentPreference`, `GenrePreference` 데이터 저장 확인

#### 2. 하트 클릭 기능 (더블클릭)

**테스트 시나리오:**
1. **하트 애니메이션 확인**
   - [ ] 무드 대시보드 영역 더블클릭
   - [ ] 클릭한 위치에 하트 2개가 위로 올라가며 사라지는 애니메이션 확인
   - [ ] 애니메이션이 1.2초 후 사라지는지 확인

2. **API 호출 확인**
   - [ ] Network 탭에서 `POST /api/preferences/heart` 호출 확인
   - [ ] 요청 본문에 `fragranceName`, `genreName`이 포함되는지 확인
   - [ ] 현재 세그먼트의 향/장르 정보가 올바르게 전달되는지 확인
   - [ ] 응답이 `{ success: true, mock: true }`인지 확인

3. **가중치 업데이트 확인 (Console 로그)**
   - [ ] Console에서 `[POST /api/preferences/heart] 목업 모드` 로그 확인
   - [ ] 하트 클릭 데이터가 Console에 로그로 출력되는지 확인

**예상 결과:**
- 더블클릭 시 하트 애니메이션 표시
- API 호출 성공
- Console에 하트 클릭 데이터 로그 출력
- (DB 마이그레이션 후) 실제 DB에 가중치 +1 반영 확인

#### 3. 별표 (무드 저장) 기능

**테스트 시나리오:**
1. **별표 버튼 UI 확인**
   - [ ] 무드 대시보드 우측 상단에 별표 버튼이 표시되는지 확인
   - [ ] 별표 버튼 클릭 시 노란색으로 채워지는지 확인
   - [ ] 다시 클릭 시 비워지는지 확인

2. **무드 저장 확인 (목업 모드 최적화)**
   - [ ] 별표 클릭 시 Network 탭에서 API 호출이 없는지 확인 (목업 모드 최적화)
   - [ ] Console에서 클라이언트 측 로그 확인
   - [ ] localStorage에 저장 확인 (개발자 도구 → Application → Local Storage)

3. **무드셋 페이지 확인**
   - [ ] 하단 네비게이션에서 "무드" 탭 클릭
   - [ ] 저장한 무드가 무드셋 페이지에 표시되는지 확인
   - [ ] 레이아웃이 1*3 구조(가로로 3분할)로 표시되는지 확인
   - [ ] 세그먼트 1에 무드 정보가 표시되는지 확인
   - [ ] 세그먼트 2, 3에 "(동일한 무드스트림 내)" placeholder가 표시되는지 확인

4. **무드 삭제 확인**
   - [ ] 무드셋 페이지에서 삭제 버튼(×) 클릭
   - [ ] 삭제 확인 모달이 표시되는지 확인
   - [ ] 확인 시 Network 탭에서 API 호출이 없는지 확인 (목업 모드 최적화)
   - [ ] 무드가 목록에서 제거되는지 확인

5. **무드 적용 확인 (더블클릭)**
   - [ ] 무드셋 페이지에서 저장된 무드 더블클릭
   - [ ] 확인 모달이 표시되는지 확인
   - [ ] 확인 시 Network 탭에서 API 호출이 없는지 확인 (목업 모드 최적화)
   - [ ] 홈 화면으로 이동하는지 확인

**예상 결과:**
- 별표 클릭 시 무드 저장 성공 (localStorage)
- 무드셋 페이지에 저장된 무드 표시
- 1*3 레이아웃으로 정상 표시
- 삭제 및 적용 기능 정상 동작

#### 4. 가중치 정규화 및 LLM 프롬프트 반영

**테스트 시나리오:**
1. **LLM 프롬프트 확인 (Console 로그)**
   - [ ] 무드스트림 생성 시 Console에서 LLM 프롬프트 확인
   - [ ] 프롬프트에 `[USER PREFERENCE WEIGHTS]` 섹션이 포함되는지 확인
   - [ ] `Fragrance Preferences` 섹션에 정규화된 가중치가 표시되는지 확인
   - [ ] `Genre Preferences` 섹션에 정규화된 가중치가 표시되는지 확인
   - [ ] 가중치가 높은 항목이 우선적으로 표시되는지 확인

2. **가중치 정규화 확인**
   - [ ] 모든 가중치의 합이 1.0 (100%)인지 확인
   - [ ] 가중치가 높은 순으로 정렬되어 있는지 확인

**예상 결과:**
- LLM 프롬프트에 사용자 선호도 가중치 포함
- 가중치가 정규화되어 표시
- 높은 가중치를 가진 항목이 우선적으로 추천

#### 5. 무드셋 페이지 레이아웃 변경

**테스트 시나리오:**
1. **레이아웃 구조 확인**
   - [ ] 무드셋 페이지 접속
   - [ ] 저장된 무드가 가로로 긴 카드 형태로 표시되는지 확인
   - [ ] 각 카드가 가로로 3분할되어 있는지 확인
   - [ ] 세그먼트 1, 2, 3이 구분되어 표시되는지 확인

2. **반응형 확인**
   - [ ] 모바일 화면에서 레이아웃이 깨지지 않는지 확인
   - [ ] 카드 내 텍스트가 잘리지 않고 표시되는지 확인

**예상 결과:**
- 2*3 그리드에서 1*3 구조로 변경 확인
- 각 블록이 가로로 3분할되어 표시
- 반응형 레이아웃 정상 동작

---

## 배포 전 체크리스트

### ✅ 로컬에서 처리 가능한 작업 (완료)

#### 1. checkMockMode async 변경 적용 ✅
- ✅ 모든 `checkMockMode()` 호출에 `await` 추가 완료 (13개 파일)
- ✅ 타입 오류 수정 완료
- ✅ 빌드 성공 확인

#### 2. 타입 오류 및 린트 오류 수정 ✅
- ✅ 모든 타입 오류 해결
- ✅ ESLint 오류 수정
- ✅ 빌드 성공 확인

#### 3. 목업 모드 최적화 ✅
- ✅ 프론트엔드에서 목업 모드일 경우 API 호출 스킵
- ✅ 불필요한 API 호출 제거
- ✅ 네트워크 트래픽 감소

#### 4. Phase 2 구현 완료 ✅
- ✅ 선호도 가중치 시스템 구현
- ✅ 하트 클릭 기능 구현
- ✅ 별표 저장 기능 구현
- ✅ 무드 적용 API 엔드포인트 생성

### ⚠️ AWS EC2에서 처리해야 하는 작업

#### 1. 데이터베이스 마이그레이션 (필수)

**이유**: 로컬에서 AWS RDS에 접근 불가 (보안 그룹 또는 내부 네트워크 전용)

**작업 순서:**

1. **EC2 인스턴스 접속**
   ```bash
   ssh -i your-key.pem ec2-user@your-ec2-ip
   ```

2. **프로젝트 클론 및 설정**
   ```bash
   git clone <repository-url>
   cd mood-manager/Web
   npm install
   ```

3. **환경 변수 설정**
   ```bash
   # .env 파일 생성
   nano .env
   ```
   
   ```env
   DATABASE_URL="postgresql://postgres:moodmanagerrds@mood-manager-db.cd4iisicagg0.ap-northeast-2.rds.amazonaws.com:5432/postgres?sslmode=require"
   # 기타 환경 변수들...
   ```

4. **데이터베이스 이름 확인**
   ```bash
   psql -U postgres -h mood-manager-db.cd4iisicagg0.ap-northeast-2.rds.amazonaws.com -p 5432
   # 비밀번호: moodmanagerrds
   \l
   ```

5. **마이그레이션 실행**
   ```bash
   npx prisma migrate deploy
   npx prisma generate
   ```

6. **어드민 계정 설정**
   ```sql
   UPDATE "User" SET "isAdmin" = true WHERE email = 'admin@moodmanager.com';
   ```

#### 2. 전체 파이프라인 테스트

**테스트 항목:**
- [ ] DB 연결 테스트
- [ ] Firestore 연결 테스트
- [ ] Python 서버 통신 테스트 (포트 5000)
- [ ] ML 서버 통신 테스트
- [ ] 전체 데이터 파이프라인 테스트:
  - WearOS → Firebase → ML 서버 → Web App → Python 서버 → LLM

#### 3. 네트워크 설정 확인

**확인 사항:**
- [ ] 보안 그룹 설정 확인
- [ ] 내부 네트워크 통신 확인 (Web ↔ Python 서버)
- [ ] 외부 통신 확인 (ML 서버 → Web API)
- [ ] 포트 설정 확인 (3000, 5000)

#### 4. 환경 변수 설정

**필수 환경 변수:**
```env
# Database
DATABASE_URL="postgresql://..."

# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
FIREBASE_ADMIN_CREDENTIALS=...

# Python Server
PYTHON_SERVER_URL=http://python-service:5000
PYTHON_SERVER_TIMEOUT=30000

# ML Server
ML_API_KEY=...

# OpenAI
OPENAI_API_KEY=...

# NextAuth
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=...
```

### 📋 배포 전 최종 체크리스트

#### 로컬 작업 완료 확인
- [x] checkMockMode async 변경 완료 ✅
- [x] 린터 오류 없음 확인 ✅
- [x] 빌드 성공 확인 ✅
- [x] 목업 모드 최적화 완료 ✅
- [x] Phase 2 구현 완료 ✅
- [ ] Firestore 연결 테스트 완료 (가능한 경우)

#### AWS 배포 준비
- [ ] EC2 인스턴스 준비
- [ ] 환경 변수 목록 정리
- [ ] 배포 스크립트 준비 (선택)
- [ ] 롤백 계획 수립

#### 배포 후 확인
- [ ] DB 마이그레이션 성공
- [ ] 모든 API 엔드포인트 정상 동작
- [ ] 데이터 파이프라인 정상 동작
- [ ] 에러 로그 모니터링

---

## 코드 품질 및 개선 사항

### ✅ 완료된 작업

#### 1. 타입 오류 수정 ✅
- ✅ `musicHandler.ts`: `emotionEvents` 기본값 제공
- ✅ `scentHandler.ts`: `emotionEvents` 기본값 제공
- ✅ `streamHandler.ts`: `emotionEvents` 기본값 제공
- ✅ `LLMEmotionPredictionProvider.ts`: `emotionEvents` 기본값 제공
- ✅ `PythonFileBasedProvider.ts`: `emotionEvents` 기본값 제공
- ✅ Prisma 클라이언트 재생성 (`npx prisma generate`)

#### 2. JSX 문법 오류 수정 ✅
- ✅ `mood/page.tsx`: 중복된 닫는 태그 제거 및 들여쓰기 정리

#### 3. 코드 통일성 개선 ✅
- ✅ `seedFragrancesAndGenres.ts`: 불필요한 console.log 제거
- ✅ `optimizePromptForPython.ts`: 사용하지 않는 매개변수에 `_` prefix 추가

#### 4. 임포트 경로 통일 ✅
- ✅ 모든 파일에서 일관된 import 경로 사용 확인

#### 5. 빌드 성공 ✅
- ✅ 모든 타입 오류 해결
- ✅ Next.js 빌드 성공 확인

### ⚠️ 향후 개선 사항

#### 단기 (1-2주)
1. **DB 마이그레이션**: PostgreSQL 마이그레이션 실행 및 데이터 검증
2. **무드 저장 기능 DB 연동**: `Preset.isStarred` 필드 활용하여 실제 DB에 저장
3. **무드셋 페이지 개선**: 세그먼트 2, 3 정보 실제 표시 (현재는 placeholder)

#### 중기 (1개월)
1. **사용하지 않는 코드 정리**: 미사용 변수/임포트 제거
2. **에러 처리 강화**: 모든 API 엔드포인트의 에러 처리 일관성 확보
3. **로깅 개선**: console.log를 구조화된 로깅 시스템으로 전환

#### 장기 (향후)
1. **성능 최적화**: DB 쿼리 최적화, 캐싱 전략 개선
2. **테스트 코드 작성**: 단위 테스트 및 통합 테스트 추가
3. **문서화**: API 문서 및 코드 주석 보완

---

## 알려진 제한사항

### 1. DB 마이그레이션 미완료
- 실제 DB에 데이터가 저장되지 않음
- API는 성공 응답을 반환하지만 실제 저장은 되지 않음
- Console 로그로만 동작 확인 가능

### 2. 무드셋 세그먼트 2, 3 정보
- 현재는 placeholder만 표시
- 향후 3개 세그먼트 전체 저장 기능 구현 필요

### 3. 가중치 조회
- DB 마이그레이션 전까지는 목업 데이터 반환
- LLM 프롬프트에 목업 가중치 포함

### 4. 실제 디바이스 연결
- 디바이스 제어는 DB에만 저장됨
- 실제 Philips Wiz 또는 기타 스마트 기기와의 통신 없음

---

**작성일**: 2024년 12월  
**최종 업데이트**: 2024년 12월  
**상태**: ✅ Phase 2 구현 완료, 목업 모드 최적화 완료, 빌드 성공 확인

