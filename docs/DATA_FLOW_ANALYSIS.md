# 데이터 흐름 분석 및 개선 제안

## 현재 데이터 흐름 구조

### 1. LLM 호출 및 데이터 생성

```
[API Route] /api/moods/current/generate
  ↓
[LLM 호출] OpenAI API
  ↓
[응답] CompleteSegmentOutput[] (10개 세그먼트)
  ↓
[MoodStreamSegment[]] 변환
```

**위치**: `Web/src/app/api/moods/current/generate/route.ts`

**호출 시점**:
- 초기 콜드스타트: `useColdStart` → `/api/moods/current` (3개 세그먼트)
- 자동 생성: `useAutoGeneration` → `/api/moods/current/generate` (7개 세그먼트)
- 새로고침: `useRefresh` → `/api/moods/current/generate` (10개 세그먼트)

### 2. 데이터 저장 및 관리

```
[MoodStreamContext] (전역 Context)
  ├─ moodStream: MoodStream | null
  │   ├─ streamId: string
  │   ├─ segments: MoodStreamSegment[] (10개)
  │   └─ currentMood: MoodStreamSegment["mood"]
  ├─ currentSegmentIndex: number (0-9)
  └─ updateCurrentSegment: (updates) => void
```

**위치**: `Web/src/context/MoodStreamContext.tsx`

**관리 훅**: `Web/src/hooks/useMoodStream/index.ts`
- `useMoodStream()`: 메인 훅
- `useColdStart()`: 초기 3개 세그먼트 생성
- `useAutoGeneration()`: 자동 7개 세그먼트 생성
- `useStreamTransition()`: 스트림 전환 관리
- `useRefresh()`: 새로고침 관리

### 3. 데이터 전달 경로

#### 현재 구조 (복잡함)

```
home/page.tsx
  ├─ useDevices() → devices 상태
  ├─ useMood() → currentMood 상태
  └─ HomeContent
      ├─ useMoodStreamContext() → moodStream, currentSegmentIndex
      ├─ useBackgroundParams() → backgroundParams (LLM 배경 파라미터)
      ├─ useDeviceSync() → 디바이스 동기화
      ├─ deviceGridMood (useMemo) → 현재 세그먼트 기반 Mood 변환
      ├─ MoodDashboard
      │   ├─ moodStream.segments[currentSegmentIndex] 직접 접근
      │   └─ backgroundParams 직접 접근
      └─ DeviceGrid
          ├─ deviceGridMood 전달
          └─ DeviceCardSmall/Expanded
              └─ currentMood 전달
```

**문제점**:
1. **데이터 소스 분산**: `moodStream`, `currentMood`, `backgroundParams`가 각각 다른 곳에서 관리됨
2. **변환 로직 분산**: `deviceGridMood`, `convertSegmentMoodToMood` 등 여러 곳에서 변환
3. **인덱스 관리 분산**: `currentSegmentIndex`가 Context에 있지만 각 컴포넌트에서 직접 접근
4. **중복 변환**: 같은 세그먼트 데이터를 여러 컴포넌트에서 각각 변환

### 4. 각 컴포넌트별 데이터 접근 방식

#### HomeContent.tsx
```typescript
// 1. Context에서 moodStream 가져오기
const { moodStream, currentSegmentIndex } = useMoodStreamContext();

// 2. LLM 배경 파라미터 별도 관리
const { backgroundParams } = useBackgroundParams(moodStream, shouldFetchLLM, currentSegmentIndex);

// 3. 현재 세그먼트를 Mood 타입으로 변환
const deviceGridMood = useMemo(() => {
  const currentSegment = moodStream.segments[currentSegmentIndex];
  return convertSegmentMoodToMood(currentSegment.mood, currentMood, currentSegment);
}, [currentMood, backgroundParams, moodStream, currentSegmentIndex]);

// 4. currentMood 초기화 (useEffect)
useEffect(() => {
  const currentSegment = moodStream.segments[currentSegmentIndex];
  const convertedMood = convertSegmentMoodToMood(currentSegment.mood, currentMood, currentSegment);
  onMoodChange(convertedMood);
}, [moodStream, currentSegmentIndex, currentMood, onMoodChange]);
```

#### MoodDashboard.tsx
```typescript
// 1. Context에서 직접 접근
const { moodStream, currentSegmentIndex } = useMoodStreamContext();

// 2. 현재 세그먼트 직접 접근
const currentSegment = moodStream?.segments[currentSegmentIndex];

// 3. backgroundParams 별도 전달받음
const { backgroundParams } = props;
```

#### DeviceCardSmall/Expanded.tsx
```typescript
// 1. currentMood를 props로 받음
const { currentMood } = props;

// 2. device.output에서 직접 값 가져오기
const lightColor = device.output.color || currentMood?.color;
```

### 5. LLM 배경 파라미터 관리

```
useBackgroundParams(moodStream, shouldFetchLLM, currentSegmentIndex)
  ↓
[API 호출] /api/ai/background-params
  ↓
[응답] BackgroundParamsResponse (10개 세그먼트 배열)
  ↓
[상태] backgroundParams: BackgroundParams | null (현재 세그먼트만)
  ↓
[상태] allSegmentsParams: BackgroundParams[] | null (전체 10개)
```

**위치**: `Web/src/hooks/useBackgroundParams.ts`

**문제점**:
- `backgroundParams`는 현재 세그먼트만 저장 (단일 객체)
- `allSegmentsParams`는 전체 10개 저장하지만 사용처가 제한적
- `moodStream.segments`와 `backgroundParams`가 분리되어 관리됨

---

## 사용자 제안 구조

### 제안: home/page.tsx에서 중앙 집중식 관리

```
home/page.tsx
  ├─ [상태] moodStreamData: {
  │     streamId: string
  │     segments: MoodStreamSegment[] (10개)
  │     backgroundParams: BackgroundParams[] (10개) ← LLM 결과 통합
  │     currentIndex: number
  │   }
  ├─ [함수] getCurrentSegmentData() → 현재 인덱스의 통합 데이터
  └─ 각 모달/컴포넌트로 props 전달
      ├─ MoodDashboard → getCurrentSegmentData()
      ├─ DeviceGrid → getCurrentSegmentData()
      └─ DeviceCard → getCurrentSegmentData()
```

### 장점
1. **단일 소스**: 모든 데이터가 `home/page.tsx`에 집중
2. **명확한 흐름**: LLM → page.tsx → 컴포넌트
3. **변환 로직 통합**: 한 곳에서만 변환
4. **인덱스 관리 통합**: `currentIndex` 변경 시 모든 컴포넌트 자동 업데이트

---

## 현재 구조 vs 제안 구조 비교

### 현재 구조의 문제점

1. **데이터 소스 분산**
   - `moodStream`: Context
   - `backgroundParams`: HomeContent의 useBackgroundParams
   - `currentMood`: home/page.tsx의 useMood
   - 각각 다른 훅에서 관리되어 동기화 복잡

2. **변환 로직 중복**
   - `convertSegmentMoodToMood`: 여러 곳에서 호출
   - `deviceGridMood`: HomeContent에서 계산
   - 각 컴포넌트에서 필요한 형태로 재변환

3. **인덱스 관리 분산**
   - `currentSegmentIndex`: Context
   - 각 컴포넌트에서 `moodStream.segments[index]` 직접 접근
   - 인덱스 변경 시 여러 곳에서 업데이트 필요

4. **LLM 데이터 분리**
   - `moodStream.segments`: 기본 무드 데이터
   - `backgroundParams`: LLM 배경 파라미터
   - 두 데이터가 분리되어 통합 관리 어려움

### 제안 구조의 장점

1. **중앙 집중식 관리**
   ```typescript
   // home/page.tsx
   const [moodStreamData, setMoodStreamData] = useState({
     streamId: "",
     segments: [], // 10개 세그먼트
     backgroundParams: [], // 10개 LLM 파라미터
     currentIndex: 0,
   });
   
   // 현재 세그먼트 통합 데이터
   const currentSegmentData = useMemo(() => {
     const segment = moodStreamData.segments[moodStreamData.currentIndex];
     const bgParams = moodStreamData.backgroundParams[moodStreamData.currentIndex];
     return {
       ...segment,
       backgroundParams: bgParams,
     };
   }, [moodStreamData]);
   ```

2. **명확한 데이터 흐름**
   ```
   LLM API 호출
     ↓
   home/page.tsx에서 통합 저장
     ↓
   currentSegmentData 계산
     ↓
   props로 각 컴포넌트 전달
   ```

3. **변환 로직 통합**
   ```typescript
   // home/page.tsx에서 한 번만 변환
   const getCurrentMood = () => {
     return convertSegmentToMood(currentSegmentData);
   };
   ```

4. **인덱스 변경 시 자동 업데이트**
   ```typescript
   // currentIndex 변경 시
   setMoodStreamData(prev => ({ ...prev, currentIndex: newIndex }));
   // → currentSegmentData 자동 재계산
   // → 모든 컴포넌트 자동 업데이트
   ```

---

## 구현 가능성 분석

### ✅ 구현 가능한 부분

1. **home/page.tsx에서 데이터 관리**
   - `moodStream` 상태를 `home/page.tsx`로 이동 가능
   - `backgroundParams`도 함께 관리 가능
   - `currentSegmentIndex`도 함께 관리 가능

2. **통합 데이터 구조**
   ```typescript
   interface MoodStreamData {
     streamId: string;
     segments: MoodStreamSegment[];
     backgroundParams: BackgroundParams[]; // LLM 결과 통합
     currentIndex: number;
   }
   ```

3. **현재 세그먼트 데이터 제공 함수**
   ```typescript
   const getCurrentSegmentData = () => {
     return {
       segment: moodStreamData.segments[moodStreamData.currentIndex],
       backgroundParams: moodStreamData.backgroundParams[moodStreamData.currentIndex],
     };
   };
   ```

### ⚠️ 주의사항

1. **Context 제거 시 영향**
   - 현재 `MoodStreamContext`를 사용하는 모든 컴포넌트 수정 필요
   - 페이지 이동 시 상태 유지 방법 재검토 필요

2. **LLM 호출 타이밍**
   - 현재는 `useBackgroundParams`에서 조건부 호출
   - `home/page.tsx`로 이동 시 호출 로직도 함께 이동 필요

3. **자동 생성 로직**
   - `useAutoGeneration`이 백그라운드에서 자동 호출
   - `home/page.tsx`에서도 동일한 로직 구현 필요

---

## 권장 개선 방안

### 단계적 리팩토링

#### Phase 1: 데이터 구조 통합
1. `MoodStreamData` 인터페이스 정의
2. `backgroundParams`를 `moodStream.segments`에 통합
3. 각 세그먼트에 `backgroundParams` 필드 추가

#### Phase 2: 상태 관리 이동
1. `home/page.tsx`에 `moodStreamData` 상태 추가
2. `MoodStreamContext`에서 데이터 가져와서 `home/page.tsx`로 이동
3. `currentSegmentIndex`도 함께 이동

#### Phase 3: 컴포넌트 리팩토링
1. `HomeContent`에서 직접 Context 접근 제거
2. `getCurrentSegmentData()` 함수로 통합 데이터 제공
3. 모든 하위 컴포넌트에 props로 전달

#### Phase 4: Context 제거 (선택적)
1. `MoodStreamContext` 사용처 확인
2. 다른 페이지에서 사용하지 않으면 제거
3. 사용한다면 최소한의 상태만 유지

---

## 결론

### 현재 구조의 문제
- 데이터 소스 분산 (Context, HomeContent, page.tsx)
- 변환 로직 중복 (여러 곳에서 각각 변환)
- 인덱스 관리 분산 (각 컴포넌트에서 직접 접근)

### 제안 구조의 장점
- ✅ 중앙 집중식 관리 (home/page.tsx)
- ✅ 명확한 데이터 흐름 (LLM → page → 컴포넌트)
- ✅ 변환 로직 통합 (한 곳에서만 변환)
- ✅ 인덱스 변경 시 자동 업데이트

### 구현 가능성
- ✅ **완전히 구현 가능**
- 단계적 리팩토링으로 안전하게 진행 가능
- 기존 기능 유지하면서 개선 가능

### 권장 사항
1. **Phase 1부터 시작**: 데이터 구조 통합
2. **점진적 이동**: Context → page.tsx로 단계적 이동
3. **테스트 강화**: 각 단계마다 기능 테스트

---

## 다음 단계

1. 사용자 확인: 제안 구조 승인 여부
2. Phase 1 시작: 데이터 구조 통합
3. 단계별 구현 및 테스트

