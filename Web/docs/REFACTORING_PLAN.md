# 🔧 리팩토링 계획서

## 📋 개요

이 문서는 Mood Manager 프로젝트의 코드베이스 전반을 분석하여 발견된 문제점과 개선 방안을 정리한 리팩토링 계획서입니다.

**작성일**: 2025-01-XX  
**분석 범위**: Web/src 디렉토리 전체

---

## 🔍 발견된 주요 문제점

### 1. 중복 코드 (Code Duplication)

#### 1.1 색상 유틸리티 함수 중복
**문제점**:
- `hexToRgb` 함수가 `src/lib/utils.ts`와 `src/lib/utils/colorUtils.ts`에 중복 정의됨
- 두 함수의 구현이 약간 다름 (기본값 처리 방식 차이)
- 프로젝트 전반에서 두 파일을 혼용하여 import하고 있음

**영향받는 파일**:
- `src/lib/utils.ts` (34-47줄)
- `src/lib/utils/colorUtils.ts` (12-22줄)
- `src/app/api/moods/current/route.ts` (4줄: `@/lib/utils`에서 import)
- `src/app/(main)/home/components/Device/DeviceCardExpanded.tsx` (33줄: `@/lib/utils/colorUtils`에서 import)
- 기타 20개 이상의 파일

**우선순위**: 🔴 높음

#### 1.2 API 라우트 인증 패턴 중복
**문제점**:
- 모든 API 라우트에서 동일한 인증 체크 패턴이 반복됨
- `requireAuth()` → `checkMockMode()` → 에러 처리 패턴이 50개 이상의 라우트에 중복

**영향받는 파일**:
- `src/app/api/devices/route.ts`
- `src/app/api/devices/[deviceId]/route.ts`
- `src/app/api/moods/current/route.ts`
- `src/app/api/auth/profile/route.ts`
- 기타 모든 API 라우트 파일

**우선순위**: 🔴 높음

#### 1.3 에러 응답 형식 불일치
**문제점**:
- API 라우트마다 에러 응답 형식이 다름
- 일부는 `{ error: "CODE", message: "..." }` 형식
- 일부는 `{ error: "..." }` 형식
- HTTP 상태 코드 사용이 일관되지 않음

**우선순위**: 🟡 중간

---

### 2. 타입 정의 문제 (Type Issues)

#### 2.1 타입 정의 분산
**문제점**:
- 타입 정의가 여러 파일에 분산되어 있음
- `src/types/` 디렉토리와 `src/lib/` 내부에 타입이 혼재
- 일부 타입이 중복 정의될 가능성

**영향받는 파일**:
- `src/types/mood.ts`
- `src/types/device.ts`
- `src/types/moodStream.ts`
- `src/lib/llm/types/completeOutput.ts`
- `src/lib/music/getMusicTrackByID.ts`

**우선순위**: 🟡 중간

#### 2.2 타입 불일치 가능성
**문제점**:
- `ScentType`이 여러 곳에서 정의될 수 있음
  - `src/types/mood.ts`: PascalCase ("Musk", "Aromatic", ...)
  - `src/lib/llm/types/completeOutput.ts`: 다른 형식일 가능성
- 타입 변환 로직이 여러 곳에 분산 (`scentTypeToCategory` 등)

**우선순위**: 🟡 중간

---

### 3. 파일 구조 문제 (File Structure Issues)

#### 3.1 유틸리티 함수 분산
**문제점**:
- 색상 관련 함수가 `utils.ts`와 `colorUtils.ts`에 분산
- `utils.ts`에 색상 함수와 일반 유틸리티가 혼재
- 파일 역할이 명확하지 않음

**현재 구조**:
```
src/lib/
  utils.ts          # cn, blendWithWhite, hexToRgb, hexToRgba, rgbToHex, reduceWhiteTint
  utils/
    colorUtils.ts   # hexToRgb (중복!)
    errorHandler.ts # 에러 핸들링
    validation.ts   # 검증 함수
    time.ts         # 시간 관련
    segmentUtils.ts # 세그먼트 관련
```

**우선순위**: 🟡 중간

#### 3.2 Firebase 초기화 파일 구조
**문제점**:
- Firebase 관련 파일이 여러 곳에 있음
- `src/lib/firebase.ts` (빈 파일, TODO 주석만)
- `src/lib/firebase/client.ts` (클라이언트 SDK)
- `src/lib/firebase/admin.ts` (Admin SDK)

**우선순위**: 🟢 낮음 (현재 구조는 합리적이나 정리 필요)

---

### 4. API 라우트 구조 문제

#### 4.1 반복되는 보일러플레이트 코드
**문제점**:
- 모든 API 라우트에서 다음 패턴이 반복:
  ```typescript
  const sessionOrError = await requireAuth();
  if (sessionOrError instanceof NextResponse) {
    return sessionOrError;
  }
  const session = sessionOrError;
  
  if (await checkMockMode(session)) {
    // 목업 처리
  }
  
  try {
    // 실제 로직
  } catch (error) {
    // 에러 처리
  }
  ```

**우선순위**: 🔴 높음

#### 4.2 에러 핸들링 불일치
**문제점**:
- 일부 라우트는 try-catch로 감싸고, 일부는 감싸지 않음
- 에러 메시지 형식이 일관되지 않음
- 로깅 방식이 다름

**우선순위**: 🟡 중간

---

## 🎯 리팩토링 계획

### Phase 1: 유틸리티 함수 통합 및 정리 (우선순위: 높음)

#### 1.1 색상 유틸리티 통합
**작업 내용**:
1. `src/lib/utils/colorUtils.ts`를 단일 소스로 통합
2. `src/lib/utils.ts`에서 색상 관련 함수 제거
3. 모든 import 경로를 `@/lib/utils/colorUtils`로 통일
4. `hexToRgb` 함수 구현 통일 (기본값 처리 방식 결정)

**예상 작업 시간**: 2-3시간  
**영향받는 파일**: 약 25개 파일

**구체적 작업**:
- [ ] `colorUtils.ts`에 모든 색상 함수 통합
- [ ] `utils.ts`에서 색상 함수 제거
- [ ] 모든 import 경로 수정
- [ ] 타입 정의 확인 및 통일

#### 1.2 API 라우트 래퍼 함수 생성
**작업 내용**:
1. `src/lib/api/routeHandler.ts` 생성
2. 공통 인증/목업 체크 로직을 래퍼 함수로 추출
3. 에러 응답 형식 표준화

**예상 작업 시간**: 4-5시간  
**영향받는 파일**: 모든 API 라우트 (약 50개)

**구체적 작업**:
- [ ] `withAuth` 래퍼 함수 생성
- [ ] `withAuthAndMock` 래퍼 함수 생성
- [ ] 표준 에러 응답 헬퍼 함수 생성
- [ ] 기존 API 라우트에 적용 (점진적)

**예시 코드**:
```typescript
// src/lib/api/routeHandler.ts
export async function withAuth<T>(
  handler: (session: AuthSession) => Promise<T>
): Promise<NextResponse | T> {
  const sessionOrError = await requireAuth();
  if (sessionOrError instanceof NextResponse) {
    return sessionOrError;
  }
  return handler(sessionOrError);
}

export async function withAuthAndMock<T>(
  handler: (session: AuthSession) => Promise<T>,
  mockHandler: (session: AuthSession) => T
): Promise<NextResponse | T> {
  return withAuth(async (session) => {
    if (await checkMockMode(session)) {
      return mockHandler(session);
    }
    return handler(session);
  });
}
```

---

### Phase 2: 타입 정의 정리 (우선순위: 🔴 매우 높음 - ScentType 중복 문제)

#### 2.1 ScentType 중복 문제 해결 (긴급)
**작업 내용**:
1. 두 개의 다른 `ScentType` 정의를 단일 정의로 통합
2. 타입 매핑 로직 확인 및 수정
3. 모든 사용처에서 올바른 타입 사용 확인

**예상 작업 시간**: 4-6시간  
**영향받는 파일**: 약 20개 파일

**구체적 작업**:
- [ ] 두 `ScentType` 정의 비교 및 통합 방안 결정
  - 옵션 1: `src/types/mood.ts`의 12개 타입을 표준으로 사용
  - 옵션 2: 두 타입을 합쳐서 확장된 타입 정의
  - 옵션 3: LLM용 타입과 UI용 타입을 분리하고 매핑 함수 생성
- [ ] 선택한 방안에 따라 타입 통합
- [ ] `src/lib/llm/types/completeOutput.ts`의 `ScentType` 수정
- [ ] 타입 변환 로직 확인 및 수정
- [ ] 모든 `ScentType` 사용처 검증

**주의사항**: 
- 이 작업은 런타임 에러를 방지하기 위해 최우선으로 진행해야 함
- 타입 변경 시 LLM 응답 파싱 로직도 함께 확인 필요

#### 2.2 타입 정의 통합
**작업 내용**:
1. `src/types/` 디렉토리를 단일 소스로 통합
2. `src/lib/` 내부의 타입 정의를 `src/types/`로 이동
3. 중복 타입 정의 제거

**예상 작업 시간**: 3-4시간  
**영향받는 파일**: 약 15개 파일

**구체적 작업**:
- [ ] `src/lib/llm/types/` 내 타입 검토 및 이동
- [ ] 타입 import 경로 정리
- [ ] 타입 문서화

#### 2.2 타입 안정성 개선
**작업 내용**:
1. `strict: true` 모드에서 발생하는 타입 에러 수정
2. `any` 타입 사용 최소화
3. 타입 가드 함수 추가

**예상 작업 시간**: 5-6시간  
**영향받는 파일**: 전체

---

### Phase 3: 파일 구조 개선 (우선순위: 중간)

#### 3.1 유틸리티 디렉토리 구조 정리
**작업 내용**:
1. `src/lib/utils.ts`를 `src/lib/utils/index.ts`로 변경
2. 각 유틸리티를 기능별로 분리된 파일로 구성
3. barrel export 사용

**예상 구조**:
```
src/lib/utils/
  index.ts          # barrel export
  color.ts          # 색상 관련 (colorUtils.ts 통합)
  validation.ts     # 검증 함수 (기존 유지)
  errorHandler.ts   # 에러 핸들링 (기존 유지)
  time.ts           # 시간 관련 (기존 유지)
  segmentUtils.ts   # 세그먼트 관련 (기존 유지)
```

**예상 작업 시간**: 2-3시간  
**영향받는 파일**: 약 30개 파일

#### 3.2 Firebase 파일 정리
**작업 내용**:
1. `src/lib/firebase.ts` 파일 삭제 또는 정리
2. Firebase 관련 파일을 `src/lib/firebase/` 디렉토리로 통합
3. 사용하지 않는 파일 제거

**예상 작업 시간**: 1시간

---

### Phase 4: API 라우트 표준화 (우선순위: 높음)

#### 4.1 에러 응답 표준화
**작업 내용**:
1. 표준 에러 응답 형식 정의
2. 에러 코드 상수 정의
3. 모든 API 라우트에 적용

**표준 에러 응답 형식**:
```typescript
{
  error: {
    code: string;      // "UNAUTHORIZED", "NOT_FOUND", etc.
    message: string;    // 사용자 친화적 메시지
    details?: unknown;  // 선택적 상세 정보
  }
}
```

**예상 작업 시간**: 4-5시간  
**영향받는 파일**: 모든 API 라우트

#### 4.2 API 라우트 문서화
**작업 내용**:
1. 각 API 라우트에 JSDoc 주석 추가
2. 요청/응답 형식 문서화
3. 에러 케이스 문서화

**예상 작업 시간**: 6-8시간

---

## 📊 우선순위 매트릭스

| 작업 | 우선순위 | 예상 시간 | 영향 범위 | 난이도 |
|------|---------|----------|----------|--------|
| **ScentType 중복 해결** | 🔴 **매우 높음** | 4-6h | 20개 파일 | 높음 |
| 색상 유틸리티 통합 | 🔴 높음 | 2-3h | 25개 파일 | 낮음 |
| API 라우트 래퍼 생성 | 🔴 높음 | 4-5h | 50개 파일 | 중간 |
| 타입 정의 통합 (나머지) | 🟡 중간 | 3-4h | 15개 파일 | 중간 |
| 에러 응답 표준화 | 🟡 중간 | 4-5h | 50개 파일 | 중간 |
| 유틸리티 구조 정리 | 🟡 중간 | 2-3h | 30개 파일 | 낮음 |
| 타입 안정성 개선 | 🟡 중간 | 5-6h | 전체 | 높음 |
| API 문서화 | 🟢 낮음 | 6-8h | 50개 파일 | 낮음 |

---

## 🚀 실행 계획

### Week 1: 긴급 수정 (Phase 1, 2.1)
- [ ] **ScentType 중복 문제 해결 (최우선)**
- [ ] 색상 유틸리티 통합
- [ ] API 라우트 래퍼 함수 생성 및 적용 (핵심 라우트부터)

### Week 2: 타입 및 구조 개선 (Phase 2.2, 3)
- [ ] 타입 정의 통합 (나머지)
- [ ] 유틸리티 구조 정리
- [ ] Firebase 파일 정리

### Week 3: 표준화 및 문서화 (Phase 4)
- [ ] 에러 응답 표준화
- [ ] API 라우트 문서화
- [ ] 타입 안정성 개선

---

## ⚠️ 주의사항

### 리팩토링 시 고려사항
1. **점진적 적용**: 한 번에 모든 파일을 수정하지 말고, 기능별로 점진적으로 적용
2. **테스트**: 각 단계마다 테스트를 수행하여 회귀 버그 방지
3. **백업**: 리팩토링 전 현재 상태를 커밋
4. **코드 리뷰**: 큰 변경사항은 PR을 통해 리뷰

### 리스크 관리
- **매우 높은 리스크**: **ScentType 중복 해결** (런타임 에러 가능성, LLM 응답 파싱 영향)
- **높은 리스크**: API 라우트 래퍼 적용 (모든 API에 영향)
- **중간 리스크**: 타입 정의 통합 (타입 에러 가능성)
- **낮은 리스크**: 유틸리티 함수 통합 (import 경로만 변경)

---

## 📝 추가 확인 완료 사항

### 1. 타입 중복 확인 ✅
**확인 결과**: **심각한 문제 발견**

`ScentType`이 두 곳에서 **다른 값**으로 정의되어 있습니다:

1. **`src/types/mood.ts`** (12개 타입):
   ```typescript
   "Musk" | "Aromatic" | "Woody" | "Citrus" | "Honey" | "Green" | 
   "Dry" | "Leathery" | "Marine" | "Spicy" | "Floral" | "Powdery"
   ```

2. **`src/lib/llm/types/completeOutput.ts`** (8개 타입):
   ```typescript
   "Floral" | "Woody" | "Spicy" | "Fresh" | "Citrus" | "Herbal" | "Musk" | "Oriental"
   ```

**문제점**:
- 두 타입이 완전히 다름 (공통: Floral, Woody, Spicy, Citrus, Musk만)
- `src/types/mood.ts`에는 있지만 `completeOutput.ts`에는 없는 타입: Aromatic, Honey, Green, Dry, Leathery, Marine, Powdery
- `completeOutput.ts`에는 있지만 `mood.ts`에는 없는 타입: Fresh, Herbal, Oriental
- 타입 불일치로 인한 런타임 에러 가능성

**우선순위**: 🔴 **매우 높음** (즉시 수정 필요)

**해결 방안**:
- 단일 `ScentType` 정의로 통합
- 두 타입 간 매핑 함수 생성 또는 타입 통일
- 기존 코드에서 사용하는 모든 `ScentType` 참조 확인 및 수정

### 2. API 에러 처리 패턴
**확인 결과**: 
- `src/lib/utils/errorHandler.ts`에 기본적인 에러 핸들링 유틸리티가 있음
- 하지만 모든 API 라우트에서 일관되게 사용되지 않음
- 에러 응답 형식이 표준화되지 않음

**권장 사항**: Phase 4에서 에러 응답 표준화 작업 필요

### 3. 테스트 코드
**확인 결과**: 
- `package.json`에 테스트 관련 스크립트나 의존성이 없음
- 테스트 프레임워크가 설정되어 있지 않음
- 테스트 코드가 존재하지 않는 것으로 확인됨

**권장 사항**: 
- 리팩토링 후 테스트 코드 작성 고려
- 최소한 핵심 API 라우트에 대한 테스트 추가 권장

---

## 🔄 다음 단계

1. **추가 정보 수집**: 위의 "추가 확인 필요 사항"에 대한 정보 수집
2. **우선순위 결정**: 팀과 논의하여 리팩토링 우선순위 최종 결정
3. **작업 시작**: Phase 1부터 순차적으로 진행
4. **진행 상황 추적**: 각 Phase 완료 시 체크리스트 업데이트

---

## 📚 참고 자료

- [TypeScript Best Practices](https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html)
- [Next.js API Routes Best Practices](https://nextjs.org/docs/api-routes/introduction)
- [Clean Code Principles](https://github.com/ryanmcdermott/clean-code-javascript)

---

**작성자**: AI Assistant  
**최종 수정일**: 2025-01-XX

