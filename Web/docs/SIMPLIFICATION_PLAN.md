# 코드 단순화 계획서

## 📋 현재 문제점 요약

### 1. home/page.tsx의 과도한 복잡도
- **현재 상태**: 약 750줄의 코드
- **문제**: 세그먼트 관리, 디바이스 상태, 무드 상태, UI 상태가 모두 섞여 있음
- **원인**: 버그 수정 시마다 조건문이 중첩되어 복잡해짐

### 2. 세그먼트 병합 로직의 복잡성
- **현재 문제**: 초기 3세그먼트와 LLM 7세그먼트 병합 로직이 복잡함
- **원인**: "마지막 3개 버림" 로직이 여러 곳에 분산
- **영향**: 세그먼트 전환 시 예상치 못한 동작 발생 가능

### 3. 디바이스 상태 변경 처리의 불명확성
- **현재 문제**: 음량은 즉각 반영, 빛/컬러는 route.ts 전송의 구분이 불명확
- **원인**: 변경 타입별 처리 로직이 분산되어 있음
- **영향**: 상태 동기화 문제 발생 가능

### 4. 자동 생성 조건의 불명확성
- **현재 문제**: "뒤에서 2번째 이내" 체크가 어디서 이루어지는지 불명확
- **원인**: 조건 체크 로직이 여러 곳에 분산
- **영향**: 불필요한 스트림 생성 또는 생성 누락 가능

---

## 🎯 단순화 전략

### 전략 1: 관심사 분리 (Separation of Concerns)

**원칙**: 각 훅/컴포넌트는 하나의 책임만 가짐

```
home/page.tsx (레이아웃만)
  ├── useMoodStreamManager (세그먼트 관리)
  ├── useDeviceState (디바이스 상태)
  ├── useMoodState (무드 상태)
  └── UI 컴포넌트들
```

### 전략 2: 상태 관리 단순화

**원칙**: 상태 간 의존성 최소화, 단방향 데이터 흐름

```
세그먼트 상태 → 디바이스 상태 → UI
(단방향, 명확한 흐름)
```

### 전략 3: 조건 로직 명확화

**원칙**: 복잡한 조건을 명확한 함수로 분리

```typescript
// Before: 여러 곳에 분산된 조건 체크
if (currentIndex >= segments.length - 2) { ... }

// After: 명확한 함수
function shouldGenerateNextStream(currentIndex: number, totalSegments: number): boolean {
  return currentIndex >= totalSegments - 2;
}
```

---

## 📝 구체적 개선 계획

### Phase 1: 세그먼트 관리 로직 단순화 (우선순위: 🔴 높음)

**목표**: 초기 세그먼트와 LLM 세그먼트 병합 로직을 명확하고 단순하게 만들기

**작업 내용**:

1. **`useMoodStreamManager` 훅 생성**
   ```typescript
   // src/hooks/useMoodStreamManager.ts
   export function useMoodStreamManager() {
     // 초기 세그먼트 로드
     // LLM 세그먼트 생성 및 병합
     // 세그먼트 전환 관리
     // 다음 스트림 생성 조건 체크
   }
   ```

2. **세그먼트 병합 전략 명확화**
   ```typescript
   // 명확한 병합 로직
   function mergeSegments(
     initialSegments: MoodStreamSegment[],  // 3개
     llmSegments: MoodStreamSegment[]       // 7개
   ): MoodStreamSegment[] {
     // 초기 3개 + LLM 앞 4개 (마지막 3개 버림)
     return [...initialSegments, ...llmSegments.slice(0, 4)];
   }
   ```

3. **세그먼트 전환 조건 명확화**
   ```typescript
   // 명확한 조건 함수
   function shouldGenerateNextStream(
     currentIndex: number,
     totalSegments: number
   ): boolean {
     // 뒤에서 2번째 이내
     return currentIndex >= totalSegments - 2;
   }
   ```

**예상 효과**:
- `home/page.tsx` 코드 라인 수: 750줄 → 400줄 (예상)
- 세그먼트 관리 로직 가독성 향상
- 버그 발생 시 원인 파악 용이

---

### Phase 2: 디바이스 상태 변경 로직 정리 (우선순위: 🔴 높음)

**목표**: 디바이스 카드 변경 시 즉각 반영과 route.ts 전송을 명확히 구분

**작업 내용**:

1. **`useDeviceState` 훅 생성**
   ```typescript
   // src/hooks/useDeviceState.ts
   export function useDeviceState() {
     // 디바이스 상태 관리
     // 변경 타입별 처리
     // 상태 동기화
   }
   ```

2. **변경 타입별 처리 명확화**
   ```typescript
   // 명확한 처리 로직
   function handleDeviceChange(
     deviceId: string,
     changeType: 'volume' | 'light' | 'color' | 'scent',
     value: unknown
   ) {
     if (changeType === 'volume') {
       // 즉각 반영 (home 상태 업데이트)
       updateLocalState(deviceId, 'volume', value);
     } else if (changeType === 'light' || changeType === 'color') {
       // route.ts로 전송 (라즈베리파이 풀링)
       sendToRoute(deviceId, changeType, value);
     } else if (changeType === 'scent') {
       // 즉각 반영 + route.ts 전송
       updateLocalState(deviceId, 'scent', value);
       sendToRoute(deviceId, 'scent', value);
     }
   }
   ```

**예상 효과**:
- 디바이스 상태 변경 로직 가독성 향상
- 상태 동기화 문제 해결
- 버그 발생 시 원인 파악 용이

---

### Phase 3: 무드스트림 자동 생성 로직 개선 (우선순위: 🟡 중간)

**목표**: 로그인 후 최초 home 진입 시 자동 생성 로직을 명확하게 만들기

**작업 내용**:

1. **자동 생성 조건 함수화**
   ```typescript
   // 명확한 조건 함수
   function shouldAutoGenerateStream(
     isFirstVisit: boolean,
     currentSegmentIndex: number,
     totalSegments: number
   ): boolean {
     // 로그인 후 최초 진입
     if (isFirstVisit) return true;
     
     // 현재 세그먼트가 뒤에서 2번째 이내
     return currentSegmentIndex >= totalSegments - 2;
   }
   ```

2. **초기 세그먼트와 LLM 세그먼트 병합 전략 개선**
   - 병합 로직을 별도 함수로 분리
   - 병합 타이밍 명확화

**예상 효과**:
- 자동 생성 로직 가독성 향상
- 불필요한 스트림 생성 방지
- 생성 누락 방지

---

## 🔧 구현 우선순위

### 🔴 높음 (즉시 개선)

1. **세그먼트 관리 로직 단순화**
   - 예상 작업 시간: 4-6시간
   - 영향 범위: `home/page.tsx`, `useMoodStreamManager` 훅
   - 효과: 코드 복잡도 대폭 감소

2. **디바이스 상태 변경 로직 정리**
   - 예상 작업 시간: 3-4시간
   - 영향 범위: `home/page.tsx`, `useDeviceState` 훅, 디바이스 카드 컴포넌트
   - 효과: 상태 동기화 문제 해결

### 🟡 중간 (단계적 개선)

3. **무드스트림 자동 생성 로직 개선**
   - 예상 작업 시간: 2-3시간
   - 영향 범위: `useMoodStreamManager` 훅
   - 효과: 자동 생성 로직 명확화

### 🟢 낮음 (선택적 개선)

4. **에러 처리 개선**
   - 예상 작업 시간: 2-3시간
   - 영향 범위: 전체
   - 효과: 사용자 경험 향상

5. **성능 최적화**
   - 예상 작업 시간: 3-4시간
   - 영향 범위: 전체
   - 효과: 불필요한 리렌더링 방지

---

## 📊 예상 효과

### 코드 복잡도 감소
- `home/page.tsx`: 750줄 → 400줄 (약 47% 감소)
- 상태 관리 로직 분리로 가독성 향상
- 버그 수정으로 인한 중첩 조건문 제거

### 유지보수성 향상
- 각 훅의 책임 명확화
- 테스트 가능한 단위로 분리
- 버그 발생 시 원인 파악 용이

### 성능 개선
- 불필요한 리렌더링 방지
- 상태 업데이트 최적화

---

## 🚀 실행 계획

### Week 1: Phase 1 (세그먼트 관리 로직 단순화)
- [ ] `useMoodStreamManager` 훅 생성
- [ ] 세그먼트 병합 전략 명확화
- [ ] 세그먼트 전환 조건 명확화
- [ ] `home/page.tsx`에서 세그먼트 관리 로직 제거

### Week 2: Phase 2 (디바이스 상태 변경 로직 정리)
- [ ] `useDeviceState` 훅 생성
- [ ] 변경 타입별 처리 명확화
- [ ] 상태 동기화 단순화
- [ ] 디바이스 카드 컴포넌트 수정

### Week 3: Phase 3 (무드스트림 자동 생성 로직 개선)
- [ ] 자동 생성 조건 함수화
- [ ] 초기 세그먼트와 LLM 세그먼트 병합 전략 개선
- [ ] 테스트 및 검증

---

**작성일**: 2025-01-XX  
**작업자**: AI Assistant

