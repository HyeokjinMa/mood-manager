# 데이터 흐름 리팩토링 계획

## 목표

**중앙 집중식 데이터 관리**: `home/page.tsx`에서 모든 무드스트림 데이터를 관리하고, 각 컴포넌트로 명확하게 전달

## 최종 구조

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

---

## Phase 1: 데이터 구조 통합

### 목표
- `backgroundParams`를 `MoodStreamSegment`에 통합
- 각 세그먼트가 자신의 LLM 배경 파라미터를 포함하도록 변경

### 작업 내용

#### 1.1 타입 정의 수정
**파일**: `Web/src/hooks/useMoodStream/types.ts`

```typescript
// 기존
export interface MoodStreamSegment {
  timestamp: number;
  duration: number;
  mood: { ... };
  musicTracks: MusicTrack[];
  backgroundIcon?: { ... };
  // ...
}

// 변경 후
export interface MoodStreamSegment {
  timestamp: number;
  duration: number;
  mood: { ... };
  musicTracks: MusicTrack[];
  backgroundParams?: BackgroundParams; // ← 통합!
  // 기존 필드들은 backgroundParams 내부로 이동 가능
}
```

#### 1.2 LLM 응답 처리 수정
**파일**: `Web/src/app/api/moods/current/generate/route.ts`

- LLM 응답을 받아서 각 세그먼트에 `backgroundParams` 필드로 저장
- 10개 세그먼트 각각에 해당하는 `BackgroundParams` 매핑

#### 1.3 초기 세그먼트 생성 수정
**파일**: `Web/src/lib/mock/getInitialColdStartSegments.ts`

- 초기 3개 캐롤 세그먼트에도 `backgroundParams` 필드 추가 (null 또는 기본값)

### 검증
- [ ] 타입 에러 없음
- [ ] 기존 기능 동작 확인
- [ ] LLM 응답이 각 세그먼트에 올바르게 저장되는지 확인

---

## Phase 2: 상태 관리 이동 (home/page.tsx)

### 목표
- `MoodStreamContext`의 상태를 `home/page.tsx`로 이동
- `currentSegmentIndex`도 함께 이동

### 작업 내용

#### 2.1 home/page.tsx에 상태 추가
**파일**: `Web/src/app/(main)/home/page.tsx`

```typescript
interface MoodStreamData {
  streamId: string;
  segments: MoodStreamSegment[];
  currentIndex: number;
  isLoading: boolean;
  isGeneratingNextStream: boolean;
}

const [moodStreamData, setMoodStreamData] = useState<MoodStreamData>({
  streamId: "",
  segments: [],
  currentIndex: 0,
  isLoading: true,
  isGeneratingNextStream: false,
});
```

#### 2.2 콜드스타트 로직 이동
**파일**: `Web/src/app/(main)/home/page.tsx`

```typescript
// 페이지 접근 시 초기 3세그먼트 로드
useEffect(() => {
  const loadInitialSegments = async () => {
    // 1. 초기 3개 캐롤 세그먼트 가져오기
    const response = await fetch("/api/moods/carol-segments");
    const data = await response.json();
    const carolSegments = data.segments || [];
    
    // 2. 상태에 저장
    setMoodStreamData(prev => ({
      ...prev,
      segments: carolSegments,
      currentIndex: 0,
      isLoading: false,
    }));
    
    // 3. 즉시 첫 번째 세그먼트 정보 공유 (currentMood 초기화)
    if (carolSegments.length > 0) {
      const firstSegment = carolSegments[0];
      const convertedMood = convertSegmentMoodToMood(firstSegment.mood, null, firstSegment);
      setCurrentMood(convertedMood);
    }
    
    // 4. 바로 무드스트림 생성 호출 (7개 세그먼트)
    generateMoodStream(7);
  };
  
  if (status === "authenticated") {
    loadInitialSegments();
  }
}, [status]);
```

#### 2.3 무드스트림 생성 함수 추가
**파일**: `Web/src/app/(main)/home/page.tsx`

```typescript
const generateMoodStream = async (segmentCount: number = 7) => {
  try {
    setMoodStreamData(prev => ({ ...prev, isGeneratingNextStream: true }));
    
    const response = await fetch("/api/moods/current/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nextStartTime: getLastSegmentEndTime(moodStreamData.segments),
        segmentCount,
      }),
    });
    
    const data = await response.json();
    const newSegments = data.segments || [];
    
    // 기존 세그먼트에 추가
    setMoodStreamData(prev => ({
      ...prev,
      segments: [...prev.segments, ...newSegments],
      isGeneratingNextStream: false,
    }));
  } catch (error) {
    console.error("Failed to generate mood stream:", error);
    setMoodStreamData(prev => ({ ...prev, isGeneratingNextStream: false }));
  }
};
```

#### 2.4 자동 생성 로직 추가
**파일**: `Web/src/app/(main)/home/page.tsx`

```typescript
// 8, 9, 10번째 세그먼트 도달 시 다음 스트림 자동 생성
useEffect(() => {
  const clampedTotal = 10;
  const clampedIndex = moodStreamData.currentIndex >= clampedTotal 
    ? clampedTotal - 1 
    : moodStreamData.currentIndex;
  const remainingFromClamped = clampedTotal - clampedIndex - 1;
  
  // 8, 9, 10번째 세그먼트일 때 다음 스트림(10개) 생성
  if (moodStreamData.segments.length >= 10 && 
      remainingFromClamped > 0 && 
      remainingFromClamped <= 3 &&
      !moodStreamData.isGeneratingNextStream) {
    generateMoodStream(10);
  }
}, [moodStreamData.currentIndex, moodStreamData.segments.length]);
```

### 검증
- [ ] 초기 3세그먼트 로드 확인
- [ ] 무드스트림 생성 호출 확인
- [ ] 자동 생성 로직 동작 확인
- [ ] 기존 기능 동작 확인

---

## Phase 3: 현재 세그먼트 데이터 제공 함수

### 목표
- `getCurrentSegmentData()` 함수로 통합 데이터 제공
- 모든 변환 로직을 한 곳에 집중

### 작업 내용

#### 3.1 getCurrentSegmentData 함수 추가
**파일**: `Web/src/app/(main)/home/page.tsx`

```typescript
// 현재 세그먼트 통합 데이터
const currentSegmentData = useMemo(() => {
  if (!moodStreamData.segments || moodStreamData.segments.length === 0) {
    return null;
  }
  
  const segment = moodStreamData.segments[moodStreamData.currentIndex];
  if (!segment) return null;
  
  // Mood 타입으로 변환
  const mood = convertSegmentMoodToMood(
    segment.mood,
    currentMood,
    segment
  );
  
  return {
    segment,
    mood,
    backgroundParams: segment.backgroundParams,
    index: moodStreamData.currentIndex,
  };
}, [moodStreamData.segments, moodStreamData.currentIndex, currentMood]);
```

#### 3.2 currentMood 동기화
**파일**: `Web/src/app/(main)/home/page.tsx`

```typescript
// currentSegmentData 변경 시 currentMood 업데이트
useEffect(() => {
  if (currentSegmentData?.mood) {
    setCurrentMood(currentSegmentData.mood);
  }
}, [currentSegmentData]);
```

### 검증
- [ ] currentSegmentData가 올바르게 계산되는지 확인
- [ ] currentMood가 자동으로 업데이트되는지 확인

---

## Phase 4: 컴포넌트 리팩토링 (HomeContent)

### 목표
- `HomeContent`에서 직접 Context 접근 제거
- `currentSegmentData`를 props로 받아서 사용

### 작업 내용

#### 4.1 HomeContent props 수정
**파일**: `Web/src/app/(main)/home/components/HomeContent.tsx`

```typescript
interface HomeContentProps {
  // 기존 props...
  currentSegmentData: {
    segment: MoodStreamSegment;
    mood: Mood;
    backgroundParams?: BackgroundParams;
    index: number;
  } | null;
  onSegmentIndexChange: (index: number) => void;
  onGenerateNextStream: () => void;
}
```

#### 4.2 Context 접근 제거
**파일**: `Web/src/app/(main)/home/components/HomeContent.tsx`

```typescript
// 제거
// const { moodStream, currentSegmentIndex } = useMoodStreamContext();

// 추가
const { currentSegmentData, onSegmentIndexChange } = props;
```

#### 4.3 useBackgroundParams 제거
**파일**: `Web/src/app/(main)/home/components/HomeContent.tsx`

```typescript
// 제거
// const { backgroundParams } = useBackgroundParams(...);

// 사용
const backgroundParams = currentSegmentData?.backgroundParams;
```

#### 4.4 deviceGridMood 제거
**파일**: `Web/src/app/(main)/home/components/HomeContent.tsx`

```typescript
// 제거
// const deviceGridMood = useMemo(...);

// 사용
const deviceGridMood = currentSegmentData?.mood;
```

### 검증
- [ ] HomeContent가 props로만 동작하는지 확인
- [ ] 모든 하위 컴포넌트가 올바르게 업데이트되는지 확인

---

## Phase 5: 컴포넌트 리팩토링 (MoodDashboard)

### 목표
- `MoodDashboard`에서 직접 Context 접근 제거
- `currentSegmentData`를 props로 받아서 사용

### 작업 내용

#### 5.1 MoodDashboard props 수정
**파일**: `Web/src/app/(main)/home/components/MoodDashboard/MoodDashboard.tsx`

```typescript
interface MoodDashboardProps {
  // 기존 props...
  currentSegmentData: {
    segment: MoodStreamSegment;
    mood: Mood;
    backgroundParams?: BackgroundParams;
    index: number;
  } | null;
  onSegmentIndexChange: (index: number) => void;
}
```

#### 5.2 Context 접근 제거
**파일**: `Web/src/app/(main)/home/components/MoodDashboard/MoodDashboard.tsx`

```typescript
// 제거
// const { moodStream, currentSegmentIndex } = useMoodStreamContext();

// 사용
const { currentSegmentData, onSegmentIndexChange } = props;
const currentSegment = currentSegmentData?.segment;
const backgroundParams = currentSegmentData?.backgroundParams;
```

### 검증
- [ ] MoodDashboard가 props로만 동작하는지 확인
- [ ] 세그먼트 전환 기능이 올바르게 동작하는지 확인

---

## Phase 6: 컴포넌트 리팩토링 (DeviceGrid)

### 목표
- `DeviceGrid`와 하위 컴포넌트에서 `currentMood` 직접 접근 제거
- `currentSegmentData`를 props로 받아서 사용

### 작업 내용

#### 6.1 DeviceGrid props 수정
**파일**: `Web/src/app/(main)/home/components/Device/DeviceGrid.tsx`

```typescript
interface DeviceGridProps {
  // 기존 props...
  currentSegmentData: {
    segment: MoodStreamSegment;
    mood: Mood;
    backgroundParams?: BackgroundParams;
    index: number;
  } | null;
}
```

#### 6.2 currentMood 전달 수정
**파일**: `Web/src/app/(main)/home/components/Device/DeviceGrid.tsx`

```typescript
// 변경 전
currentMood={deviceGridMood}

// 변경 후
currentMood={currentSegmentData?.mood}
```

### 검증
- [ ] DeviceGrid가 props로만 동작하는지 확인
- [ ] 모든 DeviceCard가 올바르게 업데이트되는지 확인

---

## Phase 7: Context 제거 및 정리

### 목표
- `MoodStreamContext` 완전 제거
- 사용하지 않는 훅 및 유틸리티 정리

### 작업 내용

#### 7.1 Context 사용처 확인
**파일**: 전체 프로젝트

```bash
# grep으로 사용처 확인
grep -r "useMoodStreamContext" Web/src
grep -r "MoodStreamContext" Web/src
```

#### 7.2 Context 제거
**파일**: `Web/src/context/MoodStreamContext.tsx`
- 파일 삭제 또는 최소한의 상태만 유지

#### 7.3 사용하지 않는 훅 제거
**파일**: 
- `Web/src/hooks/useMoodStream/index.ts` (선택적)
- `Web/src/hooks/useBackgroundParams.ts` (선택적)

#### 7.4 Provider 제거
**파일**: `Web/src/app/layout.tsx`

```typescript
// 제거
// <MoodStreamProvider>...</MoodStreamProvider>
```

### 검증
- [ ] 모든 Context 사용처 제거 확인
- [ ] 빌드 에러 없음
- [ ] 모든 기능 정상 동작

---

## Phase 8: Modal 전환 (mypage, mood)

### 목표
- `mypage`와 `mood` 페이지를 modal로 전환
- 페이지 이동 없이 상태 유지

### 작업 내용

#### 8.1 Modal 컴포넌트 생성
**파일**: `Web/src/app/(main)/home/components/modals/MyPageModal.tsx`

```typescript
export default function MyPageModal({ 
  isOpen, 
  onClose 
}: { 
  isOpen: boolean; 
  onClose: () => void;
}) {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        {/* 기존 mypage/page.tsx 내용 */}
        <button onClick={onClose}>닫기</button>
      </div>
    </div>
  );
}
```

#### 8.2 MoodModal 컴포넌트 생성
**파일**: `Web/src/app/(main)/home/components/modals/MoodModal.tsx`

```typescript
export default function MoodModal({ 
  isOpen, 
  onClose,
  currentSegmentData,
}: { 
  isOpen: boolean; 
  onClose: () => void;
  currentSegmentData: ...;
}) {
  // 기존 mood/page.tsx 내용
}
```

#### 8.3 home/page.tsx에 Modal 추가
**파일**: `Web/src/app/(main)/home/page.tsx`

```typescript
const [showMyPageModal, setShowMyPageModal] = useState(false);
const [showMoodModal, setShowMoodModal] = useState(false);

// BottomNav에서 모달 열기
<BottomNav 
  onMyPageClick={() => setShowMyPageModal(true)}
  onMoodClick={() => setShowMoodModal(true)}
/>

{showMyPageModal && (
  <MyPageModal 
    isOpen={showMyPageModal} 
    onClose={() => setShowMyPageModal(false)} 
  />
)}

{showMoodModal && (
  <MoodModal 
    isOpen={showMoodModal} 
    onClose={() => setShowMoodModal(false)}
    currentSegmentData={currentSegmentData}
  />
)}
```

#### 8.4 라우팅 제거
**파일**: `Web/src/components/navigation/BottomNav.tsx`

```typescript
// 제거
// router.push("/mypage");
// router.push("/mood");

// 추가
const { onMyPageClick, onMoodClick } = props;
```

### 검증
- [ ] Modal이 올바르게 표시되는지 확인
- [ ] 페이지 이동 없이 상태 유지되는지 확인
- [ ] 기존 기능이 모두 동작하는지 확인

---

## Phase 9: 최종 정리 및 최적화 ✅ 완료

### 목표
- 코드 정리 및 최적화
- 문서 업데이트

### 작업 내용

#### 9.1 사용하지 않는 파일 제거 ✅
- ✅ `Web/src/hooks/useMoodStream/index.ts` - 제거됨 (Context 제거로 더 이상 사용되지 않음)
- ✅ `Web/src/hooks/useMoodStream/hooks/` - 제거됨 (useColdStart, useAutoGeneration, useRefresh, useStreamTransition)
- ✅ `Web/src/context/MoodStreamContext.tsx` - 제거됨 (Phase 7에서 제거)
- ⚠️ `Web/src/hooks/useBackgroundParams.ts` - 유지됨 (BackgroundParams 타입 정의 필요)
- ⚠️ `Web/src/hooks/useMoodStream/types.ts` - 유지됨 (MoodStreamSegment, MusicTrack 타입 정의 필요)

#### 9.2 타입 정의 정리 ✅
**파일**: `Web/src/types/moodStream.ts` (생성됨)

```typescript
// 모든 무드스트림 관련 타입을 한 곳에 모음
export interface MoodStreamData { ... }
export interface CurrentSegmentData { ... }
```

- ✅ `MoodStreamData` 타입을 별도 파일로 분리
- ✅ `CurrentSegmentData` 타입을 별도 파일로 분리
- ✅ `home/page.tsx`, `HomeContent.tsx`, `MoodDashboard.tsx`에서 중복 타입 정의 제거

#### 9.3 문서 업데이트 ✅
- ✅ `docs/REFACTORING_PLAN.md` - Phase 9 완료 상태 업데이트

### 검증
- ✅ 빌드 에러 없음
- ✅ 모든 기능 정상 동작
- ✅ 코드 가독성 향상 확인

---

## 전체 일정 예상

| Phase | 작업 내용 | 예상 시간 | 우선순위 |
|-------|----------|----------|---------|
| Phase 1 | 데이터 구조 통합 | 2-3시간 | 높음 |
| Phase 2 | 상태 관리 이동 | 3-4시간 | 높음 |
| Phase 3 | 현재 세그먼트 데이터 제공 | 1-2시간 | 높음 |
| Phase 4 | HomeContent 리팩토링 | 2-3시간 | 중간 |
| Phase 5 | MoodDashboard 리팩토링 | 2-3시간 | 중간 |
| Phase 6 | DeviceGrid 리팩토링 | 1-2시간 | 중간 |
| Phase 7 | Context 제거 | 1-2시간 | 낮음 |
| Phase 8 | Modal 전환 | 3-4시간 | 중간 |
| Phase 9 | 최종 정리 | 1-2시간 | 낮음 |

**총 예상 시간**: 16-25시간

---

## 리스크 관리

### 주요 리스크

1. **기능 회귀**
   - 각 Phase마다 기능 테스트 필수
   - 단계별로 커밋하여 롤백 가능하도록

2. **타입 에러**
   - TypeScript strict mode 유지
   - 각 Phase마다 빌드 확인

3. **성능 이슈**
   - 불필요한 리렌더링 확인
   - useMemo, useCallback 적절히 사용

### 대응 방안

- 각 Phase 완료 후 즉시 테스트
- 문제 발생 시 해당 Phase 롤백
- 점진적 마이그레이션으로 안전성 확보

---

## 다음 단계

1. **Phase 1 시작**: 데이터 구조 통합
2. **단계별 검증**: 각 Phase마다 기능 테스트
3. **문서 업데이트**: 변경사항 문서화

