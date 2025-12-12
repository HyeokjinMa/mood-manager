# 볼륨 무한 루프 관련 파일 위치

## 1. useMusicTrackPlayer.ts
**파일 경로:** `/Users/tema/Desktop/mood-manager/Web/src/hooks/useMusicTrackPlayer.ts`

### 주요 코드 위치:
- **Line 78-99**: `setVolume` 함수 정의
  - Line 86: `setVolumeState(clampedVolume)` (에러 발생 지점)
  
- **Line 190-254**: `setTrackProgress` useEffect (진행 시간 추적)
  - Line 237-244: `setTrackProgress` 함수형 업데이트 (에러 발생 지점)
  
- **Line 104-108**: volume 변경 시 MusicPlayer에 반영 useEffect

**전체 파일:** [useMusicTrackPlayer.ts](../../src/hooks/useMusicTrackPlayer.ts)

---

## 2. MoodDashboard.tsx
**파일 경로:** `/Users/tema/Desktop/mood-manager/Web/src/app/(main)/home/components/MoodDashboard/MoodDashboard.tsx`

### 주요 코드 위치:
- **Line 227-251**: 외부 volume 변경 시 MusicPlayer에 반영 useEffect
  - Line 248: `setVolume(volumeNormalized)` 호출
  
- **Line 253-285**: volume 변경 시 상위 컴포넌트에 전달 useEffect
  - Line 264-285: `onVolumeChange` 호출 로직
  
- **Line 201-225**: isUserChangingRef 동기화 useEffect들

**전체 파일:** [MoodDashboard.tsx](../../src/app/(main)/home/components/MoodDashboard/MoodDashboard.tsx)

---

## 3. home/page.tsx
**파일 경로:** `/Users/tema/Desktop/mood-manager/Web/src/app/(main)/home/page.tsx`

### 주요 코드 위치:
- **Line 514-522**: MoodDashboard에 전달하는 volume 관련 props
  - Line 516-519: `onVolumeChange` 핸들러 (에러 발생 지점)
  - Line 517: `setVolume(newVolume)` 호출

**전체 파일:** [page.tsx](../../src/app/(main)/home/page.tsx) (Line 510-530 부근)

---

## 4. DeviceControls.tsx
**파일 경로:** `/Users/tema/Desktop/mood-manager/Web/src/app/(main)/home/components/Device/components/DeviceControls.tsx`

### 주요 코드 위치:
- **Line 254-310**: Manager 타입 볼륨 슬라이더
  - Line 259-271: `onChange` 핸들러
  - Line 272-279: `onMouseDown` 핸들러 (volumeIsUserChangingRef 설정)
  - Line 280-287: `onTouchStart` 핸들러
  - Line 288-297: `onMouseUp` 핸들러 (volumeIsUserChangingRef 해제, onVolumeDragEnd 호출)
  - Line 298-307: `onTouchEnd` 핸들러

**전체 파일:** [DeviceControls.tsx](../../src/app/(main)/home/components/Device/components/DeviceControls.tsx)

---

## 5. DeviceCardExpanded.tsx
**파일 경로:** `/Users/tema/Desktop/mood-manager/Web/src/app/(main)/home/components/Device/DeviceCardExpanded.tsx`

### 주요 코드 위치:
- **Line 310-323**: `onUpdateVolume` 핸들러 (pendingVolumeRef 업데이트)
- **Line 324-348**: `onVolumeDragEnd` 핸들러 (최종 값 전달)

**전체 파일:** [DeviceCardExpanded.tsx](../../src/app/(main)/home/components/Device/DeviceCardExpanded.tsx)

---

## 6. HomeContent.tsx
**파일 경로:** `/Users/tema/Desktop/mood-manager/Web/src/app/(main)/home/components/HomeContent.tsx`

### 주요 코드 위치:
- **Line 270-276**: `onUpdateVolume` 핸들러 (HomePage로 전달)

**전체 파일:** [HomeContent.tsx](../../src/app/(main)/home/components/HomeContent.tsx)

---

## 데이터 흐름 요약

```
DeviceControls (onChange) 
  → DeviceCardExpanded (onUpdateVolume) 
    → pendingVolumeRef 업데이트
      → (드래그 종료) DeviceCardExpanded (onVolumeDragEnd)
        → HomeContent (onUpdateVolume)
          → HomePage (onVolumeChange) 
            → setVolume(newVolume)
              → externalVolume 변경
                → MoodDashboard (externalVolume useEffect)
                  → setVolume(volumeNormalized)
                    → useMusicTrackPlayer (setVolume)
                      → setVolumeState(clampedVolume) [에러 86행]
                        → volume state 변경
                          → MoodDashboard (volume useEffect)
                            → onVolumeChange(volumePercent)
                              → HomePage (setVolume) [에러 517행]
                                → 루프 계속...
```

---

## 핵심 문제점

1. **useMusicTrackPlayer.ts Line 86**: `setVolumeState` 호출로 인한 무한 루프
2. **MoodDashboard.tsx Line 248**: `setVolume` 호출로 인한 무한 루프
3. **home/page.tsx Line 517**: `setVolume` 호출로 인한 무한 루프
4. **useMusicTrackPlayer.ts Line 237-244**: `setTrackProgress` 함수형 업데이트 (의존성 배열 문제 가능성)
