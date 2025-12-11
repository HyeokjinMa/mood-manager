# 🔄 다음 스트림 전환 기능 구현 계획서

## 📋 현재 상태 분석

### ✅ 구현되어 있는 부분

1. **백그라운드 스트림 생성 조건 감지**
   - `shouldGenerateNextStream`: `currentIndex >= totalSegments - 2` (인덱스 8, 9, 10에서 true)
   - `checkAndGenerateNextStream`: 조건 만족 시 `generateAndMergeStream` 호출
   - `isGeneratingNextStream` 상태로 백그라운드 생성 중 표시

2. **세그먼트 생성**
   - `generateAndMergeStream`: LLM을 호출하여 새 세그먼트 10개 생성
   - 재시도 로직 포함
   - 타임아웃 처리 포함

### ❌ 구현되지 않은 부분

1. **백그라운드에서 생성된 다음 스트림 저장**
   - 현재는 생성된 세그먼트를 기존 세그먼트에 **추가**만 함 (`[...prev.segments, ...newSegments]`)
   - 다음 스트림을 별도로 저장하지 않음

2. **10번 세그먼트 종료 시 새 스트림으로 전환**
   - 현재 세그먼트가 10번(인덱스 9)에서 끝날 때 새 스트림으로 전환하는 로직 없음
   - 세그먼트 자동 전환 로직 확인 필요

3. **다음 버튼 클릭 시 새 스트림으로 전환**
   - 다음 버튼을 눌렀을 때 새 스트림이 있으면 전환하는 로직 없음
   - 단순히 `currentIndex`만 증가시킴

---

## 🎯 요구사항

1. **백그라운드 생성**: 8, 9, 10번 세그먼트(인덱스 7, 8, 9)에서 다음 스트림 10개를 백그라운드로 미리 생성
2. **별도 저장**: 생성된 다음 스트림을 기존 세그먼트와 분리하여 저장
3. **자동 전환**: 10번 세그먼트가 끝나면 자연스럽게 새 스트림으로 전환
4. **수동 전환**: 다음 버튼을 눌러 10번 세그먼트를 넘어가면 새 스트림으로 전환
5. **온전한 세팅**: 새 스트림의 10개 세그먼트가 모두 준비되어 있어야 함

---

## 🔧 구현 계획

### Phase 1: 상태 구조 개선

#### 1.1 MoodStreamData 타입 확장

```typescript
interface MoodStreamData {
  streamId: string;
  segments: MoodStreamSegment[];
  currentIndex: number;
  isLoading: boolean;
  isGeneratingNextStream: boolean;
  // ✅ 추가: 다음 스트림 정보
  nextStream?: {
    segments: MoodStreamSegment[];
    streamId: string;
    isReady: boolean;
  };
}
```

#### 1.2 다음 스트림 저장 로직 수정

**현재 (문제):**
```typescript
// generateAndMergeStream에서
setMoodStreamData(prev => ({
  ...prev,
  segments: [...prev.segments, ...newSegments], // ❌ 추가만 함
  isGeneratingNextStream: false,
}));
```

**개선 후:**
```typescript
// generateAndMergeStream에서
setMoodStreamData(prev => {
  // 초기 병합인지 확인
  const hasInitialSegments = 
    segmentsToUse.length === DEFAULT_MERGE_STRATEGY.initialCount && 
    segmentsToUse[0]?.backgroundParams?.source === "initial";
  
  if (hasInitialSegments && segmentCount >= DEFAULT_MERGE_STRATEGY.keepLlmCount) {
    // 초기 병합: 기존 세그먼트에 추가
    return {
      ...prev,
      segments: mergedSegments,
      isGeneratingNextStream: false,
    };
  } else {
    // 다음 스트림 생성: nextStream에 저장 (기존 세그먼트는 유지)
    return {
      ...prev,
      nextStream: {
        segments: newSegments,
        streamId: `stream-${Date.now()}`,
        isReady: true,
      },
      isGeneratingNextStream: false,
    };
  }
});
```

---

### Phase 2: 스트림 전환 로직 구현

#### 2.1 세그먼트 인덱스 증가 시 전환 체크

**위치**: `home/page.tsx` 또는 `useMoodStreamManager.ts`

```typescript
const handleNextSegment = useCallback(() => {
  const nextIndex = moodStreamData.currentIndex + 1;
  
  // 현재 세그먼트가 마지막이고, 다음 스트림이 준비되어 있으면 전환
  if (nextIndex >= moodStreamData.segments.length && 
      moodStreamData.nextStream?.isReady) {
    
    // 새 스트림으로 전환
    setMoodStreamData(prev => ({
      ...prev,
      streamId: prev.nextStream!.streamId,
      segments: prev.nextStream!.segments,
      currentIndex: 0, // 새 스트림의 첫 번째 세그먼트로
      nextStream: undefined, // 다음 스트림 초기화
    }));
    
    // 전환 후 다시 다음 스트림 생성 시작
    checkAndGenerateNextStream();
    
  } else if (nextIndex < moodStreamData.segments.length) {
    // 일반적인 경우: 인덱스만 증가
    setMoodStreamData(prev => ({
      ...prev,
      currentIndex: nextIndex,
    }));
    
    // 인덱스가 8, 9, 10이 되면 다음 스트림 생성 체크
    checkAndGenerateNextStream();
  }
}, [moodStreamData, checkAndGenerateNextStream]);
```

#### 2.2 세그먼트 자동 전환 (타이머 기반)

**위치**: `home/page.tsx`의 세그먼트 타이머

```typescript
useEffect(() => {
  if (!currentSegmentData?.segment || !playing) {
    return;
  }
  
  const duration = currentSegmentData.segment.duration;
  const timer = setTimeout(() => {
    // 현재 세그먼트가 마지막이고, 다음 스트림이 준비되어 있으면 전환
    if (moodStreamData.currentIndex === moodStreamData.segments.length - 1 &&
        moodStreamData.nextStream?.isReady) {
      
      setMoodStreamData(prev => ({
        ...prev,
        streamId: prev.nextStream!.streamId,
        segments: prev.nextStream!.segments,
        currentIndex: 0,
        nextStream: undefined,
      }));
      
      checkAndGenerateNextStream();
      
    } else {
      // 일반적인 다음 세그먼트로 이동
      handleNextSegment();
    }
  }, duration);
  
  return () => clearTimeout(timer);
}, [currentSegmentData, playing, moodStreamData, handleNextSegment, checkAndGenerateNextStream]);
```

---

### Phase 3: 백그라운드 생성 조건 개선

#### 3.1 초기 병합과 다음 스트림 생성 구분

```typescript
const checkAndGenerateNextStream = useCallback(() => {
  // 스트림이 로드되지 않았거나 생성 중이면 스킵
  if (moodStreamData.isLoading || moodStreamData.isGeneratingNextStream) {
    return;
  }

  // 세그먼트가 없으면 스킵
  if (!moodStreamData.segments || moodStreamData.segments.length === 0) {
    return;
  }

  // 초기 병합인지 확인
  const isInitialMerge = 
    moodStreamData.segments.length === DEFAULT_MERGE_STRATEGY.initialCount + DEFAULT_MERGE_STRATEGY.keepLlmCount &&
    moodStreamData.segments[0]?.backgroundParams?.source === "initial";

  // 뒤에서 2번째 이내인지 체크
  if (shouldGenerateNextStream(moodStreamData.currentIndex, moodStreamData.segments.length)) {
    if (isInitialMerge) {
      // 초기 병합 후 첫 번째 다음 스트림 생성
      generateAndMergeStream(10);
    } else {
      // 이미 스트림이 있으면 다음 스트림 생성 (nextStream에 저장)
      generateAndMergeStream(10);
    }
  }
}, [
  moodStreamData.isLoading,
  moodStreamData.isGeneratingNextStream,
  moodStreamData.segments,
  moodStreamData.currentIndex,
  generateAndMergeStream,
]);
```

---

### Phase 4: UI 표시 개선

#### 4.1 다음 스트림 준비 상태 표시

```typescript
// 다음 스트림이 준비 중이면 로딩 인디케이터 표시
{moodStreamData.isGeneratingNextStream && (
  <div className="loading-indicator">
    다음 스트림 준비 중...
  </div>
)}

// 다음 스트림이 준비되었으면 미리 알림
{moodStreamData.nextStream?.isReady && (
  <div className="next-stream-ready">
    다음 스트림 준비 완료 (자동 전환 예정)
  </div>
)}
```

---

## 📝 구현 단계별 체크리스트

### Step 1: 타입 정의 ✅
- [ ] `MoodStreamData` 타입에 `nextStream` 필드 추가
- [ ] `useMoodStreamManager.ts`에서 타입 적용

### Step 2: 백그라운드 생성 로직 수정 ✅
- [ ] `generateAndMergeStream`에서 초기 병합과 다음 스트림 생성 구분
- [ ] 다음 스트림 생성 시 `nextStream`에 저장 (기존 세그먼트는 유지)
- [ ] 초기 병합은 기존 로직 유지

### Step 3: 스트림 전환 로직 구현 ✅
- [ ] `handleNextSegment` 함수에서 전환 로직 추가
- [ ] 세그먼트 타이머에서 자동 전환 로직 추가
- [ ] 전환 시 `currentIndex`를 0으로 리셋

### Step 4: 다음 스트림 재생성 트리거 ✅
- [ ] 새 스트림으로 전환된 후 `checkAndGenerateNextStream` 호출
- [ ] 인덱스 8, 9, 10에서 다시 다음 스트림 생성 시작

### Step 5: 테스트 및 디버깅 ✅
- [ ] 초기 3개 + LLM 7개 = 10개 세그먼트 정상 작동 확인
- [ ] 인덱스 8에서 다음 스트림 생성 시작 확인
- [ ] 인덱스 9, 10에서도 계속 체크 확인
- [ ] 10번 세그먼트 종료 시 자동 전환 확인
- [ ] 다음 버튼으로 10번 세그먼트 넘어갈 때 전환 확인
- [ ] 새 스트림의 10개 세그먼트가 모두 준비되어 있는지 확인

---

## 🚨 주의사항

1. **초기 병합 로직 유지**
   - 초기 3개 + LLM 7개 병합은 기존 로직 유지
   - 이후 스트림부터 `nextStream`에 저장

2. **전환 시점**
   - 10번 세그먼트가 끝나는 순간 전환
   - 다음 버튼으로 10번 세그먼트를 넘어갈 때 전환
   - 두 경우 모두 동일한 전환 로직 사용

3. **에러 처리**
   - 다음 스트림 생성 실패 시 기존 세그먼트 계속 재생
   - 재시도 로직 유지

4. **성능 최적화**
   - 백그라운드 생성이 UI 블로킹을 일으키지 않도록
   - `isGeneratingNextStream` 상태로 중복 생성 방지

---

## 📊 예상 동작 흐름

### 시나리오 1: 자동 전환

```
1. 초기 3개 + LLM 7개 = 10개 세그먼트 로드
2. 세그먼트 0 → 1 → 2 → ... → 7 재생
3. 세그먼트 8 진입 시: checkAndGenerateNextStream() 호출
   → 백그라운드에서 다음 스트림 10개 생성 시작
4. 세그먼트 8 → 9 재생 (생성 중...)
5. 세그먼트 10 진입: 다음 스트림 생성 완료 대기
6. 세그먼트 10 종료: nextStream이 준비되어 있으면 전환
   → streamId 변경, segments 교체, currentIndex = 0
   → checkAndGenerateNextStream() 다시 호출
7. 새 스트림의 세그먼트 0부터 재생 시작
```

### 시나리오 2: 수동 전환 (다음 버튼)

```
1. 세그먼트 10 재생 중
2. 사용자가 다음 버튼 클릭
3. currentIndex = 10 (마지막)
4. nextStream이 준비되어 있으면:
   → streamId 변경, segments 교체, currentIndex = 0
   → checkAndGenerateNextStream() 다시 호출
5. 새 스트림의 세그먼트 0부터 재생 시작
```

---

**작성일**: 2025-01-XX  
**상태**: 계획 완료, 구현 대기
