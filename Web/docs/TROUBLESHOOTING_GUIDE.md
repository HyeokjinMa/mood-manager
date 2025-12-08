# 트러블슈팅 가이드

이 문서는 Mood Manager 개발 중 겪은 주요 문제들과 해결 방법을 정리한 것입니다.

---

## 목차

### 반복적으로 발생한 문제들
1. [Calm Breeze 하드코딩 문제](#1-calm-breeze-하드코딩-문제)
2. [음악 재생 문제](#2-음악-재생-문제)
3. [이미지 매핑 실패 문제](#3-이미지-매핑-실패-문제)
4. [세그먼트 Duration 고정 문제](#4-세그먼트-duration-고정-문제)
5. [LLM 응답 구조 문제](#5-llm-응답-구조-문제)
6. [React Hooks 순서 에러](#6-react-hooks-순서-에러)
7. [Prisma 브라우저 환경 에러](#7-prisma-브라우저-환경-에러)

### 최근 발생한 문제들
8. [Git 푸시 속도 문제](#8-git-푸시-속도-문제)
9. [파일명 매칭 문제](#9-파일명-매칭-문제)
10. [빌드 산출물 Git 추적 문제](#10-빌드-산출물-git-추적-문제)
11. [음악 파일 경로 변경](#11-음악-파일-경로-변경)

---

## 1. Calm Breeze 하드코딩 문제

### 문제 상황
- 여러 파일에 "Calm Breeze"가 하드코딩되어 있음
- 실제 데이터가 없을 때 "Calm Breeze"가 계속 표시됨
- 사용자가 삭제해도 다시 나타남

### 원인 분석
```typescript
// 여러 파일에서 발견된 하드코딩
const defaultMood = "Calm Breeze"; // ❌
const fallbackMood = { name: "Calm Breeze", ... }; // ❌
```

**문제가 있던 파일들:**
- `useBackgroundParams.ts`
- `api/moods/saved/route.ts`
- `api/devices/route.ts`
- `api/ai/background-params/handlers/scentHandler.ts`
- `api/ai/background-params/handlers/musicHandler.ts`
- `api/moods/saved/[savedMoodId]/route.ts`
- `lib/auth/createDefaultUserSetup.ts`

### 해결 방법

#### 1. 하드코딩 제거
```typescript
// ❌ 기존
const defaultMood = "Calm Breeze";

// ✅ 개선
const defaultMood = null; // 또는 실제 DB에서 가져오기
```

#### 2. Skeleton UI 사용
```typescript
// 데이터가 없을 때 하드코딩된 값 대신 스켈레톤 UI 표시
if (!currentMood) {
  return <SkeletonUI />;
}
```

#### 3. 전역 검색 및 제거
```bash
# 하드코딩된 "Calm Breeze" 찾기
grep -r "Calm Breeze" Web/src --exclude-dir=node_modules
```

### 결과
- 모든 하드코딩 제거 완료
- 실제 데이터가 없을 때 스켈레톤 UI 표시
- "Calm Breeze"는 이제 DB의 실제 mood 데이터로만 표시됨

### 교훈
- **하드코딩은 최후의 수단으로만 사용**
- **Fallback 값도 실제 데이터 소스에서 가져오기**
- **Mock 데이터와 실제 데이터를 명확히 구분**

---

## 2. 음악 재생 문제

### 문제 상황
- 음악이 자동으로 재생되지 않음
- Pause/Play 시 음악이 처음부터 다시 시작됨
- 세그먼트 전환 시 음악이 이어지지 않음
- 실제 MP3 길이가 아닌 고정된 3분으로 표시됨

### 원인 분석

#### 1. 브라우저 Autoplay 정책
```typescript
// ❌ 자동 재생 시도
audioElement.play(); // NotAllowedError 발생
```

#### 2. Audio Element 관리 문제
```typescript
// ❌ 세그먼트 변경 시 새로운 Audio 생성
// 이전 Audio의 currentTime이 유지되지 않음
```

#### 3. Duration 하드코딩
```typescript
// ❌ 고정된 duration
const duration = 180; // 3분
```

### 해결 방법

#### 1. User Interaction 후 재생
```typescript
// ✅ 사용자 인터랙션 후 재생
let userInteracted = false;
document.addEventListener('click', () => {
  userInteracted = true;
  // 이제 자동 재생 가능
});
```

#### 2. Audio Element 상태 관리
```typescript
// ✅ currentTime 유지
class MusicPlayer {
  private audioElement: HTMLAudioElement;
  
  pause() {
    this.audioElement.pause();
    // currentTime은 자동으로 유지됨
  }
  
  resume() {
    this.audioElement.play(); // currentTime에서 재개
  }
}
```

#### 3. 실제 MP3 Duration 사용
```typescript
// ✅ 실제 파일에서 duration 가져오기
audioElement.addEventListener('loadedmetadata', () => {
  const duration = audioElement.duration; // 실제 길이
});
```

#### 4. 세그먼트별 독립 재생
```typescript
// ✅ 각 세그먼트는 독립적인 음악
// 세그먼트 전환 시 이전 음악 중지, 새 음악 시작
```

### 결과
- 사용자 인터랙션 후 자동 재생 가능
- Pause/Play 시 현재 위치에서 재개
- 세그먼트별로 올바른 음악 재생
- 실제 MP3 길이 반영

### 교훈
- **브라우저 정책을 이해하고 준수**
- **Audio Element 생명주기 관리 중요**
- **하드코딩된 값 대신 실제 데이터 사용**

---

## 3. 이미지 매핑 실패 문제

### 문제 상황
- "Santa Claus Is Comin' to Town.png" 이미지가 표시되지 않음
- 파일명의 작은 차이(공백, 따옴표)로 매핑 실패
- 대체 이미지가 계속 표시됨

### 원인 분석
```typescript
// ❌ 정확한 파일명 매칭만 시도
const imageUrl = `/musics_img/${genre}/${title}.png`;
// "Santa Claus Is Comin' to Town" vs "Santa Claus Is Comin'  to Town" (공백 차이)
```

**문제점:**
- 파일명의 공백 개수 차이
- 따옴표 종류 차이 (', ', ')
- 대소문자 차이
- 하이픈 vs 공백 차이

### 해결 방법

#### 1. 파일 시스템 기반 매칭
```typescript
// ✅ 실제 파일 시스템에서 찾기
import * as fs from 'fs';

function findImageFile(title: string, genre: string): string | null {
  const dir = `public/musics_img/${genre}/`;
  const files = fs.readdirSync(dir);
  
  // 정규화된 제목으로 매칭
  const normalizedTitle = normalizeString(title);
  return files.find(file => {
    const normalizedFile = normalizeString(file.replace('.png', ''));
    return normalizedFile === normalizedTitle;
  });
}
```

#### 2. 문자열 정규화
```typescript
function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .replace(/[''']/g, "'") // 모든 따옴표를 '로 통일
    .replace(/\s+/g, ' ') // 여러 공백을 하나로
    .replace(/[_-]/g, ' ') // 하이픈/언더스코어를 공백으로
    .trim();
}
```

#### 3. 메타데이터 기반 매핑 (최종 해결)
```typescript
// ✅ JSON에 직접 imageUrl 저장
{
  "mp3Url": "/album/Balad/Balad_01.mp3",
  "imageUrl": "/album/Balad/A glass of soju.png" // 정확한 경로
}
```

### 결과
- 메타데이터 파일에 정확한 경로 저장
- 파일명 매칭 문제 완전 해결
- 이미지가 올바르게 표시됨

### 교훈
- **파일명 매칭은 복잡하고 오류 발생 가능**
- **메타데이터에 정확한 경로 저장이 가장 안전**
- **정규화 로직은 복잡해질수록 버그 가능성 증가**

---

## 4. 세그먼트 Duration 고정 문제

### 문제 상황
- 모든 세그먼트가 3분(180초)으로 고정 표시
- 실제 MP3 파일 길이가 반영되지 않음
- UI의 진행 바가 부정확함

### 원인 분석
```typescript
// ❌ 하드코딩된 duration
const duration = 180; // 모든 트랙에 동일하게 적용
```

**문제점:**
- `musicTracks.json`에 duration이 하드코딩됨
- 실제 MP3 파일의 메타데이터를 읽지 않음
- 세그먼트 생성 시 duration이 고정값으로 설정됨

### 해결 방법

#### 1. 실제 MP3 Duration 사용
```typescript
// ✅ Audio Element에서 duration 가져오기
const audio = new Audio(mp3Url);
audio.addEventListener('loadedmetadata', () => {
  const actualDuration = audio.duration; // 초 단위
});
```

#### 2. musicTracks.json에 실제 Duration 저장
```typescript
// ✅ 스크립트로 실제 duration 측정 후 저장
// generate-music-tracks-from-album.ts에서
// all-songs.md의 duration 값 사용 (실제 측정값)
```

#### 3. 세그먼트 생성 시 Duration 전달
```typescript
// ✅ musicTrack의 duration 사용
const segment: MoodStreamSegment = {
  duration: musicTrack.duration, // 실제 MP3 길이
  // ...
};
```

### 결과
- 각 트랙의 실제 duration 반영
- UI 진행 바가 정확함
- 세그먼트 길이가 다양해짐

### 교훈
- **하드코딩된 값은 항상 문제의 원인**
- **실제 데이터 소스를 우선 사용**
- **메타데이터는 실제 값과 동기화 유지**

---

## 5. LLM 응답 구조 문제

### 문제 상황
- LLM이 새로운 `CompleteSegmentOutput` 구조를 반환하지 않음
- 계속 기존 `BackgroundParamsResponse` 구조를 반환
- JSON 파싱 에러 발생
- 음악 선택이 잘못됨 (가짜 제목 생성)

### 원인 분석

#### 1. 프롬프트가 명확하지 않음
```typescript
// ❌ 모호한 지시사항
"Please generate mood segments" // 어떤 구조로?
```

#### 2. Temperature가 너무 높음
```typescript
temperature: 0.7 // 창의적이지만 구조 준수 실패
```

#### 3. JSON Schema 미사용
```typescript
// ❌ 구조 강제 없음
response_format: { type: "json_object" }
```

#### 4. 음악 목록 제공 부족
```typescript
// ❌ LLM이 사용 가능한 음악을 모름
// 가짜 제목을 생성함
```

### 해결 방법

#### 1. JSON Schema 적용
```typescript
// ✅ 엄격한 구조 강제
response_format: {
  type: "json_schema",
  json_schema: {
    name: "complete_segment_output",
    strict: true,
    schema: completeOutputSchema,
  },
},
temperature: 0.0, // 구조 준수 최우선
```

#### 2. Temperature 조정
```typescript
temperature: 0.0 // 기존: 0.7
// 생체 데이터 기반이므로 창의도 불필요
```

#### 3. 프롬프트 간소화
```typescript
// ✅ 핵심 지시사항만
// 기존: ~400줄 → 개선: ~20줄
```

#### 4. musicID 기반 선택
```typescript
// ✅ LLM은 musicID만 선택 (10-69)
// 실제 매핑은 코드에서 처리
{
  "music": {
    "musicID": 25, // 숫자만
    "volume": 70,
    "fadeIn": 1500,
    "fadeOut": 1500
  }
}
```

### 결과
- LLM이 새로운 구조를 안정적으로 반환
- JSON 파싱 에러 해결
- 음악 선택이 정확해짐 (musicID 기반)

### 교훈
- **JSON Schema는 구조 강제의 필수 도구**
- **Temperature는 용도에 맞게 조정**
- **LLM에게는 선택만 하게 하고, 매핑은 코드에서**

---

## 6. React Hooks 순서 에러

### 문제 상황
```
React has detected a change in the order of Hooks called by HomeContent.
Previous render: useEffect
Next render: useMemo
```

### 원인 분석
```typescript
// ❌ 조건부 Hook 호출
if (!currentMood) {
  return <SkeletonUI />;
}

const currentScentLevel = useMemo(...); // 조건부로 호출됨
```

**문제점:**
- React Hooks는 항상 같은 순서로 호출되어야 함
- 조건부 return이 Hook 호출 전에 있으면 순서가 바뀜

### 해결 방법

#### 1. Hook을 조건부 return 전에 호출
```typescript
// ✅ 모든 Hook을 먼저 호출
const currentScentLevel = useMemo(...);
const otherValue = useMemo(...);

// 그 다음 조건부 return
if (!currentMood) {
  return <SkeletonUI />;
}
```

#### 2. 조건부 로직을 Hook 내부로
```typescript
// ✅ Hook 내부에서 조건 처리
const currentScentLevel = useMemo(() => {
  if (!currentMood) return 5; // 기본값
  return devices.find(...)?.output?.scentLevel || 5;
}, [devices, currentMood]);
```

### 결과
- React Hooks 순서 에러 해결
- 컴포넌트가 정상적으로 렌더링됨

### 교훈
- **React Hooks 규칙을 엄격히 준수**
- **조건부 return은 모든 Hook 호출 후에**
- **조건부 로직은 Hook 내부에서 처리**

---

## 7. Prisma 브라우저 환경 에러

### 문제 상황
```
PrismaClient is unable to run in this browser environment
at getCarolSongs (src/lib/mock/getInitialColdStartSegments.ts:16:37)
```

### 원인 분석
```typescript
// ❌ 클라이언트 컴포넌트에서 Prisma 사용
'use client';
import { prisma } from '@/lib/prisma'; // ❌ 브라우저에서 실행 불가
```

**문제점:**
- Prisma는 Node.js 환경에서만 동작
- 클라이언트 컴포넌트에서 직접 사용 불가
- `getInitialColdStartSegments`가 클라이언트에서 호출됨

### 해결 방법

#### 1. API Route 생성
```typescript
// ✅ Web/src/app/api/moods/carol-segments/route.ts
export async function GET() {
  const segments = await getInitialColdStartSegments(); // 서버에서만
  return Response.json(segments);
}
```

#### 2. 클라이언트에서 API 호출
```typescript
// ✅ 클라이언트 컴포넌트
const response = await fetch('/api/moods/carol-segments');
const segments = await response.json();
```

#### 3. 함수 분리
```typescript
// ✅ 서버 전용 함수
// getInitialColdStartSegments.ts (서버에서만 사용)

// ✅ 클라이언트 전용 함수
// useColdStart.ts (API 호출)
```

### 결과
- Prisma 에러 해결
- 서버/클라이언트 분리 명확
- 초기 세그먼트가 올바르게 로드됨

### 교훈
- **Prisma는 서버에서만 사용**
- **API Route로 서버 로직 노출**
- **서버/클라이언트 경계 명확히 구분**

---

## 8. Git 푸시 속도 문제

### 문제 상황
- Git 푸시가 11분 이상 걸림
- Web 폴더만 푸시하는데도 매우 느림

### 원인 분석
```bash
# Git 히스토리에 큰 파일들이 포함되어 있음
git rev-list --objects --all | git cat-file --batch-check='%(objecttype) %(objectname) %(objectsize) %(rest)' | awk '/^blob/ && $3 > 1000000 {sum+=$3; count++} END {print "큰 파일 개수:", count, "\n총 크기:", sum/1024/1024, "MB"}'
```

**발견된 큰 파일들:**
- `next-swc.darwin-arm64.node` (129MB) - Next.js 빌드 도구
- `node_modules` 바이너리들 (21MB, 19MB 등)
- MP3 파일들 (13MB, 10MB 등)
- PDF 파일들

**총 925MB의 큰 파일이 Git 히스토리에 포함됨**

### 해결 방법

#### 1. `.gitignore` 업데이트
```gitignore
# next.js
/.next/
Web/.next/
Web/.next/**
Web/server/
Web/.build-artifacts/
/out/

# dependencies
/node_modules
Web/node_modules

# 음악 파일 및 앨범 이미지 (용량이 크므로 GitHub 제외)
Web/public/musics/
Web/public/musics_img/
Web/public/album/
```

#### 2. 빌드 산출물 제거
```bash
# 이미 추적 중인 빌드 산출물 제거
git rm -r --cached Web/server/
git commit -m "chore: Web/server 빌드 산출물 Git 추적 제거"
```

#### 3. Git LFS 설정 (선택사항)
```gitattributes
# 큰 바이너리 파일들
*.node filter=lfs diff=lfs merge=lfs -text
*.dylib filter=lfs diff=lfs merge=lfs -text
*.so filter=lfs diff=lfs merge=lfs -text
*.dll filter=lfs diff=lfs merge=lfs -text

# 미디어 파일들 (선택사항)
*.mp3 filter=lfs diff=lfs merge=lfs -text
*.mp4 filter=lfs diff=lfs merge=lfs -text
*.pdf filter=lfs diff=lfs merge=lfs -text
```

### 결과
- 앞으로는 `.gitignore`에 의해 큰 파일이 추가되지 않음
- 푸시 속도가 크게 개선됨
- 히스토리에 있는 큰 파일들은 점진적으로 영향이 줄어듦

### 참고사항
- `.gitignore`는 **새 파일만** 무시함
- 이미 히스토리에 들어간 파일은 계속 전송됨
- 완전히 제거하려면 `git filter-repo` 사용 (위험할 수 있음)

---

## 2. 파일명 매칭 문제

### 문제 상황
- MP3 파일명: `Balad_01.mp3` (숫자 기반)
- PNG 파일명: `A glass of soju.png` (제목 기반)
- 파일명이 달라서 매칭이 어려움
- 공백, 하이픈, 따옴표 등 특수문자 처리 문제

### 원인 분석
```typescript
// 기존 코드: 파일명 직접 매칭 시도
const imageUrl = `/musics_img/${genre}/${title}.png`; // ❌ 매칭 실패
```

**문제점:**
- MP3와 PNG 파일명 형식이 다름
- 공백, 하이픈, 따옴표 등 특수문자 처리 복잡
- 파일명 정규화 로직이 복잡하고 오류 발생 가능

### 해결 방법

#### 1. 메타데이터 파일 활용
`Web/public/album/all-songs.md` 파일에 MP3와 PNG 매핑 정보 저장:
```markdown
```json
{
  "title": "A glass of soju",
  "mp3": "Balad/Balad_01.mp3",
  "png": "Balad/A glass of soju.png",
  "artist": "Lim Changjung",
  "description": "...",
  "duration": 291
}
```
```

#### 2. 자동 스캔 스크립트 생성
```typescript
// Web/scripts/generate-music-tracks-from-album.ts
// 실제 파일 시스템을 스캔하여 MP3와 PNG를 메타데이터와 매칭
```

**장점:**
- 파일명 형식에 구애받지 않음
- 메타데이터 파일이 단일 소스(single source of truth)
- 파일 추가/변경 시 스크립트만 재실행

#### 3. 통합된 폴더 구조
```
Web/public/album/
  ├── Balad/
  │   ├── Balad_01.mp3
  │   ├── A glass of soju.png
  │   └── ...
  ├── Pop/
  └── ...
```

**장점:**
- MP3와 PNG가 같은 폴더에 있어 관리 용이
- 경로가 단순해짐: `/album/{Genre}/{filename}`

### 결과
- 파일명 매칭 문제 완전 해결
- 메타데이터 기반으로 안정적인 매핑
- 파일 추가/변경이 쉬워짐

---

## 3. 빌드 산출물 Git 추적 문제

### 문제 상황
- `Web/server/` 폴더가 Git에 추적됨
- 빌드 산출물이 커밋에 포함됨
- 불필요한 파일들이 저장소에 포함됨

### 원인 분석
```bash
# 빌드 산출물이 Git에 추적되고 있음
git ls-files Web/server/ | wc -l  # 673개 파일
du -sh Web/server  # 33MB
```

**문제점:**
- Next.js 빌드 산출물이 Git에 포함됨
- `.next/` 폴더는 무시되지만 `server/` 폴더는 추적됨
- 빌드 산출물은 환경마다 다를 수 있음

### 해결 방법

#### 1. `.gitignore` 업데이트
```gitignore
# next.js
Web/.next/
Web/.next/**
Web/server/
Web/.build-artifacts/
```

#### 2. 기존 추적 제거
```bash
git rm -r --cached Web/server/
git commit -m "chore: Web/server 빌드 산출물 Git 추적 제거"
```

### 결과
- 빌드 산출물이 더 이상 Git에 추적되지 않음
- 저장소 크기 감소
- 빌드 산출물은 로컬에서 `npm run build`로 생성

---

## 4. LLM 출력 구조 검증 문제

### 문제 상황
- LLM이 새로운 `CompleteSegmentOutput` 구조를 반환하지 않음
- 기존 `BackgroundParamsResponse` 구조를 계속 반환
- JSON 파싱 에러 발생

### 원인 분석
1. **프롬프트가 명확하지 않음**
   - LLM이 새로운 구조를 이해하지 못함
   - 기존 구조에 익숙해져 있음

2. **Temperature가 너무 높음**
   - 창의적인 응답을 유도하지만 구조 준수 실패
   - 생체 데이터 기반이므로 창의도 불필요

3. **JSON Schema 미사용**
   - 구조 강제가 약함
   - 응답이 잘릴 수 있음

### 해결 방법

#### 1. JSON Schema 적용
```typescript
// streamHandler.ts
const response = await openai.chat.completions.create({
  // ...
  response_format: {
    type: "json_schema",
    json_schema: {
      name: "complete_segment_output",
      strict: true,
      schema: completeOutputSchema,
    },
  },
  temperature: 0.0, // 구조 준수 최우선
  max_tokens: 8000, // 응답 잘림 방지
});
```

#### 2. Temperature 조정
```typescript
temperature: 0.0  // 기존: 0.7
```

**이유:**
- 생체 데이터 기반이므로 창의도 불필요
- 구조 준수가 최우선
- 환각 방지

#### 3. 프롬프트 간소화
```typescript
// 기존: ~400줄의 상세한 설명
// 개선: ~20줄의 핵심 지시사항
```

**장점:**
- LLM이 핵심에 집중
- 토큰 사용량 감소
- 응답 속도 개선

### 결과
- LLM이 새로운 구조를 안정적으로 반환
- JSON 파싱 에러 해결
- 검증 로직이 정상 작동

---

## 5. 음악 파일 경로 변경

### 문제 상황
- 기존: `/musics/{Genre}/`와 `/musics_img/{Genre}/` 분리
- 파일명 매칭 문제
- 경로 관리 복잡

### 해결 방법

#### 1. 통합 폴더 구조
```
기존:
Web/public/musics/Balad/Balad_01.mp3
Web/public/musics_img/Balad/A glass of soju.png

개선:
Web/public/album/Balad/
  ├── Balad_01.mp3
  ├── A glass of soju.png
  └── ...
```

#### 2. 경로 통일
```typescript
// 기존
mp3Url: "/musics/Balad/Balad_01.mp3"
imageUrl: "/musics_img/Balad/A glass of soju.png"

// 개선
mp3Url: "/album/Balad/Balad_01.mp3"
imageUrl: "/album/Balad/A glass of soju.png"
```

#### 3. 자동 생성 스크립트
```bash
# 파일 추가/변경 시
npx tsx scripts/generate-music-tracks-from-album.ts > src/lib/music/musicTracks.json
```

### 결과
- 경로가 단순하고 일관됨
- 파일 관리가 쉬워짐
- 매핑 문제 해결

---

## 일반적인 트러블슈팅 팁

### 1. Git 히스토리 분석
```bash
# 큰 파일 찾기
git rev-list --objects --all | git cat-file --batch-check='%(objecttype) %(objectname) %(objectsize) %(rest)' | awk '/^blob/ && $3 > 1000000 {print $3/1024/1024 " MB - " $4}' | sort -rn | head -20

# 추적 중인 파일 확인
git ls-files | xargs ls -lh 2>/dev/null | awk '{if ($5 ~ /M/) print $5, $9}' | sort -hr | head -10
```

### 2. 파일 매칭 검증
```bash
# 실제 파일 존재 확인
test -f public/album/Balad/Balad_01.mp3 && echo "✅ 존재" || echo "❌ 없음"

# JSON 파일 검증
node -e "const data = require('./src/lib/music/musicTracks.json'); console.log('트랙 수:', data.tracks.length);"
```

### 3. 빌드 산출물 확인
```bash
# .gitignore가 제대로 작동하는지 확인
git check-ignore -v Web/.next/ Web/server/ Web/public/album/

# 추적 중인 빌드 파일 확인
git ls-files | grep -E "(\.next|server|node_modules)"
```

---

## 예방 조치

### 1. `.gitignore` 정기 점검
- 새로운 빌드 산출물 경로 추가
- 큰 파일 확장자 추가

### 2. 메타데이터 파일 유지
- `all-songs.md` 파일을 단일 소스로 유지
- 파일 추가/변경 시 메타데이터도 함께 업데이트

### 3. 자동화 스크립트 활용
- 파일 추가 시 스크립트 재실행
- CI/CD 파이프라인에 검증 단계 추가

---

## 관련 문서

- [LLM Output Refactoring Plan](./LLM_OUTPUT_REFACTORING_PLAN.md)
- [Music Data Integration Plan](./MUSIC_DATA_INTEGRATION_PLAN.md)
- [Git Conflict Analysis](./GIT_CONFLICT_ANALYSIS.md)

---

**마지막 업데이트:** 2025-12-07

