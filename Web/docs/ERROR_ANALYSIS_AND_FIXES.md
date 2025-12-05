# 에러 분석 및 해결 방안

## 1. PrismaClient 브라우저 환경 에러

### 에러 메시지
```
PrismaClient is unable to run in this browser environment, or has been bundled for the browser
at getCarolSongs (src/lib/mock/getInitialColdStartSegments.ts:16:37)
```

### 원인
- `getInitialColdStartSegments` 함수가 클라이언트 컴포넌트(`useColdStart`)에서 직접 호출됨
- Prisma는 서버 사이드에서만 실행 가능 (Node.js 환경 필요)
- 클라이언트 번들에 포함되어 브라우저에서 실행 시도

### 해결 방법
1. **API 라우트 생성**: `/api/moods/carol-segments` 엔드포인트 생성
2. **서버 사이드에서만 실행**: API 라우트에서 Prisma 호출
3. **클라이언트에서 fetch**: `useColdStart`에서 API 호출로 변경

### 수정 파일
- `Web/src/lib/mock/getInitialColdStartSegments.ts` → API 라우트로 이동
- `Web/src/app/api/moods/carol-segments/route.ts` (신규 생성)
- `Web/src/hooks/useMoodStream/hooks/useColdStart.ts` → API 호출로 변경

---

## 2. MusicPlayer 재생 실패 (사용자 인터랙션 필요)

### 에러 메시지
```
[MusicPlayer] 재생 실패: play() failed because the user didn't interact with the document first
```

### 원인
- 브라우저 자동 재생 정책 위반
- 사용자 인터랙션 없이 `audio.play()` 호출
- `userInteracted` 플래그가 제대로 전달되지 않음

### 해결 방법
1. **재생 버튼 클릭 시에만 재생**: 사용자가 명시적으로 재생 버튼 클릭
2. **userInteracted 플래그 관리**: 클릭 이벤트에서 `true`로 설정
3. **에러 핸들링 개선**: 조용히 실패 처리 (콘솔 에러만, 사용자에게는 표시 안 함)

### 수정 파일
- `Web/src/lib/audio/musicPlayer.ts` → 에러 핸들링 개선
- `Web/src/hooks/useMusicTrackPlayer.ts` → userInteracted 플래그 관리
- `Web/src/app/(main)/home/components/MoodDashboard/components/MusicControls.tsx` → 재생 버튼 클릭 시 플래그 전달

---

## 3. Audio Error

### 에러 메시지
```
[MusicPlayer] Audio error: {}
```

### 원인
- 오디오 파일 로드 실패 (파일 경로 오류, 네트워크 문제 등)
- 에러 객체가 비어있어서 디버깅 어려움

### 해결 방법
1. **에러 정보 상세화**: `error.target`, `error.message` 등 상세 정보 로깅
2. **파일 경로 검증**: `fileUrl`이 유효한지 확인
3. **Fallback 처리**: 로드 실패 시 기본 오디오 또는 재시도

### 수정 파일
- `Web/src/lib/audio/musicPlayer.ts` → 에러 핸들링 개선

---

## 4. 세그먼트 전환 시 새로고침 느낌

### 문제
- 세그먼트 전환 시 페이지가 리로드되는 것처럼 보임
- 간헐적으로 발생 (항상은 아님)

### 원인 추정
1. **상태 업데이트로 인한 리렌더링**: `setCurrentSegmentIndex` 호출 시 전체 컴포넌트 리렌더링
2. **API 호출**: 세그먼트 전환 시 불필요한 API 호출
3. **애니메이션 부재**: 전환 애니메이션이 없어서 갑작스러운 변화

### 해결 방법
1. **CSS Transition 추가**: 세그먼트 전환 시 fade-in/out 애니메이션
2. **상태 업데이트 최적화**: 불필요한 리렌더링 방지 (React.memo, useMemo)
3. **모달처럼 전환**: 미리 다음 세그먼트 데이터 준비 후 부드럽게 전환

### 수정 파일
- `Web/src/app/(main)/home/components/MoodDashboard/MoodDashboard.tsx` → 전환 애니메이션 추가
- `Web/src/hooks/useMoodStream/hooks/useStreamTransition.ts` (확인 필요)

---

## 5. 향(scent) 대시보드 반영 안 됨

### 문제
- `ScentControl` 컴포넌트에 현재 세그먼트의 향이 반영되지 않음

### 원인
- `currentSegment.mood.scent`이 `MoodDashboard`에서 `ScentControl`로 전달되지 않음
- `mood` prop이 이전 세그먼트의 값을 유지

### 해결 방법
1. **currentSegment에서 scent 가져오기**: `currentSegment?.mood.scent` 사용
2. **ScentControl에 전달**: `mood` prop 대신 `currentSegment.mood` 전달

### 수정 파일
- `Web/src/app/(main)/home/components/MoodDashboard/MoodDashboard.tsx` → currentSegment.mood 전달

---

## 6. LLM 콜 문제 - 새 스트림 생성 안 됨

### 문제
- 새 스트림이 이어지지 않음
- LLM 콜이 안 되어서 그런 것으로 추정

### 원인 추정
1. **API 키 누락**: `OPENAI_API_KEY` 환경 변수 없음
2. **에러 핸들링**: API 실패 시 조용히 실패
3. **스트림 생성 로직**: 첫 번째 스트림만 생성하도록 제한됨

### 해결 방법
1. **에러 로깅 개선**: API 실패 시 상세 로그
2. **Fallback 확인**: Mock 데이터로 대체되는지 확인
3. **스트림 생성 로직 확인**: `useAutoGeneration`에서 올바르게 호출되는지

### 수정 파일
- `Web/src/hooks/useMoodStream/hooks/useAutoGeneration.ts` → 에러 로깅 개선
- `Web/src/app/api/moods/current/generate/route.ts` (확인 필요)

---

## 작업 우선순위

1. **높음**: PrismaClient 브라우저 에러 (즉시 수정 필요)
2. **높음**: MusicPlayer 재생 실패 (사용자 경험 저하)
3. **중간**: 세그먼트 전환 부드럽게 (UX 개선)
4. **중간**: 향 대시보드 반영 (기능 완성)
5. **낮음**: Audio error 핸들링 (디버깅 개선)
6. **낮음**: LLM 콜 문제 (추가 조사 필요)

