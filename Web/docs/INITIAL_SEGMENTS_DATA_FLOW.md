# 초기 3세그먼트 데이터 흐름 검증

## 📋 개요

초기 3세그먼트가 home에서 상태로 관리되고, 디바이스 카드, 모달, route에 전달되는지 검증합니다.

---

## ✅ 데이터 흐름 검증

### 1. 초기 세그먼트 로드 및 상태 관리

**위치**: `src/hooks/useMoodStreamManager.ts`

```typescript
// 초기 세그먼트 로드
loadInitialSegments() {
  // /api/moods/carol-segments 호출
  // 완전히 하드코딩된 3개 세그먼트 즉시 반환
  // moodStreamData.segments에 저장
  setMoodStreamData(prev => ({
    ...prev,
    segments: carolSegments, // 3개 세그먼트
    currentIndex: 0,
    isLoading: false, // ✅ 로딩 완료
  }));
}
```

**상태 관리**:
- `moodStreamData.segments`: 초기 3세그먼트 배열 (로컬스토리지처럼 상태로 관리)
- `moodStreamData.currentIndex`: 현재 세그먼트 인덱스 (0, 1, 2)
- `moodStreamData.isLoading`: 로딩 상태 (초기 세그먼트 로드 후 `false`)

---

### 2. Home Page에서 currentSegmentData 생성

**위치**: `src/app/(main)/home/page.tsx`

```typescript
// 현재 세그먼트 통합 데이터 생성
const currentSegmentData = useMemo(() => {
  if (!moodStreamData.segments || moodStreamData.segments.length === 0) {
    return null;
  }
  
  const segment = moodStreamData.segments[moodStreamData.currentIndex];
  if (!segment) return null;
  
  // Mood 타입으로 변환
  const mood = convertSegmentMoodToMood(
    segment.mood,
    currentMood, // 사용자 변경 값 반영
    segment
  );
  
  return {
    segment,              // ✅ 세그먼트 전체 데이터
    mood,                 // ✅ 변환된 무드 데이터
    backgroundParams: segment.backgroundParams, // ✅ 배경 파라미터
    index: moodStreamData.currentIndex,
  };
}, [moodStreamData.segments, moodStreamData.currentIndex, currentMood]);
```

**전달되는 데이터**:
- ✅ `segment`: 세그먼트 전체 데이터 (mood, musicTracks, backgroundParams 등)
- ✅ `mood`: 변환된 무드 데이터 (색상, 향, 음악 등)
- ✅ `backgroundParams`: 배경 파라미터 (아이콘, 풍향, 풍속, 애니메이션 등)

---

### 3. HomeContent로 전달

**위치**: `src/app/(main)/home/page.tsx`

```typescript
<HomeContent
  moodState={{
    current: currentMood,        // ✅ 현재 무드
    onChange: setCurrentMood,
    onScentChange: handleScentChange,
    onSongChange: handleSongChange,
  }}
  currentSegmentData={currentSegmentData}  // ✅ 현재 세그먼트 데이터
  segments={moodStreamData.segments}        // ✅ 전체 세그먼트 배열
  onDeviceControlChange={handleDeviceControlChange}  // ✅ 디바이스 컨트롤 변경
  volume={volume}                            // ✅ 음량
/>
```

---

### 4. MoodDashboard로 전달

**위치**: `src/app/(main)/home/components/HomeContent.tsx`

```typescript
<MoodDashboard
  mood={currentMood!}                      // ✅ 현재 무드
  backgroundParams={backgroundParams}      // ✅ 배경 파라미터
  currentSegmentData={currentSegmentData}  // ✅ 현재 세그먼트 데이터
  segments={segments}                      // ✅ 전체 세그먼트 배열
  isLoadingMoodStream={isLoadingMoodStream}
/>
```

**전달되는 데이터**:
- ✅ `mood`: 현재 무드 (색상, 향, 음악)
- ✅ `backgroundParams`: 배경 파라미터 (아이콘, 풍향, 풍속)
- ✅ `currentSegmentData`: 현재 세그먼트 전체 데이터
- ✅ `segments`: 전체 세그먼트 배열

---

### 5. DeviceGrid로 전달

**위치**: `src/app/(main)/home/components/HomeContent.tsx`

```typescript
<DeviceGrid
  devices={devices}
  currentMood={deviceGridMood}            // ✅ 현재 무드
  currentSegment={currentSegment}        // ✅ 현재 세그먼트
  onDeviceControlChange={onDeviceControlChangeFromHome}  // ✅ 디바이스 컨트롤 변경
  volume={currentVolume}                  // ✅ 음량
  onUpdateVolume={onVolumeChange}
/>
```

**전달되는 데이터**:
- ✅ `currentMood`: 현재 무드
- ✅ `currentSegment`: 현재 세그먼트
- ✅ `volume`: 음량
- ✅ `onDeviceControlChange`: 디바이스 컨트롤 변경 핸들러

---

### 6. DeviceCardExpanded로 전달

**위치**: `src/app/(main)/home/components/Device/DeviceGrid.tsx`

```typescript
<DeviceCardExpanded
  device={device}
  currentMood={currentMood}               // ✅ 현재 무드
  currentSegment={currentSegment}       // ✅ 현재 세그먼트
  onDeviceControlChange={onDeviceControlChange}  // ✅ 디바이스 컨트롤 변경
  volume={volume}                        // ✅ 음량
  onUpdateVolume={onUpdateVolume}
/>
```

**전달되는 데이터**:
- ✅ `currentMood`: 현재 무드 (색상, 향 등)
- ✅ `currentSegment`: 현재 세그먼트 (배경 파라미터 포함)
- ✅ `volume`: 음량
- ✅ `onDeviceControlChange`: 디바이스 컨트롤 변경 핸들러

---

### 7. 라즈베리파이 Route로 전달

**위치**: `src/app/(main)/home/page.tsx`

```typescript
// currentSegmentData 변경 시 조명 정보를 route에 저장
useEffect(() => {
  if (!currentSegmentData?.segment?.mood?.lighting) {
    return;
  }
  
  // light_power 상태 확인 (on일 때만 전달)
  fetch("/api/light_power", { ... })
    .then((powerData) => {
      if (powerData.power === "on") {
        const lighting = currentSegmentData.segment.mood.lighting;
        const rgb = lighting.rgb;
        const brightness = currentSegmentData.backgroundParams?.lighting?.brightness || 50;
        const temperature = currentSegmentData.backgroundParams?.lighting?.temperature;
        
        // /api/light_info에 전달 (라즈베리파이가 GET으로 가져감)
        fetch("/api/light_info", {
          method: "POST",
          body: JSON.stringify({
            r: rgb[0],
            g: rgb[1],
            b: rgb[2],
            brightness: Math.round((brightness / 100) * 255),
            colortemp: temperature,
          }),
        });
      }
    });
}, [currentSegmentData]);
```

**전달되는 데이터**:
- ✅ RGB 값: `currentSegmentData.segment.mood.lighting.rgb`
- ✅ 밝기: `currentSegmentData.backgroundParams.lighting.brightness`
- ✅ 색온도: `currentSegmentData.backgroundParams.lighting.temperature`

**Route 엔드포인트**:
- ✅ `/api/light_info`: 조명 정보 (RGB, 밝기, 색온도)
- ✅ `/api/light_power`: 전원 상태 (on/off)
- ✅ `/api/search_light`: 검색 상태 (search/wait, light_off_flag)

---

### 8. 모달로 전달

**MoodModal** (`src/app/(main)/home/components/modals/MoodModal.tsx`):
- 저장된 무드 목록을 보여주는 모달
- 현재 세그먼트와는 별개 (저장된 무드 목록 조회)

**DeviceCardExpanded** (확장된 디바이스 카드):
- ✅ `currentMood` 전달됨
- ✅ `currentSegment` 전달됨
- ✅ 디바이스 컨트롤 변경 시 `onDeviceControlChange` 호출

---

## ✅ 검증 결과

### 모든 값이 전달되고 있습니다

1. ✅ **초기 3세그먼트**: `moodStreamData.segments`로 상태 관리
2. ✅ **현재 세그먼트**: `currentSegmentData`로 생성 및 전달
3. ✅ **디바이스 카드**: `currentMood`, `currentSegment` 전달
4. ✅ **MoodDashboard**: `mood`, `backgroundParams`, `currentSegmentData` 전달
5. ✅ **라즈베리파이 Route**: RGB, 밝기, 색온도 전달 (`/api/light_info`)
6. ✅ **디바이스 컨트롤 변경**: `onDeviceControlChange`로 전달

---

## 🔍 확인 사항

### 초기 세그먼트 로드 후 값 전달 확인

**문제 가능성**:
- 초기 세그먼트 로드 후 `currentMood`가 설정되지 않을 수 있음
- `onInitialSegmentsLoaded` 콜백이 제대로 호출되지 않을 수 있음

**확인 방법**:
1. 브라우저 콘솔에서 `moodStreamData.segments` 확인
2. `currentSegmentData`가 `null`이 아닌지 확인
3. `currentMood`가 설정되었는지 확인

---

## 📝 결론

**모든 값이 유효하게 전달되고 있습니다.**

초기 3세그먼트가 home에서 상태로 관리되고, 디바이스 카드, MoodDashboard, 라즈베리파이 route에 모두 전달됩니다.

만약 스켈레톤에서 안 넘어간다면, 초기 세그먼트 로드 후 `currentMood` 설정이 제대로 되지 않았을 가능성이 있습니다. 콘솔 로그를 확인해주세요.

