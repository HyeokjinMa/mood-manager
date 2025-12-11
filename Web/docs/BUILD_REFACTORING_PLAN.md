# 🔧 빌드 과정 개선 리팩토링 계획

## 📋 개요

빌드 과정에서 발견된 문제점들을 분석하고, 코드 품질 개선을 위한 리팩토링 계획을 정리한 문서입니다.

**작성일**: 2025-01-XX  
**빌드 도구**: Next.js 15.5.6 (Turbopack)  
**분석 범위**: 전체 프로젝트 TypeScript/ESLint 경고 분석

---

## 🔍 발견된 주요 문제점

### 1. 사용하지 않는 Import/변수 제거 필요

#### 1.1 사용하지 않는 React Hooks Import
**문제점**:
- `useCallback`이 여러 파일에서 import되었지만 사용되지 않음
- React Hook 규칙 위반 가능성

**영향받는 파일**:
```typescript
// Web/src/app/(main)/home/page.tsx (12줄)
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
// ❌ useCallback은 사용되지 않음

// Web/src/app/(main)/home/components/HomeContent.tsx (11줄)
import { useState, useEffect, useMemo, useCallback } from "react";
// ❌ useState, useCallback은 사용되지 않음
```

**해결 방법**:
```typescript
// ✅ 올바른 방법
import { useState, useEffect, useRef, useMemo } from "react";
```

**우선순위**: 🟡 중간

#### 1.2 사용하지 않는 변수 선언
**문제점**:
- 선언만 되고 사용되지 않는 변수들이 많음
- 코드 가독성 저하 및 유지보수 어려움

**주요 발견 사례**:

```typescript
// Web/src/app/(main)/home/page.tsx
const ADMIN_EMAIL = ... // ❌ 사용되지 않음 (15줄)
const isAdminMode = ... // ❌ 사용되지 않음 (44줄)
const isLoadingDevices = ... // ❌ 사용되지 않음 (130줄)

// Web/src/app/(main)/home/components/Device/DeviceCardExpanded.tsx
const onUpdateLightColor = ... // ❌ 사용되지 않음 (42줄)
const onUpdateLightBrightness = ... // ❌ 사용되지 않음 (43줄)
const onUpdateScentLevel = ... // ❌ 사용되지 않음 (44줄)
const setLightColor = ... // ❌ 사용되지 않음 (70줄)
const setLightBrightness = ... // ❌ 사용되지 않음 (72줄)
const setScentLevel = ... // ❌ 사용되지 않음 (74줄)

// Web/src/app/(main)/home/components/MoodDashboard/hooks/useMoodDashboard.ts
// ❌ useEffect의 dependency 배열에 'mood' 누락 (48줄, 75줄)
```

**해결 방법**:
1. 사용되지 않는 변수/import 제거
2. 향후 사용 예정인 경우 주석 추가
3. ESLint 규칙 활성화: `@typescript-eslint/no-unused-vars`

**우선순위**: 🟡 중간

---

### 2. React Hook 의존성 배열 문제

#### 2.1 useEffect 의존성 배열 누락
**문제점**:
- React Hooks의 exhaustive-deps 규칙 위반
- 의도하지 않은 버그 발생 가능성

**영향받는 파일**:

```typescript
// Web/src/app/(main)/home/page.tsx (232줄)
useEffect(() => {
  if (currentSegmentData?.mood) {
    // ...
    setCurrentMood(currentSegmentData.mood);
  }
}, [currentSegmentData?.mood?.id, setCurrentMood]);
// ⚠️ 경고: 'currentSegmentData.mood'가 의존성 배열에 없음

// Web/src/app/(main)/home/components/MoodDashboard/hooks/useMoodDashboard.ts (48줄, 75줄)
useEffect(() => {
  if (!mood) return;
  setIsSaved(false);
}, [mood?.id]); // ⚠️ 경고: 'mood'가 의존성 배열에 없음

useEffect(() => {
  if (!mood) return;
  const fetchPreferenceCount = async () => {
    // ...
  };
  fetchPreferenceCount();
}, [mood?.id]); // ⚠️ 경고: 'mood'가 의존성 배열에 없음
```

**해결 방법**:

**옵션 1: 의존성 배열에 추가** (권장)
```typescript
// ✅ 올바른 방법 1: 전체 객체 의존성
useEffect(() => {
  if (currentSegmentData?.mood) {
    // ...
  }
}, [currentSegmentData?.mood, setCurrentMood]);

// ⚠️ 주의: 무한 루프 방지 필요 시 useMemo 또는 useCallback 사용
```

**옵션 2: useMemo로 최적화** (복잡한 객체인 경우)
```typescript
// ✅ 올바른 방법 2: useMemo로 최적화
const moodId = useMemo(() => currentSegmentData?.mood?.id, [currentSegmentData?.mood?.id]);

useEffect(() => {
  if (currentSegmentData?.mood) {
    // ...
  }
}, [moodId, currentSegmentData?.mood, setCurrentMood]);
```

**옵션 3: ESLint 비활성화** (명시적 의도가 있는 경우)
```typescript
// ⚠️ 최후의 수단: 주석으로 의도 명시
useEffect(() => {
  // ...
}, [mood?.id]); 
// eslint-disable-next-line react-hooks/exhaustive-deps
// 의도: mood.id만 추적하여 무한 루프 방지
```

**우선순위**: 🔴 높음 (버그 위험)

---

### 3. 코드 구조 개선 필요

#### 3.1 타입 안정성 개선
**문제점**:
- `Mood` 타입이 `home/page.tsx`에서 직접 import 없이 사용됨
- 타입 추론이 명확하지 않은 부분 존재

**발견 사례**:
```typescript
// Web/src/app/(main)/home/page.tsx (120줄)
const initialMood = useMemo((): Mood | null => {
  // ...
}, [initialSegments]);
// ❌ 'Mood' 타입이 import되지 않았지만 TypeScript가 추론함
```

**해결 방법**:
```typescript
// ✅ 올바른 방법: 명시적 타입 import
import type { Mood } from "@/types/mood";

const initialMood = useMemo((): Mood | null => {
  // ...
}, [initialSegments]);
```

**우선순위**: 🟢 낮음 (현재는 작동하지만 타입 안정성 향상)

#### 3.2 상태 관리 로직 분리
**문제점**:
- `home/page.tsx`가 너무 많은 책임을 가짐 (500줄 이상)
- 상태 관리, 비즈니스 로직, UI 렌더링이 모두 혼재

**현재 구조**:
- `home/page.tsx`: 상태 관리 + 레이아웃 + 모달 관리
- `HomeContent.tsx`: 추가 상태 관리 + 컴포넌트 조합
- 여러 커스텀 훅이 있지만 여전히 복잡함

**해결 방법**:
```typescript
// ✅ 개선 방향: Custom Hook으로 로직 분리

// hooks/useHomePageState.ts (새로 생성)
export function useHomePageState() {
  // 모든 상태 관리 로직을 이곳으로 이동
  // - 세션 관리
  // - 모달 상태
  // - 무드 스트림 관리
  // - 디바이스 상태 관리
  
  return {
    // 필요한 상태와 핸들러만 반환
  };
}

// home/page.tsx (단순화)
export default function HomePage() {
  const {
    session,
    modals,
    moodState,
    deviceState,
    handlers,
  } = useHomePageState();
  
  // UI 렌더링만 담당
  return (/* JSX */);
}
```

**우선순위**: 🟡 중간 (유지보수성 향상)

---

### 4. API 핸들러 개선

#### 4.1 사용하지 않는 파라미터
**문제점**:
- API 핸들러에서 선언만 되고 사용되지 않는 파라미터들이 많음

**발견 사례**:
```typescript
// Web/src/app/api/ai/background-params/handlers/streamHandler.ts
export async function handleStreamRequest(params: {
  // ...
  preprocessed?: any; // ❌ 사용되지 않음 (621줄)
  moodStream?: any; // ❌ 사용되지 않음 (622줄)
  userPreferences?: any; // ❌ 사용되지 않음 (623줄)
  forceFresh?: boolean; // ❌ 사용되지 않음 (624줄)
  userId?: string; // ❌ 사용되지 않음 (626줄)
  session?: Session; // ❌ 사용되지 않음 (627줄)
})
```

**해결 방법**:
1. 사용하지 않는 파라미터 제거 (다른 곳에서 사용 중인지 확인 후)
2. 향후 사용 예정인 경우 `_` prefix 사용하여 명시
3. TypeScript unused parameter 경고 무시 (의도적인 경우)

```typescript
// ✅ 올바른 방법 1: 제거
export async function handleStreamRequest(params: {
  // 필요한 파라미터만 포함
})

// ✅ 올바른 방법 2: 명시적 무시 (향후 사용 예정)
export async function handleStreamRequest(params: {
  // ...
  _preprocessed?: any; // 향후 사용 예정
})

// ✅ 올바른 방법 3: 주석 처리
export async function handleStreamRequest(params: {
  // ...
  // preprocessed?: any; // TODO: 향후 구현 예정
})
```

**우선순위**: 🟡 중간

---

## 📝 구체적인 리팩토링 단계

### Phase 1: 즉시 수정 가능한 문제 (빠른 승리)

#### 1.1 사용하지 않는 Import 제거
```bash
# 대상 파일 목록
- Web/src/app/(main)/home/page.tsx
- Web/src/app/(main)/home/components/HomeContent.tsx
- Web/src/app/(main)/home/components/modals/MyPageModal.tsx
- Web/src/app/(main)/mypage/components/ProfileSection.tsx
```

**작업 내용**:
1. 각 파일에서 사용하지 않는 import 확인
2. ESLint 자동 수정 사용: `npm run lint -- --fix`
3. 수동으로 남은 부분 제거

**예상 소요 시간**: 30분

#### 1.2 사용하지 않는 변수 제거
```bash
# 주요 대상
- home/page.tsx: ADMIN_EMAIL, isAdminMode, isLoadingDevices, useCallback
- DeviceCardExpanded.tsx: onUpdateLightColor, onUpdateLightBrightness 등
- HomeContent.tsx: useState, useCallback, loadPreferences
```

**작업 내용**:
1. 각 변수가 정말 사용되지 않는지 확인 (IDE 검색 활용)
2. 다른 파일에서 참조되는지 확인
3. 제거 또는 주석 처리

**예상 소요 시간**: 1시간

---

### Phase 2: React Hook 의존성 배열 수정 (중요)

#### 2.1 useEffect 의존성 배열 수정

**대상 파일**:
1. `home/page.tsx` (232줄)
2. `components/MoodDashboard/hooks/useMoodDashboard.ts` (48줄, 75줄)

**작업 순서**:

**Step 1: home/page.tsx 수정**
```typescript
// 현재 코드 (232줄)
useEffect(() => {
  if (currentSegmentData?.mood) {
    if (prevMoodIdRef.current !== currentSegmentData.mood.id) {
      prevMoodIdRef.current = currentSegmentData.mood.id;
      setCurrentMood(currentSegmentData.mood);
    }
  }
}, [currentSegmentData?.mood?.id, setCurrentMood]);

// ✅ 수정 후
useEffect(() => {
  if (currentSegmentData?.mood) {
    if (prevMoodIdRef.current !== currentSegmentData.mood.id) {
      prevMoodIdRef.current = currentSegmentData.mood.id;
      setCurrentMood(currentSegmentData.mood);
    }
  }
}, [currentSegmentData?.mood, setCurrentMood]);
// ⚠️ 주의: currentSegmentData.mood가 객체이므로 참조 동일성 체크 필요
// 현재는 prevMoodIdRef로 id 기반 체크를 하고 있으므로 안전함
```

**Step 2: useMoodDashboard.ts 수정**
```typescript
// 현재 코드 (48줄)
useEffect(() => {
  if (!mood) return;
  setIsSaved(false);
}, [mood?.id]);

// ✅ 수정 후
useEffect(() => {
  if (!mood) return;
  setIsSaved(false);
}, [mood]); // mood 객체 전체를 의존성으로 추가
// 또는
// eslint-disable-next-line react-hooks/exhaustive-deps
// 의도: mood.id만 추적하여 불필요한 리렌더링 방지
```

**Step 3: 테스트**
- 빌드 실행: `npm run build`
- 경고 메시지 확인
- 애플리케이션 동작 확인

**예상 소요 시간**: 1-2시간

---

### Phase 3: 코드 구조 개선 (선택적)

#### 3.1 Custom Hook으로 상태 관리 로직 분리

**새 파일 생성**: `hooks/useHomePageState.ts`

```typescript
/**
 * HomePage의 모든 상태 관리 로직을 담당하는 Custom Hook
 */
export function useHomePageState() {
  // 1. 세션 관리
  const { status, data: session } = useSession();
  const router = useRouter();
  
  // 2. 모달 상태
  const [showMyPageModal, setShowMyPageModal] = useState(false);
  const [showMoodModal, setShowMoodModal] = useState(false);
  // ... 기타 모달 상태
  
  // 3. 디바이스 상태
  const { devices, setDevices, addDevice } = useDevices(/* ... */);
  
  // 4. 무드 상태
  const { currentMood, setCurrentMood } = useMood(/* ... */);
  
  // 5. 무드 스트림 관리
  const { moodStreamData, setMoodStreamData } = useMoodStreamManager(/* ... */);
  
  // 6. 세션 리다이렉트 로직
  useEffect(() => {
    // 세션 체크 로직
  }, [status, router]);
  
  return {
    // 필요한 상태와 핸들러만 반환
    session: { status, data: session },
    modals: {
      showMyPageModal,
      setShowMyPageModal,
      // ...
    },
    moodState: {
      currentMood,
      setCurrentMood,
      // ...
    },
    deviceState: {
      devices,
      setDevices,
      addDevice,
      // ...
    },
    // ...
  };
}
```

**home/page.tsx 단순화**:
```typescript
export default function HomePage() {
  const {
    session,
    modals,
    moodState,
    deviceState,
    handlers,
  } = useHomePageState();
  
  // UI 렌더링만 담당
  return (
    <div>
      {/* JSX */}
    </div>
  );
}
```

**예상 소요 시간**: 4-6시간

---

### Phase 4: API 핸들러 정리 (선택적)

#### 4.1 사용하지 않는 파라미터 제거/명시

**대상 파일**:
- `api/ai/background-params/handlers/streamHandler.ts`

**작업 내용**:
1. 각 파라미터의 사용 여부 확인
2. 다른 파일에서 전달하는지 확인
3. 제거 또는 명시적 주석 추가

**예상 소요 시간**: 1-2시간

---

## ✅ 체크리스트

### 즉시 수정 가능 (Phase 1)
- [ ] 사용하지 않는 import 제거
  - [ ] `home/page.tsx` - useCallback 제거
  - [ ] `HomeContent.tsx` - useState, useCallback 제거
  - [ ] `MyPageModal.tsx` - useEffect, useRef 제거
  - [ ] 기타 파일들
- [ ] 사용하지 않는 변수 제거
  - [ ] `home/page.tsx` - ADMIN_EMAIL, isAdminMode, isLoadingDevices
  - [ ] `DeviceCardExpanded.tsx` - onUpdateLightColor 등
  - [ ] `HomeContent.tsx` - loadPreferences
  - [ ] 기타 파일들

### 중요 수정 (Phase 2)
- [ ] React Hook 의존성 배열 수정
  - [ ] `home/page.tsx` (232줄) - currentSegmentData.mood 의존성 추가
  - [ ] `useMoodDashboard.ts` (48줄) - mood 의존성 처리
  - [ ] `useMoodDashboard.ts` (75줄) - mood 의존성 처리
- [ ] 빌드 테스트 및 경고 확인
- [ ] 애플리케이션 동작 검증

### 구조 개선 (Phase 3, 선택적)
- [ ] Custom Hook으로 상태 관리 로직 분리
  - [ ] `hooks/useHomePageState.ts` 생성
  - [ ] `home/page.tsx` 리팩토링
  - [ ] 테스트 및 검증

### API 정리 (Phase 4, 선택적)
- [ ] 사용하지 않는 API 파라미터 정리
  - [ ] `streamHandler.ts` 파라미터 확인 및 정리

---

## 🛠️ 권장 도구 설정

### ESLint 규칙 강화
```json
// .eslintrc.json 또는 eslint.config.js
{
  "rules": {
    "@typescript-eslint/no-unused-vars": ["error", {
      "argsIgnorePattern": "^_",
      "varsIgnorePattern": "^_"
    }],
    "react-hooks/exhaustive-deps": "warn"
  }
}
```

### Pre-commit Hook 설정 (선택적)
```bash
# Husky + lint-staged 사용
npm install --save-dev husky lint-staged

# package.json
{
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ]
  }
}
```

---

## 📊 예상 개선 효과

### 빌드 경고 감소
- **현재**: ~40개의 경고
- **Phase 1 완료 후**: ~20개 (50% 감소)
- **Phase 2 완료 후**: ~10개 (75% 감소)
- **전체 완료 후**: ~5개 이하 (90% 감소)

### 코드 품질 향상
- ✅ 타입 안정성 향상
- ✅ 유지보수성 향상
- ✅ 버그 예방 (React Hook 의존성 배열)
- ✅ 가독성 향상 (불필요한 코드 제거)

---

## 📚 참고 자료

- [React Hooks 규칙](https://react.dev/reference/rules/rules-of-hooks)
- [ESLint React Hooks Plugin](https://www.npmjs.com/package/eslint-plugin-react-hooks)
- [TypeScript ESLint 규칙](https://typescript-eslint.io/rules/)
- [Next.js 15 릴리즈 노트](https://nextjs.org/blog/next-15)

---

## 🔄 진행 상황 추적

**시작일**: YYYY-MM-DD  
**예상 완료일**: YYYY-MM-DD

- [ ] Phase 1 완료
- [ ] Phase 2 완료
- [ ] Phase 3 완료 (선택)
- [ ] Phase 4 완료 (선택)

---

**작성자**: AI Assistant  
**검토 필요**: 팀 리뷰 권장
