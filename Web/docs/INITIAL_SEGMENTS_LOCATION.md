# 크리스마스 컨셉 초기 3세그먼트 위치

## 📍 위치

### 1. 생성 함수
**파일**: `src/lib/mock/getInitialColdStartSegments.ts`
- 함수: `getInitialColdStartSegments()`
- 크리스마스 컨셉 3개 세그먼트 생성
- DB에서 실제 캐롤 음악 가져오기
- 실패 시 폴백 세그먼트 반환

### 2. API 엔드포인트
**파일**: `src/app/api/moods/carol-segments/route.ts`
- GET `/api/moods/carol-segments`
- `getInitialColdStartSegments()` 호출
- 세그먼트 배열 반환

### 3. 사용 위치
**파일**: `src/hooks/useMoodStreamManager.ts`
- 함수: `loadInitialSegments()`
- 로그인 후 최초 home 진입 시 자동 호출
- `/api/moods/carol-segments` API 호출
- 초기 세그먼트 로드 후 `isLoading: false` 설정

## 📋 세그먼트 구성

### 세그먼트 1
- 색상: `#DC143C` (크리스마스 레드)
- 아이콘: `["snowflake", "star", "gift", "bell", "candle", "tree"]`
- 무드: "Festive Christmas Vibes"
- 향: Woody - "Wood"

### 세그먼트 2
- 색상: `#228B22` (크리스마스 그린)
- 아이콘: `["tree", "bell", "candle", "snowflake", "star", "gift"]`
- 무드: "Cozy Green Retreat"
- 향: Spicy - "Cinnamon Stick"

### 세그먼트 3
- 색상: `#FFD700` (골드)
- 아이콘: `["star", "sparkles", "gift", "bell", "snowflake", "tree"]`
- 무드: "Golden Holiday Cheer"
- 향: Floral

## 🎵 음악

DB에서 캐롤 장르 음악 가져오기 (musicID 60-69)
- 처음 3개 선택 (musicID 60, 61, 62)
- 실패 시 폴백 음악 사용:
  - "All I want for christmas" (Mariah Carey)
  - "Last Christmas" (Wham!)
  - "Jingle bell rock" (Bobby Helms)

## 🔄 흐름

1. 로그인 후 최초 home 진입
2. `useMoodStreamManager`의 `loadInitialSegments()` 호출
3. `/api/moods/carol-segments` API 호출
4. `getInitialColdStartSegments()` 실행
5. DB에서 캐롤 음악 조회
6. 3개 세그먼트 생성
7. `moodStreamData`에 저장 (`isLoading: false`)
8. 첫 번째 세그먼트로 `currentMood` 초기화
9. UI에 즉시 표시 (스켈레톤 숨김)

