# 🔗 세그먼트 병합 문제 분석

## 🔍 문제 상황

**현상**: 초기 세그먼트 3개에 LLM 생성 세그먼트 4개(0,1,2,3)가 붙어서 총 7개가 표시됨  
**기대**: 초기 3개 + LLM 앞 4개(인덱스 0-3) = 총 7개 ✅ (정상 작동 중)  
**실제 로그**: LLM이 Segment 0-9까지 10개를 생성했는데, 초기 3개에 0,1,2,3이 붙어서 7개가 됨

---

## 📋 현재 코드 흐름

### 1. 병합 전략 설정

```typescript
// useMoodStreamManager.ts (31-35줄)
const DEFAULT_MERGE_STRATEGY: MergeStrategy = {
  initialCount: 3,
  llmCount: 7,  // ⚠️ 7개를 생성한다고 설정
  keepLlmCount: 4, // 7개 중 4개만 유지 (마지막 3개 버림)
};
```

### 2. mergeSegments 함수

```typescript
// useMoodStreamManager.ts (46-62줄)
function mergeSegments(
  initialSegments: MoodStreamSegment[],
  llmSegments: MoodStreamSegment[],
  strategy: MergeStrategy = DEFAULT_MERGE_STRATEGY
): MoodStreamSegment[] {
  if (initialSegments.length === strategy.initialCount) {
    // 초기 세그먼트 + LLM 앞 keepLlmCount개
    return [
      ...initialSegments,
      ...llmSegments.slice(0, strategy.keepLlmCount)  // ✅ 앞 4개만 가져옴
    ];
  }
  
  return [...initialSegments, ...llmSegments];
}
```

### 3. 병합 조건 체크

```typescript
// useMoodStreamManager.ts (403-423줄)
const hasInitialSegments = 
  segmentsToUse.length === DEFAULT_MERGE_STRATEGY.initialCount && 
  segmentsToUse[0]?.backgroundParams?.source === "initial";  // ⚠️ 문제: source 체크

if (hasInitialSegments && segmentCount === DEFAULT_MERGE_STRATEGY.llmCount) {
  // 초기 3개 + LLM 4개 (마지막 3개 버림)
  const mergedSegments = mergeSegments(segmentsToUse, newSegments, DEFAULT_MERGE_STRATEGY);
  // ...
} else {
  // 일반적인 경우: 그냥 추가
  setMoodStreamData(prev => ({
    ...prev,
    segments: [...prev.segments, ...newSegments],  // ⚠️ 10개 모두 추가됨
  }));
}
```

### 4. generateAndMergeStream 호출

```typescript
// useMoodStreamManager.ts (448줄, 468줄)
generateAndMergeStream(10, currentSegments);  // ⚠️ 10개를 전달
```

---

## ⚠️ 문제점

### 1. `segmentCount` 불일치

**문제**:
- `DEFAULT_MERGE_STRATEGY.llmCount = 7` (7개를 생성한다고 설정)
- 실제 호출: `generateAndMergeStream(10, ...)` (10개를 생성)

**결과**:
- `segmentCount === DEFAULT_MERGE_STRATEGY.llmCount` 조건 (408줄)이 `false`가 됨
- `hasInitialSegments`가 `true`여도 `else` 블록으로 이동
- `[...prev.segments, ...newSegments]`로 10개 모두 추가됨

### 2. `backgroundParams.source` 체크 문제

**문제**:
- 초기 세그먼트의 `backgroundParams.source`가 `"initial"`로 설정되지 않았을 수 있음
- `hasInitialSegments` 조건이 `false`가 됨

**확인 필요**: `getInitialColdStartSegments.ts`에서 `source: "initial"` 설정 여부

### 3. 병합 로직이 실행되지 않음

**결과**:
- `else` 블록에서 `[...prev.segments, ...newSegments]` 실행
- 초기 3개 + LLM 10개 = 총 13개가 되어야 하는데, 실제로는 7개가 표시됨
- 이는 **다른 곳에서 잘림**을 의미할 수 있음

---

## 🔧 해결 방안

### 해결책 1: segmentCount 조건 제거 또는 수정

**옵션 A**: `segmentCount` 조건을 제거하고 `hasInitialSegments`만 체크

```typescript
// 수정 전
if (hasInitialSegments && segmentCount === DEFAULT_MERGE_STRATEGY.llmCount) {

// 수정 후
if (hasInitialSegments) {  // segmentCount 조건 제거
  // LLM이 생성한 세그먼트가 10개여도 앞 4개만 가져오기
  const mergedSegments = mergeSegments(segmentsToUse, newSegments, DEFAULT_MERGE_STRATEGY);
  // ...
}
```

**옵션 B**: `segmentCount` 조건을 더 유연하게 수정

```typescript
// 수정
if (hasInitialSegments && segmentCount >= DEFAULT_MERGE_STRATEGY.keepLlmCount) {
  // LLM이 10개를 생성했어도 앞 4개만 가져오기
  const mergedSegments = mergeSegments(segmentsToUse, newSegments, DEFAULT_MERGE_STRATEGY);
  // ...
}
```

### 해결책 2: 초기 세그먼트에 `source: "initial"` 추가

```typescript
// getInitialColdStartSegments.ts
backgroundParams: {
  source: "initial",  // ✅ 추가
  moodAlias: config.moodAlias,
  musicSelection: config.musicTitle,
  // ...
}
```

### 해결책 3: 조건 체크 단순화

초기 세그먼트는 항상 3개이고, LLM 생성 세그먼트가 있을 때 앞 4개만 가져오도록 단순화:

```typescript
// 단순화된 조건
const hasInitialSegments = segmentsToUse.length === DEFAULT_MERGE_STRATEGY.initialCount;

if (hasInitialSegments) {
  // 초기 3개 세그먼트가 있고, LLM 세그먼트가 생성되었을 때
  // LLM 세그먼트의 앞 4개만 가져오기
  const mergedSegments = mergeSegments(segmentsToUse, newSegments, DEFAULT_MERGE_STRATEGY);
  // ...
}
```

---

## ✅ 권장 해결책

**해결책 1 옵션 B + 해결책 2 조합**:

1. `segmentCount` 조건을 `>=`로 변경
2. 초기 세그먼트에 `source: "initial"` 추가
3. 조건 체크 단순화 (선택적)

이렇게 하면:
- LLM이 10개를 생성해도 앞 4개만 가져옴
- 초기 세그먼트 식별이 명확해짐
- 조건 체크가 더 유연해짐

---

## 📝 추가 확인 필요

1. **초기 세그먼트의 `backgroundParams.source` 확인**
   - `getInitialColdStartSegments.ts`에서 설정 여부
   - 없으면 추가 필요

2. **실제 병합 결과 확인**
   - 콘솔 로그로 `hasInitialSegments` 값 확인
   - `mergedSegments` vs `[...prev.segments, ...newSegments]` 어떤 경로로 가는지 확인

3. **세그먼트 개수 제한**
   - UI에서 7개만 표시하는 로직이 있는지 확인
   - 있다면 그 부분도 확인 필요

---

**작성일**: 2025-01-XX  
**상태**: 문제 분석 완료, 해결 방안 제시
