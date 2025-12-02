# V2 개발 계획 (DB + 실제 출력장치 연동)

## 📋 목표

V1 (Mock Mode) 완료 후, 실제 DB 기반으로 전환하고 실제 출력장치와 연동하는 V2 단계를 진행합니다.

**핵심 목표**:
- 사용자별 데이터 영구 저장 (PostgreSQL)
- Firestore 실시간 데이터 수신 (Watch 앱 → Web 앱)
- Python ML 서버 통신 (감정 예측)
- 실제 출력장치 연동 (조명, 향, 음악)
- AWS 배포 및 네트워크 설정

---

## 🔍 현재 상태 분석

### ✅ 이미 구현된 기능

1. **NextAuth 인증 시스템**
   - Credentials Provider (이메일/비밀번호)
   - 소셜 로그인 (Google, Naver, Kakao)
   - 세션 관리 및 목업 모드 감지
   - 파일: `Web/src/app/api/auth/[...nextauth]/route.ts`

2. **V1 Mock Mode 완료**
   - 어드민 계정으로 전체 플로우 경험 가능
   - localStorage 및 메모리 저장소 사용
   - 목업 데이터로 무드스트림 생성

3. **Prisma 스키마 정의**
   - PostgreSQL 스키마 완료
   - ERD 생성 완료
   - 파일: `Web/prisma/schema.prisma`

4. **Watch 앱 Firestore 연결**
   - 생체 데이터 수집 (`raw_periodic`)
   - 오디오 이벤트 수집 (`raw_events`)
   - `ml_processed` 상태 관리

### ⚠️ V2에서 구현 필요

1. **Firestore Web 연결**
   - Web 앱에서 Firestore 데이터 수신
   - 실시간 리스너 설정
   - 데이터 전처리 파이프라인 연결

2. **Python ML 서버 통신**
   - REST API 연동
   - 감정 카운트 수신
   - 감정 예측 결과 수신

3. **DB 마이그레이션 및 연결**
   - PostgreSQL 마이그레이션 실행
   - Prisma Client 연결 테스트
   - V1 Mock 코드 → V2 DB 코드 전환

4. **실제 출력장치 연동**
   - 조명 제어 (Philips Wiz via Raspberry Pi)
   - 향 제어 (UI 트리거)
   - 음악 재생 (V2-M1: 로컬 파일, V2-M2: Spotify/YouTube Music)

---

## 🚀 V2 개발 순서

### Phase 1: (auth) 페이지 고도화

**목표**: 인증 시스템 완성 및 보안 강화

**작업 내용**:
1. **NextAuth 설정 최적화**
   - [ ] JWT 토큰 설정 검토 및 최적화
   - [ ] 세션 만료 시간 설정
   - [ ] CSRF 보호 확인
   - [ ] 파일: `Web/src/app/api/auth/[...nextauth]/route.ts`

2. **로그인 페이지 개선**
   - [ ] 에러 메시지 개선 (사용자 친화적)
   - [ ] 로딩 상태 UI 개선
   - [ ] 소셜 로그인 버튼 UX 개선
   - [ ] 파일: `Web/src/app/(auth)/login/page.tsx`

3. **회원가입 페이지 개선**
   - [ ] 폼 검증 강화
   - [ ] 비밀번호 강도 표시
   - [ ] 이메일 중복 체크 실시간 피드백
   - [ ] 파일: `Web/src/app/(auth)/register/page.tsx`

4. **비밀번호 찾기 페이지 개선**
   - [ ] 이메일 발송 기능 (실제 구현 또는 Mock)
   - [ ] 토큰 기반 비밀번호 재설정
   - [ ] 파일: `Web/src/app/(auth)/forgot-password/page.tsx`

5. **인증 미들웨어 강화**
   - [ ] 보호된 라우트 자동 리다이렉트
   - [ ] 세션 갱신 로직
   - [ ] 파일: `Web/src/lib/auth/session.ts`

**검증 방법**:
- [ ] 로그인/회원가입 플로우 테스트
- [ ] 세션 유지 시간 확인
- [ ] 보안 헤더 확인

**예상 소요 시간**: 4-6시간

---

### Phase 2: (main) 페이지 고도화

**목표**: 홈 화면 및 무드 대시보드 완성

**작업 내용**:
1. **홈 화면 초기화 개선**
   - [ ] Cold Start 로직 최적화
   - [ ] 로딩 스켈레톤 UI 개선
   - [ ] 에러 처리 강화
   - [ ] 파일: `Web/src/app/(main)/home/page.tsx`

2. **무드 대시보드 개선**
   - [ ] 세그먼트 전환 애니메이션
   - [ ] 실시간 무드 업데이트 (Firestore 연동 준비)
   - [ ] LLM 소스 표시 개선
   - [ ] 파일: `Web/src/app/(main)/home/components/MoodDashboard/`

3. **디바이스 카드 개선**
   - [ ] 실시간 상태 표시 (V2에서 실제 장치 연동)
   - [ ] 디바이스 제어 UI 개선
   - [ ] 파일: `Web/src/app/(main)/home/components/Device/`

4. **설문 오버레이 개선**
   - [ ] 설문 완료 후 가중치 업데이트 (DB 저장)
   - [ ] 설문 결과 시각화
   - [ ] 파일: `Web/src/app/(main)/home/components/SurveyOverlay/`

**검증 방법**:
- [ ] 홈 화면 진입 플로우 테스트
- [ ] 무드스트림 생성 및 표시 확인
- [ ] 디바이스 카드 인터랙션 테스트

**예상 소요 시간**: 6-8시간

---

### Phase 3: MyPage 고도화

**목표**: 사용자 프로필 및 설정 관리 완성

**작업 내용**:
1. **프로필 섹션 개선**
   - [ ] 프로필 이미지 업로드 (S3 또는 로컬)
   - [ ] 개인정보 수정 기능
   - [ ] 어드민 모드 표시 (V1 유지)
   - [ ] 파일: `Web/src/app/(main)/mypage/components/ProfileSection.tsx`

2. **설정 메뉴 개선**
   - [ ] 알림 설정
   - [ ] 언어 설정
   - [ ] 테마 설정 (다크모드 등)
   - [ ] 파일: `Web/src/app/(main)/mypage/components/MenuSection.tsx`

3. **계정 관리**
   - [ ] 비밀번호 변경
   - [ ] 계정 삭제 (데이터 정리 포함)
   - [ ] 소셜 계정 연결/해제
   - [ ] 파일: `Web/src/app/(main)/mypage/components/DeleteAccountModal.tsx`

4. **문의/FAQ 페이지**
   - [ ] 문의하기 기능 (이메일 또는 DB 저장)
   - [ ] FAQ 콘텐츠 관리
   - [ ] 파일: `Web/src/app/(main)/mypage/inquiry/page.tsx`, `qna/page.tsx`

**검증 방법**:
- [ ] 프로필 수정 플로우 테스트
- [ ] 설정 변경 저장 확인
- [ ] 계정 삭제 데이터 정리 확인

**예상 소요 시간**: 5-7시간

---

### Phase 4: Mood 페이지 고도화

**목표**: 저장된 무드 관리 기능 완성

**작업 내용**:
1. **무드셋 표시 개선**
   - [ ] 그리드 레이아웃 최적화 (2x3)
   - [ ] 무드셋 카드 디자인 개선
   - [ ] 무드셋 미리보기 (색상, 아이콘 등)
   - [ ] 파일: `Web/src/app/(main)/mood/page.tsx`

2. **무드셋 관리 기능**
   - [ ] 무드셋 삭제 (DB 연동)
   - [ ] 무드셋 교체 (현재 세그먼트에 적용)
   - [ ] 무드셋 이름 수정
   - [ ] 파일: `Web/src/app/(main)/mood/components/`

3. **무드셋 정렬 및 필터**
   - [ ] 최신순/이름순 정렬
   - [ ] 무드 타입별 필터
   - [ ] 검색 기능 (선택사항)

**검증 방법**:
- [ ] 무드셋 저장 및 표시 확인
- [ ] 무드셋 교체 플로우 테스트
- [ ] 무드셋 삭제 확인

**예상 소요 시간**: 4-6시간

---

### Phase 5: DB 마이그레이션 및 연결

**목표**: PostgreSQL 연결 및 V1 → V2 전환

**작업 내용**:
1. **DB 마이그레이션 준비**
   - [ ] Prisma 스키마 최종 검토
   - [ ] 마이그레이션 스크립트 작성
   - [ ] 시드 데이터 준비 (선택사항)
   - [ ] 파일: `Web/prisma/schema.prisma`, `Web/prisma/seed.ts`

2. **DB 연결 테스트**
   - [ ] 로컬 PostgreSQL 연결 테스트
   - [ ] Prisma Client 연결 확인
   - [ ] 기본 CRUD 작업 테스트
   - [ ] 파일: `Web/src/lib/prisma.ts`

3. **V1 Mock 코드 → V2 DB 코드 전환**
   - [ ] API 라우트에서 Mock 코드 주석 처리
   - [ ] DB 저장 로직 활성화
   - [ ] 사용자별 데이터 격리 확인
   - [ ] 파일: 모든 API 라우트 (`Web/src/app/api/**/route.ts`)

4. **데이터 마이그레이션 (필요 시)**
   - [ ] 기존 Mock 데이터 → DB 마이그레이션 (선택사항)
   - [ ] 사용자 데이터 초기화 전략

**검증 방법**:
- [ ] Prisma Studio로 데이터 확인
- [ ] API 호출 시 DB 저장 확인
- [ ] 사용자별 데이터 격리 확인

**예상 소요 시간**: 6-8시간

---

### Phase 6: Firestore Web 연결

**목표**: Watch 앱 데이터를 Web 앱에서 실시간 수신

**작업 내용**:
1. **Firebase 초기화**
   - [ ] Firebase Admin SDK 설정 확인
   - [ ] Firestore 클라이언트 초기화
   - [ ] 환경 변수 설정
   - [ ] 파일: `Web/src/lib/firebase.ts` (생성 필요)

2. **실시간 데이터 리스너**
   - [ ] `raw_periodic` 컬렉션 리스너
   - [ ] `raw_events` 컬렉션 리스너
   - [ ] 사용자별 데이터 필터링
   - [ ] 파일: `Web/src/lib/firestore/listeners.ts` (생성 필요)

3. **데이터 전처리 파이프라인 연결**
   - [ ] Firestore 데이터 → 전처리 API 연결
   - [ ] 실시간 업데이트 처리
   - [ ] 파일: `Web/src/app/api/preprocessing/route.ts`

4. **에러 처리 및 재연결 로직**
   - [ ] 네트워크 오류 처리
   - [ ] 자동 재연결 로직
   - [ ] 데이터 동기화 전략

**검증 방법**:
- [ ] Watch 앱에서 데이터 전송 → Web 앱 수신 확인
- [ ] 실시간 업데이트 확인
- [ ] 네트워크 오류 시나리오 테스트

**예상 소요 시간**: 5-7시간

---

### Phase 7: Python ML 서버 통신

**목표**: Python ML 서버와 REST API 통신

**작업 내용**:
1. **Python 서버 API 클라이언트**
   - [ ] REST API 클라이언트 작성
   - [ ] 감정 카운트 수신
   - [ ] 감정 예측 결과 수신
   - [ ] 파일: `Web/src/lib/ml/client.ts` (생성 필요)

2. **API 통신 로직**
   - [ ] 전처리 데이터 → Python 서버 전송
   - [ ] 예측 결과 수신 및 처리
   - [ ] 에러 처리 및 Fallback
   - [ ] 파일: `Web/src/app/api/preprocessing/route.ts`

3. **네트워크 설정 (배포 후)**
   - [ ] 내부 네트워크 연결 (AWS VPC)
   - [ ] 외부 통신 설정 (ML 서버)
   - [ ] 보안 그룹 설정

**검증 방법**:
- [ ] 로컬 Python 서버와 통신 테스트
- [ ] 예측 결과 수신 확인
- [ ] 에러 처리 확인

**예상 소요 시간**: 4-6시간 (로컬), 2-3시간 (배포 후 네트워크 설정)

---

### Phase 8: 실제 출력장치 연동

**목표**: 조명, 향, 음악 실제 제어

**작업 내용**:
1. **조명 제어 (Philips Wiz)**
   - [ ] 라즈베리파이 브리지 API 설계
   - [ ] Web → Raspberry Pi → Wiz 전구 통신
   - [ ] 무드 컬러 → 파스텔 컬러 변환
   - [ ] 파일: `Web/src/lib/devices/lightControl.ts` (생성 필요)

2. **향 제어**
   - [ ] 향 선택 시 UI 트리거
   - [ ] 향 레벨 표시 (LvX)
   - [ ] 스프레이 간격 타이머 애니메이션
   - [ ] 파일: `Web/src/lib/devices/scentControl.ts` (생성 필요)

3. **음악 재생 (V2-M1: 로컬 파일)**
   - [ ] 로컬 음원 파일 매핑 테이블
   - [ ] HTML5 Audio API로 재생
   - [ ] 재생 상태 동기화
   - [ ] 파일: `Web/src/lib/music/localPlayer.ts` (생성 필요)

4. **음악 재생 (V2-M2: Spotify/YouTube Music) - 선택사항**
   - [ ] Spotify Web Playback API 연동
   - [ ] YouTube Music API 연동
   - [ ] OAuth 인증 플로우
   - [ ] 파일: `Web/src/lib/music/streamingPlayer.ts` (생성 필요)

**검증 방법**:
- [ ] 조명 컬러 변경 확인
- [ ] 향 트리거 확인
- [ ] 음악 재생 확인

**예상 소요 시간**: 
- 조명/향: 6-8시간
- V2-M1 (로컬 음악): 4-6시간
- V2-M2 (스트리밍): 8-12시간 (선택사항)

---

## 📅 배포 전/후 태스크 구분

### 🟢 배포 전 (로컬 개발 가능)

**Phase 1-5: 프론트엔드 및 DB 작업**
- ✅ (auth) 페이지 고도화
- ✅ (main) 페이지 고도화
- ✅ MyPage 고도화
- ✅ Mood 페이지 고도화
- ✅ DB 마이그레이션 및 연결 (로컬 PostgreSQL)

**Phase 6: Firestore Web 연결 (부분)**
- ✅ Firebase 초기화
- ✅ 실시간 데이터 리스너 (로컬 테스트)
- ✅ 데이터 전처리 파이프라인 연결

**Phase 7: Python ML 서버 통신 (부분)**
- ✅ Python 서버 API 클라이언트
- ✅ API 통신 로직 (로컬 Python 서버와 테스트)

**Phase 8: 출력장치 연동 (부분)**
- ✅ 조명 제어 로직 (로컬 테스트)
- ✅ 향 제어 UI
- ✅ 음악 재생 (V2-M1: 로컬 파일)

---

### 🔴 배포 후 (AWS 인프라 필요)

**Phase 6: Firestore Web 연결 (완성)**
- [ ] AWS 환경 변수 설정
- [ ] Firestore 보안 규칙 확인
- [ ] 프로덕션 데이터 수신 테스트

**Phase 7: Python ML 서버 통신 (완성)**
- [ ] AWS VPC 내부 네트워크 설정
  - [ ] Web 서버 (EC2) → Python 서버 (EC2) 내부 통신
  - [ ] 보안 그룹 설정
- [ ] ML 서버 외부 통신 설정
  - [ ] ML 서버 → 외부 API 통신 허용
  - [ ] 보안 그룹 설정
- [ ] Firestore 외부 통신 설정
  - [ ] Web 서버 → Firestore 통신 허용
  - [ ] 보안 그룹 설정

**Phase 8: 출력장치 연동 (완성)**
- [ ] 라즈베리파이 네트워크 설정
- [ ] Web 서버 → 라즈베리파이 통신
- [ ] 실제 조명 제어 테스트

**인프라 설정**
- [ ] PostgreSQL RDS 연결
  - [ ] RDS 엔드포인트 설정
  - [ ] 보안 그룹 설정
  - [ ] 마이그레이션 실행
- [ ] EC2 배포
  - [ ] 환경 변수 설정
  - [ ] PM2 또는 systemd 서비스 설정
  - [ ] 로그 관리
- [ ] 도메인 및 SSL 설정
- [ ] 모니터링 및 알림 설정

---

## 🎯 V2 완성 기준

다음 조건을 모두 만족하면 V2 완성:

### 필수 기능
- [ ] 사용자별 데이터 영구 저장 (PostgreSQL)
- [ ] Firestore 실시간 데이터 수신
- [ ] Python ML 서버 통신 (감정 예측)
- [ ] 조명 제어 (실제 장치 연동)
- [ ] 향 제어 (UI 트리거)
- [ ] 음악 재생 (V2-M1: 로컬 파일)

### 선택 기능
- [ ] 음악 재생 (V2-M2: Spotify/YouTube Music)
- [ ] 고급 설정 (알림, 테마 등)

### 인프라
- [ ] AWS 배포 완료
- [ ] 네트워크 설정 완료
- [ ] 보안 설정 완료
- [ ] 모니터링 설정 완료

---

## 📝 우선순위 정리

### 높음 (즉시 구현)
1. **Phase 1: (auth) 페이지 고도화** - 인증 시스템 완성
2. **Phase 5: DB 마이그레이션 및 연결** - 데이터 영구 저장 기반
3. **Phase 6: Firestore Web 연결** - 실시간 데이터 수신

### 중간 (핵심 기능)
4. **Phase 2: (main) 페이지 고도화** - 사용자 경험 개선
5. **Phase 3: MyPage 고도화** - 사용자 관리
6. **Phase 4: Mood 페이지 고도화** - 무드 관리
7. **Phase 7: Python ML 서버 통신** - 감정 예측

### 낮음 (완성 후 개선)
8. **Phase 8: 실제 출력장치 연동** - 실제 장치 제어
   - 조명/향: 높음
   - 음악 (V2-M1): 중간
   - 음악 (V2-M2): 낮음 (선택사항)

---

## 🔄 개발 워크플로우

1. **로컬 개발 (배포 전)**
   - Phase 1-5 완료
   - Phase 6-8 부분 완료 (로컬 테스트)
   - 통합 테스트

2. **AWS 배포 준비**
   - 환경 변수 설정
   - 빌드 및 배포 스크립트 작성
   - 인프라 설정 문서화

3. **AWS 배포 및 네트워크 설정**
   - EC2 배포
   - RDS 연결
   - 네트워크 설정 (VPC, 보안 그룹)
   - Firestore 외부 통신 설정

4. **통합 테스트 및 최적화**
   - End-to-End 테스트
   - 성능 최적화
   - 모니터링 설정

---

## 📚 관련 문서

- `docs/V1_V2_DEVELOPMENT_PLAN.md`: V1/V2 전체 계획
- `docs/COMPREHENSIVE_GUIDE.md`: 전체 시스템 가이드
- `Web/prisma/schema.prisma`: DB 스키마
- `README.md`: 프로젝트 개요

---

## 🚨 주의사항

1. **데이터 마이그레이션**
   - V1 Mock 데이터는 V2에서 사용하지 않음
   - 사용자는 V2에서 새로 시작

2. **보안**
   - 환경 변수는 절대 커밋하지 않음
   - AWS 보안 그룹 설정 필수
   - Firestore 보안 규칙 검토

3. **네트워크**
   - 내부 네트워크 (Web ↔ DB ↔ Python)는 VPC 내부 통신
   - 외부 통신 (ML 서버, Firestore)은 보안 그룹으로 제어

4. **테스트**
   - 각 Phase 완료 후 즉시 테스트
   - 통합 테스트 필수
   - 배포 전 전체 플로우 테스트

