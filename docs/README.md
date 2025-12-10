# Documentation

**최종 업데이트**: 2025.12.10

이 디렉토리는 Mood Manager 프로젝트의 필수 문서를 포함합니다.

---

## 문서 목록

### 필수 문서

1. **[API_SPECIFICATION.md](./API_SPECIFICATION.md)**: API 명세서 및 Firestore 데이터 구조
2. **[DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md)**: 개발 환경 설정 및 개발 가이드
3. **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)**: 배포 체크리스트 및 가이드
4. **[PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md)**: 프로젝트 구조 및 조직
5. **[TECHNOLOGY_STACK.md](./TECHNOLOGY_STACK.md)**: 기술 스택 및 적용 기술 상세 설명
6. **[LIGHT_CONNECTION.md](./LIGHT_CONNECTION.md)**: 전구 연결 구현 가이드 및 라즈베리파이 통신 구조

---

## 빠른 참조

### 프론트엔드 개발자
1. **API 사용**: `API_SPECIFICATION.md` - API 엔드포인트 명세
2. **설정**: `DEVELOPMENT_GUIDE.md` - 설치 및 설정
3. **프로젝트 구조**: `PROJECT_STRUCTURE.md` - 전체 구조

### 백엔드 개발자
1. **API 명세**: `API_SPECIFICATION.md` - 모든 API 엔드포인트 및 Firestore 구조
2. **데이터베이스**: `DEVELOPMENT_GUIDE.md` - 데이터베이스 설정 및 마이그레이션
3. **배포**: `DEPLOYMENT_GUIDE.md` - 배포 절차

### 프로젝트 매니저
1. **프로젝트 구조**: `PROJECT_STRUCTURE.md` - 전체 프로젝트 구조
2. **배포**: `DEPLOYMENT_GUIDE.md` - 배포 체크리스트

---

## 문서 요약

### API_SPECIFICATION.md
- 모든 API 엔드포인트
- 요청/응답 형식
- 인증 요구사항
- Firestore 컬렉션 구조
- ML 처리 플로우

### DEVELOPMENT_GUIDE.md
- 요구사항 (Node.js, npm, PostgreSQL)
- 설치 단계
- 환경 변수 설정
- 데이터베이스 설정 (로컬 및 프로덕션)
- 데이터베이스 마이그레이션 가이드
- 코드 스타일 가이드
- 문제 해결

### DEPLOYMENT_GUIDE.md
- 배포 전 코드 리뷰
- 배포 단계
- 배포 후 검증
- 알려진 이슈 및 제한사항
- 롤백 계획
- 모니터링

### PROJECT_STRUCTURE.md
- 웹 앱 구조 (Next.js)
- WearOS 앱 상세
- 디렉토리 조직

### TECHNOLOGY_STACK.md
- 디스크릿 마르코프 체인 (통계 분석)
- LLM 기반 무드 생성 (GPT-4o-mini)
- Wav2Vec2 기반 오디오 분류
- Health Services API
- AudioRecord API

### LIGHT_CONNECTION.md
- LLM 출력 구조
- RGB vs Color Temperature 처리
- API 엔드포인트
- 네트워크 통신 방법
- AWS EC2 배포
- 구현 상태
