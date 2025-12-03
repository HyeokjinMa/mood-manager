# DB 마이그레이션 체크리스트

## 📋 목표

V1 Mock Mode에서 V2 DB 연결로 전환 시 필요한 작업들을 정리합니다.

---

## ✅ 현재 상태

### Mock Mode 처리 완료
- ✅ Admin 계정 Mock Mode 감지
- ✅ API 라우트 Mock 응답 처리
- ✅ Mock Mode 시 DB 연결 시도 건너뛰기
- ✅ 에러 발생 시 Mock Mode로 폴백

### TODO 주석 정리 상태
- ✅ API 라우트에 DB 연동 TODO 명시
- ✅ Mock 코드에 TODO 주석 달림
- ✅ V2 개발 계획 문서에 전환 작업 명시

---

## 🔄 V2 DB 연결 시 수정 필요 작업

### Phase 1: API 라우트 Mock 코드 → DB 코드 전환

#### 1.1 무드 관련 API
- [ ] `Web/src/app/api/moods/saved/route.ts`
  - ✅ TODO 주석 있음: `// TODO: 실제 DB 연동 시 Firestore 사용`
  - Mock 코드 주석 처리
  - Prisma Client로 DB 저장/조회 구현

- [ ] `Web/src/app/api/moods/saved/[savedMoodId]/route.ts`
  - ✅ TODO 주석 있음: `// TODO: 실제 DB 연동 시 Firestore에서 삭제/조회`
  - Mock 코드 주석 처리
  - Prisma Client로 DB 삭제/조회 구현

- [ ] `Web/src/app/api/moods/saved/[savedMoodId]/apply/route.ts`
  - ✅ TODO 주석 있음: `// TODO: DB 마이그레이션 후 구현`
  - 전체 구현 필요

- [ ] `Web/src/app/api/moods/preference/route.ts`
  - ✅ TODO 주석 있음: `// TODO: 실제 DB 연동 시 Firestore 사용`
  - Mock 코드 주석 처리
  - Prisma Client로 Preference 저장/조회 구현

#### 1.2 디바이스 관련 API
- [ ] `Web/src/app/api/devices/[deviceId]/scent-level/route.ts`
  - ✅ TODO 주석 있음: `// TODO: 백엔드 API 연동 시 아래 주석 해제하고 목업 코드 제거`
  - Mock 코드 주석 처리
  - DB 업데이트 구현

#### 1.3 프로필 관련 API
- [ ] `Web/src/app/api/auth/profile/route.ts`
  - ✅ Mock Mode 처리 완료 (이미 구현됨)
  - DB 연결 시 Prisma Client로 전환

- [ ] `Web/src/app/api/auth/change-password/route.ts`
  - ✅ Mock Mode 처리 완료 (이미 구현됨)
  - DB 연결 시 Prisma Client로 전환

### Phase 2: 프론트엔드 Mock 코드 → DB 코드 전환

#### 2.1 디바이스 핸들러
- [ ] `Web/src/app/(main)/home/components/Device/hooks/useDeviceHandlers.ts`
  - ✅ TODO 주석 있음:
    - `// TODO: 백엔드 API로 교체 필요 (현재 API 스펙에 없음)` (light color/brightness)
    - `// TODO: 백엔드 API로 교체 필요 (현재 API 스펙에 scent-level이 있지만 레거시)` (scent level)
  - Mock Mode 에러 처리 완료
  - DB 연결 시 API 호출 활성화

#### 2.2 무드 대시보드
- [ ] `Web/src/app/(main)/home/components/MoodDashboard/hooks/useMoodDashboard.ts`
  - ✅ TODO 주석 있음: `// TODO: 백엔드 API로 교체 필요`
  - Mock 코드 주석 처리
  - DB 저장 API 호출

#### 2.3 무드 훅
- [ ] `Web/src/hooks/useMood.ts`
  - ✅ TODO 주석 있음: `// TODO: 백엔드 API로 교체 필요`
  - Mock 코드 주석 처리
  - DB API 호출

#### 2.4 디바이스 훅
- [ ] `Web/src/hooks/useDevices.ts`
  - ✅ TODO 주석 있음: `// TODO: 백엔드 무드 API 구현 후 실제 API 호출로 변경`
  - Mock 코드 주석 처리
  - DB API 호출

### Phase 3: Mock Mode 감지 로직 제거 (선택사항)

#### 3.1 Mock Mode 유틸리티
- [ ] `Web/src/lib/auth/mockMode.ts`
  - ✅ TODO 주석 있음: `// TODO: DB 연결 후 User.isAdmin 필드를 조회하도록 변경 필요`
  - Mock Mode 로직 유지 또는 제거 결정
  - Admin 계정 처리 방식 변경

#### 3.2 프론트엔드 Mock Mode 체크
- [ ] `Web/src/app/(main)/mood/page.tsx`
  - ✅ Mock Mode 체크 있음: `if (isAdminMode) { ... return; }`
  - DB 연결 시 제거 또는 조건 변경

### Phase 4: 외부 서비스 연동 (V2 후반부)

#### 4.1 Firebase
- [ ] `Web/src/lib/firebase.ts`
  - ✅ TODO 주석 있음: `// TODO: 백엔드 API 연동 시 Firebase SDK 설정 필요`
  - Firebase Admin SDK 설정
  - Firestore 클라이언트 초기화

#### 4.2 AWS
- [ ] `Web/src/lib/aws.ts`
  - ✅ TODO 주석 있음: `// TODO: 백엔드 API 연동 시 AWS SDK 설정 필요`
  - AWS SDK 설정

#### 4.3 OpenAI
- [ ] `Web/src/lib/openai.ts`
  - ✅ TODO 주석 있음: `// TODO: 백엔드 API 연동 시 주석 해제 및 패키지 설치 필요`
  - OpenAI 클라이언트 활성화

### Phase 5: 추가 구현 필요 API

- [ ] `Web/src/app/api/ai/chat/route.ts`
  - ✅ TODO 주석 있음: `// TODO: 백엔드 API 연동 시 구현`
  - 전체 구현 필요

- [ ] `Web/src/app/(main)/mypage/inquiry/page.tsx`
  - ✅ TODO 주석 있음: `// TODO: 백엔드 API로 교체 필요`
  - 문의하기 API 구현

---

## 📝 마이그레이션 순서

### 1단계: DB 연결 및 스키마 확인
- [ ] Prisma 스키마 최종 검토
- [ ] DB 마이그레이션 실행
- [ ] Prisma Client 생성 및 연결 테스트

### 2단계: 기본 CRUD API 전환
- [ ] 디바이스 API (GET, POST, PUT, DELETE)
- [ ] 프로필 API (GET, PUT)
- [ ] 비밀번호 변경 API

### 3단계: 무드 관련 API 전환
- [ ] 무드 저장 API
- [ ] 무드 조회 API
- [ ] 무드 삭제 API
- [ ] 무드 적용 API
- [ ] 선호도 저장/조회 API

### 4단계: Mock Mode 제거 또는 조건 변경
- [ ] Mock Mode 감지 로직 검토
- [ ] Admin 계정 처리 방식 변경
- [ ] 프론트엔드 Mock Mode 체크 제거

### 5단계: 외부 서비스 연동
- [ ] Firebase 설정 및 연동
- [ ] AWS 설정 및 연동
- [ ] OpenAI 설정 및 연동

---

## ✅ 검증 방법

### 각 단계별 검증
1. **API 테스트**: Postman 또는 curl로 API 호출 테스트
2. **DB 확인**: Prisma Studio로 데이터 저장 확인
3. **프론트엔드 테스트**: 브라우저에서 기능 테스트
4. **에러 처리**: Mock Mode 에러 처리 로직 확인

### 최종 검증
- [ ] 모든 API 라우트 정상 동작
- [ ] DB에 데이터 정상 저장/조회
- [ ] 사용자별 데이터 격리 확인
- [ ] Mock Mode 제거 후 정상 동작
- [ ] 에러 처리 정상 동작

---

## 🔍 관련 파일 목록

### API 라우트 (Mock 코드 포함)
- `Web/src/app/api/moods/saved/route.ts`
- `Web/src/app/api/moods/saved/[savedMoodId]/route.ts`
- `Web/src/app/api/moods/saved/[savedMoodId]/apply/route.ts`
- `Web/src/app/api/moods/preference/route.ts`
- `Web/src/app/api/devices/[deviceId]/scent-level/route.ts`
- `Web/src/app/api/auth/profile/route.ts`
- `Web/src/app/api/auth/change-password/route.ts`
- `Web/src/app/api/ai/chat/route.ts`

### 프론트엔드 (Mock 코드 포함)
- `Web/src/app/(main)/home/components/Device/hooks/useDeviceHandlers.ts`
- `Web/src/app/(main)/home/components/MoodDashboard/hooks/useMoodDashboard.ts`
- `Web/src/hooks/useMood.ts`
- `Web/src/hooks/useDevices.ts`
- `Web/src/app/(main)/mood/page.tsx`
- `Web/src/app/(main)/mypage/inquiry/page.tsx`

### 유틸리티 (Mock Mode 처리)
- `Web/src/lib/auth/mockMode.ts`
- `Web/src/lib/firebase.ts` (TODO)
- `Web/src/lib/aws.ts` (TODO)
- `Web/src/lib/openai.ts` (TODO)

---

## 📚 관련 문서

- `docs/V2_DEVELOPMENT_PLAN.md`: V2 전체 개발 계획
- `Web/prisma/schema.prisma`: DB 스키마
- `README.md`: 프로젝트 개요

---

## ⚠️ 주의사항

1. **Mock Mode 유지**: V1 배포 환경에서는 Mock Mode를 유지해야 함
2. **점진적 전환**: 모든 API를 한 번에 전환하지 말고 단계적으로 진행
3. **에러 처리**: DB 연결 실패 시 적절한 에러 처리 필요
4. **데이터 마이그레이션**: 기존 Mock 데이터 마이그레이션 전략 수립
5. **테스트**: 각 단계별 충분한 테스트 진행

