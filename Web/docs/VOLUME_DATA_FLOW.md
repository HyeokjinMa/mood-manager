# 볼륨 데이터 흐름 및 연결 관계

## 파일별 핵심 코드

### 1. DeviceControls.tsx (슬라이더 UI)
**위치**: `src/app/(main)/home/components/Device/components/DeviceControls.tsx`

```typescript
// Manager 타입 볼륨 슬라이더
<input
  type="range"
  value={volume ?? 70}
  onChange={(e) => {
    const newVolume = Number(e.target.value);
    // ✅ onChange에서 onUpdateVolume 호출 (pendingVolumeRef 업데이트용)
    if (onUpdateVolume) {
      onUpdateVolume(newVolume);
    }
  }}
  onMouseDown={(e) => {
    // ✅ 사용자 조작 시작 시점에 플래그 설정
    if (volumeIsUserChangingRef) {
      volumeIsUserChangingRef.current = true;
    }
  }}
  onMouseUp={(e) => {
    // ✅ 사용자 조작 종료 시점에 플래그 해제
    if (volumeIsUserChangingRef) {
      volumeIsUserChangingRef.current = false;
    }
    onVolumeDragEnd?.(); // 드래그 종료 핸들러 호출
  }}
/>
```

**역할**:
- 사용자 입력을 받는 최상위 UI 컴포넌트
- `onChange`: `onUpdateVolume` 호출 → `DeviceCardExpanded.onUpdateVolume`
- `onMouseDown/TouchStart`: `volumeIsUserChangingRef.current = true` 설정
- `onMouseUp/TouchEnd`: `volumeIsUserChangingRef.current = false` + `onVolumeDragEnd` 호출

---

### 2. DeviceCardExpanded.tsx
**위치**: `src/app/(main)/home/components/Device/DeviceCardExpanded.tsx`

```typescript
const pendingVolumeRef = useRef<number | null>(null);

// DeviceControls에 전달하는 핸들러
onUpdateVolume={(newVolume) => {
  // ✅ 드래그 중: pendingVolumeRef만 업데이트 (즉시 상위로 전달하지 않음)
  if (volumeIsUserChangingRef) {
    volumeIsUserChangingRef.current = true;
  }
  isUserChangingRef.current.volume = true;
  
  // 최종 값 저장 (드래그 종료 시 API 호출에 사용)
  pendingVolumeRef.current = newVolume;
}}

onVolumeDragEnd={() => {
  // ✅ 드래그 종료 시: 최종 값으로 API 호출 및 HomeContent로 전달
  if (pendingVolumeRef.current !== null) {
    const finalVolume = pendingVolumeRef.current;
    
    // HomeContent로 전달 (HomePage의 setVolume 호출)
    if (onUpdateVolume) {
      onUpdateVolume(finalVolume);
    }
    
    // 디바이스 컨트롤 변경도 함께 전달
    if (onDeviceControlChange) {
      onDeviceControlChange({ volume: finalVolume, deviceId: device.id });
    }
    
    pendingVolumeRef.current = null;
  }
  
  // 플래그 리셋
  setTimeout(() => {
    if (volumeIsUserChangingRef) {
      volumeIsUserChangingRef.current = false;
    }
    isUserChangingRef.current.volume = false;
  }, 300);
}}
```

**역할**:
- `onChange` 시: `pendingVolumeRef`만 업데이트 (UI 반응성)
- `onVolumeDragEnd` 시: `onUpdateVolume(finalVolume)` 호출 → `HomeContent.onUpdateVolume`

---

### 3. HomeContent.tsx
**위치**: `src/app/(main)/home/components/HomeContent.tsx`

```typescript
// DeviceCardExpanded에 전달
onUpdateVolume={(newVolume) => {
  // 외부로 볼륨 변경 전달
  if (onVolumeChange) {
    onVolumeChange(newVolume); // ⚠️ 즉시 HomePage.setVolume 호출
  }
}}
```

**역할**:
- `DeviceCardExpanded`에서 받은 값을 `HomePage`로 즉시 전달
- `onVolumeChange(newVolume)` → `HomePage.setVolume(newVolume)`

---

### 4. HomePage.tsx
**위치**: `src/app/(main)/home/page.tsx`

```typescript
const [volume, setVolume] = useState<number>(70); // 0-100 범위
const volumeIsUserChangingRef = useRef<boolean>(false);

// MoodDashboard에 전달
<MoodDashboard
  volume={volume}
  onVolumeChange={(newVolume) => {
    setVolume(newVolume); // ⚠️ 여기서 volume state 업데이트
    console.log(`[HomePage] 🔊 음량 변경 (MoodDashboard에서): ${newVolume}%`);
  }}
  externalVolume={volume} // ⚠️ volume state를 externalVolume으로 전달
  volumeIsUserChangingRef={volumeIsUserChangingRef}
/>
```

**역할**:
- `volume` state 관리 (0-100 범위)
- `setVolume(newVolume)` 호출 시 `volume` state 변경 → `externalVolume` prop 변경

---

### 5. MoodDashboard.tsx
**위치**: `src/app/(main)/home/components/MoodDashboard/MoodDashboard.tsx`

```typescript
// useMusicTrackPlayer에서 받은 값
const { volume, setVolume, isUserChangingRef } = useMusicTrackPlayer({...});

// ✅ externalVolume 동기화 useEffect
const prevExternalVolumeRef = useRef<number | undefined>(undefined);
const currentVolumeRefForSync = useRef<number>(volume);

useEffect(() => {
  currentVolumeRefForSync.current = volume;
}, [volume]);

useEffect(() => {
  // ✅ 사용자 조작 중이면 동기화 스킵
  const isUserChanging = externalVolumeIsUserChangingRef?.current ?? isUserChangingRef.current;
  if (isUserChanging) {
    return;
  }
  
  if (externalVolume !== undefined && externalVolume !== prevExternalVolumeRef.current) {
    const volumeNormalized = externalVolume / 100; // 0-100 → 0-1
    const currentVolumePercent = Math.round(currentVolumeRefForSync.current * 100);
    
    if (externalVolume !== currentVolumePercent) {
      prevExternalVolumeRef.current = externalVolume;
      setVolume(volumeNormalized); // ⚠️ useMusicTrackPlayer의 volume 업데이트
    }
  }
}, [externalVolume, setVolume]); // ✅ volume 제거

// ✅ volume 변경 시 상위로 전달 useEffect
const prevVolumeRef = useRef<number | undefined>(undefined);
const currentVolumeRef = useRef<number>(volume);

useEffect(() => {
  currentVolumeRef.current = volume;
}, [volume]);

useEffect(() => {
  // ✅ 사용자 조작 중이면 상위로 전달하지 않음
  const isUserChanging = externalVolumeIsUserChangingRef?.current ?? isUserChangingRef.current;
  if (isUserChanging) {
    return;
  }
  
  if (onVolumeChange) {
    const volumePercent = Math.round(currentVolumeRef.current * 100);
    if (externalVolume === undefined || externalVolume !== volumePercent) {
      if (prevVolumeRef.current !== volumePercent) {
        prevVolumeRef.current = volumePercent;
        onVolumeChange(volumePercent); // ⚠️ HomePage.setVolume 호출
      }
    }
  }
}, [onVolumeChange, externalVolume, externalVolumeIsUserChangingRef, isUserChangingRef]); // ✅ volume 제거
```

**역할**:
- `externalVolume` 변경 시 → `setVolume(volumeNormalized)` 호출 → `useMusicTrackPlayer.volume` 업데이트
- `volume` 변경 시 → `onVolumeChange(volumePercent)` 호출 → `HomePage.setVolume` 호출

---

### 6. useMusicTrackPlayer.ts
**위치**: `src/hooks/useMusicTrackPlayer.ts`

```typescript
const [volume, setVolumeState] = useState<number>(0.7); // 0-1 범위
const isUserChangingRef = useRef(false);

const setVolume = useCallback((newVolume: number) => {
  const clampedVolume = Math.max(0, Math.min(1, newVolume));
  setVolumeState(clampedVolume); // ⚠️ 여기서 volume state 업데이트
  
  // MusicPlayer에 즉시 반영
  if (musicPlayerRef.current) {
    musicPlayerRef.current.setVolume(clampedVolume);
  }
  
  // localStorage에 저장
  localStorage.setItem("mood-manager:music-volume", clampedVolume.toString());
}, []);

// volume 변경 시 MusicPlayer에 반영
useEffect(() => {
  if (musicPlayerRef.current) {
    musicPlayerRef.current.setVolume(volume);
  }
}, [volume]);

// ✅ 진행 시간 추적 useEffect (setTrackProgress)
useEffect(() => {
  if (!playing || !segment || !currentTrack || !musicPlayerRef.current) {
    return;
  }

  if (intervalRef.current) return;

  intervalRef.current = setInterval(() => {
    const currentTime = musicPlayerRef.current.getCurrentTime() * 1000;
    
    if (segmentDuration > 0 && currentTime >= segmentDuration) {
      setTrackProgress((prev) => {
        if (prev.progress >= segmentDuration) return prev;
        return { progress: segmentDuration };
      });
      // ... cleanup
      return;
    }

    // ✅ 함수형 업데이트 사용하여 무한 루프 방지
    setTrackProgress((prev) => {
      if (Math.abs(prev.progress - currentTime) < 50) {
        return prev;
      }
      return { progress: currentTime };
    });
  }, 100);

  return () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };
}, [playing, segment, currentTrack, segmentDuration, onSegmentEnd]); // ✅ trackProgress 제거
```

**역할**:
- `volume` state 관리 (0-1 범위)
- `setVolume(newVolume)` 호출 시 `volume` state 변경
- `trackProgress` 추적 (100ms마다 업데이트)

---

## 데이터 흐름 연결도

### 사용자가 볼륨 슬라이더를 드래그할 때 (정상 흐름)

```
[사용자 드래그 시작]
  ↓
DeviceControls.onMouseDown
  ↓
volumeIsUserChangingRef.current = true
  ↓
[드래그 중]
  ↓
DeviceControls.onChange
  ↓
DeviceCardExpanded.onUpdateVolume(newVolume)
  ↓
pendingVolumeRef.current = newVolume (로컬 저장만, 상위로 전달 안 함)
  ↓
[드래그 종료]
  ↓
DeviceControls.onMouseUp
  ↓
onVolumeDragEnd() 호출
  ↓
DeviceCardExpanded.onVolumeDragEnd
  ↓
onUpdateVolume(finalVolume) 호출
  ↓
HomeContent.onUpdateVolume(finalVolume)
  ↓
onVolumeChange(finalVolume) 호출
  ↓
HomePage.setVolume(finalVolume)
  ↓
HomePage.volume state 변경
  ↓
MoodDashboard.externalVolume prop 변경
  ↓
[MoodDashboard.useEffect 체크]
  ↓
isUserChangingRef.current === false? ✅
  ↓
setVolume(volumeNormalized) 호출
  ↓
useMusicTrackPlayer.volume 업데이트
  ↓
완료 ✅
```

### 무한 루프가 발생하는 경우 (문제 흐름)

```
[초기 상태]
  ↓
MoodDashboard.volume 변경
  ↓
MoodDashboard.useEffect (volume → onVolumeChange)
  ↓
⚠️ isUserChangingRef 체크 실패? (false)
  ↓
onVolumeChange(volumePercent) 호출
  ↓
HomePage.setVolume(newVolume)
  ↓
HomePage.volume state 변경
  ↓
MoodDashboard.externalVolume prop 변경
  ↓
MoodDashboard.useEffect (externalVolume → setVolume)
  ↓
⚠️ isUserChangingRef 체크 실패? (false)
  ↓
setVolume(volumeNormalized) 호출
  ↓
useMusicTrackPlayer.volume 업데이트
  ↓
MoodDashboard.volume prop 변경
  ↓
[루프 시작] ← 여기서 다시 위로
```

---

## 현재 구현된 방어 메커니즘

### 1. `isUserChangingRef` 체크
- `DeviceControls.onMouseDown`: `volumeIsUserChangingRef.current = true`
- `MoodDashboard.useEffect` 두 곳 모두에서 `isUserChangingRef.current` 체크
- 사용자 조작 중일 때는 동기화/전달 스킵

### 2. `ref`를 통한 이전 값 추적
- `prevExternalVolumeRef`: `externalVolume` 변경 감지용
- `prevVolumeRef`: `volume` 변경 감지용
- `currentVolumeRefForSync`, `currentVolumeRef`: 의존성 배열에서 `volume` 제거 후 참조용

### 3. 함수형 업데이트 (setTrackProgress)
- `setTrackProgress((prev) => {...})` 사용하여 불필요한 업데이트 방지

### 4. 드래그 종료 패턴
- `onChange` 시: 로컬 `pendingVolumeRef`만 업데이트
- `onDragEnd` 시: 최종 값으로 상위 컴포넌트에 전달

---

## 잠재적 문제점

### 1. 타이밍 이슈
- `onMouseUp`에서 `volumeIsUserChangingRef.current = false` 설정
- 하지만 `onVolumeDragEnd`에서 `onUpdateVolume(finalVolume)` 호출
- 이 순서로 인해 `MoodDashboard.useEffect` 실행 시점에 플래그가 이미 `false`일 수 있음

### 2. 비동기 상태 업데이트
- `HomePage.setVolume` 호출 → `volume` state 업데이트 (비동기)
- `MoodDashboard.externalVolume` prop 변경 (다음 렌더링)
- 이 사이에 `isUserChangingRef`가 `false`로 리셋되면 루프 가능성

### 3. 두 개의 useEffect가 서로를 트리거
- `externalVolume` 변경 → 첫 번째 useEffect → `setVolume` → `volume` 변경
- `volume` 변경 → 두 번째 useEffect → `onVolumeChange` → `externalVolume` 변경
- 양방향 동기화 시 루프 가능성

---

## 권장 해결 방안

### 1. 플래그 리셋 타이밍 조정
```typescript
onVolumeDragEnd={() => {
  // ... API 호출
  // 플래그는 API 호출 완료 후 또는 일정 시간 후에 리셋
  setTimeout(() => {
    if (volumeIsUserChangingRef) {
      volumeIsUserChangingRef.current = false;
    }
  }, 500); // 300ms → 500ms로 증가
}}
```

### 2. 단방향 데이터 흐름 강제
- `externalVolume` → `volume` 방향만 허용
- `volume` → `externalVolume` 방향은 제거 (또는 조건 강화)

### 3. Debounce 적용
```typescript
const debouncedOnVolumeChange = useMemo(
  () => debounce((newVolume: number) => {
    onVolumeChange(newVolume);
  }, 300),
  [onVolumeChange]
);
```
