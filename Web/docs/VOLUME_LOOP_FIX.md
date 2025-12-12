# 볼륨 무한 루프 문제 분석 및 해결 방안

## 발견된 문제점

### 1. useMusicTrackPlayer.ts - setInterval 중복
- `startPlayback` 함수 내부에 setInterval이 있음 (179-207행)
- 별도의 useEffect에도 setInterval이 있음 (233-294행)
- 두 곳에서 interval을 생성하려고 시도할 수 있음
- `startPlayback`의 cleanup 함수는 async 함수이므로 의미 없음

### 2. MoodDashboard.tsx - volume 의존성 배열 문제
- Line 275: `volume`을 의존성 배열에 포함하고 있어서, `volume`이 변경될 때마다 실행됨
- 이 useEffect는 `volume`이 변경되면 `onVolumeChange`를 호출
- `onVolumeChange`는 `HomePage`의 `setVolume`을 호출
- `setVolume`은 `externalVolume`을 변경시킴
- `externalVolume` 변경 시 다시 동기화 useEffect 실행 → 루프

### 3. DeviceControls.tsx - Manager 타입에 onMouseDown 누락
- Speaker 타입에는 `onMouseDown`/`onTouchStart` 핸들러가 있음
- Manager 타입에는 없어서 일관성 없음

### 4. 무한 루프 경로
```
DeviceControls onChange 
→ DeviceCardExpanded onUpdateVolume 
→ HomeContent onVolumeChange 
→ HomePage setVolume 
→ HomePage volume 변경 
→ MoodDashboard externalVolume 변경 
→ MoodDashboard useEffect (line 230) → setVolume 호출 
→ useMusicTrackPlayer volume 변경 
→ MoodDashboard volume 변경 
→ MoodDashboard useEffect (line 256) → onVolumeChange 호출 
→ 루프 계속
```

## 해결 방안

### 1. useMusicTrackPlayer.ts
- `startPlayback`에서 setInterval 제거
- useEffect에서만 interval 관리
- 함수형 업데이트 유지

### 2. MoodDashboard.tsx
- Line 256의 useEffect에서 `volume`을 의존성 배열에서 제거
- ref를 사용하여 이전 값을 추적하고 비교

### 3. DeviceControls.tsx
- Manager 타입의 볼륨 슬라이더에도 `onMouseDown`/`onTouchStart` 추가

### 4. DeviceCardExpanded.tsx
- `onUpdateVolume`에서 즉시 `onUpdateVolume` 호출하지 않고, 드래그 종료 시에만 호출하도록 변경
