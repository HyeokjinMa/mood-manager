# 볼륨 조절 시 노래가 꺼지는 문제 분석

## 로그 분석 결과

### 1. 볼륨 조절 시 반복되는 API 호출
로그에서 확인된 패턴:
- `PUT /api/devices/fa821786-dac8-4244-a09c-4d445eb7976f/update` 호출이 반복적으로 발생
- 각 호출마다 `UPDATE "public"."Device" SET "volume" = $1` 쿼리 실행
- 볼륨 조절 시마다 여러 번 호출됨 (라인 718, 722, 732, 743, 751, 798 등)

### 2. 문제점 진단

#### 문제 1: MusicPlayer 초기화 useEffect가 volume을 의존성으로 가짐
**파일:** `useMusicTrackPlayer.ts` (Line 64-81)

**문제 코드:**
```typescript
useEffect(() => {
  if (typeof window === "undefined" || isInitializedRef.current) return;

  musicPlayerRef.current = new MusicPlayer();
  const volumeNormalized = volume / 100;
  musicPlayerRef.current.init({
    volume: volumeNormalized,
    // ...
  });
  isInitializedRef.current = true;

  return () => {
    musicPlayerRef.current?.dispose(); // ⚠️ cleanup에서 dispose 호출
    musicPlayerRef.current = null;
    isInitializedRef.current = false;
  };
}, [volume]); // ⚠️ volume을 의존성 배열에 포함
```

**문제:**
- `volume`이 변경될 때마다 useEffect가 실행됨
- cleanup 함수에서 `musicPlayerRef.current?.dispose()` 호출
- MusicPlayer가 dispose되면서 재생 중인 음악이 중단됨
- 그 다음 MusicPlayer를 다시 초기화하지만, 재생은 자동으로 재개되지 않음

**발생 흐름:**
```
볼륨 조절 (DeviceCardExpanded)
  → handleDeviceControlChange (useDeviceState)
    → setVolume(changes.volume) (HomePage volume state 변경)
      → MoodDashboard volume prop 변경
        → useMusicTrackPlayer volume prop 변경
          → useEffect([volume]) 트리거
            → cleanup: musicPlayerRef.current?.dispose() ⚠️ 재생 중단
            → MusicPlayer 재초기화 (하지만 재생 자동 재개 안됨)
```

#### 문제 2: setDevices가 특정 deviceId에만 적용됨
**파일:** `useDeviceState.ts` (Line 204-230)

**문제 코드:**
```typescript
if (changes.deviceId) {
  setDevices(prevDevices => {
    return prevDevices.map(device => {
      if (device.id === changes.deviceId) { // ⚠️ 특정 deviceId만 업데이트
        // ...
      }
      return device;
    });
  });
}
```

**문제:**
- `changes.deviceId`가 있을 때만 `setDevices` 호출
- 해당 deviceId의 디바이스만 업데이트됨
- 다른 디바이스 카드들은 devices 배열이 업데이트되지 않아 UI가 반영되지 않음
- Manager 타입 디바이스의 volume 변경이 다른 디바이스(light, scent, speaker)에 전달되지 않음

#### 문제 3: volume 변경이 MusicPlayer에 즉시 반영되지 않음
**파일:** `useMusicTrackPlayer.ts` (Line 109-115)

**현재 코드:**
```typescript
useEffect(() => {
  if (musicPlayerRef.current) {
    const volumeNormalized = volume / 100;
    musicPlayerRef.current.setVolume(volumeNormalized);
  }
}, [volume]);
```

**문제:**
- 위의 초기화 useEffect가 먼저 실행되어 MusicPlayer가 dispose됨
- 그 다음 이 useEffect가 실행될 때 `musicPlayerRef.current`가 null이거나 재생이 중단된 상태
- `setVolume`만 호출하고 재생을 재개하지 않음

---

## 문제 요약

### 핵심 문제
1. **MusicPlayer 초기화 useEffect의 volume 의존성**: volume 변경 시 MusicPlayer를 dispose하고 재초기화하면서 재생이 중단됨
2. **재생 자동 재개 로직 부재**: MusicPlayer가 재초기화된 후 이전 재생 상태를 복원하지 않음
3. **setDevices 범위 제한**: 특정 deviceId만 업데이트하여 다른 디바이스 카드에 변경사항이 반영되지 않음

### 발생 원인 체인
```
볼륨 조절
  ↓
useDeviceState.handleDeviceControlChange
  ↓
setVolume(changes.volume) → HomePage volume state 변경
  ↓
MoodDashboard volume prop 변경
  ↓
useMusicTrackPlayer volume prop 변경
  ↓
useEffect([volume]) 트리거
  ↓
cleanup: musicPlayerRef.current?.dispose() ← ⚠️ 재생 중단
  ↓
MusicPlayer 재초기화 (재생 상태 복원 안됨)
```

---

## 해결 방안 제안

### 1. MusicPlayer 초기화 useEffect 수정
- `volume`을 의존성 배열에서 제거
- 초기 마운트 시에만 실행되도록 수정
- volume 변경은 별도의 useEffect에서만 처리

### 2. 재생 상태 복원 로직 추가
- MusicPlayer 재초기화 후 이전 재생 상태를 복원하는 로직 필요
- 또는 초기화를 한 번만 수행하고 volume만 별도로 업데이트

### 3. setDevices 범위 확장
- Manager 타입 디바이스의 volume 변경이 모든 디바이스에 반영되도록 수정
- 또는 volume은 디바이스별이 아닌 전역 상태로 관리
