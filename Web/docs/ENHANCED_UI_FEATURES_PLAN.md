# 향상된 UI 기능 구현 계획

## 개요
사용자 경험 향상을 위한 4가지 주요 기능 추가:
1. **앨범 정보 모달**: 앨범 클릭 시 노래 설명 표시
2. **디바이스 카드 음량 조절**: 모든 디바이스에서 음량 조절 및 연동
3. **설정 저장 기능**: 별표 버튼으로 음량/향 설정 저장 및 자동 갱신
4. **향 정보 모달**: 향 클릭 시 향 카테고리별 설명 표시

---

## Phase 1: 앨범 정보 모달

### 1.1 현재 상태 분석
- ✅ `AlbumSection` 컴포넌트에 `onAlbumClick` 핸들러 존재 (현재 빈 함수)
- ✅ `musicTracks.json`에 `description` 필드 존재 (일부 노래만)
- ✅ `currentTrack`에서 현재 재생 중인 노래 정보 접근 가능
- ❌ 앨범 정보 모달 UI 부재

### 1.2 구현 계획

#### 1.2.1 앨범 정보 모달 컴포넌트 생성
**파일**: `Web/src/app/(main)/home/components/MoodDashboard/components/AlbumInfoModal.tsx`

**기능**:
- 앨범 이미지 표시
- 노래 제목, 아티스트 표시
- 설명(description)이 있으면 표시, 없으면 숨김
- 닫기 버튼

**Props**:
```typescript
interface AlbumInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  track: MusicTrack | null; // currentTrack
}
```

#### 1.2.2 `AlbumSection` 수정
**파일**: `Web/src/app/(main)/home/components/MoodDashboard/components/AlbumSection.tsx`

**변경 사항**:
- `onAlbumClick` 핸들러를 실제 모달 열기 함수로 연결
- `currentTrack` prop 추가 (MoodDashboard에서 전달)

#### 1.2.3 `MoodDashboard` 수정
**파일**: `Web/src/app/(main)/home/components/MoodDashboard/MoodDashboard.tsx`

**변경 사항**:
- `AlbumInfoModal` 상태 관리 (`isOpen`)
- `currentTrack`를 `AlbumSection`에 전달
- `onAlbumClick`에서 모달 열기

**예상 작업 시간**: 30-40분

---

## Phase 2: 디바이스 카드 음량 조절

### 2.1 현재 상태 분석
- ✅ `MusicPlayer.setVolume()` 메서드 존재
- ✅ `DeviceCardSmall`, `DeviceCardExpanded` 컴포넌트 존재
- ✅ `useDeviceSync` 훅으로 디바이스 동기화 가능
- ❌ 디바이스 카드에 음량 조절 UI 부재
- ❌ 음량 상태 관리 부재

### 2.2 구현 계획

#### 2.2.1 `useMusicTrackPlayer` 훅 확장
**파일**: `Web/src/hooks/useMusicTrackPlayer.ts`

**변경 사항**:
- `volume` 상태 추가 (기본값: 0.7, 0-1 범위)
- `setVolume` 함수 추가 (MusicPlayer.setVolume 호출)
- localStorage에 음량 저장/불러오기 (선택적)

**인터페이스 추가**:
```typescript
interface UseMusicTrackPlayerReturn {
  // ... 기존 필드들
  volume: number; // 0-1 범위
  setVolume: (volume: number) => void;
}
```

#### 2.2.2 `DeviceCardExpanded`에 음량 슬라이더 추가
**파일**: `Web/src/app/(main)/home/components/Device/DeviceCardExpanded.tsx`

**변경 사항**:
- Speaker 디바이스에 음량 슬라이더 추가
- Manager 디바이스에도 음량 슬라이더 추가 (통합 제어)
- 슬라이더 값 변경 시 `setVolume` 호출

**UI 디자인**:
```
[Speaker Device Card Expanded]
├── [Device Info]
├── [Now Playing: 노래 제목]
└── [Volume Control]
    🔊 |━━━━━━━━━━━━━━━━━━━━| 70%
```

#### 2.2.3 `useDeviceSync`에 음량 반영
**파일**: `Web/src/hooks/useDeviceSync.ts`

**변경 사항**:
- `volume` prop 추가 (0-100 범위)
- Speaker 디바이스의 `output.volume` 업데이트
- Manager 디바이스의 `output.volume` 업데이트 (선택적)

**인터페이스 변경**:
```typescript
interface UseDeviceSyncProps {
  // ... 기존 필드들
  volume?: number; // 0-100 범위
}
```

#### 2.2.4 `HomeContent`에서 음량 전달
**파일**: `Web/src/app/(main)/home/components/HomeContent.tsx`

**변경 사항**:
- `useMusicTrackPlayer`에서 `volume`, `setVolume` 가져오기
- `useDeviceSync`에 `volume` 전달
- `DeviceGrid`에 `volume`, `onVolumeChange` 전달

#### 2.2.5 모든 디바이스 연동
**로직**:
- Speaker 디바이스에서 음량 조절 → `setVolume` 호출 → 모든 디바이스 카드 업데이트
- Manager 디바이스에서 음량 조절 → 동일하게 처리
- 음량 변경 시 `useDeviceSync`를 통해 모든 관련 디바이스 동기화

**예상 작업 시간**: 1-1.5시간

---

## Phase 3: 설정 저장 기능 (별표 버튼)

### 3.1 현재 상태 분석
- ✅ `useMoodDashboard`에 `preferenceCount` 관리 로직 존재
- ✅ `/api/moods/preference` API 엔드포인트 존재
- ❌ 음량/향 설정 저장 기능 부재
- ❌ 별표 버튼 UI 부재

### 3.2 구현 계획

#### 3.2.1 설정 저장 데이터 구조 정의
**파일**: `Web/src/types/preference.ts` (새 파일)

**타입 정의**:
```typescript
interface UserDevicePreferences {
  volume: number; // 0-100
  scentType: ScentType;
  scentName: string;
  scentLevel?: number; // 0-10
  lastUpdated: Date;
}
```

#### 3.2.2 API 엔드포인트 확장
**파일**: `Web/src/app/api/moods/preference/route.ts`

**변경 사항**:
- 기존 `moodPreferences` 외에 `devicePreferences` 필드 추가
- GET: `devicePreferences` 반환
- POST: `devicePreferences` 저장/갱신

**데이터 구조**:
```typescript
{
  moodPreferences: { [moodId: string]: number },
  devicePreferences: {
    volume: number,
    scentType: ScentType,
    scentName: string,
    scentLevel?: number,
    lastUpdated: string
  } | null
}
```

#### 3.2.3 별표 버튼 UI 추가
**위치 옵션**:
- **옵션 A**: DeviceCardExpanded 내부 (Speaker/Manager 카드)
- **옵션 B**: MoodDashboard 헤더 (기존 별표 버튼 옆)
- **옵션 C**: 별도 설정 섹션

**추천**: 옵션 A (디바이스 카드 내부)

**파일**: `Web/src/app/(main)/home/components/Device/DeviceCardExpanded.tsx`

**변경 사항**:
- 별표 아이콘 버튼 추가 (lucide-react `Star` 아이콘)
- 저장된 설정이 있으면 채워진 별표, 없으면 빈 별표
- 클릭 시 현재 음량/향 설정 저장

#### 3.2.4 설정 저장 로직
**파일**: `Web/src/hooks/useDevicePreferences.ts` (새 파일)

**기능**:
- `devicePreferences` 상태 관리
- API에서 설정 불러오기
- 설정 저장/갱신 함수
- 자동 갱신 로직 (값 변동 시)

**로직**:
```typescript
// 별표 클릭 시
const handleSavePreferences = () => {
  const preferences = {
    volume: currentVolume,
    scentType: currentMood.scent.type,
    scentName: currentMood.scent.name,
    scentLevel: currentScentLevel,
    lastUpdated: new Date()
  };
  saveDevicePreferences(preferences);
};

// 값 변동 감지 및 자동 갱신
useEffect(() => {
  if (isSaved && hasChanges) {
    // 자동으로 갱신
    updateDevicePreferences(newPreferences);
  }
}, [volume, scentType, scentName]);
```

#### 3.2.5 설정 불러오기 및 적용
**파일**: `Web/src/hooks/useDevicePreferences.ts`

**기능**:
- 마운트 시 저장된 설정 불러오기
- 저장된 설정이 있으면 음량/향 자동 적용
- 저장된 설정이 없으면 기본값 사용

**예상 작업 시간**: 1.5-2시간

---

## Phase 4: 향 정보 모달

### 4.1 현재 상태 분석
- ✅ `ScentControl` 컴포넌트에 `onScentClick` 핸들러 존재 (현재 빈 함수)
- ✅ `SCENT_DEFINITIONS`에 향 카테고리별 정의 존재
- ❌ 향 정보 모달 UI 부재
- ❌ 향 카테고리별 설명 부재

### 4.2 구현 계획

#### 4.2.1 향 카테고리별 설명 정의
**파일**: `Web/src/types/mood.ts`

**추가 내용**:
```typescript
export const SCENT_DESCRIPTIONS: Record<ScentType, string> = {
  Musk: "부드럽고 따뜻한 향으로 편안함과 안정감을 줍니다.",
  Aromatic: "상쾌하고 허브 향으로 집중력 향상과 스트레스 완화에 도움이 됩니다.",
  Woody: "깊고 따뜻한 나무 향으로 차분함과 안정감을 제공합니다.",
  Citrus: "밝고 상쾌한 과일 향으로 활력과 기분 전환에 좋습니다.",
  Honey: "달콤하고 따뜻한 꿀 향으로 편안함과 행복감을 줍니다.",
  Green: "신선하고 자연스러운 풀 향으로 상쾌함과 활력을 줍니다.",
  Dry: "건조하고 따뜻한 대지 향으로 차분함과 안정감을 제공합니다.",
  Leathery: "고급스럽고 따뜻한 가죽 향으로 세련됨과 편안함을 줍니다.",
  Marine: "시원하고 상쾌한 바다 향으로 활력과 기분 전환에 좋습니다.",
  Spicy: "따뜻하고 자극적인 향으로 활력과 집중력 향상에 도움이 됩니다.",
  Floral: "부드럽고 달콤한 꽃 향으로 편안함과 행복감을 줍니다.",
  Powdery: "부드럽고 따뜻한 파우더 향으로 편안함과 안정감을 제공합니다.",
};
```

#### 4.2.2 향 정보 모달 컴포넌트 생성
**파일**: `Web/src/app/(main)/home/components/MoodDashboard/components/ScentInfoModal.tsx`

**기능**:
- 향 아이콘 표시
- 향 타입 및 이름 표시
- 향 카테고리 설명 표시
- 닫기 버튼

**Props**:
```typescript
interface ScentInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  scentType: ScentType;
  scentName: string;
}
```

#### 4.2.3 `ScentControl` 수정
**파일**: `Web/src/app/(main)/home/components/MoodDashboard/components/ScentControl.tsx`

**변경 사항**:
- `onScentClick` 핸들러를 실제 모달 열기 함수로 연결

#### 4.2.4 `MoodDashboard` 수정
**파일**: `Web/src/app/(main)/home/components/MoodDashboard/MoodDashboard.tsx`

**변경 사항**:
- `ScentInfoModal` 상태 관리 (`isOpen`)
- `onScentClick`에서 모달 열기

**예상 작업 시간**: 30-40분

---

## 전체 구현 순서

### 우선순위 1 (기본 기능)
1. ✅ **Phase 1**: 앨범 정보 모달 (30-40분)
2. ✅ **Phase 4**: 향 정보 모달 (30-40분)

### 우선순위 2 (핵심 기능)
3. ✅ **Phase 2**: 디바이스 카드 음량 조절 (1-1.5시간)

### 우선순위 3 (고급 기능)
4. ✅ **Phase 3**: 설정 저장 기능 (1.5-2시간)

**총 예상 작업 시간**: 3.5-4.5시간

---

## 기술적 고려사항

### 음량 범위
- 내부: 0-1 (MusicPlayer.setVolume)
- UI: 0-100% (사용자 친화적)
- 변환: `volume / 100` → MusicPlayer, `volume * 100` → UI

### 설정 저장 전략
- 별표 클릭 시 즉시 저장
- 값 변동 감지 후 자동 갱신 (debounce 적용 권장)
- 가장 마지막 설정만 저장 (이전 설정 덮어쓰기)

### 모달 UI 일관성
- 앨범 정보 모달과 향 정보 모달의 디자인 통일
- 반투명 배경, 중앙 정렬, 닫기 버튼
- 모바일 친화적 크기

### 디바이스 연동
- 음량 변경 시 모든 관련 디바이스 (Speaker, Manager) 동기화
- `useDeviceSync`를 통해 실시간 반영

---

## UI 디자인 가이드

### 앨범 정보 모달
```
┌─────────────────────────┐
│  [X]                    │
│                         │
│  [앨범 이미지]          │
│                         │
│  노래 제목              │
│  아티스트               │
│                         │
│  설명 텍스트...         │
│  (description이 있을 때)│
└─────────────────────────┘
```

### 향 정보 모달
```
┌─────────────────────────┐
│  [X]                    │
│                         │
│  [향 아이콘]            │
│                         │
│  향 타입                │
│  향 이름                │
│                         │
│  향 설명 텍스트...       │
│  (카테고리별 설명)      │
└─────────────────────────┘
```

### 디바이스 카드 음량 조절
```
[Speaker Device Card Expanded]
├── 🔊 Now Playing: 노래 제목
├── [Volume Slider]
│   🔊 |━━━━━━━━━━━━━━━━━━━━| 70%
└── [⭐ Save Settings]
```

---

## 데이터베이스 스키마 변경 (필요 시)

### Prisma Schema
```prisma
model User {
  // ... 기존 필드들
  devicePreferences Json? // { volume, scentType, scentName, scentLevel, lastUpdated }
}
```

또는 별도 테이블:
```prisma
model DevicePreference {
  id        String   @id @default(cuid())
  userId    String
  volume    Int      @default(70)
  scentType String
  scentName String
  scentLevel Int?
  lastUpdated DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id])
  
  @@unique([userId])
}
```

---

## 참고사항
- 기존 UI 스타일과 일관성 유지
- 모바일 환경 고려 (터치 친화적 슬라이더)
- 접근성 고려 (ARIA 레이블, 키보드 네비게이션)
- 성능 최적화 (debounce, 메모이제이션)

