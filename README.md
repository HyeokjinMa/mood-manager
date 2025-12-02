# Mood Manager

### AI-Based Personalized Mood Management System for Smart Homes

**Mood Manager** is an AI-powered service that analyzes biometric signals and audio events from WearOS devices to generate personalized mood streams. The system controls lighting, scents, and sound in smart home environments through a virtual device called the **Manager**.

---

## 아이템 개요

**Mood Manager**는 WearOS 기기에서 수집된 생체 정보(심박수, HRV, 스트레스 지표)와 음성 이벤트(웃음, 한숨, 분노, 슬픔 감지)를 기반으로 사용자의 심리·신체 상태를 분석하고, 이에 최적화된 조명·향기·소리 환경을 추천하는 멀티모달 AI 서비스입니다.

시스템은 **WearOS → Firebase → ML 분석 서버 → Next.js 웹앱 → 감정 예측 (LLM/ML 모델) → 무드 확장 (LLM) → 출력장치 제어** 파이프라인을 기반으로 동작합니다.

### 주요 기능

- **실시간 생체 데이터 수집**: WearOS 기기에서 심박수, HRV, 스트레스 지표를 1분 주기로 수집
- **오디오 이벤트 분류**: ML 모델을 통한 웃음/한숨/분노/슬픔 감지
- **개인화된 무드 생성**: 사용자 선호도와 외부 요인(날씨 등)을 종합하여 10개 세그먼트(30분)의 무드 스트림 생성
- **스마트 홈 제어**: 조명, 향기, 음악을 통합 제어하는 Manager 디바이스 시뮬레이션
- **사용자 인증 및 프로필 관리**: NextAuth 기반 인증, 소셜 로그인(Google, Kakao, Naver), 프로필 관리
- **무드 저장 및 관리**: 생성된 무드 세그먼트 저장, 삭제, 교체 기능

---

## 시스템 아키텍처

### 1. WearOS Layer

- **Kotlin 기반 네이티브 앱**: 웨어러블 기기에 최적화된 애플리케이션
- **Health Services API**: 심박수, HRV, 스트레스 지표, 움직임 데이터를 실시간으로 수집
- **오디오 처리**: AudioRecord를 통해 2초간 음성을 캡처하고, RMS/dBFS를 계산하여 무음 구간을 필터링한 뒤 PCM 데이터를 WAV/Base64로 변환
- **포그라운드 서비스**: 1분 주기의 루프를 통해 백그라운드에서도 안정적으로 데이터를 수집
- **데이터 업로드**: 수집된 생체 및 오디오 데이터를 Firestore의 사용자별 컬렉션에 업로드

### 2. Firebase Layer

- **실시간 데이터 브릿지**: 웨어러블, ML 서버, 웹 앱 간의 데이터 흐름을 중계
- **데이터 구조**:
  - `users/{userId}/raw_periodic/{docId}`: 생체 데이터 (heartRate, HRV, stress 등)
  - `users/{userId}/raw_events/{docId}`: 오디오 이벤트 (Base64 WAV, `ml_processed` 상태)
    - **ML 처리 플로우**: ML 서버가 `ml_processed == 'pending'`인 문서를 조회하여 처리 후 `'completed'`로 업데이트
    - **필수 필드**: `audio_base64`, `timestamp`, `ml_processed`

### 3. ML Python Microservice

- **오디오 분류**: Firestore에 저장된 Base64 WAV 데이터를 수집해 전처리
- **분석**: 파인튜닝된 Wav2Vec2 기반 오디오 모델로 웃음·한숨·소음 이벤트를 고정밀도로 분류
- **결과 반환**: 분석된 이벤트의 타임스탬프와 분류 결과를 웹 애플리케이션으로 전달
- **배포 전략**: 모델을 ONNX 및 양자화를 통해 경량화한 후 Docker 이미지로 패키징하여 AWS Lambda에 서버리스 형태로 배포

### 4. Web Application Layer (Next.js)

- **데이터 수집**: Firestore에서 생체 데이터와 ML 분류가 완료된 오디오 이벤트를 수신
- **전처리**: 생체/음성 데이터를 유효한 수치형 데이터로 전처리하고, 사용자 선호도와 날씨 등 외부 데이터를 결합
- **무드 생성**: 2단계 처리를 통한 무드 생성
  - **1차 처리 (감정 예측)**: 10개의 감정 세그먼트 생성 (30분)
    - **현재**: LLM 기반 예측 (temperature: 0.3, 일관성 필수)
    - **향후**: 시계열 + 마르코프 체인 모델 (LLM 대체, 더 나은 일관성 및 성능)
  - **2차 처리 (무드 확장)**: 감정 세그먼트를 색상, 음악, 향, 조명이 포함된 상세 무드 아웃풋으로 확장 (LLM 사용, temperature: 0.7, 창의성 필수)
- **대시보드**: 최종 결정된 무드를 시각화하고 홈 환경 제어를 시뮬레이션
- **데이터베이스**: PostgreSQL (Prisma ORM)을 통한 사용자 데이터 관리
- **인증**: NextAuth.js를 통한 이메일/비밀번호 및 소셜 로그인 지원

### 5. Database Layer (PostgreSQL)

- **사용자 관리**: 사용자 프로필, 선호도, 무드셋 저장
- **디바이스 관리**: 연결된 디바이스 정보 저장
- **세션 관리**: NextAuth 세션 및 JWT 토큰 관리

---

## 시스템 아키텍처 (그림)

![System Architecture](./Web/public/system-architecture.png)

---

## Getting Started

### 요구사항

- **Node.js**: 18.x 이상 (권장: 22.21.0)
- **npm**: 8.x 이상 (권장: 10.9.4)
- **PostgreSQL**: 14.x 이상 (프로덕션 환경)

### 설치 및 수행절차

1. **저장소 클론**

   ```bash
   git clone <repository-url>
   cd mood-manager
   ```

2. **의존성 설치**

   ```bash
   cd Web
   npm install
   ```

3. **환경 변수 설정**

   `Web/.env.local` 파일을 생성하고 다음 환경 변수를 설정합니다:

   ```env
   # NextAuth 설정
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your-secret-key-here

   # 데이터베이스 연결 (PostgreSQL)
   DATABASE_URL=postgresql://user:password@localhost:5432/moodmanager

   # OpenAI API (선택사항, LLM 기능 사용 시)
   OPENAI_API_KEY=your-openai-api-key

   # Firebase 설정 (선택사항, Firestore 연동 시)
   NEXT_PUBLIC_FIREBASE_API_KEY=your-firebase-api-key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-firebase-auth-domain
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-firebase-project-id
   NEXT_PUBLIC_FIREBASE_APP_ID=your-firebase-app-id
   FIREBASE_ADMIN_CREDENTIALS=your-firebase-admin-credentials-json

   # Python ML 서버 (선택사항, ML 예측 사용 시)
   PYTHON_SERVER_URL=http://localhost:5000
   PYTHON_SERVER_TIMEOUT=30000
   PYTHON_SERVER_RETRY_MAX=3

   # ML API 인증 (선택사항)
   ML_API_KEY=your-ml-api-key
   ```

   **참고**: 
   - `NEXTAUTH_SECRET`은 프로덕션 환경에서 반드시 강력한 랜덤 문자열로 설정해야 합니다.
   - `DATABASE_URL`은 PostgreSQL 연결 문자열입니다.
   - OpenAI API 키가 없으면 LLM 기능이 동작하지 않으며, mock 데이터로 대체됩니다.

4. **데이터베이스 마이그레이션** (선택사항)

   ```bash
   cd Web
   npx prisma generate
   npx prisma migrate dev
   ```

   **참고**: V1 (Mock Mode)에서는 데이터베이스 마이그레이션이 필수는 아닙니다. 관리자 계정(`admin@moodmanager.com` / `admin1234`)으로 로그인하면 mock 데이터로 전체 플로우를 테스트할 수 있습니다.

5. **개발 서버 실행**

   ```bash
   cd Web
   npm run dev
   ```

   브라우저에서 `http://localhost:3000`으로 접속합니다.

6. **프로덕션 빌드** (배포 전)

   ```bash
   cd Web
   npm run build
   npm start
   ```

### 관리자 모드 (Mock Mode)

V1에서는 관리자 계정으로 로그인하면 실제 데이터베이스 없이도 전체 플로우를 테스트할 수 있습니다:

- **이메일**: `admin@moodmanager.com`
- **비밀번호**: `admin1234`

관리자 모드에서는:
- Mock 데이터로 디바이스 생성/삭제
- localStorage 기반 무드셋 관리
- 실제 LLM 호출 (API 키가 있는 경우)

### 프로덕션 배포

프로덕션 환경에서는 다음 사항을 확인해야 합니다:

1. **환경 변수**: 모든 필수 환경 변수가 설정되어 있는지 확인
2. **데이터베이스**: PostgreSQL 연결 및 마이그레이션 완료
3. **보안**: `NEXTAUTH_SECRET`이 강력한 랜덤 문자열로 설정되어 있는지 확인
4. **HTTPS**: 프로덕션 환경에서는 HTTPS를 사용해야 합니다 (`NEXTAUTH_URL`도 HTTPS로 설정)

---

## Members

| Name (KOR) | Name (ENG) | Department | Email |
| :--- | :--- | :--- | :--- |
| 마혁진 | Hyeokjin Ma | Information Systems | tema0311@hanyang.ac.kr |
| 박새연 | Saeyeon Park | Information Systems | saeyeon0317@hanyang.ac.kr |
| 안준성 | Junseong Ahn | Information Systems | lljs1113@hanyang.ac.kr |
| 채희주 | Heejoo Chae | Information Systems | heeju0203@hanyang.ac.kr |
| 최현우 | Hyeonwoo Choi | Information Systems | hhyyrr0713@hanyang.ac.kr |

---

## Additional Resources

- **Watch Repository**: [mood-manager-watch](https://github.com/Ma-Hyekjin/mood-manager-watch.git)
- **API Documentation**: [Mood Manager – API Specification v1](https://www.notion.so/Mood-Manager-API-Specification-v1-2b1739c2f15880bafcfdc063069488)
- **Deployed Demo**: [mood-manager-deployed](http://54.180.50.127/)
