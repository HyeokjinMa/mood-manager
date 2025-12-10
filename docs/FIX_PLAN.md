# 수정 계획

**작성일**: 2025.12.10

## 1. Admin 모드에서 LLM 호출 문제 (1번)

### 문제 상황
- Admin으로 접속했을 때 LLM이 유효하게 처리되지 않고 fallback 값이 표시됨
- LLM 호출을 하지 말라는 것이 아니라, 진짜 값이 들어가게 해야 함

### 현재 상태 분석
- `Web/src/app/api/moods/current/generate/route.ts`에서 `isAdminMode`가 `true`일 때 목업 데이터를 즉시 반환
- 이로 인해 LLM 호출이 건너뛰어지고 있음

### 해결 방안

#### 옵션 1: Admin 모드에서도 LLM 호출 (권장)
- Admin 모드에서도 실제 LLM을 호출하여 진짜 값을 생성
- 목업 데이터는 LLM 호출 실패 시에만 사용

**수정 위치**:
- `Web/src/app/api/moods/current/generate/route.ts`
  - `isAdminMode` 체크를 제거하거나 조건 변경
  - LLM 호출 후 실패 시에만 목업 데이터 반환

**장점**:
- Admin 모드에서도 실제 LLM 응답 확인 가능
- 개발 및 테스트 시 실제 동작 확인 가능

**단점**:
- API 비용 발생 (하지만 개발/테스트용이므로 허용 가능)

#### 옵션 2: Admin 모드 전용 LLM 호출 플래그
- Admin 모드에서도 LLM을 호출하되, 별도 플래그로 구분
- 목업 데이터는 완전히 제거하지 않고 폴백으로만 사용

**수정 위치**:
- `Web/src/app/api/moods/current/generate/route.ts`
  - `isAdminMode` 체크 제거
  - LLM 호출 실패 시 목업 데이터 반환

### 구현 계획

1. **`Web/src/app/api/moods/current/generate/route.ts` 수정**:
   ```typescript
   // 기존: isAdminMode일 때 목업 데이터 즉시 반환
   // 수정: isAdminMode 체크 제거, LLM 호출 진행
   
   // 관리자 모드에서도 LLM 호출
   // if (isAdminMode) { ... } 블록 제거
   ```

2. **에러 처리 개선**:
   - LLM 호출 실패 시에만 목업 데이터 반환
   - Admin 모드 여부와 관계없이 동일한 에러 처리

3. **로깅 추가**:
   - Admin 모드에서 LLM 호출 시 로그 추가
   - 목업 데이터 사용 시 명확한 로그

---

## 2. 마이페이지 내부 페이지 Modal 전환 (2번)

### 문제 상황
- 마이페이지/무드페이지는 Modal로 잘 출력됨
- 하지만 마이페이지 내에서 이동하는 페이지들(QNA 등)이 풀페이지로 넘어감
- 다시 돌아가면 문제 발생

### 현재 상태 분석
- `MyPageModal.tsx`가 Modal로 구현되어 있음
- `Web/src/app/(main)/mypage/inquiry/page.tsx`는 별도 페이지로 존재
- 내부 페이지들도 Modal로 전환 필요

### 해결 방안

#### 구조 개선
1. **마이페이지 내부 페이지들을 Modal로 전환**:
   - `inquiry/page.tsx` → `MyPageInquiryModal.tsx`
   - 기타 내부 페이지들도 Modal로 전환

2. **`home/page.tsx`에서 모든 Modal 상태 관리**:
   - `showMyPageModal` 외에 `showMyPageInquiryModal` 등 추가
   - 내부 페이지 Modal 상태도 `home/page.tsx`에서 관리

3. **라우팅 대신 상태 기반 네비게이션**:
   - `router.push()` 대신 Modal 상태 변경
   - `MyPageModal` 내부에서 내부 페이지 Modal 열기

### 구현 계획

#### Phase 1: Inquiry 페이지 Modal 전환
1. **`Web/src/app/(main)/home/components/modals/MyPageInquiryModal.tsx` 생성**:
   - `inquiry/page.tsx`의 내용을 Modal로 변환
   - `home/page.tsx`에서 상태 관리

2. **`MyPageModal.tsx` 수정**:
   - QNA 버튼 클릭 시 `router.push()` 대신 `onInquiryClick` 콜백 호출
   - `home/page.tsx`에서 `showMyPageInquiryModal` 상태 변경

3. **`home/page.tsx` 수정**:
   - `showMyPageInquiryModal` 상태 추가
   - `MyPageInquiryModal` 컴포넌트 렌더링
   - `MyPageModal`에 `onInquiryClick` prop 전달

#### Phase 2: 기타 내부 페이지들도 Modal로 전환
- 마이페이지 내부의 다른 페이지들도 동일한 방식으로 전환
- 모든 내부 페이지 Modal 상태를 `home/page.tsx`에서 관리

### 파일 구조
```
Web/src/app/(main)/home/
├── components/
│   └── modals/
│       ├── MyPageModal.tsx (기존)
│       ├── MyPageInquiryModal.tsx (신규)
│       └── ... (기타 내부 페이지 Modal)
└── page.tsx (모든 Modal 상태 관리)
```

---

## 3. 세션 체크 문제 (3번)

### 해결 사항
- SessionProvider refetchInterval/refetchOnWindowFocus 설정 개선
- 세션 로딩 타임아웃 처리 추가 (5초)
- requireAuth에 에러 처리 및 로깅 추가
- NextAuth JWT/session 콜백에 로깅 추가
- 쿠키 설정 개선 (maxAge 명시)

### 추가 확인 사항
- 시크릿 모드에서 세션이 제대로 초기화되는지 확인
- 캐시 삭제 후에도 정상 작동하는지 확인
- 서버 접속 문제가 해결되었는지 확인

---

## 우선순위

1. **3번 (세션 체크)**: 완료
2. **1번 (Admin LLM)**: 다음 작업
3. **2번 (Modal 전환)**: 그 다음 작업

