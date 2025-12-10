# 프로젝트 구조

**작성일**: 2025.12.10

---

## 현재 프로젝트 구조

```
mood-manager/
├── Web/                    # Next.js 웹앱
│   ├── src/                # Source Code
│   │   ├── app/             # Next.js App Router
│   │   │   ├── (auth)/       # 인증 페이지
│   │   │   │   ├── login/
│   │   │   │   ├── register/
│   │   │   │   └── forgot-password/
│   │   │   ├── (main)/       # 메인 페이지
│   │   │   │   ├── home/
│   │   │   │   └── mypage/
│   │   │   └── api/          # API Routes (21개)
│   │   │       ├── auth/
│   │   │       ├── devices/
│   │   │       ├── moods/
│   │   │       └── inquiry/
│   │   ├── components/       # 공유 컴포넌트
│   │   │   ├── navigation/   # 네비게이션
│   │   │   └── ui/           # UI 컴포넌트
│   │   ├── hooks/            # 커스텀 훅
│   │   ├── lib/              # 유틸리티 및 설정
│   │   └── types/            # TypeScript 타입 정의
│   ├── public/              # 정적 파일
│   └── prisma/              # Prisma Schema & Migrations
├── Watch/                   # WearOS 앱 (Kotlin)
│   └── app/
│       ├── src/main/java/com/moodmanager/watch/
│       │   └── presentation/
│       │       ├── MainActivity.kt
│       │       ├── PeriodicDataService.kt
│       │       ├── AudioEventService.kt
│       │       ├── FirebaseViewModel.kt
│       │       └── theme/Theme.kt
│       └── google-services.json
├── ML/                      # ML Python Server (예정)
└── docs/                    # 문서
```

---

## 구조 설명

### 웹앱 (Next.js)
- **위치**: `Web/src/`
- **구조**: Next.js App Router 표준 구조

### WearOS 앱 (Kotlin)
- **위치**: `Watch/`
- **구조**: Android/Kotlin 표준 구조
- **상태**: v4 버전, 정상 작동 중이다.
- **역할**: 생체 데이터 및 오디오 이벤트 수집 후 Firestore로 전송

---

## WearOS 앱 상세

### 프로젝트 정보
- **언어**: Kotlin
- **플랫폼**: Android / Wear OS SDK
- **주요 API**: Firebase SDK, Health Services
- **상태**: 완성된 v4 버전, 정상 작동한다.

### Firebase 연동
- `google-services.json` 파일 존재
- Firebase BOM 사용
- Firestore KTX 포함
- Firebase Storage KTX 포함
- Google Services 플러그인 적용

### 빌드 설정
- Kotlin + Compose 사용
- Wear OS SDK 설정 (minSdk 30, targetSdk 36)
- Health Services 클라이언트 포함
- Java 11 호환성 설정

### 데이터 전송
- **PeriodicDataService**: 1분마다 생체 데이터 수집 → `users/{userId}/raw_periodic`
- **AudioEventService**: 오디오 이벤트 수집 → `users/{userId}/raw_events`
- **Firestore 경로**: 
  - `users/testUser/raw_periodic/{timestamp}`
  - `users/testUser/raw_events/{auto_id}`

### 코드 구조
- **Kotlin 파일**: 5개
- **주요 파일**:
  - `MainActivity.kt`: 메인 액티비티, 권한 요청 및 서비스 시작
  - `PeriodicDataService.kt`: 주기적 생체 데이터 수집 및 Firestore 전송
  - `AudioEventService.kt`: 오디오 이벤트 수집 및 Firestore 전송
  - `FirebaseViewModel.kt`: Firebase 연동 로직 (더미 데이터용)
  - `Theme.kt`: Compose 테마 설정
