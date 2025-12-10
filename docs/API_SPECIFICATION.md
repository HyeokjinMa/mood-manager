# API 명세서

## 개요

프론트엔드에서 사용하는 API 엔드포인트 명세이다.

---

## 1. GET /api/preprocessing

### 설명
오늘 날짜의 전처리된 데이터를 조회한다.

### 인증
- NextAuth 세션이 필요하다 (현재는 목업 모드).

### 요청
- Method: `GET`
- Headers: 없음

### 응답

#### 200 OK
```json
{
  "average_stress_index": 45,
  "recent_stress_index": 39,
  "latest_sleep_score": 79,
  "latest_sleep_duration": 600,
  "weather": {
    "temperature": 9.6,
    "humidity": 26,
    "rainType": 0,
    "sky": 1
  },
  "emotionEvents": {
    "laughter": [1234567890, 1234567900],
    "sigh": [1234568000],
    "anger": [],
    "sadness": [],
    "neutral": [1234567000]
  }
}
```

#### 204 No Content
- 오늘 날짜의 데이터가 없는 경우
- 프론트엔드에서 기본값 사용

### 필드 설명

| 필드 | 타입 | 설명 |
|------|------|------|
| `average_stress_index` | number | 그 날의 평균 스트레스 지수 (0~100) |
| `recent_stress_index` | number | 최근 스트레스 지수 (0~100) |
| `latest_sleep_score` | number | 최근 수면 점수 (0~100) |
| `latest_sleep_duration` | number | 최근 수면 시간 (분) |
| `weather.temperature` | number | 기온 (°C) |
| `weather.humidity` | number | 습도 (%) |
| `weather.rainType` | number | 강수형태 (0: 없음, 1: 비, 2: 비/눈, 3: 눈) |
| `weather.sky` | number | 하늘상태 (1: 맑음, 3: 구름 많음, 4: 흐림) |
| `emotionEvents.laughter` | number[] | 웃음 타임스탬프 배열 |
| `emotionEvents.sigh` | number[] | 한숨 타임스탬프 배열 |
| `emotionEvents.anger` | number[] | 분노 타임스탬프 배열 |
| `emotionEvents.sadness` | number[] | 슬픔 타임스탬프 배열 |
| `emotionEvents.neutral` | number[] | 평온 타임스탬프 배열 (기본값) |

---

## 2. GET /api/moods/current

### 설명
현재 예약된 무드스트림을 조회한다 (읽기 전용).

### 인증
- NextAuth 세션이 필요하다 (현재는 목업 모드).

### 요청
- Method: `GET`
- Headers: 없음

### 응답

#### 200 OK
```json
{
  "currentMood": {
    "id": "calm-1",
    "name": "Calm Breeze",
    "cluster": "0",
    "music": {
      "genre": "newage",
      "title": "Calm Breeze"
    },
    "scent": {
      "type": "Marine",
      "name": "Wave"
    },
    "lighting": {
      "color": "#E6F3FF",
      "rgb": [230, 243, 255]
    }
  },
  "moodStream": [
    {
      "timestamp": 1234567890,
      "mood": { ... },
      "music": { ... },
      "scent": { ... },
      "lighting": { ... },
      "duration": 180000
    }
  ],
  "userDataCount": 45,
  "streamId": "stream-1234567890"
}
```

### 필드 설명

| 필드 | 타입 | 설명 |
|------|------|------|
| `currentMood.id` | string | 무드 ID |
| `currentMood.name` | string | 무드 이름 |
| `currentMood.cluster` | string | 감정 클러스터 ('-', '0', '+') |
| `currentMood.music.genre` | string | 음악 장르 |
| `currentMood.music.title` | string | 음악 제목 |
| `currentMood.scent.type` | string | 향 종류 |
| `currentMood.scent.name` | string | 향 이름 |
| `currentMood.lighting.color` | string | 조명 색상 (HEX) |
| `currentMood.lighting.rgb` | number[] | 조명 RGB 값 |
| `moodStream` | array | 예약된 무드스트림 세그먼트 배열 |
| `userDataCount` | number | 사용자 데이터 개수 (선호도 가중치 계산용) |
| `streamId` | string | 스트림 고유 ID |

---

## 2-1. POST /api/moods/current/generate

### 설명
무드스트림을 재생성한다 (10개 세그먼트 생성).

### 인증
- NextAuth 세션이 필요하다 (현재는 목업 모드).

### 요청
- Method: `POST`
- Headers: `Content-Type: application/json`
- Body:
```json
{
  "nextStartTime": 1234567890
}
```

### 응답

#### 200 OK
```json
{
  "segments": [
    {
      "id": "segment-1234567890-0",
      "timestamp": 1234567890,
      "moodName": "Deep Relax",
      "musicGenre": "newage",
      "scentType": "citrus",
      "mood": { ... },
      "music": { ... },
      "scent": { ... },
      "lighting": { ... },
      "duration": 180000
    }
  ],
  "streamId": "stream-1234567890"
}
```

### 필드 설명

| 필드 | 타입 | 설명 |
|------|------|------|
| `segments` | array | 생성된 10개 세그먼트 배열 |
| `segments[].id` | string | 세그먼트 고유 ID |
| `segments[].timestamp` | number | 세그먼트 시작 시간 (Unix timestamp) |
| `segments[].moodName` | string | 무드 이름 |
| `segments[].musicGenre` | string | 음악 장르 |
| `segments[].scentType` | string | 향 종류 |
| `segments[].duration` | number | 세그먼트 길이 (3분 = 180000ms) |
| `streamId` | string | 스트림 고유 ID |

### 처리 과정

1. **1분 단위 예측값 생성** (30개, 30분치)
2. **첫 번째 세그먼트로 대표 무드 결정** (전체 스트림의 대표 무드)
3. **3분 단위로 분절** (10개 세그먼트, 모두 동일한 무드 사용)
4. **각 세그먼트에 음악 장르/향 매핑** (무드는 동일, 장르/향은 세그먼트별로 다양)
5. **반환** (LLM 정보는 별도 API에서 추가)

**중요**: 하나의 무드스트림 내에서는 동일한 무드를 기반으로 하며, 음악 장르와 향은 세그먼트별로 다양할 수 있다.

---

## 3. POST /api/ai/background-params

### 설명
LLM으로 동적 배경 파라미터를 생성한다 (10개 세그먼트 전체에 대한 정보).

### 인증
- NextAuth 세션이 필요하다 (현재는 목업 모드).

### 요청
- Method: `POST`
- Headers: `Content-Type: application/json`
- Body:
```json
{
  "segments": [
    {
      "id": "segment-1234567890-0",
      "timestamp": 1234567890,
      "moodName": "Deep Relax",
      "musicGenre": "newage",
      "scentType": "citrus"
    }
  ],
  "userPreferences": {
    "music": { "rnb-soul": "-", "else": "+" },
    "color": { "black": "-", "else": "+" },
    "scent": { "spicy": "-", "else": "+" }
  }
}
```
- `segments`: 필수, 10개 세그먼트 정보
- `userPreferences`: 선택적 (없으면 기본값 사용)

### 응답

#### 200 OK
```json
{
  "moodAlias": "Calm Winter Rain",
  "musicSelection": "Ambient Rain Meditation",
  "moodColor": "#6B8E9F",
  "lighting": {
    "rgb": [107, 142, 159],
    "brightness": 50,
    "temperature": 4000
  },
  "backgroundIcon": {
    "name": "FaCloudRain",
    "category": "weather"
  },
  "backgroundWind": {
    "direction": 180,
    "speed": 3
  },
  "animationSpeed": 4,
  "iconOpacity": 0.7,
  "iconCount": 8,
  "iconSize": 50,
  "particleEffect": false,
  "gradientColors": ["#6B8E9F", "#87CEEB"],
  "source": "openai"
}
```

### 필드 설명

| 필드 | 타입 | 설명 |
|------|------|------|
| `moodAlias` | string | 무드 별명 (영어, 2-4단어) |
| `musicSelection` | string | 음악 선곡 |
| `moodColor` | string | 무드 컬러 (HEX) |
| `lighting.rgb` | number[] | 조명 RGB 값 |
| `lighting.brightness` | number | 조명 밝기 (0-100) |
| `lighting.temperature` | number | 색온도 (선택적) |
| `backgroundIcon.name` | string | React Icons 이름 |
| `backgroundIcon.category` | string | 아이콘 카테고리 |
| `backgroundWind.direction` | number | 풍향 (0-360도) |
| `backgroundWind.speed` | number | 풍속 (0-10) |
| `animationSpeed` | number | 애니메이션 속도 (0-10) |
| `iconOpacity` | number | 아이콘 투명도 (0-1) |
| `iconCount` | number | 아이콘 개수 (5-10, 선택적) |
| `iconSize` | number | 아이콘 크기 (0-100, 선택적) |
| `particleEffect` | boolean | 파티클 효과 (선택적) |
| `gradientColors` | string[] | 그라데이션 색상 (2-3개 HEX, 선택적) |
| `source` | string | LLM 응답 출처 (`"openai"`, `"cache"`, `"mock-no-key"`) |

---

## 현재 상태

### 목업 모드
- 모든 API는 현재 목업 데이터를 반환한다.
- 실제 백엔드 연동은 코드 내 `TODO` 주석으로 표시되어 있다.

### 구현 상태
- ✅ **무드스트림 생성 로직**: 1분 단위 예측값을 3분 단위로 분절하여 10개 세그먼트를 생성한다 (동일한 무드 기반).
- ✅ **자동 재생성 로직**: 예약된 세그먼트가 3개 이하가 되면 자동으로 재생성한다.
- ✅ **LLM 통합**: OpenAI API를 호출하고 배경 파라미터를 생성한다 (캐싱 포함).
- ⏳ **백엔드 연동**: 시계열 + 마르코프 체인 예측값을 받는다 (TODO).

### 다음 단계
1. 백엔드 API 연동 브랜치 병합 후 `/api/preprocessing` 실제 구현을 사용한다.
2. 시계열 + 마르코프 체인으로 `/api/moods/current/generate` 실제 구현을 완료한다.
3. OpenAI API 연동을 완료한다 (`OPENAI_API_KEY` 환경 변수 설정이 필요하다).

---

## Firestore 데이터 구조

### Overview

Firestore는 WearOS 디바이스와 ML 서버, Web 앱 간의 실시간 데이터 브리지 역할을 한다.

### 컬렉션 구조

#### 1. `users/{userId}/raw_periodic/{docId}`

생체 신호 데이터 (주기적 수집)

**필드:**
- `timestamp`: UNIX timestamp 또는 ISO 8601
- `heartRate`: 심박수 (bpm)
- `hrv`: HRV 지표
- `stress`: 스트레스 지수
- 기타 생체 신호 필드...

#### 2. `users/{userId}/raw_events/{docId}`

오디오 이벤트 데이터 (이벤트 기반 수집)

**필드:**
- `audio_base64`: Base64로 인코딩된 WAV 오디오 데이터 (문자열)
- `timestamp`: UNIX timestamp 또는 ISO 8601 (문자열 또는 숫자)
- `ml_processed`: ML 처리 상태 (문자열)
  - `"pending"`: ML 처리가 필요한 상태이다.
  - `"processing"`: 현재 ML 처리 중이다.
  - `"completed"`: ML 처리가 완료되었다.
  - `"failed"`: ML 처리가 실패했다.

### ML 서버 데이터 처리 플로우

#### 1. 데이터 수집 (Python ML 서버)

```python
# 처리되지 않은 이벤트만 조회
docs = db.collection("users").document("testUser").collection("raw_events").where('ml_processed', '==', 'pending').stream()
```

#### 2. ML 처리

1. `audio_base64` 디코딩
2. 오디오 분류 (Laughter, Sigh, Negative 등)
3. 결과 생성

#### 3. 결과 업데이트

처리 완료 후 Firestore 문서를 업데이트한다:

```python
doc.reference.update({
    'ml_processed': 'completed',
    'ml_result': 'Laughter',  # 또는 'Sigh', 'Negative' 등
    'ml_confidence': 0.92,  # 신뢰도 (0.0 ~ 1.0)
    'ml_processed_at': firestore.SERVER_TIMESTAMP
})
```

### Firestore 연결 상태

- **Watch 앱 (WearOS)**: ✅ Firestore가 연결되어 있다 (`google-services.json` 설정 완료).
- **Web 앱 (Next.js)**: ❌ Firestore가 연결되어 있지 않다 (현재 TODO 상태, V1 Mock 모드 사용 중).
- **ML Python 서버**: ✅ Firestore가 연결되어 있다 (서비스 계정 키로 접근).

---

이 문서는 프론트엔드 개발 시 참고하는 API 명세이다.

