# Brightness/ScentLevel 동기화 문제 분석 및 해결책

## 문제 원인

### 1. DeviceCardExpanded의 useEffect 조건 문제

**현재 코드 (Line 133-143, 147-157):**
```typescript
useEffect(() => {
  if (!isUserChangingRef.current.brightness && device.output.brightness !== undefined) {
    if (prevBrightnessRef.current !== device.output.brightness) {
      prevBrightnessRef.current = device.output.brightness;
      setLocalBrightness(device.output.brightness);
    }
  }
}, [device.output.brightness]);
```

**문제점:**
1. `isUserChangingRef.current.brightness`가 true인 동안에는 외부에서 온 `device.output.brightness` 변경이 동기화되지 않음
2. `prevBrightnessRef.current`와 비교하는 로직이 추가 조건이 되어 복잡도 증가
3. 드래그 종료 후 `isUserChangingRef.current.brightness = false`가 설정되지만, 그 전에 이미 useEffect가 실행되면 동기화 누락 가능

### 2. 로컬 상태 vs 전역 상태 불일치

**현재 구조:**
- `DeviceCardExpanded`는 `localBrightness`, `localScentLevel` 로컬 상태를 사용
- 전역 `devices` 상태가 업데이트되어 `device.output.brightness`가 변경되어도, useEffect 조건 때문에 로컬 상태가 업데이트되지 않을 수 있음

### 3. DeviceCardSmall은 문제 없음

`DeviceCardSmall`은 prop을 직접 사용하므로 문제 없음:
```typescript
{device.output.brightness ? `${device.output.brightness}%` : "50%"}
```

---

## 해결 방안

### 방안 1: prop을 직접 사용 (권장)

`DeviceCardExpanded`도 `DeviceCardSmall`처럼 prop을 직접 사용하도록 변경:

**장점:**
- 로컬 상태 관리 불필요
- 항상 최신 전역 상태 반영
- useEffect 동기화 로직 불필요
- 코드 단순화

**단점:**
- 슬라이더 드래그 중 UI 반응성이 약간 떨어질 수 있음 (하지만 드래그 중에는 로컬 상태 사용 가능)

### 방안 2: useEffect 동기화 로직 개선

현재 useEffect의 조건을 완화하고, `isUserChangingRef` 체크를 제거하거나 개선:

**개선안:**
- `isUserChangingRef` 체크 제거 또는 조건 완화
- `prevBrightnessRef` 비교 로직 단순화
- 드래그 종료 후 명시적으로 동기화 트리거

---

## 권장 해결책

**DeviceCardSmall처럼 prop을 직접 사용하되, 드래그 중에는 로컬 상태를 사용하는 하이브리드 방식:**

1. 기본값: `device.output.brightness` prop 직접 사용
2. 드래그 중: 로컬 상태 `localBrightness` 사용 (즉시 UI 반응)
3. 드래그 종료: 로컬 상태를 전역 상태와 동기화

이렇게 하면:
- 드래그 중 즉시 UI 반응성 유지
- 드래그 종료 후 전역 상태가 항상 반영됨
- 다른 컴포넌트에서 변경된 값도 즉시 반영
