# 🎵 노래와 이미지 매핑 문제 분석

## 🔍 문제 상황

노래 제목(`musicSelection`)과 앨범 이미지(`albumImageUrl`)가 올바르게 매핑되지 않는 문제가 발생합니다.

---

## 📋 현재 코드 흐름

### 1. 데이터 소스

```typescript
// MoodDashboard.tsx (74-77줄)
const currentSegment = currentSegmentData?.segment || null;
const currentSegmentIndex = currentSegmentData?.index ?? 0;
const backgroundParamsFromSegment = currentSegmentData?.backgroundParams || backgroundParams;
```

### 2. 음악 트랙 정보 추출

```typescript
// useMusicTrackPlayer.ts (29-32줄)
const currentTrack: MusicTrack | null = useMemo(() => {
  if (!segment?.musicTracks || segment.musicTracks.length === 0) return null;
  return segment.musicTracks[0]; // 첫 번째 트랙만 사용
}, [segment?.musicTracks]);
```

### 3. AlbumSection에 전달

```typescript
// MoodDashboard.tsx (292-297줄)
<AlbumSection 
  mood={effectiveMood as Mood}
  onAlbumClick={() => setIsAlbumModalOpen(true)}
  musicSelection={currentTrack?.title || backgroundParamsFromSegment?.musicSelection || backgroundParams?.musicSelection}
  albumImageUrl={currentTrack?.albumImageUrl}  // ⚠️ 문제: fallback 없음
/>
```

---

## ⚠️ 문제점

### 1. `currentTrack`이 `null`일 때

**원인**:
- `currentSegment`이 `null`이거나
- `segment.musicTracks`가 비어있거나
- `segment.musicTracks`가 없을 때

**결과**:
- `currentTrack`이 `null`이 됨
- `albumImageUrl={currentTrack?.albumImageUrl}`이 `undefined`가 됨
- 앨범 이미지가 표시되지 않음

### 2. `musicSelection`과 `albumImageUrl` 불일치

**원인**:
- `musicSelection`은 fallback으로 `backgroundParamsFromSegment?.musicSelection`을 사용
- `albumImageUrl`은 `currentTrack?.albumImageUrl`만 사용 (fallback 없음)

**결과**:
- `musicSelection`은 표시되지만 `albumImageUrl`이 없는 경우 발생
- 또는 `musicSelection`과 `albumImageUrl`이 다른 노래를 가리키는 경우 발생

### 3. 초기 세그먼트 fallback 시 문제

**원인**:
- `currentSegmentData`가 `initialSegments[0]`에서 오는 경우
- `useMusicTrackPlayer`의 `segment` prop이 `currentSegment`인데, 이게 `null`일 수 있음

**결과**:
- 초기 세그먼트의 `musicTracks`에 `albumImageUrl`이 있어도 사용되지 않음

---

## 🔧 해결 방안

### 해결책 1: `albumImageUrl` fallback 추가

```typescript
// MoodDashboard.tsx
// currentSegment에서 직접 musicTracks 추출
const albumImageUrl = useMemo(() => {
  // 1. currentTrack에서 가져오기 (우선순위 1)
  if (currentTrack?.albumImageUrl) {
    return currentTrack.albumImageUrl;
  }
  
  // 2. currentSegment의 musicTracks에서 가져오기 (우선순위 2)
  if (currentSegment?.musicTracks?.[0]?.albumImageUrl) {
    return currentSegment.musicTracks[0].albumImageUrl;
  }
  
  // 3. fallback: backgroundParams에서 가져올 수 있다면 (우선순위 3)
  // (현재 backgroundParams에는 albumImageUrl이 없으므로 생략)
  
  return undefined;
}, [currentTrack?.albumImageUrl, currentSegment?.musicTracks]);

// AlbumSection에 전달
<AlbumSection 
  mood={effectiveMood as Mood}
  onAlbumClick={() => setIsAlbumModalOpen(true)}
  musicSelection={currentTrack?.title || backgroundParamsFromSegment?.musicSelection || backgroundParams?.musicSelection}
  albumImageUrl={albumImageUrl}  // ✅ fallback 포함
/>
```

### 해결책 2: `useMusicTrackPlayer` 개선

`useMusicTrackPlayer`가 `segment`를 받을 때, `currentSegmentData`에서 직접 전달:

```typescript
// 현재
const { currentTrack } = useMusicTrackPlayer({
  segment: currentSegment,  // ⚠️ currentSegment가 null일 수 있음
  // ...
});

// 개선: currentSegmentData에서 직접 가져오기
const { currentTrack } = useMusicTrackPlayer({
  segment: currentSegmentData?.segment || null,  // ✅ 직접 전달
  // ...
});
```

하지만 이미 `currentSegment = currentSegmentData?.segment || null`이므로 같은 문제입니다.

### 해결책 3: `currentSegment` null 체크 강화

`currentSegment`가 `null`일 때도 `initialSegments`에서 가져오기:

```typescript
// MoodDashboard.tsx
const currentSegment = currentSegmentData?.segment || null;

// fallback: initialSegments에서 가져오기
const effectiveSegment = currentSegment || (initialSegments && initialSegments.length > 0 ? initialSegments[0] : null);

const { currentTrack } = useMusicTrackPlayer({
  segment: effectiveSegment,  // ✅ fallback 포함
  // ...
});
```

---

## ✅ 권장 해결책

**해결책 1 + 3 조합**: `albumImageUrl`을 직접 계산하고, `currentSegment` fallback도 추가

```typescript
// 1. effectiveSegment 계산 (fallback 포함)
const effectiveSegment = currentSegment || 
  (initialSegments && initialSegments.length > 0 ? initialSegments[0] : null);

// 2. useMusicTrackPlayer에 전달
const { currentTrack } = useMusicTrackPlayer({
  segment: effectiveSegment,
  // ...
});

// 3. albumImageUrl fallback 계산
const albumImageUrl = useMemo(() => {
  // 우선순위 1: currentTrack
  if (currentTrack?.albumImageUrl) {
    return currentTrack.albumImageUrl;
  }
  
  // 우선순위 2: effectiveSegment의 musicTracks
  if (effectiveSegment?.musicTracks?.[0]?.albumImageUrl) {
    return effectiveSegment.musicTracks[0].albumImageUrl;
  }
  
  return undefined;
}, [currentTrack?.albumImageUrl, effectiveSegment?.musicTracks]);
```

---

## 📝 추가 확인 필요

1. **LLM 생성 세그먼트의 구조**
   - LLM이 생성한 세그먼트에도 `musicTracks`가 있는지?
   - `backgroundParams.musicSelection`만 있고 `musicTracks`가 없는 경우가 있는지?

2. **초기 세그먼트와 LLM 생성 세그먼트의 차이**
   - 초기 세그먼트: `musicTracks`에 모든 정보 포함
   - LLM 생성 세그먼트: `backgroundParams.musicSelection`만 있고 `musicTracks`는 나중에 매핑되는지?

---

**작성일**: 2025-01-XX  
**상태**: 문제 분석 완료, 해결 방안 제시
