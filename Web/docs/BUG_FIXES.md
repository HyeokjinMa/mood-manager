# 🐛 버그 수정 계획서

## 📋 발견된 문제들

### 1. 세그먼트 이동 시 2번 세그먼트로 점프하는 문제

**증상**: 특정 세그먼트에서 노래를 넘기려고 하면 갑자기 2번 세그먼트로 이동

**원인 분석**:
- `handleSegmentSelect`에서 `setTimeout`으로 50ms 지연 후 `setCurrentSegmentIndex` 호출
- `onSegmentIndexChange`에서 인덱스 클램핑 로직이 있음
- 세그먼트 길이가 변경되거나 다른 상태 업데이트와 충돌할 가능성

**해결 방안**:
- `handleSegmentSelect`의 `setTimeout` 제거 또는 지연 시간 단축
- 인덱스 변경 로직 단순화
- 상태 업데이트 순서 확인

---

### 2. 컬러피커 사용 시 401 에러

**증상**: `POST /api/light_info 401` 에러 발생

**원인**:
- `light_info` API가 API 키 인증을 요구
- 클라이언트에서 호출할 때 API 키를 보내지 않음
- `search_light` API는 개발 환경에서 API 키 검증을 완화했지만, `light_info`는 그렇지 않음

**해결 방안**:
- `light_info` API도 개발 환경에서 API 키 검증 완화
- 또는 클라이언트에서 API 키를 헤더에 포함

---

### 3. search_light 상태 갱신 필요

**증상**: 컬러피커를 사용했을 때 search_light 상태를 갱신해야 할 수도 있음

**현재 상태**:
- 디바이스 추가 시에만 `search_light` 상태를 "search"로 변경
- 컬러피커 사용 시에는 상태 변경 없음

**해결 방안**:
- 컬러피커 사용 시 `search_light` 상태를 "search"로 변경
- 디바이스 컨트롤 변경 시 상태 갱신

---

### 4. Expanded Card 색상 실시간 업데이트 문제

**증상**: 
- 컬러피커로 값을 바꾸면 무드대시보드와 다른 곳은 변경됨
- 하지만 Expanded card의 색 요소는 변하지 않음
- small로 내렸다가 다시 키면 색 변경이 적용됨

**원인**:
- `localLightColor`가 `currentSegment?.mood?.color` 변경에 의존
- `onUpdateCurrentSegment`로 업데이트했을 때 `currentSegment` prop이 즉시 업데이트되지 않을 수 있음
- useEffect 의존성이 제대로 트리거되지 않을 수 있음

**해결 방안**:
- `onUpdateCurrentSegment` 호출 시 `localLightColor` 즉시 업데이트
- 또는 `currentSegment` prop이 업데이트될 때까지 기다리지 않고 `onDeviceControlChange`로 받은 값을 바로 사용

---

## 🔧 구현 계획

### Step 1: 세그먼트 이동 문제 해결

```typescript
// useSegmentSelector.ts 수정
const handleSegmentSelect = useCallback((index: number) => {
  // setTimeout 제거하고 즉시 실행
  // 또는 지연 시간을 최소화
}, []);
```

### Step 2: light_info API 인증 완화

```typescript
// light_info/route.ts 수정
function validateApiKey(request: NextRequest): boolean {
  // 개발 환경에서는 API 키 검증 완화
  if (process.env.NODE_ENV === "development") {
    // ...
  }
}
```

### Step 3: search_light 상태 갱신

```typescript
// DeviceCardExpanded.tsx 수정
onUpdateLightColor={(color) => {
  // 컬러 변경 시 search_light 상태를 "search"로 변경
  fetch("/api/search_light", {
    method: "POST",
    body: JSON.stringify({ status: "search" }),
  });
}}
```

### Step 4: Expanded Card 색상 업데이트

```typescript
// DeviceCardExpanded.tsx 수정
onUpdateLightColor={(color) => {
  setLocalLightColor(color); // 즉시 업데이트
  // ... 나머지 로직
}}
```

---

---

## ✅ 해결 완료

### 1. 세그먼트 이동 문제 해결 ✅

**변경 사항**:
- `useSegmentSelector`의 `setTimeout` 제거 (50ms 지연 제거)
- 세그먼트 인덱스 업데이트를 즉시 실행하도록 변경

**결과**:
- 세그먼트 이동 시 점프 없이 정상 작동

---

### 2. light_info API 401 에러 해결 ✅

**변경 사항**:
- `light_info` API의 `validateApiKey` 함수 수정
- 개발 환경에서는 API 키 검증 완화 (search_light와 동일)
- 프로덕션 환경에서는 여전히 API 키 필수

**결과**:
- 클라이언트에서 컬러피커 사용 시 401 에러 해결

---

### 3. search_light 상태 갱신 추가 ✅

**변경 사항**:
- `DeviceCardExpanded`의 `onUpdateLightColor`에서 컬러 변경 시 `search_light` 상태를 "search"로 변경
- 라즈베리파이가 컬러 변경을 감지할 수 있도록 상태 갱신

**결과**:
- 컬러피커 사용 시 자동으로 search 상태로 변경

---

### 4. Expanded Card 색상 실시간 업데이트 해결 ✅

**변경 사항**:
- `getBackgroundColor` 함수 추가하여 `localLightColor` 우선 사용
- 컬러피커로 색 변경 시 즉시 배경색 반영
- `useEffect` 의존성 개선하여 색상 동기화 개선
- `key` prop에서 `localLightColor` 제거 (불필요한 리렌더링 방지)

**결과**:
- 컬러피커 변경 시 Expanded card의 배경색, 테두리 색상, 전원 버튼 색상이 즉시 업데이트됨
- small로 내렸다가 다시 키지 않아도 색상 변경 반영

---

**작성일**: 2025-01-XX  
**상태**: ✅ 모든 문제 해결 완료
