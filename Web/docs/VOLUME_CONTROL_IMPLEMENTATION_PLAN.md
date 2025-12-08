# 음량 조절 기능 구현 계획

> ⚠️ **참고**: 이 문서는 구버전입니다. 최신 통합 계획서는 `ENHANCED_UI_FEATURES_PLAN.md`를 참고하세요.

## 개요
현재 시스템에는 음량 조절 UI가 없습니다. `MusicPlayer` 클래스에는 `setVolume()` 메서드가 이미 구현되어 있으나, 사용자가 UI를 통해 음량을 조절할 수 있는 기능이 부재합니다.

## 현재 상태 분석

### 기존 구현
- ✅ `MusicPlayer.setVolume(volume: number)` - 음량 설정 메서드 존재 (0-1 범위)
- ✅ `MusicPlayer.getVolume()` - 현재 음량 가져오기 메서드 존재
- ✅ `useMusicTrackPlayer` 훅에서 `MusicPlayer` 인스턴스 관리
- ✅ `MusicControls` 컴포넌트에 재생/일시정지, 이전/다음 버튼 존재
- ❌ 음량 조절 UI 부재
- ❌ 음량 상태 관리 부재
- ❌ 디바이스 동기화에 음량 반영 부재

### 관련 파일
- `Web/src/lib/audio/musicPlayer.ts` - MusicPlayer 클래스 (setVolume, getVolume 메서드)
- `Web/src/hooks/useMusicTrackPlayer.ts` - 음악 재생 관리 훅
- `Web/src/app/(main)/home/components/MoodDashboard/components/MusicControls.tsx` - 음악 컨트롤 UI
- `Web/src/hooks/useDeviceSync.ts` - 디바이스 동기화 훅
- `Web/src/app/(main)/home/components/MoodDashboard/MoodDashboard.tsx` - 대시보드 메인 컴포넌트

## 구현 계획

### Phase 1: 기본 음량 조절 UI 추가

#### 1.1 `useMusicTrackPlayer` 훅 확장
**파일**: `Web/src/hooks/useMusicTrackPlayer.ts`

**변경 사항**:
- `volume` 상태 추가 (기본값: 0.7, 0-1 범위)
- `setVolume` 함수 추가 (MusicPlayer.setVolume 호출)
- `useEffect`로 volume 변경 시 MusicPlayer에 반영

**인터페이스 추가**:
```typescript
interface UseMusicTrackPlayerReturn {
  // ... 기존 필드들
  volume: number;
  setVolume: (volume: number) => void;
}
```

#### 1.2 `MusicControls` 컴포넌트에 음량 조절 UI 추가
**파일**: `Web/src/app/(main)/home/components/MoodDashboard/components/MusicControls.tsx`

**변경 사항**:
- 음량 슬라이더 추가 (가로 슬라이더 또는 세로 슬라이더)
- 음량 아이콘 추가 (Volume2, VolumeX 등 lucide-react 아이콘)
- 음량 표시 (0-100% 또는 0-10 단계)

**UI 배치 옵션**:
- **옵션 A**: 재생 버튼 옆에 음량 아이콘 + 슬라이더 (가로)
- **옵션 B**: 재생 버튼 아래에 음량 슬라이더 (가로)
- **옵션 C**: 재생 버튼 오른쪽에 음량 아이콘 + 슬라이더 (세로, 작은 크기)

**추천**: 옵션 B (재생 버튼 아래 가로 슬라이더)

#### 1.3 `MoodDashboard`에서 음량 상태 전달
**파일**: `Web/src/app/(main)/home/components/MoodDashboard/MoodDashboard.tsx`

**변경 사항**:
- `useMusicTrackPlayer`에서 `volume`, `setVolume` 가져오기
- `MusicControls`에 `volume`, `onVolumeChange` prop 전달

### Phase 2: 음량 설정 영구 저장 (선택적)

#### 2.1 localStorage에 음량 저장
**파일**: `Web/src/hooks/useMusicTrackPlayer.ts`

**변경 사항**:
- 초기 마운트 시 localStorage에서 음량 불러오기
- 음량 변경 시 localStorage에 저장
- 키: `mood-manager:music-volume`

### Phase 3: 디바이스 동기화 연동

#### 3.1 `useDeviceSync`에 음량 반영
**파일**: `Web/src/hooks/useDeviceSync.ts`

**변경 사항**:
- `currentMood` 대신 별도 `volume` prop 추가 또는
- `currentMood`에 volume 정보 포함 (선택적)
- Speaker 디바이스의 `output.volume` 업데이트

**인터페이스 변경**:
```typescript
interface UseDeviceSyncProps {
  // ... 기존 필드들
  volume?: number; // 0-100 범위
}
```

#### 3.2 `HomeContent`에서 음량 전달
**파일**: `Web/src/app/(main)/home/components/HomeContent.tsx`

**변경 사항**:
- `useMusicTrackPlayer`에서 `volume` 가져오기
- `useDeviceSync`에 `volume` 전달

### Phase 4: UI/UX 개선 (선택적)

#### 4.1 음량 아이콘 상태 표시
- 음량 0%: VolumeX (음소거)
- 음량 1-30%: Volume1 (낮음)
- 음량 31-70%: Volume2 (보통)
- 음량 71-100%: Volume2 (높음)

#### 4.2 음량 툴팁
- 슬라이더에 마우스 오버 시 현재 음량 퍼센트 표시

#### 4.3 키보드 단축키 (선택적)
- 화살표 키로 음량 조절
- M 키로 음소거 토글

## 구현 순서

### 우선순위 1 (필수)
1. ✅ Phase 1.1: `useMusicTrackPlayer`에 volume 상태 추가
2. ✅ Phase 1.2: `MusicControls`에 음량 슬라이더 UI 추가
3. ✅ Phase 1.3: `MoodDashboard`에서 음량 상태 전달

### 우선순위 2 (권장)
4. ✅ Phase 2.1: localStorage에 음량 저장
5. ✅ Phase 3.1: `useDeviceSync`에 음량 반영
6. ✅ Phase 3.2: `HomeContent`에서 음량 전달

### 우선순위 3 (선택적)
7. ⏸️ Phase 4.1: 음량 아이콘 상태 표시
8. ⏸️ Phase 4.2: 음량 툴팁
9. ⏸️ Phase 4.3: 키보드 단축키

## UI 디자인 제안

### 음량 슬라이더 위치
```
[MoodDashboard]
├── [Progress Bar] (현재 시간 / 전체 시간)
├── [재생 컨트롤 버튼들] (이전 | 재생/일시정지 | 다음)
└── [음량 조절] (아이콘 |━━━━━━━━━━━━━━━━━━━━| 70%) ← 여기에 추가
```

### 음량 슬라이더 스타일
- 가로 슬라이더 (width: 100%)
- 높이: 4px (progress bar와 유사)
- 배경: 흰색 반투명 (bg-white/50)
- 진행 바: 검은색 또는 무드 컬러
- 아이콘: 왼쪽에 Volume2 아이콘
- 퍼센트: 오른쪽에 현재 음량 표시 (선택적)

## 기술적 고려사항

### 음량 범위
- 내부: 0-1 (MusicPlayer.setVolume)
- UI: 0-100% (사용자 친화적)
- 변환: `volume / 100` → MusicPlayer, `volume * 100` → UI

### 음량 초기값
- 기본값: 70% (0.7)
- localStorage에서 불러온 값이 있으면 사용

### 디바이스 동기화
- Speaker 디바이스의 `output.volume` 업데이트
- 범위: 0-100 (디바이스 표준)

## 예상 작업 시간
- Phase 1: 30-45분
- Phase 2: 15-20분
- Phase 3: 20-30분
- Phase 4: 30-45분 (선택적)

**총 예상 시간**: 1.5-2시간 (Phase 1-3만 구현 시)

## 참고사항
- 기존 `MusicPlayer.setVolume()` 메서드를 활용
- 기존 UI 스타일과 일관성 유지
- 모바일 환경에서도 사용하기 편한 터치 친화적 슬라이더
- 접근성 고려 (ARIA 레이블 등)

