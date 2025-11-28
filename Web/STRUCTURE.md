# Web 폴더 구조 설명

## 루트 파일 (Next.js 표준)

다음 파일들은 Next.js 프레임워크 요구사항에 따라 루트에 위치해야 합니다:

- `package.json`, `package-lock.json` - 프로젝트 의존성 및 스크립트
- `tsconfig.json` - TypeScript 설정
- `next.config.ts` - Next.js 설정
- `next-env.d.ts` - Next.js TypeScript 타입 정의
- `eslint.config.mjs` - ESLint 설정
- `postcss.config.mjs` - PostCSS 설정
- `components.json` - shadcn/ui 컴포넌트 설정
- `amplify.yml` - AWS Amplify 배포 설정
- `.nvmrc` - Node.js 버전 지정
- `.env.local` - 환경 변수 (Git에 커밋하지 않음)

## 폴더 구조

- `.build-artifacts/` - 빌드 산출물 (자동 생성, Git 무시)
- `.next/` - Next.js 빌드 캐시 (자동 생성, Git 무시)
- `node_modules/` - 의존성 패키지 (Git 무시)
- `src/` - 소스 코드
- `public/` - 정적 파일 (이미지, 아이콘 등)
- `prisma/` - 데이터베이스 스키마 및 마이그레이션
- `types/` - Next.js 자동 생성 타입 파일

## 정리된 항목

- 빌드 산출물: `.build-artifacts/` 폴더로 이동
- 시스템 아키텍처 이미지: `public/system-architecture.png`로 이동
