# Development Guide

개발 환경 설정 및 개발 가이드입니다.

---

## Requirements

### 1. Node.js Version

- **Recommended**: Node.js 18.x or higher (current: v22.21.0)
- **Minimum**: Node.js 18.0.0

**Check Node.js version**:
```bash
node --version
```

**Install Node.js**:
- Official site: https://nodejs.org/
- Or use nvm (recommended): https://github.com/nvm-sh/nvm

**Using nvm**:
```bash
# Auto-switch if .nvmrc file exists in project root
cd Web
nvm use

# Or specify version directly
nvm install 22.21.0
nvm use 22.21.0
```

### 2. npm Version

- **Recommended**: npm 10.x or higher (current: 10.9.4)
- **Minimum**: npm 8.0.0

**Check npm version**:
```bash
npm --version
```

**Update npm**:
```bash
npm install -g npm@latest
```

### 3. Git

Git must be installed for cloning the repository.

### 4. PostgreSQL (for Production)

- **Version**: PostgreSQL 14.x or higher
- Required for V2 (database integration)

---

## Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd mood-manager
```

### 2. Install Dependencies

```bash
cd Web
npm install
```

**Important**: All commands must be run from the `Web/` directory.

### 3. Configure Environment Variables

Create a `Web/.env.local` file and set the following environment variables:

```env
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here

# Database Connection (PostgreSQL)
DATABASE_URL=postgresql://user:password@localhost:5432/moodmanager

# OpenAI API (Optional, for LLM features)
OPENAI_API_KEY=your-openai-api-key

# Firebase Configuration (Optional, for Firestore integration)
NEXT_PUBLIC_FIREBASE_API_KEY=your-firebase-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-firebase-auth-domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-firebase-project-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-firebase-app-id
FIREBASE_ADMIN_CREDENTIALS=your-firebase-admin-credentials-json

# Python ML Server (Optional, for ML prediction)
ML_API_URL=http://localhost:8000
ML_API_KEY=your-ml-api-key
```

---

## Database Setup

### Local Development (PostgreSQL)

1. **Install PostgreSQL**:
   ```bash
   # macOS
   brew install postgresql@14
   brew services start postgresql@14

   # Ubuntu/Debian
   sudo apt-get install postgresql-14

   # Windows
   # Download from https://www.postgresql.org/download/windows/
   ```

2. **Create Database**:
   ```bash
   createdb moodmanager
   ```

3. **Update `.env.local`**:
   ```env
   DATABASE_URL=postgresql://postgres:password@localhost:5432/moodmanager
   ```

### Production (AWS RDS)

1. **Create RDS Instance**:
   - Engine: PostgreSQL 14.x
   - Instance class: db.t3.micro (for testing)
   - Storage: 20GB
   - Security group: Allow inbound from your application server

2. **Get Connection String**:
   ```env
   DATABASE_URL=postgresql://username:password@your-rds-endpoint:5432/moodmanager
   ```

---

## Database Migration

### 1. Generate Prisma Client

```bash
cd Web
npx prisma generate
```

### 2. Run Migrations

```bash
# Development (creates migration files)
npx prisma migrate dev

# Production (applies existing migrations)
npx prisma migrate deploy
```

### 3. Verify Migration

```bash
# Open Prisma Studio
npx prisma studio
```

---

## Running the Application

### Development Mode

```bash
cd Web
npm run dev
```

The application will be available at `http://localhost:3000`.

### Production Build

```bash
cd Web
npm run build
npm start
```

---

## Admin Mode (Mock Mode)

For development and testing, you can use Admin mode:

1. Register or login with an admin account
2. Admin mode automatically enables mock data
3. All features work with localStorage-based storage

---

## Code Style Guide

### 주석 스타일 가이드

#### 1. 한국어 주석 (기능 설명)
- **음슴체 사용**: "~한다", "~한다" 형태
- **예시**:
  - ✅ "무드스트림을 관리한다"
  - ✅ "색상을 계산한다"
  - ✅ "다음 스트림을 생성한다"
  - ❌ "무드스트림을 관리한다" (평서체)
  - ❌ "무드스트림 관리" (명사형)

#### 2. 영어 주석 (UI 요소, 간단한 표시)
- **Button, Link, Text 등 UI 요소**: 영어 사용
- **예시**:
  - ✅ `title="Save mood"`
  - ✅ `// button`
  - ✅ `// link`

#### 3. 주석 위치
- **파일 상단**: 파일 역할 설명 (음슴체)
- **함수/컴포넌트**: 기능 설명 (음슴체)
- **인라인 주석**: 간단한 설명 (음슴체 또는 영어)

### 점검 범위

#### 우선순위 높음 (배포 전 필수)
- `Web/src/app/(main)/home/components/MoodDashboard/` - 무드 대시보드 관련
- `Web/src/hooks/useMoodStream/` - 무드스트림 관리 훅
- `Web/src/app/(main)/home/components/HomeContent.tsx` - 홈 컨텐츠
- `Web/src/app/api/` - API 라우트 (에러 메시지는 영어)

#### 우선순위 중간
- `Web/src/app/(main)/mood/` - 무드 페이지
- `Web/src/app/(main)/mypage/` - 마이페이지
- `Web/src/app/(auth)/` - 인증 페이지

#### 우선순위 낮음 (배포 후)
- `Web/src/lib/` - 유틸리티 함수
- `Web/src/components/` - 공통 컴포넌트
- `Web/src/types/` - 타입 정의

---

## Troubleshooting

### Common Issues

1. **Prisma Client Error**:
   ```bash
   cd Web
   npx prisma generate
   ```

2. **Database Connection Error**:
   - Check `DATABASE_URL` in `.env.local`
   - Verify PostgreSQL is running
   - Check firewall settings

3. **Build Errors**:
   ```bash
   cd Web
   rm -rf node_modules .next
   npm install
   npm run build
   ```

---

## Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)

