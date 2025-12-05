# 2번(노래 길이) 및 3번(scent) 문제 해결 방안

## 2번 문제: 노래 길이가 UI에 제대로 반영 안됨 (3분으로 고정)

### 문제 원인
1. 세그먼트 생성 시 `segment.duration`이 `musicTracks[0].duration`과 일치하지 않음
2. streamHandler에서 musicTracks 매핑 후 duration 업데이트가 없음
3. `/api/moods/current/route.ts`에서 `albumImageUrl`이 musicTracks에 포함되지 않음

### 해결 방법

#### 1. streamHandler.ts 수정
- musicTracks 매핑 후 `segment.duration`을 `musicTracks[0].duration`으로 업데이트
- 세그먼트가 여러 개인 경우 각 세그먼트마다 duration 업데이트

```typescript
// streamHandler.ts에서 musicTracks 매핑 후
if (musicTracks.length > 0) {
  segment.musicTracks = musicTracks;
  // 실제 MP3 길이로 segment duration 업데이트
  segment.duration = musicTracks[0].duration;
} else {
  // fallback 사용 시에도 duration 확인
  const fallbackTracks = await getFallbackMusicTracks(...);
  segment.musicTracks = fallbackTracks;
  if (fallbackTracks.length > 0) {
    segment.duration = fallbackTracks[0].duration;
  }
}
```

#### 2. `/api/moods/current/route.ts` 수정
- musicTracks에 `albumImageUrl` 추가
- duration이 제대로 전달되는지 확인

```typescript
musicTracks: [
  {
    title: preset.sound.name,
    artist: "Mood Manager",
    duration: (preset.sound.duration || 180) * 1000,
    startOffset: 0,
    fadeIn: 750,
    fadeOut: 750,
    fileUrl: preset.sound.fileUrl,
    albumImageUrl: preset.sound.albumImageUrl || undefined, // 추가
  },
],
```

#### 3. 세그먼트 duration 확인
- 세그먼트의 `duration`이 `musicTracks[0].duration`과 항상 일치하도록 보장
- 초기 세그먼트 생성 시에도 동일한 로직 적용

---

## 3번 문제: scent가 모두 Pine으로 나옴

### 문제 원인
1. 초기 세그먼트 설정에서 scent가 다양하게 설정되어 있지만, 다른 곳에서 덮어쓰기됨
2. fallback 함수에서 scent가 하드코딩됨
3. `carol-segments/route.ts`가 중복된 함수를 사용

### 해결 방법

#### 1. `carol-segments/route.ts` 단순화 ✅ (이미 완료)
- 중복된 함수 제거하고 `getInitialColdStartSegments.ts`를 import해서 사용
- 이미 수정됨

#### 2. `getInitialColdStartSegments.ts` 확인 ✅ (이미 완료)
- 이미 다양한 scent 설정:
  - 세그먼트 1: Woody/Pine
  - 세그먼트 2: Spicy/Cinnamon Stick
  - 세그먼트 3: Floral/Rose

#### 3. 세그먼트 변환 시 scent 확인
- `convertSegmentMoodToMood` 함수에서 segmentMood.scent를 우선 사용
- fallback으로 덮어쓰지 않도록 확인

```typescript
// moodStreamConverter.ts
scent: {
  type: scentType, // segmentMood.scent?.type 우선 사용
  name: segmentMood.scent?.name || safeFallback.scent.name,
  color: safeFallback.scent.color,
},
```

#### 4. 다른 API 경로 확인
- `/api/moods/current/route.ts`에서도 scent가 덮어쓰이지 않는지 확인
- LLM 응답에서 scent가 제대로 전달되는지 확인

---

## 수정 순서

1. ✅ `carol-segments/route.ts` 단순화 (완료)
2. ⏳ `streamHandler.ts`에서 duration 업데이트 추가
3. ⏳ `/api/moods/current/route.ts`에 `albumImageUrl` 추가
4. ⏳ 세그먼트 변환 시 scent 우선순위 확인
5. ⏳ 전체 플로우에서 duration과 scent가 제대로 전달되는지 테스트

