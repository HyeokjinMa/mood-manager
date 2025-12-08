# 코드 정리 및 리팩토링 계획

## 📋 현재 상태 분석

### 문서 파일 (Web/docs)

#### ✅ 유지할 문서
- **LLM_OUTPUT_REFACTORING_PLAN.md** - 팀 공유 문서, 현재 LLM 출력 구조 설명
- **TROUBLESHOOTING_GUIDE.md** - 참고 문서, 문제 해결 가이드

#### ❌ 삭제할 문서 (완료된 작업)
- **MUSIC_DATA_INTEGRATION_PLAN.md** - 음악 데이터 통합 작업 완료
- **MUSIC_MAPPING_VERIFICATION.md** - 매핑 검증 완료
- **SLOW_PUSH_ANALYSIS.md** - Git 푸시 문제 해결 완료

### 스크립트 파일 (Web/scripts)

#### ✅ 유지할 스크립트
- **generate-music-tracks-from-album.ts** - 실제 사용 중 (음악 파일 추가 시 재사용)
- **generate-markov-data.ts** - 유용할 수 있음 (마르코프 데이터 생성)

#### ❌ 삭제할 스크립트

**일회성 작업용 (완료됨):**
- `clean-filenames.ts`
- `cleanup-mock-music-data.ts`
- `import-music-data.ts`
- `remove-underscores.ts`
- `rename-image-files.ts`
- `rename-music-files.ts`
- `rename-music-files-fixed.ts`
- `simple-rename.ts`

**구버전/중복:**
- `convert-markdown-to-music-tracks.ts` (구버전, `generate-music-tracks-from-album.ts`로 대체)
- `generate-music-metadata.ts` (구버전)
- `generate-music-tracks-from-markdown.ts` (구버전)
- `generate-music-tracks-json.ts` (구버전)

**테스트용 (개발 완료):**
- `analyze-llm-response.ts`
- `test-llm-prompt.ts`
- `test-llm-response.ts`
- `test-phase3-validation.ts`

**일회성 확인용:**
- `check-music-data.ts`

---

## 🗑️ 삭제 작업 (완료)

### ✅ Phase 1: 문서 정리 (완료)
- ✅ `MUSIC_DATA_INTEGRATION_PLAN.md` 삭제
- ✅ `MUSIC_MAPPING_VERIFICATION.md` 삭제
- ✅ `SLOW_PUSH_ANALYSIS.md` 삭제

### ✅ Phase 2: 스크립트 정리 (완료)
**일회성 작업 스크립트 (8개):**
- ✅ `clean-filenames.ts`
- ✅ `cleanup-mock-music-data.ts`
- ✅ `import-music-data.ts`
- ✅ `remove-underscores.ts`
- ✅ `rename-image-files.ts`
- ✅ `rename-music-files.ts`
- ✅ `rename-music-files-fixed.ts`
- ✅ `simple-rename.ts`

**구버전 스크립트 (4개):**
- ✅ `convert-markdown-to-music-tracks.ts`
- ✅ `generate-music-metadata.ts`
- ✅ `generate-music-tracks-from-markdown.ts`
- ✅ `generate-music-tracks-json.ts`

**테스트 스크립트 (4개):**
- ✅ `analyze-llm-response.ts`
- ✅ `test-llm-prompt.ts`
- ✅ `test-llm-response.ts`
- ✅ `test-phase3-validation.ts`

**일회성 확인 스크립트 (1개):**
- ✅ `check-music-data.ts`

**총 삭제: 17개 스크립트 + 3개 문서 = 20개 파일**

### 📁 남은 파일

**문서 (3개):**
- `CLEANUP_AND_REFACTORING_PLAN.md` (이 문서)
- `LLM_OUTPUT_REFACTORING_PLAN.md`
- `TROUBLESHOOTING_GUIDE.md`

**스크립트 (2개):**
- `generate-music-tracks-from-album.ts` (실제 사용 중)
- `generate-markov-data.ts` (유용할 수 있음)

---

## 🔄 전체 리팩토링 계획

### Phase 1: 코드 정리 (현재 단계)

#### 1.1 불필요한 파일 삭제
- ✅ 완료된 작업 문서 삭제
- ✅ 일회성 스크립트 삭제
- ✅ 구버전/중복 스크립트 삭제
- ✅ 테스트 스크립트 삭제

#### 1.2 사용되지 않는 코드 정리
- [x] 사용되지 않는 import 제거 ✅
  - `MOODS` import 제거 (`home/page.tsx`)
  - 사용되지 않는 `rgbToHex` 함수 제거 (`completeOutputMapper.ts`)
  - 사용되지 않는 catch 변수 제거 (`preprocessPeriodic.ts`, `streamHandler.ts`)
- [ ] 사용되지 않는 함수/변수 제거 (추가 경고 발견, 다음 단계)
- [ ] 주석 처리된 코드 정리

### Phase 2: 타입 시스템 개선

#### 2.1 타입 정의 통합
- [ ] `types/` 폴더의 타입 정의 정리
- [ ] 중복 타입 정의 제거
- [ ] 타입 import 경로 통일

#### 2.2 타입 안전성 강화
- [ ] `any` 타입 완전 제거
- [ ] `unknown` 타입 적절히 사용
- [ ] 타입 가드 함수 추가

### Phase 3: 코드 구조 개선

#### 3.1 폴더 구조 최적화
```
Web/src/
├── app/              # Next.js App Router
├── components/        # 재사용 가능한 컴포넌트
├── hooks/            # Custom Hooks
├── lib/              # 유틸리티 및 비즈니스 로직
│   ├── llm/          # LLM 관련
│   ├── music/        # 음악 관련
│   ├── audio/        # 오디오 재생
│   └── ...
├── types/            # 타입 정의
└── context/          # React Context
```

#### 3.2 모듈 분리
- [ ] LLM 관련 로직 모듈화
- [ ] 음악 관련 로직 모듈화
- [ ] 디바이스 동기화 로직 모듈화

### Phase 4: 성능 최적화

#### 4.1 번들 크기 최적화
- [ ] 사용되지 않는 의존성 제거
- [ ] 동적 import 적용
- [ ] 이미지 최적화

#### 4.2 렌더링 최적화
- [ ] React.memo 적용 검토
- [ ] useMemo/useCallback 최적화
- [ ] 불필요한 리렌더링 방지

### Phase 5: 에러 처리 개선

#### 5.1 에러 바운더리
- [ ] 전역 에러 바운더리 추가
- [ ] 섹션별 에러 바운더리 추가

#### 5.2 에러 로깅
- [ ] 구조화된 에러 로깅
- [ ] 에러 추적 시스템

### Phase 6: 테스트 코드 작성

#### 6.1 단위 테스트
- [ ] 핵심 유틸리티 함수 테스트
- [ ] LLM 응답 검증 로직 테스트
- [ ] 음악 매핑 로직 테스트

#### 6.2 통합 테스트
- [ ] API 엔드포인트 테스트
- [ ] 세그먼트 생성 플로우 테스트

---

## 📝 유지할 문서 구조

### Web/docs/
```
Web/docs/
├── LLM_OUTPUT_REFACTORING_PLAN.md    # LLM 출력 구조 문서
└── TROUBLESHOOTING_GUIDE.md          # 트러블슈팅 가이드
```

### 루트 docs/ (프로젝트 전체 문서)
```
docs/
├── README.md                    # 문서 인덱스
├── SETUP_GUIDE.md              # 설치 가이드
├── PROJECT_STRUCTURE.md        # 프로젝트 구조
├── API_SPECIFICATION.md        # API 명세
├── FIRESTORE_STRUCTURE.md      # Firestore 구조
└── ... (기타 프로젝트 문서)
```

---

## 🎯 우선순위

### 즉시 실행 (Phase 1)
1. ✅ 불필요한 문서 삭제
2. ✅ 불필요한 스크립트 삭제
3. [ ] 사용되지 않는 코드 정리

### 단기 (Phase 2-3)
4. [ ] 타입 시스템 개선
5. [ ] 코드 구조 개선

### 중기 (Phase 4-5)
6. [ ] 성능 최적화
7. [ ] 에러 처리 개선

### 장기 (Phase 6)
8. [ ] 테스트 코드 작성

---

## 📌 참고사항

- 삭제 전에 Git에 커밋하여 복구 가능하도록 함
- 중요한 로직은 문서화 후 삭제
- 팀원과 공유되는 문서는 삭제 전 확인

