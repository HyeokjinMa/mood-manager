# 코드 정리 작업 단위별 분할

## 작업 개요
1. 사용되지 않는 변수 제거 ✅
2. 주석 스타일 변경 ✅
   - 한 줄 주석: `//` 유지
   - 여러 줄 주석: `/**/` 블록 주석으로 변경

---

## 작업 단위별 분할

### Task 1: `home/page.tsx` 정리
**파일**: `Web/src/app/(main)/home/page.tsx`
- [x] 사용되지 않는 변수 제거:
  - `initialMood` 변수 제거 (사용 안 함) ✅
  - `useSession`은 `status`를 위해 사용 중이므로 유지
- [x] 주석 스타일 변경:
  - 파일 헤더 주석 (`// =====` → `/**/`) ✅
  - 인라인 주석들 (한 줄은 `//`, 여러 줄은 `/**/`) ✅

---

### Task 2: `HomeContent.tsx` 주석 정리
**파일**: `Web/src/app/(main)/home/components/HomeContent.tsx`
- [x] 주석 스타일 변경:
  - 파일 헤더 주석 (`// =====` → `/**/`)
  - 인라인 주석들 (한 줄은 `//`, 여러 줄은 `/**/`)

---

### Task 3: `MoodDashboard.tsx` 및 관련 컴포넌트 주석 정리
**파일들**:
- `Web/src/app/(main)/home/components/MoodDashboard/MoodDashboard.tsx`
- `Web/src/app/(main)/home/components/MoodDashboard/components/AlbumSection.tsx`
- `Web/src/app/(main)/home/components/MoodDashboard/components/MusicControls.tsx`
- `Web/src/app/(main)/home/components/MoodDashboard/components/MoodHeader.tsx`
- `Web/src/app/(main)/home/components/MoodDashboard/components/ScentControl.tsx`
- `Web/src/app/(main)/home/components/MoodDashboard/components/SegmentTransition.tsx`
- `Web/src/app/(main)/home/components/MoodDashboard/components/MoodDuration.tsx`
- [x] 주석 스타일 변경 (각 파일) - 한 줄은 `//`, 여러 줄은 `/**/`

---

### Task 4: `MoodDashboard` 훅 파일들 정리
**파일들**:
- `Web/src/app/(main)/home/components/MoodDashboard/hooks/useMoodDashboard.ts`
- `Web/src/app/(main)/home/components/MoodDashboard/hooks/useSegmentTransition.ts`
- [x] 사용되지 않는 변수 제거 (있으면)
- [x] 주석 스타일 변경 - 한 줄은 `//`, 여러 줄은 `/**/`

---

### Task 5: API Route 파일들 - 사용되지 않는 변수 정리
**파일들**:
- `Web/src/app/api/moods/saved/route.ts` (getSavedMoods, session)
- `Web/src/app/api/moods/saved/[savedMoodId]/route.ts` (editedPhone, onPhoneChange)
- `Web/src/app/api/moods/preference/route.ts` (getMusicTracksByGenre)
- `Web/src/app/api/preprocessing/route.ts` (preprocessed, moodStream, userPreferences, forceFresh, userId, session)
- `Web/src/app/api/ai/background-params/handlers/streamHandler.ts` (originalSegment 여러 곳)
- [x] 사용되지 않는 변수 제거 ✅
  - `streamHandler.ts`의 `originalSegment` 변수 4곳 제거

---

### Task 6: Device 관련 컴포넌트 주석 정리
**파일들**:
- `Web/src/app/(main)/home/components/Device/DeviceCardSmall.tsx`
- `Web/src/app/(main)/home/components/Device/hooks/useDeviceHandlers.ts`
- [x] 주석 스타일 변경 - 한 줄은 `//`, 여러 줄은 `/**/`

---

### Task 7: MyPage 관련 파일들 정리
**파일들**:
- `Web/src/app/(main)/mypage/page.tsx`
- `Web/src/app/(main)/mypage/components/ProfileSection.tsx`
- `Web/src/app/(main)/mypage/components/MenuSection.tsx`
- `Web/src/app/(main)/mypage/qna/page.tsx`
- `Web/src/app/(main)/mypage/inquiry/page.tsx`
- [x] 주석 스타일 변경 - 한 줄은 `//`, 여러 줄은 `/**/`

---

### Task 8: Auth 관련 파일들 정리
**파일들**:
- `Web/src/app/api/auth/[...nextauth]/route.ts`
- `Web/src/app/(auth)/register/components/EmailSection.tsx`
- `Web/src/app/(auth)/register/components/RegisterForm.tsx`
- [x] 사용되지 않는 변수 제거 (NextRequest 등)
- [x] 주석 스타일 변경 - 한 줄은 `//`, 여러 줄은 `/**/`

---

### Task 9: Mood 페이지 관련 파일들 정리
**파일들**:
- `Web/src/app/(main)/mood/page.tsx`
- `Web/src/app/(main)/mood/components/MoodReplaceModal.tsx`
- `Web/src/app/(main)/mood/components/MoodDeleteModal.tsx`
- [x] 주석 스타일 변경 - 한 줄은 `//`, 여러 줄은 `/**/`

---

### Task 10: 기타 컴포넌트 및 유틸리티 정리
**파일들**:
- `Web/src/components/ui/ScentBackground/drawing.ts`
- `Web/src/backend/jobs/preprocessPeriodic.ts`
- [x] 사용되지 않는 변수 제거 (parseSoundComponents 등 - 해당 변수 없음)
- [x] 주석 스타일 변경 - 한 줄은 `//`, 여러 줄은 `/**/`

---

## 작업 순서 제안

1. **Task 1** - 가장 많이 사용되는 페이지부터
2. **Task 2** - HomeContent (메인 컴포넌트)
3. **Task 3-4** - MoodDashboard 관련 (연관된 파일들)
4. **Task 5** - API Route (사용되지 않는 변수 정리)
5. **Task 6-10** - 나머지 파일들

각 Task는 독립적으로 실행 가능하며, 하나씩 진행하시면 됩니다.

