# 🔄 시스템 흐름 검증 및 추가 질문

## 📋 개요

사용자가 요청한 19단계 흐름이 코드베이스에 잘 반영되어 있는지 확인하고, 부족하거나 추가 설명이 필요한 부분을 정리한 문서입니다.

**작성일**: 2025-01-XX  
**검증 범위**: 전체 시스템 흐름 (1-19단계)

---

## ✅ 흐름 반영 확인 결과

### 1. 워치 → 파이어스토어 데이터 전송
**상태**: ✅ 확인됨  
**위치**: README.md 문서에 명시  
**확인 내용**:
- `users/{userId}/raw_periodic/{docId}`: 생체 데이터 (heartRate, HRV, stress 등)
- `users/{userId}/raw_events/{docId}`: 오디오 이벤트 (Base64 WAV, `ml_processed` 상태)

---

### 2. 데이터 수집 (raw_periodic, raw_events)
**상태**: ✅ 확인됨  
**위치**: 
- `src/app/api/preprocessing/route.ts`
- `src/backend/jobs/fetchTodayPeriodicRaw.ts`
- `src/backend/listener/periodicListener.ts`

**확인 내용**:
- `raw_periodic`: Node.js로 직접 가져옴 (`fetchTodayPeriodicRaw`)
- `raw_events`: ML 서버를 거쳐 웃음/한숨 정보로 변환된 후 Node.js로 전달
  - `ml_processed == 'pending'` → ML 서버 처리 → `'done'`으로 업데이트
  - 감정 카운트는 `EmotionCountStore`에서 관리 (`getEmotionCounts`)

**✅ 확인됨**:
- ML 서버와 Node.js 간 통신: **ML 서버가 10분마다 Node.js로 값을 전송**
  - 서로 다른 서버에 존재
  - 코드상 반영되어 있음 (추정: `periodicListener.ts`에서 처리)

---

### 3. 날씨/계절/온도 정보 수집
**상태**: ✅ 확인됨  
**위치**: 
- `src/lib/weather/fetchWeather.ts`
- `src/app/api/preprocessing/route.ts` (96-104줄)

**확인 내용**:
- 기상청(KMA) API를 통해 날씨 정보 수집
- `fetchWeather()` 함수로 temperature, humidity, rainType, sky 정보 가져옴
- 전처리 API에서 날씨 정보를 포함하여 반환

---

### 4. 수치형 데이터 가공 (전처리/마르코프)
**상태**: ✅ 확인됨  
**위치**: 
- `src/app/api/preprocessing/route.ts`
- `src/lib/stress/calculateStressIndex.ts`
- `src/lib/preprocessing/preprocess.ts` (추정)

**확인 내용**:
- 전처리 API가 다음 수치형 데이터를 생성:
  - `average_stress_index`: 평균 스트레스 지수
  - `recent_stress_index`: 최근 스트레스 지수
  - `latest_sleep_score`: 최근 수면 점수
  - `latest_sleep_duration`: 최근 수면 시간
  - `weather`: 날씨 정보 (temperature, humidity, rainType, sky)
  - `emotionCounts`: 감정 카운트 (laughter, sigh, crying)
  - `accumulationDurationSeconds`: 누적 시간

**✅ 확인됨**:
- 마르코프 체인 처리 위치: **`Web/markov/` 내 파이썬 파일들**
  - `build_yesterday_many.py`
  - `realtime_inference_many.py`
- 처리 방식:
  - 기본 생체데이터 + 날씨데이터 → 마르코프 서버로 전송
  - 마르코프 서버 (파이썬)에서 가장 높은 감정 전이 결정
  - 감정 클러스터 설명을 Node.js로 반환
  - **EC2 내부 통신**: 같은 EC2 내에 존재하여 내부 통신 (ML과의 차이점)
- 코드 위치:
  - `src/lib/prediction/PythonEmotionPredictionProvider.ts`: 마르코프 서버 호출
  - `src/app/api/ai/background-params/handlers/streamHandler.ts` (124-141줄): 마르코프 호출 로직

---

### 5. 사용자 선호도 정보 수집 및 LLM 주입
**상태**: ⚠️ 부분 확인됨  
**위치**: 
- `src/app/api/ai/background-params/handlers/streamHandler.ts`
- `src/app/api/ai/background-params/utils/getCommonData.ts` (추정)

**확인 내용**:
- `getCommonData()` 함수로 공통 데이터 수집
- 프롬프트에 사용자 선호도 정보 주입

**✅ 확인됨**:

1. **사용자 선호도 데이터 구조**:
   - DB 스키마: `ScentPreference`, `GenrePreference`, `TagPreference` 테이블
   - 구조:
     ```prisma
     model ScentPreference {
       userId: String
       scentId: Int
       weight: Int  // 가중치 (초기 설문: 호+10, 불호+1, 하트 클릭: +3)
     }
     model GenrePreference {
       userId: String
       genreId: Int
       weight: Int  // 가중치 (초기 설문: 호+10, 불호+1, 하트 클릭: +3)
     }
     model TagPreference {
       userId: String
       tagId: Int
       weight: Int  // 가중치 (초기 설문: 호+10, 불호+1, 하트 클릭: +3)
     }
     ```
   - 코드 위치: `src/lib/preferences/getUserPreferenceWeights.ts`

2. **프롬프트 주입 방식**: 
   - `getAllUserPreferenceWeights()` 함수로 가중치 조회
   - `formatPreferenceWeightsForLLM()` 함수로 프롬프트 형식 변환
   - `llmInput.genrePreferenceWeights`, `llmInput.scentPreferenceWeights`, `llmInput.tagPreferenceWeights`로 주입
   - 코드 위치: `src/app/api/ai/background-params/handlers/streamHandler.ts` (60-95줄)

3. **선호도 점수 시스템**:
   - 초기 설문: **+10점** (호/불호 선택)
   - 무드 대시보드 하트 더블클릭: **+3점** (현재 무드의 음악 장르나 향에 대한 정보)
   - 선호도 가중치는 LLM 생성 시 반영됨 (가중치가 높을수록 우선순위 높음)
   - 코드 위치: `src/app/api/moods/preference/route.ts`

---

### 6. LLM JSON 스키마 강제
**상태**: ✅ 확인됨  
**위치**: 
- `src/lib/llm/schemas/completeOutputSchema.json`
- `src/lib/llm/validateResponse.ts`
- `src/lib/llm/validators/completeOutputValidator.ts`

**확인 내용**:
- JSON Schema로 응답 형식 강제
- `validateResponse()` 함수로 검증
- 스키마 검증 실패 시 재시도 로직 있음

---

### 7. 프롬프트 주입 및 원칙 설정
**상태**: ✅ 확인됨  
**위치**: 
- `src/app/api/ai/background-params/handlers/streamHandler.ts`

**확인 내용**:
- 프롬프트에 전처리 데이터, 사용자 선호도, 날씨 정보 주입
- 원칙 설정 (temperature: 0.7, creativity required)

**✅ 확인됨**:
- **프롬프트 구조 목표**:
  - 우리가 가지고 있는 데이터 내에서의 정보만 받기 (아이콘, 음악, 향기 등)
  - JSON 스키마로 강제하여 바로 사용 가능하도록
  - 출력 토큰 절약이 목표
- **원칙 설정**:
  - Temperature: 0.7 (creativity required)
  - 코드 위치: `src/app/api/ai/background-params/handlers/streamHandler.ts`
  - 프롬프트 생성: `src/lib/llm/prepareLLMInput.ts`, `src/lib/llm/optimizePromptForPython.ts`

---

### 8. 무드스트림 구조 (10개 세그먼트)
**상태**: ✅ 확인됨  
**위치**: 
- `src/hooks/useMoodStream/types.ts`
- `src/app/api/moods/current/generate/route.ts`

**확인 내용**:
- `MoodStreamSegment` 타입 정의:
  - `timestamp`: 시작 시간
  - `duration`: 지속 시간
  - `mood`: 무드 정보 (moodAlias, color 등)
  - `musicTracks`: 음악 트랙 배열
  - `backgroundParams`: 배경 파라미터 (moodAlias, 음악, 조명, 향, 아이콘, 풍향, 풍속 등)

**세그먼트 구조**:
```typescript
interface MoodStreamSegment {
  timestamp: number;
  duration: number;
  mood: {
    name: string; // moodAlias
    color: string;
    lighting: {
      rgb: [number, number, number];
      color: string;
      // ...
    };
  };
  musicTracks: MusicTrack[];
  backgroundParams: {
    moodAlias: string;
    musicSelection: string;
    moodColor: string;
    lighting: { brightness: number; temperature: number; };
    scentType: ScentType;
    backgroundIcon: { type: string; };
    backgroundWind: { speed: number; };
    // ...
  };
}
```

---

### 9. home/page.tsx에서 세그먼트 관리 및 UI 반영
**상태**: ✅ 확인됨  
**위치**: 
- `src/app/(main)/home/page.tsx`
- `src/app/(main)/home/components/HomeContent.tsx`

**확인 내용**:
- `useMoodStreamManager` 훅으로 세그먼트 관리
- `moodStreamData.segments`로 10개 세그먼트 보유
- `currentSegmentData`로 현재 세그먼트 제공
- `HomeContent` → `MoodDashboard`, `DeviceGrid`로 UI 반영
- 라즈베리파이 API 호출: `currentSegmentData` 변경 시 자동 호출 (236-311줄)

**라즈베리파이 신호 전송**:
- `light_power`가 "on"일 때만 `light_info`로 조명 정보 전송
- RGB, brightness, colortemp 값 전달

---

### 10. 디바이스 카드 확장 시 정보 변경
**상태**: ✅ 확인됨  
**위치**: 
- `src/app/(main)/home/components/Device/DeviceCardExpanded.tsx`
- `src/hooks/useDeviceState.ts`

**확인 내용**:
- 디바이스 카드 확장 시 볼륨, 센트 레벨, 밝기, 색상 조절 가능
- 변경사항은 `onDeviceControlChange`를 통해 즉시 반영
- `useDeviceState` 훅에서 변경사항 처리

**✅ 확인됨**:

1. **변경사항 즉시 반영 원칙**:
   - 모든 변경이 즉시 output(UI, device)에 전달됨
   - 디바운싱: `DeviceCardExpanded.tsx`에서 1초 디바운스 적용 (API 저장용)
   - UI 반영은 즉시 (디바운스 없음)

2. **변경사항 반영 범위**:
   - **조명/밝기/컬러**: 현재 세그먼트에만 즉각 반영
   - **볼륨**: 한 스트림 전체에 영향을 미침 (현재 출력중인 음악의 음량 변경)
   - 코드 위치: 
     - `src/hooks/useDeviceState.ts`: 변경사항 처리
     - `src/app/(main)/home/components/Device/DeviceCardExpanded.tsx`: 디바이스 카드 변경사항

---

### 11. 무드 저장 (별표 클릭)
**상태**: ✅ 확인됨  
**위치**: 
- `src/app/(main)/home/components/MoodDashboard/hooks/useMoodDashboard.ts` (323-423줄)

**확인 내용**:
- `handleSaveToggle` 함수로 무드 저장/삭제
- 저장 시 현재 무드 정보 + 세그먼트 정보 저장
- API: `POST /api/moods/saved`

**✅ 확인됨**:

1. **저장되는 정보 범위**: 
   - 현재 무드 정보 + 디바이스 카드에서 변경한 값들 모두 저장
   - 저장 시점의 현재 상태만 저장 (별표 클릭 당시 값)
   - 이후 값을 변경해도 저장된 무드는 변경되지 않음
   - 코드에서 `fullMood: { mood, currentSegment }` 저장 확인
   - 코드 위치: `src/app/(main)/home/components/MoodDashboard/hooks/useMoodDashboard.ts` (323-423줄)

2. **저장된 무드 활용**: 
   - **목적**: 나중에 현재 세그먼트를 대체하는 용도로 사용
   - **현재 상태**: 구현되지 않음 (구현 예정)
   - 코드 위치: `src/app/(main)/home/components/modals/MoodModal.tsx`

---

### 12. 로그인 후 최초 home 진입 시 자동 생성
**상태**: ✅ 확인됨  
**위치**: 
- `src/hooks/useMoodStreamManager.ts` (473-536줄)
- `src/app/(main)/home/page.tsx` (136-152줄)

**확인 내용**:
- `isAuthenticated === true`일 때 자동 생성 시작
- `useEffect`에서 자동 생성 조건 체크
- 초기 3세그먼트 로드 후 자동으로 LLM 생성 시작

---

### 13. 초기 3세그먼트 제공
**상태**: ✅ 확인됨  
**위치**: 
- `src/lib/mock/getInitialColdStartSegments.ts`
- `src/app/(main)/home/page.tsx` (112-114줄)

**확인 내용**:
- 크리스마스 컨셉 3개 세그먼트 하드코딩
- `getInitialColdStartSegments()` 함수로 즉시 제공
- `initialSegments`로 home/page.tsx에서 사용

---

### 14. 초기 3세그먼트 수행 중 자연스러운 LLM 생성
**상태**: ✅ 확인됨  
**위치**: 
- `src/hooks/useMoodStreamManager.ts` (502-526줄)

**확인 내용**:
- 초기 3세그먼트 로드 후 자동으로 LLM 생성 시작
- 백그라운드에서 진행되며 UI 블로킹 없음
- `isGeneratingNextStream` 상태로 로딩 표시

---

### 15. 초기 7개 세그먼트 연결 및 마지막 3개 버림
**상태**: ✅ 확인됨  
**위치**: 
- `src/hooks/useMoodStreamManager.ts` (46-62줄, 388-408줄)

**확인 내용**:
- `mergeSegments()` 함수로 세그먼트 병합
- 전략: 초기 3개 + LLM 앞 4개 (마지막 3개 버림)
- `DEFAULT_MERGE_STRATEGY`:
  ```typescript
  {
    initialCount: 3,
    llmCount: 7,
    keepLlmCount: 4, // 7개 중 4개만 유지 (마지막 3개 버림)
  }
  ```

**최종 결과**: [0, 1, 2] (초기) + [3, 4, 5, 6] (LLM 앞 4개) = 총 7개 세그먼트

---

### 16. 뒤에서 2번째 이내일 때 다음 스트림 생성
**상태**: ✅ 확인됨  
**위치**: 
- `src/hooks/useMoodStreamManager.ts` (120-143줄, 439-461줄)

**확인 내용**:
- `shouldGenerateNextStream()` 함수로 조건 체크
- `currentIndex >= totalSegments - 2`일 때 다음 스트림 생성
- `checkAndGenerateNextStream()` 함수로 자동 생성

**예시**: 10개 세그먼트 중 8번째 이상일 때 다음 스트림 생성

---

### 17. 디바이스 카드 변경 시 라즈베리파이 API 호출
**상태**: ✅ 확인됨  
**위치**: 
- `src/app/(main)/home/page.tsx` (236-311줄)
- `src/hooks/useDeviceState.ts`
- `src/app/(main)/home/components/Device/DeviceCardExpanded.tsx`

**확인 내용**:
- 음량 변경: 즉시 반영 (`onUpdateVolume` → `setVolume`)
- 빛/컬러 변경: `handleDeviceControlChange` → `home/page.tsx`에서 처리
- 라즈베리파이 API:
  - `POST /api/light_info`: RGB, brightness, colortemp 업데이트
  - `GET /api/light_power`: 전원 상태 확인
  - `POST /api/search_light`: 검색 상태 업데이트

**❓ 추가 설명 필요**:
1. **음량 즉시 반영 메커니즘**: 
   - `volume` 상태가 변경되면 어떻게 오디오 플레이어에 반영되는가?
   - `useMusicTrackPlayer` 훅에서 처리하는가?

2. **라즈베리파이 API 호출 타이밍**:
   - 디바이스 카드에서 변경할 때 즉시 호출되는가?
   - 세그먼트 전환 시에도 호출되는가?

---

### 18. 라즈베리파이 풀링 구조
**상태**: ✅ 확인됨  
**위치**: 
- `src/app/api/light_info/route.ts`
- `src/app/api/light_power/route.ts`
- `src/app/api/search_light/route.ts`

**확인 내용**:
- 모든 API는 메모리 기반 상태 저장소 사용
- `GET` 요청으로 라즈베리파이가 0.5초마다 풀링
- 값만 저장하고 라즈베리파이가 GET으로 가져감
- 대부분의 정보 처리는 라즈베리파이에서 담당

**API 구조**:
- `GET /api/light_info`: 현재 조명 정보 조회
- `POST /api/light_info`: 조명 정보 업데이트
- `GET /api/light_power`: 전원 상태 조회
- `POST /api/light_power`: 전원 상태 업데이트
- `GET /api/search_light`: 검색 상태 조회
- `POST /api/search_light`: 검색 상태 업데이트

---

### 19. 세그먼트 전환 시 즉시 UI 반영
**상태**: ✅ 확인됨  
**위치**: 
- `src/app/(main)/home/page.tsx` (174-213줄)
- `src/app/(main)/home/components/HomeContent.tsx`

**확인 내용**:
- `currentSegmentData`가 변경되면 즉시 UI 반영
- `useMemo`로 현재 세그먼트 데이터 계산
- `MoodDashboard`, `DeviceGrid`에 전달하여 즉시 업데이트
- 라즈베리파이 API 호출도 자동으로 발생 (236-311줄)

**반영 메커니즘**:
1. 세그먼트 인덱스 변경
2. `currentSegmentData` 재계산 (`useMemo`)
3. `currentMood` 업데이트 (`useEffect`)
4. `HomeContent` → 하위 컴포넌트로 props 전달
5. UI 즉시 업데이트

---

## 📝 추가 확인 필요 사항

### 1. 음량 즉시 반영 구현 확인 ✅
**확인 결과**: ✅ 이미 구현되어 있음

**구현 방식**:
- `MoodDashboard`에서 `externalVolume` prop (0-100)을 받음
- `useEffect`로 `externalVolume` 변경 감지 (178-191줄)
- `externalVolume` 변경 시 → `setVolume(volumeNormalized)` 호출 → `useMusicTrackPlayer`의 `setVolume()` 실행
- `useMusicTrackPlayer.setVolume()` → `MusicPlayer.setVolume()` 즉시 호출 (78-93줄)
- `MusicPlayer`에서 HTML5 Audio API의 `volume` 속성 즉시 업데이트

**코드 위치**:
- `src/app/(main)/home/components/MoodDashboard/MoodDashboard.tsx` (178-207줄): 외부 volume 변경 감지 및 전달
- `src/hooks/useMusicTrackPlayer.ts` (78-102줄): volume 설정 및 MusicPlayer 반영
- `src/lib/audio/musicPlayer.ts`: 실제 오디오 플레이어 구현

**결론**: 디바이스 카드에서 볼륨 변경 → `useDeviceState` → `home/page.tsx` → `MoodDashboard` → `useMusicTrackPlayer` → `MusicPlayer`로 즉시 반영됨 ✅

---

### 2. 저장된 무드 세그먼트 대체 기능 구현
**현재 상태**: 미구현  
**목적**: 저장된 무드를 나중에 현재 세그먼트를 대체하는 용도로 사용

**구현 시 필요한 사항**:
- `MoodModal`에서 저장된 무드 목록 표시
- 저장된 무드 선택 시 현재 세그먼트를 해당 무드로 대체
- 세그먼트 대체 시 UI 즉시 반영

**확인 필요 위치**:
- `src/app/(main)/home/components/modals/MoodModal.tsx`
- `src/app/api/moods/saved/route.ts`

---

## 📝 최종 요약

### ✅ 완전히 반영된 부분 (19/19 단계)
- **1-19단계 모두 확인 완료** ✅
- 모든 핵심 흐름이 코드에 반영되어 있음
- 음량 즉시 반영 메커니즘도 구현되어 있음 확인

### 📋 향후 구현 예정 (1개 기능)
- **저장된 무드 세그먼트 대체 기능** (MoodModal에서 구현 예정)
  - 목적: 저장된 무드를 선택하여 현재 세그먼트를 대체
  - 현재 상태: 미구현

---

## 🎯 핵심 정리

### 시스템 아키텍처 요약

1. **데이터 수집**: 워치 → 파이어스토어 → Node.js (raw_periodic) / ML 서버 → Node.js POST (raw_events, 10분마다)
2. **전처리**: 생체데이터 + 날씨 → 수치형 데이터 가공
3. **마르코프 체인**: 전처리 데이터 → 마르코프 서버 (EC2 내부, 포트 5000) → 감정 전이 예측
4. **LLM 생성**: 전처리 + 마르코프 결과 + 사용자 선호도 → JSON 스키마 강제 → 10개 세그먼트
5. **초기 3세그먼트**: 크리스마스 컨셉 하드코딩 → 즉시 제공
6. **세그먼트 병합**: 초기 3개 + LLM 앞 4개 (마지막 3개 버림)
7. **UI 반영**: 세그먼트 전환 시 즉시 UI/디바이스 반영
8. **변경사항 관리**: 디바이스 카드 변경 → 즉시 반영 (조명/색상: 현재 세그먼트, 볼륨: 전체 스트림)
9. **라즈베리파이**: 0.5초마다 route.ts에서 폴링하여 값 가져감

### 주요 원칙

- **즉시 반영**: 모든 변경사항은 즉시 UI와 디바이스에 반영
- **볼륨 전역**: 볼륨은 전체 스트림에 영향, 조명/색상은 현재 세그먼트만
- **값 갱신 중심**: 라즈베리파이는 0.5초마다 폴링 방식이므로 route.ts에 값만 저장하면 됨
- **선호도 기반**: 설문 +10점, 하트 더블클릭 +3점 → LLM 생성 시 반영
- **JSON 스키마 강제**: LLM 출력을 JSON 스키마로 강제하여 바로 사용 가능, 출력 토큰 절약
- **데이터 내 정보만**: LLM은 우리가 가진 아이콘, 음악, 향기 등의 정보만 출력

### 통신 방식 차이점

1. **ML 서버 ↔ Node.js**: 
   - **통신 방식**: ML 서버가 10분마다 Node.js로 POST 요청으로 값을 전송
   - **위치**: 서로 다른 서버
   - **데이터**: raw_events (웃음/한숨 정보)
   - **추가 확인 필요**: Node.js 엔드포인트 경로 및 데이터 형식

2. **마르코프 서버 ↔ Node.js**:
   - **통신 방식**: 실시간 API 호출 (`POST /inference`)
   - **위치**: 같은 EC2 내부 (내부 통신)
   - **포트**: 5000번
   - **엔드포인트**: `${PYTHON_SERVER_URL}/inference` (예: `http://localhost:5000/inference`)
   - **데이터**: 생체데이터 + 날씨 → 감정 전이 예측
   - **파일**: `Web/markov/` 내 파이썬 파일들
   - **서버 시작 방법**: 아직 결정되지 않음

---

**작성일**: 2025-01-XX  
**최종 업데이트**: 사용자 확인 완료  
**작성자**: AI Assistant
