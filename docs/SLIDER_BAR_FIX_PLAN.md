# 슬라이더 바 동작 문제 해결 계획

## 문제 분석

### 현재 상태
1. **컬러피커**: ✅ 정상 동작 (onDeviceControlChange 호출 → home으로 전달 → route.ts 업데이트)
2. **Volume 바**: ⚠️ 부분 동작 (onUpdateVolume 호출되지만 실제 오디오 플레이어 반영 확인 필요)
3. **Brightness 바**: ❌ 동작 안함 (onDeviceControlChange는 호출되지만 brightness 처리 로직 없음)
4. **Scent Level 바**: ❌ 동작 안함 (onDeviceControlChange 호출하지 않음)

### 문제 원인

#### Brightness 바
- `onDeviceControlChange({ brightness })`는 호출됨
- 하지만 `useDeviceState`에서 brightness를 처리하지 않음
- `home/page.tsx`의 useEffect는 `currentMood.color`만 감지
- brightness는 `currentSegmentData.backgroundParams.lighting.brightness`에서 가져오는데, 이는 LLM 생성값이라 사용자 변경이 반영되지 않음

#### Scent Level 바
- `onUpdateScentLevel`에서 `setLocalScentLevel(level)`만 호출
- `onDeviceControlChange`를 호출하지 않음
- 따라서 디바이스 output 업데이트가 안됨

#### Volume 바
- `onUpdateVolume`과 `onDeviceControlChange` 둘 다 호출됨
- 하지만 실제 오디오 플레이어에 반영되는지 확인 필요

## 해결 방안

### 1. Brightness 바 수정

**방법 A: useDeviceState에서 직접 light_info API 호출** (추천)
- brightness 변경 시 색상과 동일하게 직접 `/api/light_info` 호출
- 현재 brightness 값도 함께 전달

**방법 B: 별도 brightness 상태 관리**
- home에서 brightness 상태 관리
- useEffect로 감지하여 route.ts 업데이트

**선택: 방법 A** (간단하고 즉시 반영 가능)

### 2. Scent Level 바 수정

- `onUpdateScentLevel`에서 `onDeviceControlChange({ scentLevel })` 호출 추가
- `useDeviceState`에서 디바이스 output 업데이트 처리
- 또는 디바이스 업데이트 API 직접 호출

### 3. Volume 바 확인 및 개선

- 현재 구현 확인
- 필요시 오디오 플레이어 반영 로직 추가

## 구현 순서

1. ✅ Scent Level: onDeviceControlChange 호출 추가
2. ✅ Brightness: useDeviceState에서 light_info API 호출 추가
3. ✅ Volume: 오디오 플레이어 반영 확인 및 개선
4. ✅ 디바이스 output 업데이트 로직 추가 (scentLevel)
