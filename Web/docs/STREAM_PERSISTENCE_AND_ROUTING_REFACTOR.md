---
title: Stream Persistence & Routing Refactor Plan
description: 브라우저 새로고침/페이지 이동 시에도 무드스트림과 디바이스 상태를 유지하기 위한 V2.5 리팩토링 설계
---

## 1. 목표 (Goal)

- **스트림 영속성 보장**
  - 브라우저 새로고침, 탭 재오픈, 서버 리마운트 이후에도 동일한 무드스트림과 현재 세그먼트를 복원.
  - 사용자가 `/home ↔ /mypage ↔ /mood`를 오갈 때, **음악/빛/향 상태가 끊기지 않고 그대로 유지**.

- **UI 라우팅 단순화**
  - `/home`을 **실제 루트 화면**으로 두고,  
    `/mypage`, `/mood`는 “페이지 전환”이 아니라 **오버레이/모달**처럼 동작하게 변경.
  - 이렇게 해서 홈의 `HomePage` / `HomeContent` / `MoodStreamProvider` 트리가 언마운트되지 않도록 보장.

- **mock는 오로지 fallback 전용**
  - 관리자 계정/DB 에러/데이터 없음 등, **명확한 조건에서만 mock**을 사용.
  - 일반 유저 플로우는 항상 **Prisma + 캐시 테이블 기반 실데이터**로 동작.

---

## 2. 현재 상태 요약 (Current State)

- **전역 스트림 관리**
  - `MoodStreamProvider` 가 `app/layout.tsx` 안에서 전체 앱을 감싸고 있음.
  - `useMoodStream()` 은 이 Provider 내부에서 한 번만 실행.
  - `/home`의 `HomeContent` 및 `MoodDashboard` 는 `useMoodStreamContext()` 로 전역 스트림을 구독.

- **문제점**
  - 브라우저 새로고침/탭 재오픈 시 클라이언트 메모리가 초기화 ⇒ `MoodStreamProvider` 재마운트 ⇒ 스트림 재생성.
  - `/mypage` 와 `/mood` 는 현재 “독립 페이지” 라우트이기 때문에,
    - Next.js 라우팅/레이아웃 구조에 따라 **실제 런타임에서 Home 트리가 언마운트될 여지가 있음**.
  - 스트림/디바이스 상태를 DB에 캐싱하지 않기 때문에, 서버 재시작 후에도 상태 복원이 불가능.

---

## 3. 캐시 테이블 설계 (UserMoodSession)

### 3.1 Prisma 모델 초안

```prisma
model UserMoodSession {
  id                 String   @id @default(uuid())
  userId             String   @unique
  streamJson         Json     // MoodStream 전체 JSON (currentMood, segments, userDataCount 등)
  currentSegmentIndex Int     @default(0)
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([updatedAt])
}
```

### 3.2 캐시 사용 규칙

- **생성/업데이트**
  - `/api/moods/current` 가 **새 스트림을 생성**하거나,  
    현재 세그먼트를 변경(세그먼트 이동/스트림 전환)할 때 마다:
    - `UserMoodSession.upsert` 로 `streamJson` + `currentSegmentIndex` 업데이트.

- **조회**
  - `/api/moods/current` 호출 시 순서:
    1. `UserMoodSession.findUnique({ where: { userId } })` 조회.
    2. 존재하고, `updatedAt` 이 특정 TTL(예: 1시간) 이내라면 → 이 값을 그대로 반환.
    3. 없거나 TTL 초과/형식 에러면 → 새 스트림 생성 후 캐시에 저장.

- **삭제/만료**
  - 로그아웃, 계정 삭제 시 `UserMoodSession` 삭제.
  - 배치/cron 으로 오래된 세션(예: 24시간 이상)을 정리해도 됨 (선택 사항).

---

## 4. `/api/moods/current` 리팩토링 플로우

### 4.1 GET /api/moods/current (새 설계)

1. **세션 검증**
   - `requireAuth()` 로 `userId` 확보.

2. **캐시 조회**
   - `UserMoodSession.findUnique({ where: { userId } })`.
   - 결과가 있고 `updatedAt` 이 TTL 안이라면:
     - `streamJson` 과 `currentSegmentIndex` 를 복원.
     - 응답:
       - `currentMood = streamJson.currentMood`
       - `moodStream = streamJson.segments`
       - `userDataCount = streamJson.userDataCount`
       - `source = "cache-session"`

3. **캐시 미스/만료**
   - 기존 로직대로:
     - DB 기반 Preset ↘
     - Markov/ML ↘
     - mock fallback ↘
   - 새로 생성한 `MoodStream` 을 `UserMoodSession.upsert` 로 저장.

4. **세그먼트 이동/스트림 전환**
   - `useMoodStream` 내부에서,
     - `setCurrentSegmentIndex` / `switchToNextStream` 호출 시
     - 백엔드에 `/api/moods/current/position` (또는 PATCH) 를 호출해
       - `UserMoodSession.currentSegmentIndex` 만 업데이트.

> 이렇게 하면:
> - 프론트가 새로고침/재마운트 되어도 `/api/moods/current` 는 항상 **DB 캐시된 스트림**을 먼저 복원.
> - 서버 재시작 후에도 동일한 Session 스트림을 계속 이어갈 수 있음.

---

## 5. 라우팅/레이아웃 구조 리팩토링

### 5.1 목표

- `/home` 을 **실질적인 루트 스크린**으로 유지.
- `/mypage`, `/mood` 는:
  - URL 은 유지하되,
  - 렌더링은 `/home` 위에 뜨는 **오버레이/모달**로 동작하게 변경.
- 이를 통해:
  - 홈의 `HomePage` / `HomeContent` / `MoodDashboard` / `DeviceGrid` / `MoodStreamProvider` 가  
    페이지 전환으로 언마운트되지 않도록 보장.

### 5.2 Next.js 구조 아이디어

#### 안 1) 단일 (main) 레이아웃 + 상태 기반 모달

- `(main)/home/page.tsx` 내에서:
  - `router.push("/home?tab=mood")` 또는 `?tab=mypage` 와 같은 쿼리로 상태만 바꿈.
  - 동일 페이지 안에서:
    - `const tab = searchParams.get("tab")` 로 분기,
    - `tab === "mood"` 이면 `MoodPageOverlay` 컴포넌트를 렌더.
  - 이렇게 하면 루트 트리는 `HomePage` 하나뿐이고,  
    그 위에 모달만 열리고 닫히는 구조가 됨.

#### 안 2) 중첩 라우트로 /home 을 부모, /home/mood 를 자식으로

- Next 13 app router 에서:
  - `/app/(main)/home/layout.tsx` 를 만들고,
  - 그 안에서 `HomeContent` + `Outlet`(children)을 렌더.
  - `/home/mood`, `/home/mypage` 는 자식 라우트로 두고,
    - 자식 라우트는 **오버레이 UI만 렌더**하도록 구성.
  - 장점:
    - URL 이 직관적 (`/home/mood`).
    - 부모 레이아웃(`home/layout.tsx`) 아래에서 **홈 UI가 항상 유지**.

> 구현 시에는 안 2) (중첩 라우트) 쪽이 Next.js 설계와 더 잘 맞고,  
> 모달/오버레이 구현도 깔끔하게 분리할 수 있음.

---

## 6. 단계별 적용 계획

### 6.1 1단계 – Mood Set 안정화 (진행 중)

1. `POST /api/moods/saved` 를 Prisma 기반 Preset/Light/Fragrance/Sound 저장으로 전환.
2. `GET /api/moods/saved` 가 `Sound.componentsJson.fullMood` 를 반영해  
   이름/노래/향/색을 UI에 올바르게 표시하도록 수정.

### 6.2 2단계 – MoodStream 전역 Context (완료)

1. `MoodStreamProvider` 도입, `useMoodStreamContext` 로 `/home` 전역 공유.
2. `HomeContent`, `MoodDashboard` 에서 직접 `useMoodStream` 호출 제거.

### 6.3 3단계 – UserMoodSession 캐시 도입 (향후 작업)

1. Prisma 스키마에 `UserMoodSession` 모델 추가.
2. `/api/moods/current` GET 에 캐시 로직 반영.
3. `useMoodStream` 내부에서 세그먼트 이동/스트림 전환 시  
   `/api/moods/current/position` (또는 PATCH) 호출로 `currentSegmentIndex` 동기화.

### 6.4 4단계 – 라우팅/레이아웃 리팩토링 (향후 작업)

1. `(main)/home/layout.tsx` 생성, `HomeContent` 를 부모 레이아웃에서 렌더.
2. `/home/mood`, `/home/mypage` 를 자식 라우트로 정의하고,  
   각 자식 라우트에서 모달/오버레이 UI만 렌더.
3. 기존 `/mood`, `/mypage` 페이지는 점진적으로 `/home` 자식 라우트로 이동.
4. 이 과정에서:
   - 스트림/디바이스 관련 훅은 모두 부모 레이아웃/Provider에서만 사용.
   - 자식 라우트는 컨텍스트/props만 소비.

---

## 7. 테스트 전략 (요약)

- **스트림 영속성**
  - `/home` 에서 스트림 시작 → `/home/mypage` → `/home/mood` → `/home` 순회.
  - 음악/색/향이 끊기지 않고 이어지는지 확인.
  - 브라우저 새로고침 후에도:
    - `/api/moods/current` 가 캐시에서 스트림을 복원하는지 확인.

- **무드셋**
  - 다양한 무드/노래/향/이벤트 상태에서 ⭐ 눌러 저장.
  - `/mood` 에서 각 카드에 저장 당시의 이름/노래/향/날짜가 올바르게 보이는지,
    - `Sound.componentsJson.fullMood` 와 일치하는지 확인.

---

이 문서는 **“스트림 영속성 + 라우팅 리팩토링”의 기준 설계서**로 사용합니다.  
실제 구현 시에는 각 단계별로 이 문서를 업데이트하여,  
현재 상태와 남은 작업을 계속 동기화합니다.


