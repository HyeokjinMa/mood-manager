# 현재 시스템 상태 분석

## 1. 세그먼트 저장 및 순차 출력 구조

### 현재 구조
- ✅ **세그먼트 저장**: `MoodStream.segments: MoodStreamSegment[]` 배열로 10개 세그먼트 보관
- ✅ **현재 세그먼트 추적**: `currentSegmentIndex`로 현재 세그먼트 인덱스 관리
- ⚠️ **디바이스 출력**: `useDeviceSync`가 `backgroundParams`와 `currentMood` 변경 시 디바이스에 반영
- ❓ **한번에 출력**: 세그먼트 변경 시 모든 출력 디바이스에 한번에 데이터를 보내는지 확인 필요

### 개선 필요 사항
현재는 `useDeviceSync`가 `backgroundParams` 변경을 감지하여 디바이스에 반영하지만, 
**세그먼트가 변경될 때마다 해당 세그먼트의 모든 정보(조명, 향, 음악, 아이콘)를 한번에 출력 디바이스에 보내는 구조**가 명확하지 않음.

**권장 구조**:
```typescript
// 세그먼트 변경 시
const currentSegment = moodStream.segments[currentSegmentIndex];

// 모든 출력 디바이스에 한번에 전송
sendToAllDevices({
  lighting: currentSegment.mood.lighting,
  scent: currentSegment.mood.scent,
  music: currentSegment.musicTracks[0],
  icons: currentSegment.backgroundIcons,
  wind: currentSegment.backgroundWind,
});
```

## 2. 음악 외 다른 부분 상태

### 조명 (Lighting)
- ✅ 구조: `MoodStreamSegment.mood.lighting.rgb` 존재
- ✅ 디바이스 반영: `useDeviceSync`를 통해 반영
- ⚠️ 확인 필요: 세그먼트 변경 시 자동 업데이트 여부

### 향 (Scent)
- ✅ 구조: `MoodStreamSegment.mood.scent` 존재
- ✅ 디바이스 반영: `useDeviceSync`를 통해 반영
- ⚠️ 확인 필요: 세그먼트 변경 시 자동 업데이트 여부

### 아이콘 (Icons)
- ✅ 구조: `MoodStreamSegment.backgroundIcons` 배열 존재
- ⚠️ 디바이스 반영: 확인 필요 (웹 UI에는 표시되지만 디바이스로 전송되는지 불명확)

### 풍향/풍속 (Wind)
- ✅ 구조: `MoodStreamSegment.backgroundWind` 존재
- ⚠️ 디바이스 반영: 확인 필요

## 3. 깃허브 업로드 전 체크리스트

### ✅ 완료된 부분
- [x] LLM 응답 구조 (`CompleteSegmentOutput`) 정의
- [x] 음악 매핑 구조 (`musicID` 기반) 정의
- [x] 세그먼트 저장 구조 (`MoodStream.segments` 배열)
- [x] 현재 세그먼트 추적 (`currentSegmentIndex`)

### ⚠️ 확인 필요
- [ ] 세그먼트 변경 시 디바이스에 한번에 출력하는 로직 명확화
- [ ] 아이콘, 풍향 등이 디바이스로 전송되는지 확인
- [ ] 음악 파일명 매핑 (마크다운 데이터 대기 중)

### ❌ 미완료
- [ ] 실제 음악 메타데이터 업데이트 (마크다운 데이터 필요)
- [ ] 세그먼트 변경 시 디바이스 출력 로직 개선

## 4. 자료가 안 넘어왔을 때 할 수 있는 작업

### 지금 당장 가능한 작업
1. **세그먼트 변경 시 디바이스 출력 로직 개선**
   - `useDeviceSync` 또는 새로운 훅 생성
   - 세그먼트 변경 시 모든 출력 디바이스에 한번에 데이터 전송

2. **아이콘/풍향 디바이스 전송 확인**
   - 현재 `backgroundIcons`, `backgroundWind`가 디바이스로 전송되는지 확인
   - 전송되지 않는다면 추가

3. **타입 정의 및 인터페이스 정리**
   - `CompleteSegmentOutput` → `MoodStreamSegment` 매핑 검증
   - 디바이스 출력 데이터 구조 정의

4. **테스트 코드 작성**
   - 세그먼트 변경 시 디바이스 출력 테스트
   - LLM 응답 → 세그먼트 변환 테스트

5. **문서화**
   - 세그먼트 변경 플로우 문서화
   - 디바이스 출력 프로토콜 문서화

### 마크다운 데이터 필요 작업
- `musicTracks.json` 업데이트
- 실제 음악 파일명 매핑

## 5. 권장 작업 순서

1. **세그먼트 변경 시 디바이스 출력 로직 개선** (우선순위 높음)
2. **아이콘/풍향 디바이스 전송 확인 및 추가**
3. **타입 정의 정리**
4. **테스트 코드 작성**
5. **문서화**

