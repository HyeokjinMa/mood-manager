# V2/V3 벨류업 작업 계획 (DB 연결 불필요)

## 📋 목표

DB 연결 없이 로컬에서 진행 가능한 **UI/UX 개선**, **애니메이션 강화**, **코드 품질 향상** 작업을 우선 진행합니다.

**핵심 원칙**:
- DB 연결 없이 완전히 구현 가능한 작업만 포함
- V1 Mock Mode와 호환 가능
- 사용자 경험 향상에 집중
- 코드 안정성 및 타입 안전성 강화

---

## 🔍 현재 상태

### ✅ 완료된 작업
- V1 Mock Mode 완성
- Phase 1-4: Auth, Main, MyPage, Mood 페이지 기본 구현
- 기본 디바이스 카드 및 무드 대시보드
- **디바이스 카드 아이콘 단순화** (완료)
  - Outline 스타일 아이콘 사용 (`react-icons/hi2`)
  - 상태 아이콘과 디바이스 타입 아이콘 구분
  - 색상 제거 (회색 통일)
- **세그먼트 전환 대각선 애니메이션** (완료)
  - 우측상단→좌측하단 대각선 그라데이션 전환
  - 0.8초 자연스러운 색상 전환 효과

### ⚠️ 개선이 필요한 부분
- 활성 디바이스 카드 레이저 글로우 효과
- 향 디바이스 정보 표시 미흡 (LvX + 타이머)
- 음악 재생 UI 기본 수준
- 에러 처리 및 로딩 상태 일관성 부족

### ✅ 최근 완료된 작업
- ✅ 디바이스 카드 아이콘 단순화 (outline 스타일, 색상 제거)
- ✅ 세그먼트 전환 대각선 애니메이션 (우측상단→좌측하단)

---

## 🚀 V2/V3 벨류업 작업 목록

### Phase 1: 디바이스 카드 시각적 개선 ⭐ (높은 우선순위)

**목표**: 활성 디바이스 카드에 레이저 글로우 효과 추가, 향 디바이스 정보 표시 강화

#### 1.0 디바이스 카드 아이콘 개선 ✅ (완료)

**작업 내용**:
- [x] 더 단순한 outline 스타일 아이콘으로 변경 (`react-icons/hi2` 계열 사용)
- [x] 상태 아이콘과 디바이스 타입 아이콘 구분 (겹치지 않도록)
- [x] 모든 아이콘 색상 제거 (회색 통일)
- [x] 파일: `Web/src/app/(main)/home/components/Device/DeviceCardSmall.tsx`

**변경 사항**:
- Light: `FaLightbulb` → `HiOutlineLightBulb`
- Scent: `FaSprayCan` → `HiOutlineSparkles`
- Music: `FaMusic` → `HiOutlineMusicalNote`
- 모든 상태 아이콘 색상 제거 (회색 통일)
- 아이콘 크기 통일 (`text-[11px]`)

#### 1.1 활성 디바이스 카드 레이저 글로우 애니메이션

**작업 내용**:
- [ ] `DeviceCardSmall.tsx`: 활성 상태일 때 테두리에 레이저 글로우 효과 추가
- [ ] `DeviceCardExpanded.tsx`: 확장 카드에도 동일 효과 적용
- [ ] CSS 애니메이션 구현 (`@keyframes laser-glow`)
- [ ] 디바이스 타입별 색상 적용 (조명: 무드 컬러, 향: 노란색, 음악: 파란색 등)
- [ ] 파일: `Web/src/app/(main)/home/components/Device/DeviceCardSmall.tsx`, `DeviceCardExpanded.tsx`

**구현 세부사항**:
```typescript
// 활성 상태 감지 (currentMood와 연동)
const isActive = device.power && 
  (device.type === 'light' && currentMood?.color) ||
  (device.type === 'scent' && currentMood?.scent) ||
  (device.type === 'music' && currentMood?.music);

// CSS 클래스 조건부 적용
className={`... ${isActive ? 'laser-glow-active' : ''}`}
```

**애니메이션 효과**:
- 테두리 주변에 레이저 같은 글로우 효과
- 색상이 순환하며 빛나는 효과
- `animation: laserGlow 2s ease-in-out infinite;`

**예상 소요 시간**: 3-4시간

---

#### 1.2 향 디바이스 정보 표시 (LvX + 스프레이 타이머)

**작업 내용**:
- [ ] `DeviceCardExpanded.tsx`: 향 디바이스일 때 "LvX" 레벨 표시 추가
- [ ] 스프레이 간격 타이머 애니메이션 구현 (원형 프로그레스)
- [ ] 스프레이 간격 설정 UI (예: 30초, 1분, 2분)
- [ ] 스프레이 시각적 효과 (파티클 애니메이션, 선택사항)
- [ ] 파일: `Web/src/app/(main)/home/components/Device/components/DeviceControls.tsx`

**구현 세부사항**:
```typescript
// 향 디바이스 상태 인터페이스
interface ScentDeviceState {
  level: number; // 1-10
  sprayInterval: number; // 초 단위 (30, 60, 120 등)
  lastSprayTime: number; // 마지막 스프레이 시간 (timestamp)
}

// 타이머 컴포넌트
<ScentTimer 
  level={scentLevel}
  interval={sprayInterval}
  lastSprayTime={lastSprayTime}
/>
```

**UI 요소**:
- 상단에 "Lv5" 같은 레벨 표시 (큰 폰트)
- 원형 프로그레스 바로 다음 스프레이까지 남은 시간 표시
- 스프레이 간격 설정 드롭다운

**예상 소요 시간**: 4-5시간

---

### Phase 2: 무드 대시보드 애니메이션 개선 ⭐⭐ (매우 높은 우선순위)

**목표**: 세그먼트 전환 시 부드러운 애니메이션 효과 추가

#### 2.1 세그먼트 전환 대각선 애니메이션 ✅ (완료)

**구현 완료 사항**:
- 우측상단에서 좌측하단으로 대각선 그라데이션 스위프 효과
- 이전 색상에서 새 색상으로 자연스러운 전환
- 0.8초 애니메이션 (diagonalSweep 키프레임)
- clip-path와 transform을 활용한 부드러운 전환

**작업 내용**:
- [x] `MoodDashboard.tsx`: 세그먼트 변경 시 대각선 애니메이션 추가
- [x] `useSegmentSelector.ts`: 세그먼트 변경 애니메이션 상태 관리
- [x] `useSegmentTransition.ts`: 전환 애니메이션 훅 생성
- [x] `SegmentTransition.tsx`: 우측상단→좌측하단 대각선 그라데이션 애니메이션 컴포넌트
- [x] 색상 전환 애니메이션 (이전 색상 → 새 색상)
- [x] `globals.css`: diagonalSweep 키프레임 애니메이션 추가
- [ ] 파일: `Web/src/app/(main)/home/components/MoodDashboard/MoodDashboard.tsx`, `hooks/useSegmentSelector.ts`

**구현 세부사항**:
```typescript
// 애니메이션 상태
const [isTransitioning, setIsTransitioning] = useState(false);
const [previousSegment, setPreviousSegment] = useState<number | null>(null);

// 세그먼트 변경 시
const handleSegmentChange = (newSegment: number) => {
  setIsTransitioning(true);
  setPreviousSegment(currentSegment);
  setTimeout(() => {
    setCurrentSegment(newSegment);
    setIsTransitioning(false);
  }, 300); // 애니메이션 시간
};
```

**애니메이션 효과**:
- 우측상단에서 좌측하단으로 대각선 그라데이션 이동
- 이전 색상 → 새 색상 자연스러운 전환
- 0.8초 애니메이션 (diagonalSweep)
- `clip-path`와 `transform`을 활용한 스위프 효과

**구현 파일**:
- `SegmentTransition.tsx`: 애니메이션 컴포넌트
- `useSegmentTransition.ts`: 애니메이션 상태 관리 훅
- `globals.css`: diagonalSweep 키프레임 애니메이션

**예상 소요 시간**: 3-4시간 (완료)

---

#### 2.2 음악 재생 UI 개선 (V2-M1 준비)

**작업 내용**:
- [ ] `MusicControls.tsx`: 음악 재생 UI 개선
- [ ] 재생 상태 시각화 (재생 중/일시정지/중지)
- [ ] 음악 정보 표시 개선 (아티스트, 앨범 등)
- [ ] 재생 시간 표시 (0:00 / 3:45 형식)
- [ ] 파일: `Web/src/app/(main)/home/components/MoodDashboard/components/MusicControls.tsx`

**구현 세부사항**:
```typescript
// 음악 재생 상태 (V2-M1에서 실제 Audio API 사용 예정)
interface MusicPlaybackState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  track: {
    title: string;
    artist: string;
    album?: string;
  };
}

// UI 구성
<MusicPlayer
  track={currentMood.music}
  playbackState={playbackState}
  onPlayPause={handlePlayPause}
  onSeek={handleSeek}
/>
```

**UI 요소**:
- 재생/일시정지 버튼 (큰 버튼)
- 재생 시간 표시
- 볼륨 컨트롤 (슬라이더)
- 다음 곡 버튼 (비활성화, 대시보드에서 통제)

**예상 소요 시간**: 2-3시간

---

### Phase 3: 전역 UI/UX 개선

**목표**: 에러 처리, 로딩 상태, 사용자 피드백 전반 개선

#### 3.1 에러 처리 및 로딩 상태 일관성 강화

**작업 내용**:
- [ ] 전역 에러 바운더리 개선
- [ ] API 호출 에러 처리 일관성 확보
- [ ] 로딩 스켈레톤 UI 통일
- [ ] 에러 메시지 사용자 친화적 표시
- [ ] 파일: `Web/src/components/ErrorBoundary.tsx` (재생성), 각 API 라우트

**구현 세부사항**:
```typescript
// 통일된 에러 응답 형식
interface ErrorResponse {
  error: string;
  message: string;
  code?: string;
  timestamp: string;
}

// 통일된 로딩 컴포넌트
<SkeletonLoader type="mood-dashboard" />
<SkeletonLoader type="device-card" />
<SkeletonLoader type="profile" />
```

**에러 처리 전략**:
- 네트워크 에러: "네트워크 연결을 확인해주세요"
- 서버 에러: "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요"
- 권한 에러: "접근 권한이 없습니다"

**예상 소요 시간**: 4-5시간

---

#### 3.2 사용자 피드백 개선 (토스트, 알림)

**작업 내용**:
- [ ] 토스트 알림 시스템 구현 (react-hot-toast 또는 커스텀)
- [ ] 성공/에러/정보 토스트 메시지 표시
- [ ] 액션 완료 피드백 (저장, 삭제, 업데이트 등)
- [ ] 파일: `Web/src/components/Toast.tsx` (생성), 각 액션 핸들러

**구현 세부사항**:
```typescript
// 토스트 훅
const { showToast } = useToast();

// 사용 예시
const handleSave = async () => {
  try {
    await saveMood();
    showToast('무드가 저장되었습니다', 'success');
  } catch (error) {
    showToast('저장에 실패했습니다', 'error');
  }
};
```

**토스트 타입**:
- `success`: 성공 (초록색)
- `error`: 에러 (빨간색)
- `info`: 정보 (파란색)
- `warning`: 경고 (노란색)

**예상 소요 시간**: 2-3시간

---

### Phase 4: 코드 품질 개선

**목표**: 타입 안정성, 코드 일관성, 성능 최적화

#### 4.1 타입 안정성 강화

**작업 내용**:
- [ ] 모든 컴포넌트 Props 타입 명시
- [ ] API 응답 타입 정의
- [ ] 유틸리티 함수 타입 정의
- [ ] any 타입 제거
- [ ] 파일: 전역 타입 파일 검토

**구현 세부사항**:
```typescript
// 명확한 타입 정의
interface DeviceCardProps {
  device: Device;
  currentMood?: Mood;
  onClose: () => void;
  onDelete: () => void;
  // ...
}

// API 응답 타입
interface MoodStreamResponse {
  segments: MoodSegment[];
  source: 'openai' | 'mock' | 'cache';
  timestamp: string;
}
```

**검증 방법**:
- TypeScript 컴파일 에러 0개
- `strict: true` 모드에서도 컴파일 가능

**예상 소요 시간**: 3-4시간

---

#### 4.2 코드 일관성 및 성능 최적화

**작업 내용**:
- [ ] 컴포넌트 메모이제이션 (React.memo, useMemo, useCallback)
- [ ] 불필요한 리렌더링 방지
- [ ] 코드 스타일 통일 (ESLint 설정)
- [ ] 주석 및 문서화 개선
- [ ] 파일: 모든 컴포넌트 검토

**구현 세부사항**:
```typescript
// 메모이제이션 예시
const MemoizedDeviceCard = React.memo(DeviceCardSmall, (prev, next) => {
  return prev.device.id === next.device.id &&
         prev.device.power === next.device.power &&
         prev.currentMood?.id === next.currentMood?.id;
});

// useCallback 사용
const handleUpdate = useCallback((value: string) => {
  onUpdate(value);
}, [onUpdate]);
```

**성능 최적화 포인트**:
- 리스트 렌더링 시 key 최적화
- 이미지 lazy loading
- 코드 스플리팅 (필요 시)

**예상 소요 시간**: 4-6시간

---

### Phase 5: V3 기능 준비 (선택사항)

**목표**: V3에서 구현할 기능들의 기반 마련

#### 5.1 테마 설정 준비 (다크 모드)

**작업 내용**:
- [ ] 테마 컨텍스트 생성 (ThemeProvider)
- [ ] 다크/라이트 모드 전환 UI (비활성화 상태)
- [ ] CSS 변수 기반 색상 시스템
- [ ] 파일: `Web/src/contexts/ThemeContext.tsx` (생성)

**구현 세부사항**:
```typescript
// 테마 컨텍스트 (V3에서 활성화)
interface ThemeContextValue {
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  // 현재는 읽기 전용 (V3에서 활성화)
}

// CSS 변수
:root {
  --bg-primary: #ffffff;
  --text-primary: #000000;
  /* 다크 모드 변수 준비 */
}
```

**예상 소요 시간**: 2-3시간 (기반만 준비)

---

#### 5.2 접근성(A11y) 개선

**작업 내용**:
- [ ] 키보드 네비게이션 지원
- [ ] ARIA 레이블 추가
- [ ] 포커스 관리 개선
- [ ] 색상 대비 검증
- [ ] 파일: 모든 인터랙티브 컴포넌트

**구현 세부사항**:
```typescript
// ARIA 레이블 예시
<button
  aria-label="무드 새로고침"
  aria-describedby="mood-refresh-description"
  onClick={handleRefresh}
>
  <RefreshIcon />
</button>
```

**예상 소요 시간**: 3-4시간

---

## 📅 작업 우선순위

### 🔴 매우 높음 (즉시 진행)
1. **Phase 2.1: 세그먼트 전환 대각선 애니메이션** ⭐ (완료) - 사용자 경험에 직접적 영향
2. **Phase 1.1: 디바이스 카드 레이저 글로우** - 시각적 피드백 중요

### 🟡 높음 (다음 단계)
3. **Phase 1.2: 향 디바이스 정보 표시** - V2에서 언급된 기능
4. **Phase 3.1: 에러 처리 개선** - 안정성 향상

### 🟢 중간 (여유 시간에)
5. **Phase 2.2: 음악 재생 UI 개선** - V2-M1 준비
6. **Phase 3.2: 토스트 알림** - 사용자 피드백
7. **Phase 4: 코드 품질 개선** - 지속적 작업

### ⚪ 낮음 (V3 준비)
8. **Phase 5: V3 기능 준비** - 기반만 준비

---

## ✅ 작업 완료 체크리스트

### Phase 1: 디바이스 카드 시각적 개선
- [ ] 활성 디바이스 카드 레이저 글로우 애니메이션
- [ ] 향 디바이스 LvX 표시
- [ ] 향 디바이스 스프레이 타이머 애니메이션

### Phase 2: 무드 대시보드 애니메이션 개선
- [x] 세그먼트 전환 대각선 애니메이션 (완료)
- [ ] 음악 재생 UI 개선

### Phase 3: 전역 UI/UX 개선
- [ ] 에러 처리 및 로딩 상태 일관성
- [ ] 토스트 알림 시스템

### Phase 4: 코드 품질 개선
- [ ] 타입 안정성 강화
- [ ] 코드 일관성 및 성능 최적화

### Phase 5: V3 기능 준비
- [ ] 테마 설정 준비
- [ ] 접근성 개선

---

## 🔧 기술 스택

### 애니메이션
- **CSS Animations**: 레이저 글로우, 페이드 효과
- **Framer Motion** (선택사항): 복잡한 애니메이션
- **React Transition Group**: 컴포넌트 전환

### 상태 관리
- **React Hooks**: useState, useCallback, useMemo
- **Context API**: 테마, 토스트 알림

### 스타일링
- **Tailwind CSS**: 유틸리티 클래스
- **CSS Variables**: 테마 색상 시스템

---

## 📝 참고 사항

### DB 연결 불필요
- 모든 작업은 V1 Mock Mode에서 동작
- localStorage 및 메모리 상태로 충분
- 실제 DB 연결은 V2 Phase 5에서 진행

### 호환성
- V1 Mock Mode와 완전 호환
- Admin 계정으로 전체 플로우 테스트 가능
- 실제 DB 연결 시에도 동작

### 테스트 방법
- 로컬에서 `npm run dev` 실행
- Admin 계정으로 로그인 (`admin@moodmanager.com` / `admin1234`)
- 각 기능 테스트 및 디버깅

---

## 🎯 완성 기준

### Phase 1-2 완료 기준
- [ ] 활성 디바이스 카드에 레이저 글로우 효과 적용
- [ ] 향 디바이스에 LvX 및 타이머 표시
- [ ] 세그먼트 전환 시 부드러운 애니메이션
- [ ] 음악 재생 UI 개선

### Phase 3-4 완료 기준
- [ ] 일관된 에러 처리 및 로딩 상태
- [ ] 토스트 알림 시스템 작동
- [ ] TypeScript 컴파일 에러 0개
- [ ] 성능 최적화 완료

### 전체 완료 기준
- [ ] 모든 Phase 작업 완료
- [ ] 로컬에서 전체 플로우 테스트 통과
- [ ] 코드 리뷰 완료
- [ ] 문서 업데이트 완료

---

## 📚 관련 문서

- `docs/V2_DEVELOPMENT_PLAN.md`: V2 전체 개발 계획
- `README.md`: 프로젝트 개요
- `Web/prisma/schema.prisma`: DB 스키마 (참고용)

---

## 🚨 주의사항

1. **DB 연결 불필요**: 모든 작업은 Mock Mode에서 진행
2. **V1 호환성**: 기존 V1 기능에 영향을 주지 않도록 주의
3. **성능**: 애니메이션은 성능에 영향을 주지 않도록 최적화
4. **접근성**: 키보드 네비게이션 및 스크린 리더 지원 고려

