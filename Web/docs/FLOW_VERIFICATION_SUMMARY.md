# 🔄 시스템 흐름 검증 요약

## ✅ 검증 완료 (19/19 단계)

모든 흐름이 코드베이스에 잘 반영되어 있습니다.

---

## 📋 단계별 확인 결과

| 단계 | 내용 | 상태 | 확인 위치 |
|------|------|------|-----------|
| 1 | 워치 → 파이어스토어 데이터 전송 | ✅ | README.md |
| 2 | raw_periodic/raw_events 수집 | ✅ | `src/app/api/preprocessing/route.ts` |
| 3 | 날씨/계절/온도 정보 수집 | ✅ | `src/lib/weather/fetchWeather.ts` |
| 4 | 수치형 데이터 가공 (전처리) | ✅ | `src/app/api/preprocessing/route.ts` |
| 5 | 사용자 선호도 + LLM 주입 | ✅ | `src/app/api/ai/background-params/handlers/streamHandler.ts` |
| 6 | LLM JSON 스키마 강제 | ✅ | `src/lib/llm/validateResponse.ts` |
| 7 | 프롬프트 주입 및 원칙 설정 | ✅ | `src/lib/llm/prepareLLMInput.ts` |
| 8 | 무드스트림 구조 (10개 세그먼트) | ✅ | `src/hooks/useMoodStream/types.ts` |
| 9 | home/page.tsx에서 세그먼트 관리 | ✅ | `src/app/(main)/home/page.tsx` |
| 10 | 디바이스 카드 확장 시 정보 변경 | ✅ | `src/app/(main)/home/components/Device/DeviceCardExpanded.tsx` |
| 11 | 무드 저장 (별표 클릭) | ✅ | `src/app/(main)/home/components/MoodDashboard/hooks/useMoodDashboard.ts` |
| 12 | 로그인 후 최초 home 진입 시 자동 생성 | ✅ | `src/hooks/useMoodStreamManager.ts` |
| 13 | 초기 3세그먼트 제공 | ✅ | `src/lib/mock/getInitialColdStartSegments.ts` |
| 14 | 초기 3세그먼트 수행 중 LLM 생성 | ✅ | `src/hooks/useMoodStreamManager.ts` |
| 15 | 초기 7개 세그먼트 연결 및 마지막 3개 버림 | ✅ | `src/hooks/useMoodStreamManager.ts` (mergeSegments) |
| 16 | 뒤에서 2번째 이내일 때 다음 스트림 생성 | ✅ | `src/hooks/useMoodStreamManager.ts` (shouldGenerateNextStream) |
| 17 | 디바이스 카드 변경 시 라즈베리파이 API 호출 | ✅ | `src/hooks/useDeviceState.ts` |
| 18 | 라즈베리파이 풀링 구조 | ✅ | `src/app/api/light_info/route.ts` |
| 19 | 세그먼트 전환 시 즉시 UI 반영 | ✅ | `src/app/(main)/home/page.tsx` |

---

## 🎯 핵심 통신 구조

### 1. ML 서버 ↔ Node.js
- **방식**: ML 서버가 10분마다 Node.js로 값 전송
- **위치**: 서로 다른 서버
- **데이터**: raw_events (웃음/한숨 정보)

### 2. 마르코프 서버 ↔ Node.js
- **방식**: 실시간 API 호출 (`/inference`)
- **위치**: 같은 EC2 내부 (내부 통신)
- **데이터**: 생체데이터 + 날씨 → 감정 전이 예측
- **파일**: `Web/markov/` 내 파이썬 파일들

### 3. 라즈베리파이 ↔ Node.js
- **방식**: 라즈베리파이가 0.5초마다 폴링
- **API**: `GET /api/light_info`, `GET /api/light_power`, `GET /api/search_light`
- **원칙**: route.ts에 값만 저장하면 자동으로 전달됨

---

## 📝 주요 원칙

1. **즉시 반영**: 모든 변경사항은 즉시 UI와 디바이스에 반영
2. **볼륨 전역**: 볼륨은 전체 스트림에 영향, 조명/색상은 현재 세그먼트만
3. **값 갱신 중심**: 라즈베리파이는 폴링 방식이므로 route.ts에 값만 저장
4. **선호도 기반**: 설문 +10점, 하트 더블클릭 +3점 → LLM 생성 시 반영
5. **JSON 스키마 강제**: LLM 출력을 JSON 스키마로 강제하여 바로 사용 가능, 출력 토큰 절약
6. **데이터 내 정보만**: LLM은 우리가 가진 아이콘, 음악, 향기 등의 정보만 출력

---

## 📋 향후 구현 예정

### 저장된 무드 세그먼트 대체 기능
- **목적**: 저장된 무드를 선택하여 현재 세그먼트를 대체
- **현재 상태**: 미구현
- **구현 위치**: `src/app/(main)/home/components/modals/MoodModal.tsx`

---

**작성일**: 2025-01-XX  
**검증 완료**: 19/19 단계
