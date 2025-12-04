---
title: Markov / Python Emotion Prediction Integration Review
description: 마르코프/시계열 감정 예측 파이프라인과 현재 Web 구조의 정합성 점검 및 개선 방안
---

## 1. 현재 감정 예측 파이프라인 요약

### 1.1 데이터 흐름 (실제 V2 기준)

- **WearOS / ML Lambda → Web**
  - ML 서버(Lambda)가 10분 단위로 `POST /api/ml/emotion-counts` 호출
  - payload: `{ timestamp, result, confidence, userId? }[]`
  - `result` ∈ {`Laughter`, `Sigh`, `Crying`, `Negative`}
  - 서버에서:
    - 신뢰도 70 미만 이벤트는 무시
    - `result` 를 내부 카운트로 변환:
      - `Laughter` → `laughter += 1`
      - `Sigh` → `sigh += 1`
      - `Crying` / `Negative` → `crying += 1`
    - `EmotionCountStore.addEmotionCounts(userId, { laughter, sigh, crying })` 로 누적

- **전처리 단계 (`/api/preprocessing`)**
  - WearOS/ML과 무관하게, Web에서 수면/스트레스/날씨 등을 종합.
  - `EmotionCountStore.getEmotionCounts(USER_ID)` 호출로 누적 카운트 조회.
  - 응답 JSON (`PreprocessingResponse`) 구조:
    - `average_stress_index`, `recent_stress_index`
    - `latest_sleep_score`, `latest_sleep_duration`
    - `weather{temperature, humidity, rainType, sky}`
    - **새 형식:** `emotionCounts { laughter, sigh, crying }`
    - **구 형식(호환용):** `emotionEvents` (현재는 빈 배열)
    - `accumulationDurationSeconds`, `lastResetTime`

- **무드스트림 생성 핸들러 (`streamHandler.ts`)**
  - `preprocessed` + 현재 `moodStream` + 사용자 선호도 가중치를 합쳐 LLM 입력 `llmInput` 구성.
  - 이때 `EmotionCountStore.getAndResetEmotionCounts(userId)` 로 누적 카운트 조회 후 **클렌징(0으로 초기화)**.
  - `preprocessedWithCounts` 에 `emotionCounts` 및 `accumulationDurationSeconds`, `lastResetTime` 주입.

- **Stage 1: Python 시계열+마르코프 모델 (현재 실질 사용중)**
  - `PythonEmotionPredictionProvider.getPythonResponse(input: EmotionPredictionInput)` 호출.
  - `EmotionPredictionInput.preprocessed` 안의 `emotionCounts.laughter/sigh/crying` 을 이용해  
    `PythonPredictionRequest` 구성:
    - `average_stress_index`, `recent_stress_index`
    - `latest_sleep_score`, `latest_sleep_duration`
    - `temperature`, `humidity`, `rainType`, `sky`
    - `laughter`, `sigh`, **`crying`**
  - Python 서버 `/api/predict` 가 **current/future 감정 상태**(id, title, description)를 반환.
  - `PythonEmotionPredictionProvider` 는 이를 `EmotionSegment[]` 로 변환 (current/future 2~3세그먼트).

- **Stage 2: LLM (OpenAI)**
  - Python 응답(`PythonPredictionResponse`)과 LLM 입력(`llmInput`)을 결합해 프롬프트 생성.
  - `optimizePrompt.ts` / `validateAndNormalizeResponse` 를 통해  
    각 세그먼트별 `moodAlias`, `musicSelection`, `moodColor`, `backgroundIcon` 등 **MoodExpansion**.
  - 결과는 `BackgroundParamsResponse` 로 정규화되어 프론트로 전달.

### 1.2 Markov Provider의 현재 상태

- 파일: `src/lib/prediction/MarkovEmotionPredictionProvider.ts`
  - `EmotionPredictionProvider` 인터페이스는 구현되었으나, **실제 로직은 전부 TODO**.
  - 현재는 segmentCount 개수만큼 `"calm"` 세그먼트를 리턴하는 **스켈레톤**.

- 파일: `src/lib/prediction/index.ts`
  - `PredictionMode = "python" | "markov" | "auto"`
  - `EmotionPredictionProviderFactory.create(mode)`:
    - `"python"`: `createPythonProvider()` (실제 Python 서버 사용)
    - `"markov"`: `MarkovEmotionPredictionProvider` 사용 (현재 mock 수준)
    - `"auto"`: `EMOTION_PREDICTION_MODE` 환경변수 또는 `"python"` 기본
  - **실제 사용 경로**:
    - 현재 스트림 핸들러(`streamHandler.ts`)는 Factory 대신 **직접 `PythonEmotionPredictionProvider`를 사용**.
    - 즉, Markov Provider는 코드상 import만 되고 **실 운용 경로에서는 사용되지 않는 상태**.

---

## 2. 최근 구조 변경과의 정합성 체크

### 2.1 EmotionPrediction 인터페이스 vs 실제 사용

- `EmotionPredictionProvider.ts`:
  - `PreprocessedData.emotionCounts` 에 `laughter`, `sigh`, `crying` 모두 반영.
  - `EmotionPredictionInput` 은 `preprocessed`, `currentTime`, `previousSegments`, `segmentCount` 포함.

- `PythonEmotionPredictionProvider`:
  - 위 인터페이스를 정확히 구현.
  - `emotionCounts.crying` 도 Python 서버로 전송.
  - ML팀이 기대하는 **입력 스펙(카운트 기반 + crying)** 과 일치.

- `MarkovEmotionPredictionProvider`:
  - `EmotionPredictionInput` 은 받지만, `preprocessed.emotionCounts` 를 전혀 사용하지 않음.
  - 현재는 단순 `"calm"` 세그먼트만 생성하는 mock이므로,  
    **실제 ML/Markov 모델과의 연결이 아직 전혀 반영되지 않은 상태**.

### 2.2 crying 도입 이후 영향

- **EmotionCountStore / ml/emotion-counts / preprocessing**:
  - 모두 `crying` 필드를 포함하도록 이미 업데이트 완료.
  - Python Provider는 이를 잘 사용하고 있음.

- **Markov Provider 설계 관점**:
  - Markov 모델이 도메인 상:
    - 웃음/한숨/울음(crying)을 기반으로 **다음 2~3세그먼트의 감정 상태 시퀀스**를 예측하는 구조라면,
    - 현재 `EmotionPredictionInput` 형태는 이미 그 요구사항을 만족시키는 형태입니다.
    - 따라서 시계열+마르코프 구현은 **새 구조(카운트 + crying)** 에 맞게 Python 서버에서 구현되어 있고,  
      Web 쪽은 사실상 “Python = 마르코프 엔진”으로 쓰고 있는 셈입니다.

### 2.3 Mock / Fallback 경로 점검

- **Python 서버가 꺼져 있거나 `PYTHON_SERVER_URL` 미설정**:
  - `streamHandler.ts` 에서:
    - 경고 로그 후 `pythonResponse = null`.
    - `handleStreamModeFallback` 을 통해 **기존 LLM-only 플로우**로 진행.
  - 이때 Markov Provider는 사용되지 않음.

- **`EMOTION_PREDICTION_MODE=markov` 설정 시**:
  - `EmotionPredictionProviderFactory` 를 통해 Markov Provider를 사용할 수는 있으나,
  - 현재 streamHandler는 Factory를 직접 쓰지 않고 `PythonEmotionPredictionProvider` 를 new 하므로,  
    **env를 바꿔도 실제 플로우에는 영향 없음**.

요약:  
현재 “실제 작동하는 감정 예측”은 **Python 서버 = Markov/시계열 모델**이고,  
TypeScript 쪽 Markov Provider는 아직 “향후 순수 TS 구현을 위한 스켈레톤” 수준입니다.

---

## 3. 현재 구조와 맞지 않거나 어색한 지점 정리

1. **Markov Provider 미사용**
   - Factory는 Markov Provider를 지원하지만, 실제 스트림 핸들러는 Python Provider를 직접 사용.
   - `PredictionMode` 스위치는 사실상 **죽어 있는 설정**이 됨.

2. **구/신 입력 형식 혼재**
   - `EmotionPredictionProvider` 에 `emotionEvents`(타임스탬프 배열)와 `emotionCounts`(카운트 기반)가 모두 존재.
   - 실제 경로는 전부 `emotionCounts` 를 사용하고, `emotionEvents` 는 빈 배열로만 유지.
   - 추후 혼란을 피하려면:
     - `emotionEvents` 는 완전히 deprecated 처리하거나,  
     - Markov 모델이 이벤트 타임라인까지 사용할지 명확히 결정해야 함.

3. **Markov Provider의 crying 미반영**
   - TS Markov Provider는 `emotionCounts` 를 전혀 사용하지 않으므로,
   - 만약 나중에 TypeScript 레벨에서 마르코프 체인을 직접 구현하려면:
     - `laughter/sigh/crying` 를 상태 전이 확률에 반영하는 로직을 새로 짜야 함.

4. **Mock vs 실제 로직 경계가 불명확한 부분**
   - Markov Provider는 현재 완전 mock이지만, 이름은 `MarkovEmotionPredictionProvider`라 혼동 가능.
   - Python Provider가 사실상 “진짜 Markov/시계열 모델”인데,  
     코드 상에서는 단순히 `PythonEmotionPredictionProvider` 로만 표현되어 있어 역할이 애매함.

---

## 4. 개선 방안 제안

### 4.1 “진짜 Markov”는 Python, TS Markov는 스켈레톤임을 명시

- 문서/코드 레벨에서 역할을 명확히:
  - Python 서버: **실제 시계열+마르코프 체인 모델 구현체** (Stage 1 핵심).
  - `MarkovEmotionPredictionProvider` (TS):  
    - 당분간은 사용하지 않는 스켈레톤으로 두되,
    - 주석과 네이밍에 `"not wired to production flow"` 임을 명시.
- `EmotionPredictionProviderFactory`:
  - 당장은 프로덕션 경로에서 사용하지 않으므로,
  - 추후 “로컬 테스트용 / Python 서버 없이 동작하는 경량 Markov” 용도로만 사용할 것을 문서화.

### 4.2 crying 포함 입력 스펙 고정

- **Python 서버와 합의된 최종 입력 스펙을 명시**:
  - `PythonPredictionRequest` 타입에 이미 반영:
    - `laughter: number`
    - `sigh: number`
    - `crying: number`
  - Web 쪽에서는 이 스펙을 기준으로:
    - `/api/ml/emotion-counts` → EmotionCountStore → `/api/preprocessing` → `streamHandler` → Python Provider  
      까지 전체 체인을 유지.
- 만약 향후 **추가 감정(예: anger, surprise)** 이 필요해도:
  - `emotionCounts` 확장으로 대응하고,
  - Python/LLM 쪽만 점진적으로 업데이트하는 방식으로 진행.

### 4.3 Markov Provider를 유지하되, 현재 로직은 그대로 두기

- 요청 사항 반영:
  - 만약 ‘crying’을 본격적으로 Markov 상태 전이에 넣으려면  
    TS/Python 양쪽에서 **대대적인 코드 수정**이 필요하므로,
  - **현재는 값은 보내되 로직 구조는 그대로 유지**하는 방향이 맞음.
- 구체적으로:
  - EmotionCountStore / ML → Web → Python 입력 스펙은 이미 crying 기반으로 정착.
  - TS Markov Provider는:
    - 지금처럼 출력만 단순 mock으로 유지.
    - 프로덕션 플로우에는 여전히 Python Provider만 사용.

### 4.4 향후 “TS Markov 체인”을 도입하고 싶을 때의 단계

1. Python 서버와 동일한 입력 스펙을 사용하는 TS Markov 구현체 설계:
   - `EmotionPredictionInput.preprocessed.emotionCounts` +  
     최근 N번의 세그먼트(`previousSegments`)를 함께 사용.
2. `MarkovEmotionPredictionProvider.predictEmotions` 에:
   - 간단한 2~3상태 마르코프 체인(예: `stressed`, `neutral`, `positive`)을 구현.
3. `EmotionPredictionProviderFactory` 를 실제 스트림 핸들러에서 사용:
   - `EMOTION_PREDICTION_MODE=markov`일 때 Python 대신 TS Markov를 사용하도록 스위치.
4. Python/TS 둘 중 어느 쪽이 “정식 프로덕션 모델”인지 문서화하여 혼동 방지.

---

## 5. 정리

- **지금 구조**는:
  - ML Lambda → Web → EmotionCountStore → Python 서버 → LLM → MoodStream 이라는 **2-Stage 파이프라인**이 이미 정리된 상태.
  - `crying` 이벤트는:
    - ML 이벤트(`Crying`, `Negative`)로부터 Web까지 누적/전달되지만,
    - Python Markov 코드에서는 **현재 sigh/laughter만 사용**하고 있음.
  - TS Markov Provider는 **사용되지 않는 스켈레톤**이며,  
    프로덕션 플로우에서는 `markov/build_yesterday_many.py` + `realtime_inference_many.py` 가  
    “실제 Markov/시계열 모델” 역할을 수행.

- **중요한 한계점 (현재 상태가 “완료”가 아님)**:
  - Web ↔ Python 간 통신은 **요약치+count 기반 실시간 inference**까지만 연결되어 있고,
  - “전날 144개 row 기반 yesterday model 빌드”는
    - Python 쪽에 `fetch_day_raw_from_api()` 템플릿만 있고,
    - Web/DB에 그 144개 row를 제공하는 API/스키마가 **아직 구현되지 않은 상태**.

---

## 6. Web / DB / Markov 통합 변경 계획 (실값 기반 파이프라인)

### 6.1 전체 목표

1. **어제 144개 시계열(raw) → yesterday model 빌드**를  
   Web/DB/Markov가 실제 데이터로 유기적으로 연결되도록 구현.
2. **실시간 inference**에서는:
   - Web이 `average_stress_index`, `recent_stress_index`, `latest_sleep_*`, `weather`,  
     그리고 (필요하다면) `emotion`(sigh/laugh/crying) 을 **실제 값**으로 Python에 전달.
3. **crying**:
   - Web → Python까지 값 전달은 이미 되어 있으므로,
   - Markov 모델에서 crying을 어떻게 반영할지(Markov transition, feature 등)는  
     Python 쪽 로직으로 명확히 설계/반영.

---

### 6.2 DB/데이터 소스 레벨 설계

#### 6.2.1 하루 144 row 저장 방식 (PostgreSQL, *전처리된* 데이터 기준)

> ⚠️ **결론:** Firestore raw는 사용하지 않고,  
> **전처리된 값을 Postgres에 144개 슬롯으로 저장**하는 구조로 통일한다.

- 새 Prisma 모델 초안 (예시):

```prisma
model DailyPreprocessedSlot {
  id        String   @id @default(uuid())
  userId    String
  date      DateTime // 해당 날짜의 00:00 기준 날짜
  slotIndex Int      // 0 ~ 143 (10분 슬롯 인덱스)

  // 전처리된 값 (웹 전처리 또는 백엔드 배치 결과)
  average_stress_index  Float
  recent_stress_index   Float
  latest_sleep_score    Float
  latest_sleep_duration Float
  temperature           Float
  humidity              Float
  rainType              Int
  sky                   Int

  laughter              Int
  sigh                  Int
  crying                Int

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, date, slotIndex])
  @@index([userId, date])
}
```

- 이 테이블에는 **이미 전처리된 값**만 들어간다.
  - 원시 raw(Firestore) → (별도 파이프라인/배치) → 전처리 결과(평균/최근/수면/날씨/카운트) →  
    **여기에 144 row로 적재**.
  - Web / Markov / LLM 모두 “전처리된 수치”만 신뢰하고 사용.

#### 6.2.2 Web API: 하루 raw 144개 제공

새 Endpoint (초안):

- `GET /api/markov/raw/day?userId=...&date=YYYY-MM-DD`

응답 형식 (Python `compute_feature_row` 가 기대하는 컬럼 포함):

```json
{
  "userId": "user_001",
  "date": "2025-11-30",
  "rows": [
    {
      "timestamp": 1732924800000,
      "average_stress_index": 45,
      "recent_stress_index": 39,
      "latest_sleep_score": 79,
      "latest_sleep_duration": 600,
      "temperature": 9.6,
      "humidity": 26,
      "rainType": 0,
      "sky": 1,
      "laughter": 2,
      "sigh": 1
      // (선택) crying: 0  // V2.1에서 확장 가능
    },
    "... 144 rows ..."
  ]
}
```

- 구현:
  - 내부에서 `fetchTodayPeriodicRaw(userId)` 또는 “주어진 date 기준 raw fetch 함수”를 사용.
  - 데이터가 144개 미만일 경우:
    - 부족분을 NaN 또는 0으로 채우되,
    - Markov Python의 `clean_raw_df_step2lite` 로 처리 가능하도록 설계.

Python `build_yesterday_many.py`의 `fetch_day_raw_from_api(user_id, date)` 는  
이 Endpoint를 호출하여 `rows` 배열을 DataFrame으로 변환한다.

---

### 6.3 Markov Python 서버 변경 계획

#### 6.3.1 build_yesterday_many.py

1. `fetch_day_raw_from_api(user_id: str, date: datetime)` 구현:
   - Web의 `GET /api/markov/raw/day` 호출:

   ```python
   import requests
   ...
   def fetch_day_raw_from_api(user_id: str, date: datetime) -> pd.DataFrame:
       url = "https://your-web-domain/api/markov/raw/day"
       params = {"userId": user_id, "date": date.strftime("%Y-%m-%d")}
       r = requests.get(url, params=params, timeout=5)
       r.raise_for_status()
       data = r.json()
       df = pd.DataFrame(data["rows"])
       return df
   ```

2. 초기 목업 데이터:
   - Web/DB에 아직 실데이터가 충분치 않을 때:
     - `build_yesterday_model_for_user` 내에서,
       - 144 row가 안 나오면:
         - (A) 목업 row로 채우고 이어서 빌드, 또는
         - (B) 해당 유저는 model_not_found 처리 후, Web이 mock fallback 사용.

3. crying 반영 (선택):
   - 현재 feature는 `sigh`/`laughter`만 사용 (FatigueScore, VibrancyScore).
   - crying을 포함하려면:
     - raw_df 에 `crying` 컬럼 추가,
     - `compute_feature_row` 에서 FatigueScore/CalmScore 등에 crying을 반영하는 수식 추가.

#### 6.3.2 realtime_inference_many.py

1. 입력 매핑 확장
   - 현재 `build_raw_point_from_payload` 는 `emotion`에서 `sigh_count`, `laugh_count`만 사용.
   - Web에서 `emotionCounts.crying` 을 의미있는 feature로 쓰려면:

   ```python
   "emotion": {
       "sigh_count": 3,
       "laugh_count": 12,
       "cry_count": 1
   }
   ```

   - 로 받도록 Web 요청 포맷을 확장하고,
   - raw_point에 `crying` 컬럼을 추가한 뒤,
   - `compute_feature_row` 에서 crying까지 반영하도록 수식 변경.

2. Web ↔ Markov 실시간 연결
   - Web의 `streamHandler.ts` 에서:
     - 현재는 `PythonEmotionPredictionProvider` 를 통해 `/api/predict` 호출.
     - Markov Flask 서버가 `/inference`를 쓴다면:
       - `PythonEmotionPredictionProvider` 를 “/inference 전용” Provider로 분리하거나,
       - 별도 MarkovInferenceProvider (TS) 를 만들어 해당 엔드포인트와 통신.

   - 입력 매핑:
     - Web `preprocessedWithCounts` → Markov payload:

     ```json
     {
       "user_id": "user_001",
       "average_stress_index": ...,
       "recent_stress_index": ...,
       "latest_sleep_score": ...,
       "latest_sleep_duration": ...,
       "weather": { ... },
       "preferences": { ... },   // 지금은 사용 안 해도 됨
       "emotion": {
         "sigh_count": emotionCounts.sigh,
         "laugh_count": emotionCounts.laughter,
         "cry_count": emotionCounts.crying
       }
     }
     ```

   - 출력:
     - `current_id/title/description`, `future_id/title/description` 을  
       현재 PythonPredictionResponse 스펙에 맞추어 정리 (필드명 통일 필요).

---

### 6.4 Web 레이어 변경 계획 요약

1. **Day Raw API 구현**  
   - `GET /api/markov/raw/day` → Firestore(또는 Postgres)에서 하루 144 row 조회.
   - build_yesterday_many.py 의 `fetch_day_raw_from_api` 가 이 API를 호출.

2. **Preprocessing ↔ Markov 입력 정렬**
   - `/api/preprocessing` 이 반환하는 JSON과  
     Markov `/inference` 가 기대하는 payload 간에 필요한 필드 정렬:
     - stress indices, sleep, weather, emotionCounts.

3. **Python Provider/Markov Provider 역할 분리**
   - 지금은 PythonEmotionPredictionProvider 가 “/api/predict 기반 파이프라인”에 묶여 있음.
   - Markov inference 서버(`/inference`)를 사용할 경우:
     - 별도 Provider 생성 (예: `MarkovPythonProvider`) 후,  
     - `streamHandler` 에서 어느 쪽을 쓸지 config/env로 선택 가능하게 설계.

4. **Mock 스켈레톤 정리**
   - TS `MarkovEmotionPredictionProvider` 에:
     - “현재는 프로덕션 경로에서 사용되지 않는 스켈레톤”이라고 주석 명시.
   - Web에선 되도록 Python/Flask 기반 Markov 서버만을 “실 모델”로 취급.

---

### 6.5 단계별 마이그레이션 시퀀스

1. **1단계 – Day Raw API & build_yesterday 연동**
   - Web에 `GET /api/markov/raw/day` 구현.
   - Markov `fetch_day_raw_from_api` 를 이 API에 연결.
   - 로컬/스테이징 환경에서 어제 모델이 정상적으로 빌드되는지 확인.

2. **2단계 – Realtime inference ↔ Web 정합성**
   - Web `streamHandler` 또는 별도 Provider에서 Markov `/inference` 와 통신.
   - Markov 응답을 현재 PythonPredictionResponse 스펙과 맞추어 래핑.
   - LLM Stage 2 에서 이 값을 그대로 사용하도록 프롬프트/검증 로직 정리.

3. **3단계 – crying/144 row의 진짜 반영**
   - Markov feature 계산(`compute_feature_row`)에 crying/144 시계열 반영.
   - cluster_summaries의 valence/arousal 정의를 재조정(필요 시).

4. **4단계 – mock/skeleton 제거 또는 격리**
   - TS Markov Provider / LLM-only fallback 등의 사용 위치를  
     “에러/DB 없음/개발 모드 등 명확한 조건”으로 한정.

이 계획을 기준으로, Web / DB / Markov 세 레이어를 **목업 스켈레톤에서 실제 데이터 파이프라인으로**  
점진적으로 옮겨갈 수 있다.


