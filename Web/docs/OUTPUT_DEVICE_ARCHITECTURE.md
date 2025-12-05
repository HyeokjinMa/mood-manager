# 출력 디바이스 아키텍처

## 출력 대상 분류

### 1. 실제 출력 디바이스에 전송 (조명, 향, 음악)
- **조명 (Lighting)**: `device.output.color`, `device.output.brightness`, `device.output.temperature`
- **향 (Scent)**: `device.output.scentType`, `device.output.scentLevel`, `device.output.scentInterval`
- **음악 (Music)**: `device.output.nowPlaying`, `device.output.volume`

**전송 방식**: `useDeviceSync` 훅이 `backgroundParams`와 `currentMood` 변경을 감지하여 디바이스 상태 업데이트

### 2. FE 전용 (아이콘, 풍향, 풍속)
- **아이콘 (Icons)**: `MoodStreamSegment.backgroundIcons` - 웹/앱 UI에서만 사용
- **풍향/풍속 (Wind)**: `MoodStreamSegment.backgroundWind` - 웹/앱 UI에서만 사용

**전송 방식**: 디바이스로 전송하지 않음, FE에서만 렌더링

## 현재 구조

### 세그먼트 변경 플로우
1. 사용자가 세그먼트 선택 또는 자동 전환
2. `useSegmentSelector`가 `currentSegmentIndex` 업데이트
3. `currentMood` 업데이트 (세그먼트의 `mood` 정보)
4. `backgroundParams` 업데이트 (세그먼트의 배경 파라미터)
5. `useDeviceSync`가 변경 감지하여 디바이스 상태 업데이트
   - Manager: 조명, 향, 음악
   - Light: 조명
   - Scent: 향
   - Speaker: 음악

### 디바이스 출력 데이터 구조
```typescript
// Manager 디바이스
{
  output: {
    color: string,              // 조명 색상
    brightness: number,         // 조명 밝기
    temperature: number,        // 조명 색온도
    scentType: string,          // 향 타입
    nowPlaying: string,         // 현재 재생 중인 음악
  }
}

// Light 디바이스
{
  output: {
    brightness: number,        // 조명 밝기
    temperature: number,        // 조명 색온도
  }
}

// Scent 디바이스
{
  output: {
    scentType: string,          // 향 타입
    scentLevel: number,         // 향 강도
    scentInterval: number,      // 향 분사 간격
  }
}

// Speaker 디바이스
{
  output: {
    nowPlaying: string,         // 현재 재생 중인 음악
    volume: number,             // 음악 볼륨
  }
}
```

## 웹-앱 동기화 (향후 계획)

### 현재 상태
- 웹과 앱은 독립적으로 동작
- 같은 사용자 ID라도 실시간 동기화 없음

### 향후 계획
- WebSocket 또는 Server-Sent Events (SSE)를 통한 실시간 동기화
- 세그먼트 변경 시 서버를 통해 웹/앱에 브로드캐스트
- 같은 사용자 ID의 모든 세션에 동일한 상태 전파

## 결론

### ✅ 현재 구조가 원하는 대로 구성됨
- 조명, 향, 음악은 출력 디바이스에 전송됨
- 아이콘, 풍향, 풍속은 FE 전용 (디바이스 전송 안 함)
- 세그먼트 변경 시 자동으로 디바이스 상태 업데이트

### ⚠️ 향후 개선 사항
- 웹-앱 실시간 동기화 (같은 사용자 ID로 같은 상황 공유)
- 디바이스 출력 로직 명시적 함수화 (현재는 `useDeviceSync`에 묶여 있음)

