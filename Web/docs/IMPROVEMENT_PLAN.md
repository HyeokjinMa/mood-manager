# 🔧 개선 계획서

## 📋 개요

현재 발견된 문제점들을 분석하고 해결 방안을 제시한 문서입니다.

**작성일**: 2025-01-XX  
**분석 범위**: 초기 세그먼트 전달, 디바이스 삭제, ML/마르코프 서버 통신 정보

---

## 🔍 발견된 문제점

### 1. 초기 세그먼트 전달 문제 (MoodDashboard 값 미표시)

#### 문제 상황
- 컬러, 아이콘, 풍향, 풍속은 잘 보임
- 무드 대시보드에서 값(무드명 등)이 표시되지 않음

#### 원인 분석

**1.1 currentSegmentData가 null일 수 있음**
```typescript
// home/page.tsx (171-210줄)
const currentSegmentData = useMemo(() => {
  if (!moodStreamData.segments || moodStreamData.segments.length === 0) {
    return null; // ⚠️ segments가 비어있으면 null 반환
  }
  // ...
}, [moodStreamData.segments, moodStreamData.currentIndex, currentMood]);
```

**문제점**:
- `useMoodStreamManager`의 초기 상태에서 `providedInitialSegments`가 있으면 segments에 설정하지만,
- `currentSegmentData` 계산 시점에 `moodStreamData.segments`가 아직 비어있을 수 있음
- 초기 렌더링 시점의 타이밍 이슈

**1.2 mood prop이 null일 때 MoodHeader 에러**
```typescript
// MoodDashboard.tsx (264-276줄)
<MoodHeader
  mood={{
    ...mood, // ⚠️ mood가 null이면 스프레드 에러
    name: displayAlias,
  }}
  // ...
/>
```

```typescript
// MoodHeader.tsx (78줄)
{mood.name} // ⚠️ mood가 없으면 에러
```

**문제점**:
- `mood` prop이 `null | undefined`일 수 있는데, `MoodHeader`는 `mood: Mood`를 필수로 받음
- 스프레드 연산자로 인한 런타임 에러 발생 가능

**1.3 currentMood 초기화 타이밍 문제**
```typescript
// home/page.tsx (117-123줄)
const initialMood = useMemo((): Mood | null => {
  const firstSegment = initialSegments[0];
  if (firstSegment?.mood) {
    return convertSegmentMoodToMood(firstSegment.mood, null, firstSegment);
  }
  return null;
}, [initialSegments]);

// (133-134줄)
const { currentMood, setCurrentMood } = useMood(initialMood, setDevices);
```

**문제점**:
- `initialMood`는 `initialSegments`에서 계산되지만,
- `currentSegmentData`는 `moodStreamData.segments`에서 계산됨
- 두 데이터 소스가 다른 시점에 업데이트되어 불일치 발생 가능

#### 해결 방안

**해결책 1: currentSegmentData가 null일 때 fallback 제공**
- `currentSegmentData`가 null일 때 `initialSegments`를 사용
- 또는 `initialMood`를 기반으로 기본 currentSegmentData 생성

**해결책 2: mood prop null 안전 처리**
- `MoodDashboard`에서 `mood`가 null일 때 기본값 제공
- `MoodHeader`에 `mood`가 없을 때의 처리 추가

**해결책 3: 초기 상태 동기화**
- `useMoodStreamManager` 초기화 시 `providedInitialSegments`가 있으면 즉시 반영
- `currentMood`도 `initialSegments`에서 즉시 설정

---

### 2. 디바이스 삭제 API 호출 누락

#### 문제 상황
- 디바이스 카드 삭제 버튼 클릭 시 UI에서만 제거됨
- DB에서 실제로 삭제되지 않음

#### 원인 분석

**코드 확인**:
```typescript
// home/page.tsx (430-441줄)
{deviceToDelete && (
  <DeviceDeleteModal
    device={deviceToDelete}
    onConfirm={() => {
      const updatedDevices = devices.filter((d) => d.id !== deviceToDelete.id);
      setDevices(updatedDevices); // ⚠️ UI만 업데이트, API 호출 없음
      setDeviceToDelete(null);
      setExpandedId(null);
    }}
    onCancel={() => setDeviceToDelete(null)}
  />
)}
```

**문제점**:
- `onConfirm` 핸들러에서 로컬 state만 업데이트
- `DELETE /api/devices/[deviceId]` API 호출이 없음
- 페이지 새로고침 시 삭제된 디바이스가 다시 나타남

#### 해결 방안

**해결책: API 호출 추가**
```typescript
onConfirm={async () => {
  try {
    // API 호출로 DB에서 삭제
    const response = await fetch(`/api/devices/${deviceToDelete.id}`, {
      method: "DELETE",
      credentials: "include",
    });
    
    if (response.ok) {
      // 성공 시 UI 업데이트
      const updatedDevices = devices.filter((d) => d.id !== deviceToDelete.id);
      setDevices(updatedDevices);
      setDeviceToDelete(null);
      setExpandedId(null);
    } else {
      // 에러 처리
      console.error("Failed to delete device");
      // 토스트 메시지 등 에러 표시
    }
  } catch (error) {
    console.error("Error deleting device:", error);
    // 에러 처리
  }
}}
```

---

### 3. ML 서버 통신 방식 명확화

#### 확인된 정보
- ML 서버가 10분마다 Node.js로 값을 전송
- POST 방식으로 전송
- 서로 다른 서버에 존재

#### 추가 확인 필요
- **엔드포인트**: ML 서버가 POST로 호출하는 Node.js 엔드포인트는?
- **데이터 형식**: 전송되는 데이터 구조는?
- **인증 방식**: API 키 또는 다른 인증 방법은?

**확인 필요 위치**:
- `src/backend/listener/periodicListener.ts`
- ML 서버 코드 (별도 저장소)

---

### 4. 마르코프 서버 정보 업데이트

#### 확인된 정보
- 포트: 5000번
- 위치: EC2 내부
- 엔드포인트: `POST ${PYTHON_SERVER_URL}/inference`
- 환경 변수: `PYTHON_SERVER_URL` (예: `http://localhost:5000`)

#### 추가 확인 필요
- **서버 시작 방법**: 아직 정하지 못함
- **프로세스 관리**: systemd, PM2, Docker 등?

---

## 🔧 구체적인 해결 방안

### 해결책 1: 초기 세그먼트 전달 문제 해결

#### 1.1 currentSegmentData fallback 제공

```typescript
// home/page.tsx
const currentSegmentData = useMemo(() => {
  // moodStreamData.segments가 있으면 우선 사용
  if (moodStreamData.segments && moodStreamData.segments.length > 0) {
    const segment = moodStreamData.segments[moodStreamData.currentIndex];
    if (segment) {
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
    }
  }
  
  // fallback: initialSegments 사용
  if (initialSegments && initialSegments.length > 0) {
    const segment = initialSegments[0];
    if (segment?.mood) {
      const mood = convertSegmentMoodToMood(segment.mood, currentMood, segment);
      return {
        segment,
        mood,
        backgroundParams: segment.backgroundParams,
        index: 0,
      };
    }
  }
  
  return null;
}, [moodStreamData.segments, moodStreamData.currentIndex, currentMood, initialSegments]);
```

#### 1.2 mood prop null 안전 처리

```typescript
// MoodDashboard.tsx
// mood가 null일 때 기본값 제공
const safeMood: Mood | null = mood || currentSegmentData?.mood || null;

// MoodHeader에 전달
<MoodHeader
  mood={safeMood || {
    id: "default",
    name: "Loading...",
    color: "#E6F3FF",
    song: { title: "", duration: 0 },
    scent: { type: "Musk", name: "Default", color: "#9CAF88" },
  }}
  // ...
/>
```

또는 `MoodHeader`에서 null 처리:
```typescript
// MoodHeader.tsx
interface MoodHeaderProps {
  mood: Mood | null; // null 허용으로 변경
  // ...
}

export default function MoodHeader({ mood, ... }: MoodHeaderProps) {
  if (!mood) {
    return <div className="text-base font-semibold text-gray-400">Loading...</div>;
  }
  
  return (
    <div>
      {mood.name}
      {/* ... */}
    </div>
  );
}
```

#### 1.3 초기 상태 즉시 반영

`useMoodStreamManager`의 초기 상태가 이미 올바르게 설정되어 있으므로,
`currentSegmentData` 계산 시 fallback만 추가하면 됨.

---

### 해결책 2: 디바이스 삭제 API 호출 추가

```typescript
// home/page.tsx
const handleDeviceDelete = async (device: Device) => {
  try {
    const response = await fetch(`/api/devices/${device.id}`, {
      method: "DELETE",
      credentials: "include",
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("[HomePage] 디바이스 삭제 실패:", error);
      // 에러 토스트 메시지 표시
      toast.error("디바이스 삭제에 실패했습니다.");
      return;
    }

    // 성공 시 UI 업데이트
    const updatedDevices = devices.filter((d) => d.id !== device.id);
    setDevices(updatedDevices);
    setDeviceToDelete(null);
    setExpandedId(null);
    toast.success("디바이스가 삭제되었습니다.");
  } catch (error) {
    console.error("[HomePage] 디바이스 삭제 에러:", error);
    toast.error("디바이스 삭제 중 오류가 발생했습니다.");
  }
};

// JSX
<DeviceDeleteModal
  device={deviceToDelete}
  onConfirm={() => handleDeviceDelete(deviceToDelete)}
  onCancel={() => setDeviceToDelete(null)}
/>
```

---

## 📝 개선 계획

### Phase 1: 긴급 수정 (✅ 완료)

#### 1.1 초기 세그먼트 전달 문제 해결 ✅
- [x] `currentSegmentData`에 `initialSegments` fallback 추가
- [x] `MoodDashboard`에서 `mood` null 안전 처리
- [x] `MoodHeader`에서 `mood` null 허용 및 처리

**수정 완료**:
- `home/page.tsx`: `currentSegmentData` 계산 시 `initialSegments` fallback 추가
- `MoodDashboard.tsx`: `mood`가 null일 때 `currentSegmentData?.mood` 사용
- `MoodHeader.tsx`: `mood`를 `null` 허용으로 변경하고 early return 추가

#### 1.2 디바이스 삭제 API 호출 추가 ✅
- [x] `handleDeviceDelete` 함수 구현 (인라인으로 `onConfirm`에 추가)
- [x] API 호출 로직 추가
- [x] 에러 처리 추가

**수정 완료**:
- `home/page.tsx`: `DeviceDeleteModal`의 `onConfirm`에 API 호출 추가
- `DELETE /api/devices/[deviceId]` 엔드포인트 호출
- 에러 처리 및 alert 추가 (토스트는 추후 react-hot-toast로 교체 가능)

---

### Phase 2: 문서 업데이트 (정보 반영)

#### 2.1 ML 서버 통신 정보 업데이트
- [ ] FLOW_VERIFICATION.md에 ML 서버 POST 방식 정보 추가
- [ ] 엔드포인트 확인 후 문서 업데이트

**예상 소요 시간**: 10분

#### 2.2 마르코프 서버 정보 업데이트
- [ ] FLOW_VERIFICATION.md에 포트 5000번 정보 추가
- [ ] 서버 시작 방법 결정 후 문서 업데이트

**예상 소요 시간**: 5분

---

### Phase 3: 추가 개선 (선택적)

#### 3.1 에러 처리 강화
- [ ] 디바이스 삭제 실패 시 재시도 로직
- [ ] 초기 세그먼트 로드 실패 시 fallback UI

#### 3.2 로딩 상태 개선
- [ ] 초기 세그먼트 로드 중 스켈레톤 UI 표시
- [ ] 디바이스 삭제 중 로딩 상태 표시

---

## ✅ 체크리스트

### 긴급 수정 (✅ 완료)
- [x] Phase 1.1: 초기 세그먼트 전달 문제 해결
  - [x] `currentSegmentData` fallback 추가
  - [x] `mood` null 안전 처리
  - [ ] 테스트: MoodDashboard 값 표시 확인 (사용자 테스트 필요)
- [x] Phase 1.2: 디바이스 삭제 API 호출 추가
  - [x] `handleDeviceDelete` 함수 구현 (인라인)
  - [x] API 호출 및 에러 처리
  - [ ] 테스트: DB에서 실제 삭제 확인 (사용자 테스트 필요)

### 문서 업데이트
- [ ] Phase 2.1: ML 서버 통신 정보 업데이트
- [ ] Phase 2.2: 마르코프 서버 정보 업데이트

---

## 📊 우선순위

1. **🔴 높음 (즉시 수정)**:
   - 초기 세그먼트 전달 문제 (MoodDashboard 값 미표시)
   - 디바이스 삭제 API 호출 누락

2. **🟡 중간 (정보 업데이트)**:
   - ML 서버 통신 방식 문서화
   - 마르코프 서버 정보 업데이트

3. **🟢 낮음 (향후 개선)**:
   - 에러 처리 강화
   - 로딩 상태 개선

---

---

## 📊 최종 상태

### ✅ 완료된 작업
1. **초기 세그먼트 전달 문제 해결**
   - `currentSegmentData`에 `initialSegments` fallback 추가
   - `mood` null 안전 처리 (MoodDashboard, MoodHeader)
   - 조건부 렌더링으로 타입 에러 해결

2. **디바이스 삭제 API 호출 추가**
   - `DELETE /api/devices/[deviceId]` 호출 추가
   - 에러 처리 추가

3. **문서 업데이트**
   - ML 서버 통신 방식 정보 추가 (POST, 10분마다)
   - 마르코프 서버 정보 추가 (포트 5000, EC2 내부)

### 🧪 테스트 필요
- [ ] MoodDashboard 값 표시 확인 (초기 세그먼트 로드 시)
- [ ] 디바이스 삭제 DB 확인 (실제 DB에서 삭제되는지)

### 📋 향후 작업 (선택적)
- [ ] 에러 처리 강화 (토스트 메시지로 변경)
- [ ] 로딩 상태 개선
- [ ] 저장된 무드 세그먼트 대체 기능 구현

---

---

## ✅ 적용 완료

### 수정 사항 요약

#### 1. 초기 세그먼트 전달 문제 해결 ✅
**파일**: 
- `src/app/(main)/home/page.tsx`
- `src/app/(main)/home/components/MoodDashboard/MoodDashboard.tsx`
- `src/app/(main)/home/components/MoodDashboard/components/MoodHeader.tsx`
- `src/app/(main)/home/components/MoodDashboard/hooks/useMoodColors.ts`

**변경 내용**:
1. `currentSegmentData` 계산 시 `initialSegments` fallback 추가
2. `MoodDashboard`에서 `effectiveMood` 변수로 `mood || currentSegmentData?.mood` 계산
3. `MoodHeader`에서 `mood` null 허용 및 early return 추가
4. `useMoodColors`에서 `mood` null 허용 및 기본값 처리
5. 조건부 렌더링으로 타입 안전성 확보

#### 2. 디바이스 삭제 API 호출 추가 ✅
**파일**: `src/app/(main)/home/page.tsx`

**변경 내용**:
1. `DeviceDeleteModal`의 `onConfirm`에 `DELETE /api/devices/[deviceId]` API 호출 추가
2. 에러 처리 및 alert 메시지 추가

#### 3. 문서 업데이트 ✅
**파일**: `docs/FLOW_VERIFICATION.md`

**변경 내용**:
1. ML 서버 통신 방식: POST, 10분마다 전송
2. 마르코프 서버: 포트 5000, EC2 내부 통신

---

**작성일**: 2025-01-XX  
**최종 업데이트**: 코드 수정 완료, 빌드 성공  
**상태**: ✅ Phase 1 완료, 테스트 필요
